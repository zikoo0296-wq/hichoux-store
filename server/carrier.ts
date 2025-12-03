import { storage } from './storage';
import type { Order } from '@shared/schema';

export interface ShippingLabelResponse {
  success: boolean;
  labelUrl?: string;
  pdfBase64?: string;
  trackingNumber?: string;
  providerName?: string;
  error?: string;
}

export async function sendOrderToCarrier(order: Order): Promise<ShippingLabelResponse> {
  try {
    const carrierApiUrl = await storage.getSetting('carrier_api_url');
    const carrierApiKey = await storage.getSetting('carrier_api_key');

    if (!carrierApiUrl?.value || !carrierApiKey?.value) {
      const trackingNumber = `TRK${order.id.toString().padStart(8, '0')}`;
      
      const mockLabel = await storage.createShippingLabel({
        orderId: order.id,
        labelUrl: null,
        pdfBase64: null,
        trackingNumber,
        providerName: 'Standard Carrier',
      });

      await storage.createSyncLog({
        orderId: order.id,
        action: 'SEND_TO_CARRIER',
        result: 'SUCCESS',
        details: `Mock shipping label created with tracking: ${trackingNumber}`,
      });

      return {
        success: true,
        trackingNumber,
        providerName: 'Standard Carrier',
      };
    }

    const response = await fetch(carrierApiUrl.value + '/shipments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${carrierApiKey.value}`,
      },
      body: JSON.stringify({
        recipient: {
          name: order.customerName,
          phone: order.phone,
          address: order.address,
          city: order.city,
        },
        order_id: order.id.toString(),
        cod_amount: parseFloat(order.totalPrice),
        notes: order.notes,
      }),
    });

    if (!response.ok) {
      throw new Error(`Carrier API error: ${response.statusText}`);
    }

    const data = await response.json();

    const label = await storage.createShippingLabel({
      orderId: order.id,
      labelUrl: data.label_url || null,
      pdfBase64: data.pdf_base64 || null,
      trackingNumber: data.tracking_number || null,
      providerName: data.provider_name || 'Carrier API',
    });

    await storage.createSyncLog({
      orderId: order.id,
      action: 'SEND_TO_CARRIER',
      result: 'SUCCESS',
      details: `Shipping label created with tracking: ${data.tracking_number}`,
    });

    return {
      success: true,
      labelUrl: data.label_url,
      pdfBase64: data.pdf_base64,
      trackingNumber: data.tracking_number,
      providerName: data.provider_name,
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
