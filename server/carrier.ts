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

const CARRIER_ENDPOINTS: Record<CarrierName, { create: string; track: string; quote: string; labels: string; historics: string }> = {
  DIGYLOG: {
    create: '/orders',
    track: '/order',
    quote: '/deliverycost',
    labels: '/labels',
    historics: '/historics',
  },
  OZON: {
    create: '/api/v1/orders',
    track: '/api/v1/tracking',
    quote: '/api/v1/rates',
    labels: '/api/v1/labels',
    historics: '/api/v1/history',
  },
  CATHEDIS: {
    create: '/shipping/create',
    track: '/shipping/track',
    quote: '/shipping/rates',
    labels: '/shipping/labels',
    historics: '/shipping/history',
  },
  SENDIT: {
    create: '/v1/shipments',
    track: '/v1/tracking',
    quote: '/v1/quotes',
    labels: '/v1/labels',
    historics: '/v1/history',
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
    
    if (!endpoints) {
      throw new Error(`Carrier ${name} endpoints not configured`);
    }
    
    let response: Response;
    let shipmentData: any;
    
    if (name === 'DIGYLOG') {
      // DIGYLOG specific format according to their API v2.4
      // Get store and network from settings
      const storeSetting = await storage.getSetting('carrier_digylog_store');
      const networkSetting = await storage.getSetting('carrier_digylog_network');
      
      const storeName = storeSetting?.value || 'Default Store';
      const networkId = networkSetting?.value ? parseInt(networkSetting.value) : 1;
      
      shipmentData = {
        mode: 1, // Standard order
        network: networkId,
        store: storeName,
        status: 1, // 1 = add & send orders immediately
        checkDuplicate: 1, // Check for duplicate orders
        orders: [{
          num: `CMD-${order.id}`,
          type: 1, // Normal delivery
          name: order.customerName,
          phone: order.phone,
          address: order.address,
          city: order.city,
          price: parseFloat(order.totalPrice),
          openproduct: 0,
          port: 1, // Shipping cost paid by customer (COD)
          note: order.notes || '',
          refs: order.items?.map(item => ({
            designation: item.product?.title || `Produit #${item.productId}`,
            quantity: item.quantity,
          })) || [{ designation: 'Commande', quantity: 1 }],
        }],
      };
      
      response = await fetch(config.apiUrl + endpoints.create, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `bearer ${config.apiKey}`,
          'Referer': 'https://apiseller.digylog.com',
        },
        body: JSON.stringify(shipmentData),
      });
    } else {
      // Generic format for other carriers
      shipmentData = {
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

      response = await fetch(config.apiUrl + endpoints.create, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          'X-API-Key': config.apiKey,
        },
        body: JSON.stringify(shipmentData),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${name} API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    let trackingNumber: string | null = null;
    let labelUrl: string | null = null;
    let pdfBase64: string | null = null;
    
    if (name === 'DIGYLOG') {
      // DIGYLOG returns array: [{ num: "your num", tracking: "S1036052CA", ... }]
      if (Array.isArray(data) && data.length > 0) {
        const orderResult = data[0];
        trackingNumber = orderResult.tracking || orderResult.trackingNumber || null;
        
        // If we have a BL ID, we can download labels later
        if (orderResult.bl) {
          labelUrl = `${config.apiUrl}/bl/${orderResult.bl}/pdf`;
        }
      } else if (data.tracking) {
        trackingNumber = data.tracking;
      } else if (data.error) {
        throw new Error(`DIGYLOG: ${data.error}`);
      }
    } else {
      // Generic response parsing for other carriers
      trackingNumber = data.tracking_number || data.trackingNumber || data.tracking_id || null;
      labelUrl = data.label_url || data.labelUrl || null;
      pdfBase64 = data.pdf_base64 || data.pdfBase64 || null;
    }

    await storage.createShippingLabel({
      orderId: order.id,
      labelUrl,
      pdfBase64,
      trackingNumber,
      providerName: name,
    });

    await storage.createSyncLog({
      orderId: order.id,
      action: 'SEND_TO_CARRIER',
      result: 'SUCCESS',
      details: `Shipped via ${name} - Tracking: ${trackingNumber || 'N/A'}`,
    });

    return {
      success: true,
      labelUrl: labelUrl || undefined,
      pdfBase64: pdfBase64 || undefined,
      trackingNumber: trackingNumber || undefined,
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
    
    if (carrierName === 'DIGYLOG') {
      // DIGYLOG uses GET /order/:tracking/infos for single order
      // or GET /historics?trackings=tracking1,tracking2 for multiple
      const response = await fetch(`${config.apiUrl}${endpoints.track}/${trackingNumber}/infos`, {
        method: 'GET',
        headers: {
          'Authorization': `bearer ${config.apiKey}`,
          'Referer': 'https://apiseller.digylog.com',
        },
      });

      if (!response.ok) {
        throw new Error(`Tracking API error: ${response.statusText}`);
      }

      return await response.json();
    } else {
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
    }
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

// Sync status from carrier for all shipped orders
export async function syncCarrierStatuses(): Promise<{ synced: number; errors: number; details: string[] }> {
  const details: string[] = [];
  let synced = 0;
  let errors = 0;

  // Status mapping from carrier to internal status
  const statusMap: Record<string, string> = {
    'picked_up': 'ENVOYEE',
    'in_transit': 'ENVOYEE',
    'out_for_delivery': 'ENVOYEE',
    'delivered': 'LIVREE',
    'livree': 'LIVREE',
    'failed': 'INJOIGNABLE',
    'unreachable': 'INJOIGNABLE',
    'injoignable': 'INJOIGNABLE',
    'returned': 'RETOURNEE',
    'retournee': 'RETOURNEE',
    'cancelled': 'ANNULEE',
    'annulee': 'ANNULEE',
  };

  try {
    const labels = await storage.getShippingLabels();

    // Cache carrier configs to avoid repeated lookups
    const carrierConfigCache: Record<string, CarrierConfig | null> = {};

    for (const label of labels) {
      // Skip if no tracking number or already in final state
      if (!label.trackingNumber) continue;
      if (['LIVREE', 'ANNULEE', 'RETOURNEE'].includes(label.order?.status || '')) continue;

      // Skip internal mock labels
      if (label.providerName === 'Internal' || !label.providerName) {
        continue;
      }

      try {
        const carrierName = label.providerName as CarrierName;
        
        // Get or cache carrier config
        if (!(carrierName in carrierConfigCache)) {
          carrierConfigCache[carrierName] = await getCarrierConfig(carrierName);
        }
        
        const config = carrierConfigCache[carrierName];
        if (!config) {
          details.push(`Order #${label.orderId}: Carrier ${carrierName} not configured`);
          continue;
        }

        const endpoints = CARRIER_ENDPOINTS[carrierName];
        if (!endpoints) {
          details.push(`Order #${label.orderId}: Unknown carrier ${carrierName}`);
          continue;
        }

        const response = await fetch(`${config.apiUrl}${endpoints.track}/${label.trackingNumber}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'X-API-Key': config.apiKey,
          },
        });

        if (!response.ok) {
          errors++;
          details.push(`Order #${label.orderId}: API error ${response.status} from ${carrierName}`);
          continue;
        }

        const data = await response.json();
        const carrierStatus = (data.status || data.shipment_status || '').toLowerCase().replace(/[^a-z_]/g, '_');
        const mappedStatus = statusMap[carrierStatus];

        if (mappedStatus && label.order?.status !== mappedStatus) {
          await storage.updateOrderStatus(label.orderId, mappedStatus);
          await storage.createSyncLog({
            orderId: label.orderId,
            action: 'STATUS_SYNC',
            result: 'SUCCESS',
            details: `Status updated from ${label.order?.status} to ${mappedStatus} via ${carrierName} sync`,
          });
          synced++;
          details.push(`Order #${label.orderId}: ${label.order?.status} → ${mappedStatus}`);
        }
      } catch (error: any) {
        errors++;
        details.push(`Order #${label.orderId}: Error - ${error.message}`);
        console.error(`Error syncing status for order #${label.orderId}:`, error);
      }
    }

    if (labels.length === 0) {
      details.push('No shipping labels found');
    }

    return { synced, errors, details };
  } catch (error: any) {
    console.error('Error syncing carrier statuses:', error);
    return { synced, errors: errors + 1, details: [...details, `Global error: ${error.message}`] };
  }
}

// Send all confirmed orders to carrier
export async function sendAllConfirmedToCarrier(): Promise<{ sent: number; errors: number; details: string[] }> {
  const details: string[] = [];
  let sent = 0;
  let errors = 0;

  try {
    const orders = await storage.getOrders();
    const confirmedOrders = orders.filter(o => o.status === 'CONFIRMEE');

    // Cache existing shipping labels once to avoid O(N²) queries
    const existingLabels = await storage.getShippingLabels();
    const labeledOrderIds = new Set(existingLabels.map(l => l.orderId));

    for (const order of confirmedOrders) {
      try {
        // Check if already has a shipping label using cached set
        if (labeledOrderIds.has(order.id)) {
          details.push(`Order #${order.id}: Already has shipping label`);
          continue;
        }

        const fullOrder = await storage.getOrder(order.id);
        if (!fullOrder) {
          details.push(`Order #${order.id}: Order not found`);
          continue;
        }

        const result = await sendOrderToCarrier(fullOrder);
        if (result.success) {
          // sendOrderToCarrier already creates the shipping label, just update status
          await storage.updateOrderStatus(order.id, 'ENVOYEE');
          // Add to labeled set to prevent duplicate sends within same sync
          labeledOrderIds.add(order.id);
          sent++;
          details.push(`Order #${order.id}: Sent successfully - Tracking: ${result.trackingNumber}`);
        } else {
          errors++;
          details.push(`Order #${order.id}: Failed - ${result.error}`);
        }
      } catch (error: any) {
        errors++;
        details.push(`Order #${order.id}: Error - ${error.message}`);
        console.error(`Error sending order #${order.id} to carrier:`, error);
      }
    }

    return { sent, errors, details };
  } catch (error: any) {
    console.error('Error sending confirmed orders to carrier:', error);
    return { sent, errors: errors + 1, details: [...details, `Global error: ${error.message}`] };
  }
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
