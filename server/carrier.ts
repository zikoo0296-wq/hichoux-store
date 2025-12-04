import { storage } from './storage';
import type { Order, OrderWithItems } from '@shared/schema';

export interface ShippingLabelResponse {
  success: boolean;
  labelUrl?: string;
  pdfBase64?: string;
  trackingNumber?: string;
  providerName?: string;
  error?: string;
}

export interface CarrierConfig {
  name: string;
  apiUrl: string;
  apiKey: string;
  enabled: boolean;
}

export type CarrierName = 'DIGYLOG' | 'OZON' | 'CATHEDIS' | 'SENDIT';

const CARRIER_ENDPOINTS: Record<CarrierName, { create: string; track: string; quote: string }> = {
  DIGYLOG: {
    create: '/api/shipments/create',
    track: '/api/shipments/track',
    quote: '/api/shipments/quote',
  },
  OZON: {
    create: '/api/v1/orders',
    track: '/api/v1/tracking',
    quote: '/api/v1/rates',
  },
  CATHEDIS: {
    create: '/shipping/create',
    track: '/shipping/track',
    quote: '/shipping/rates',
  },
  SENDIT: {
    create: '/v1/shipments',
    track: '/v1/tracking',
    quote: '/v1/quotes',
  },
};

async function getCarrierConfig(carrierName: CarrierName): Promise<CarrierConfig | null> {
  const apiUrlSetting = await storage.getSetting(`carrier_${carrierName.toLowerCase()}_api_url`);
  const apiKeySetting = await storage.getSetting(`carrier_${carrierName.toLowerCase()}_api_key`);
  const enabledSetting = await storage.getSetting(`carrier_${carrierName.toLowerCase()}_enabled`);

  if (!apiUrlSetting?.value || !apiKeySetting?.value) {
    return null;
  }

  return {
    name: carrierName,
    apiUrl: apiUrlSetting.value,
    apiKey: apiKeySetting.value,
    enabled: enabledSetting?.value === 'true',
  };
}

async function getActiveCarrier(): Promise<{ config: CarrierConfig; name: CarrierName } | null> {
  const defaultCarrierSetting = await storage.getSetting('default_carrier');
  const defaultCarrier = (defaultCarrierSetting?.value as CarrierName) || 'DIGYLOG';
  
  const carriers: CarrierName[] = ['DIGYLOG', 'OZON', 'CATHEDIS', 'SENDIT'];
  
  const prioritizedCarriers = [defaultCarrier, ...carriers.filter(c => c !== defaultCarrier)];
  
  for (const carrierName of prioritizedCarriers) {
    const config = await getCarrierConfig(carrierName);
    if (config && config.enabled) {
      return { config, name: carrierName };
    }
  }
  
  return null;
}

export async function sendOrderToCarrier(order: OrderWithItems): Promise<ShippingLabelResponse> {
  try {
    const activeCarrier = await getActiveCarrier();
    
    if (!activeCarrier) {
      const trackingNumber = `TRK${Date.now().toString().slice(-8)}${order.id.toString().padStart(4, '0')}`;
      
      await storage.createShippingLabel({
        orderId: order.id,
        labelUrl: null,
        pdfBase64: null,
        trackingNumber,
        providerName: 'Internal',
      });

      await storage.createSyncLog({
        orderId: order.id,
        action: 'SEND_TO_CARRIER',
        result: 'SUCCESS',
        details: `Mock shipping label created with tracking: ${trackingNumber} (No carrier configured)`,
      });

      return {
        success: true,
        trackingNumber,
        providerName: 'Internal',
      };
    }

    const { config, name } = activeCarrier;
    const endpoints = CARRIER_ENDPOINTS[name];
    
    const shipmentData = {
      order_id: order.id.toString(),
      recipient: {
        name: order.customerName,
        phone: order.phone,
        address: order.address,
        city: order.city,
      },
      cod_amount: parseFloat(order.totalPrice),
      notes: order.notes || '',
      items: order.items?.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: parseFloat(item.unitPrice),
        name: item.product?.title || `Product #${item.productId}`,
      })) || [],
    };

    const response = await fetch(config.apiUrl + endpoints.create, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'X-API-Key': config.apiKey,
      },
      body: JSON.stringify(shipmentData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${name} API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    await storage.createShippingLabel({
      orderId: order.id,
      labelUrl: data.label_url || data.labelUrl || null,
      pdfBase64: data.pdf_base64 || data.pdfBase64 || null,
      trackingNumber: data.tracking_number || data.trackingNumber || data.tracking_id || null,
      providerName: name,
    });

    await storage.createSyncLog({
      orderId: order.id,
      action: 'SEND_TO_CARRIER',
      result: 'SUCCESS',
      details: `Shipped via ${name} - Tracking: ${data.tracking_number || data.trackingNumber || 'N/A'}`,
    });

    return {
      success: true,
      labelUrl: data.label_url || data.labelUrl,
      pdfBase64: data.pdf_base64 || data.pdfBase64,
      trackingNumber: data.tracking_number || data.trackingNumber || data.tracking_id,
      providerName: name,
    };
  } catch (error: any) {
    console.error('Error sending to carrier:', error);

    await storage.createSyncLog({
      orderId: order.id,
      action: 'SEND_TO_CARRIER',
      result: 'FAILURE',
      details: error.message || 'Unknown error',
    });

    return {
      success: false,
      error: error.message || 'Failed to send to carrier',
    };
  }
}

export async function getTrackingInfo(trackingNumber: string, carrierName: CarrierName): Promise<any> {
  try {
    const config = await getCarrierConfig(carrierName);
    
    if (!config) {
      return { status: 'unknown', message: 'Carrier not configured' };
    }

    const endpoints = CARRIER_ENDPOINTS[carrierName];
    
    const response = await fetch(`${config.apiUrl}${endpoints.track}/${trackingNumber}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'X-API-Key': config.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Tracking API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error getting tracking info:', error);
    return { status: 'error', message: error.message };
  }
}

export async function getShippingQuote(
  city: string,
  weight: number = 1
): Promise<{ carrier: CarrierName; price: number; estimatedDays: number }[]> {
  const quotes: { carrier: CarrierName; price: number; estimatedDays: number }[] = [];
  const carriers: CarrierName[] = ['DIGYLOG', 'OZON', 'CATHEDIS', 'SENDIT'];

  for (const carrierName of carriers) {
    try {
      const config = await getCarrierConfig(carrierName);
      
      if (!config || !config.enabled) continue;

      const endpoints = CARRIER_ENDPOINTS[carrierName];
      
      const response = await fetch(`${config.apiUrl}${endpoints.quote}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          'X-API-Key': config.apiKey,
        },
        body: JSON.stringify({ city, weight }),
      });

      if (response.ok) {
        const data = await response.json();
        quotes.push({
          carrier: carrierName,
          price: data.price || data.rate || 35,
          estimatedDays: data.estimated_days || data.estimatedDays || 2,
        });
      }
    } catch (error) {
      console.error(`Error getting quote from ${carrierName}:`, error);
    }
  }

  if (quotes.length === 0) {
    quotes.push({
      carrier: 'DIGYLOG' as CarrierName,
      price: 35,
      estimatedDays: 2,
    });
  }

  return quotes.sort((a, b) => a.price - b.price);
}

export async function handleCarrierWebhook(
  carrierName: CarrierName,
  payload: any,
  signature?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const trackingNumber = payload.tracking_number || payload.trackingNumber || payload.tracking_id;
    const status = payload.status || payload.shipment_status;
    const orderId = payload.order_id || payload.orderId || payload.reference;

    if (!trackingNumber && !orderId) {
      return { success: false, message: 'Missing tracking number or order ID' };
    }

    const label = await storage.getShippingLabelByTracking(trackingNumber);
    
    if (!label) {
      console.log(`Webhook received for unknown tracking: ${trackingNumber}`);
      return { success: false, message: 'Shipping label not found' };
    }

    const statusMap: Record<string, string> = {
      'picked_up': 'ENVOYEE',
      'in_transit': 'ENVOYEE',
      'out_for_delivery': 'ENVOYEE',
      'delivered': 'LIVREE',
      'failed': 'INJOIGNABLE',
      'returned': 'ANNULEE',
    };

    const normalizedStatus = status?.toLowerCase().replace(/[^a-z_]/g, '_');
    const mappedStatus = statusMap[normalizedStatus] || null;

    if (mappedStatus) {
      await storage.updateOrderStatus(label.orderId, mappedStatus as any);
    }

    await storage.createSyncLog({
      orderId: label.orderId,
      action: 'CARRIER_WEBHOOK',
      result: 'SUCCESS',
      details: `${carrierName} webhook: ${status} for ${trackingNumber}`,
    });

    return { success: true, message: 'Webhook processed successfully' };
  } catch (error: any) {
    console.error('Error processing carrier webhook:', error);
    return { success: false, message: error.message };
  }
}
