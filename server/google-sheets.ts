import { google } from 'googleapis';
import { storage } from './storage';
import type { Order, OrderItem, Product } from '@shared/schema';

let connectionSettings: any = null;

async function getAccessToken(): Promise<string> {
  if (connectionSettings?.settings?.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  if (!hostname) {
    throw new Error('REPLIT_CONNECTORS_HOSTNAME not configured. Please set up Google Sheets integration in Replit.');
  }

  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('Replit authentication token not found. Please ensure the app is running in Replit environment.');
  }

  try {
    const response = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Google Sheets connection: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    connectionSettings = data.items?.[0];

    if (!connectionSettings) {
      throw new Error('Google Sheets connection not found. Please connect Google Sheets in the Replit integrations panel.');
    }

    const accessToken = connectionSettings?.settings?.access_token || 
                       connectionSettings?.settings?.oauth?.credentials?.access_token;

    if (!accessToken) {
      throw new Error('Google Sheets access token not found. Please reconnect Google Sheets in the integrations panel.');
    }

    return accessToken;
  } catch (error: any) {
    connectionSettings = null;
    if (error.message.includes('Google Sheets')) {
      throw error;
    }
    throw new Error(`Failed to connect to Google Sheets: ${error.message}`);
  }
}

async function getUncachableGoogleSheetClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.sheets({ version: 'v4', auth: oauth2Client });
}

export async function syncOrderToGoogleSheets(order: Order, items: (OrderItem & { product: Product })[]): Promise<boolean> {
  try {
    const spreadsheetIdSetting = await storage.getSetting('google_sheets_id');
    const spreadsheetId = spreadsheetIdSetting?.value;

    if (!spreadsheetId) {
      throw new Error('Google Sheets ID not configured in settings');
    }

    const sheets = await getUncachableGoogleSheetClient();

    // Format products as SKU list and calculate total quantity
    const productSkus = items.map(item => item.product?.sku || `PROD-${item.productId}`).join(', ');
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const productNames = items.map(item => `${item.product?.title} x${item.quantity}`).join(', ');

    // Columns matching user's sheet:
    // A: Order Reference, B: Name, C: Phone, D: Address, E: City, 
    // F: COD Amount, G: Product SKU, H: Quantity, I: Notes, 
    // J: Tracking Number Status, K: Errors, L: Date
    const values = [
      [
        `CMD-${order.id}`,                                    // A: Order Reference
        order.customerName,                                   // B: Name
        order.phone,                                          // C: Phone
        order.address,                                        // D: Address
        order.city,                                           // E: City
        parseFloat(order.totalPrice).toFixed(2),              // F: COD Amount
        productSkus,                                          // G: Product SKU
        totalQuantity.toString(),                             // H: Quantity
        productNames,                                         // I: Notes (products detail)
        order.trackingNumber || '',                           // J: Tracking Number Status
        '',                                                   // K: Errors
        new Date(order.createdAt).toLocaleDateString('fr-FR'), // L: Date
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'A:L',
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    });

    await storage.markOrderSynced(order.id);
    await storage.createSyncLog({
      orderId: order.id,
      action: 'SYNC_TO_SHEETS',
      result: 'SUCCESS',
      details: `Order ${order.id} synced to Google Sheets`,
    });

    return true;
  } catch (error: any) {
    console.error('Error syncing to Google Sheets:', error);

    try {
      await storage.createSyncLog({
        orderId: order.id,
        action: 'SYNC_TO_SHEETS',
        result: 'FAILURE',
        details: error.message || 'Unknown error',
      });
    } catch (logError) {
      console.error('Error creating sync log:', logError);
    }

    return false;
  }
}

export async function syncAllUnSyncedOrders(): Promise<{ synced: number; failed: number; error?: string }> {
  try {
    const unSyncedOrders = await storage.getUnSyncedOrders();
    let synced = 0;
    let failed = 0;

    if (unSyncedOrders.length === 0) {
      return { synced: 0, failed: 0 };
    }

    for (const order of unSyncedOrders) {
      try {
        const items = await storage.getOrderItems(order.id);
        const success = await syncOrderToGoogleSheets(order, items);
        if (success) {
          synced++;
        } else {
          failed++;
        }
      } catch (orderError: any) {
        console.error(`Error syncing order ${order.id}:`, orderError);
        failed++;
      }
    }

    return { synced, failed };
  } catch (error: any) {
    console.error('Error in syncAllUnSyncedOrders:', error);
    return { synced: 0, failed: 0, error: error.message };
  }
}

export async function ensureSheetExists(): Promise<void> {
  const spreadsheetIdSetting = await storage.getSetting('google_sheets_id');
  const spreadsheetId = spreadsheetIdSetting?.value;

  if (!spreadsheetId) {
    return;
  }

  try {
    const sheets = await getUncachableGoogleSheetClient();

    // Just verify we can access the spreadsheet
    await sheets.spreadsheets.get({
      spreadsheetId,
    });
  } catch (error: any) {
    console.error('Error verifying sheet access:', error);
    throw new Error(`Failed to access Google Sheet: ${error.message}`);
  }
}
