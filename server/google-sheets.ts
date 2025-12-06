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

    // Columns matching user's sheet (like Ecomlik):
    // A: Order Reference, B: Name, C: Phone, D: City, E: Address, 
    // F: COD Amount, G: Product SKU, H: Quantity, I: Notes, J: Status
    const values = [
      [
        `CMD-${order.id}`,                                    // A: Order Reference
        order.customerName,                                   // B: Name
        order.phone,                                          // C: Phone
        order.city,                                           // D: City
        order.address,                                        // E: Address
        parseFloat(order.totalPrice).toFixed(2),              // F: COD Amount
        productSkus,                                          // G: Product SKU
        totalQuantity.toString(),                             // H: Quantity
        productNames,                                         // I: Notes (products detail)
        '',                                                   // J: Status (empty, updated when sent to carrier)
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'A:J',
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

// Update the status column in Google Sheets for an order
export async function updateOrderStatusInSheet(orderId: number, status: string, error?: string): Promise<boolean> {
  try {
    const spreadsheetIdSetting = await storage.getSetting('google_sheets_id');
    const spreadsheetId = spreadsheetIdSetting?.value;

    if (!spreadsheetId) {
      console.log('Google Sheets ID not configured, skipping status update');
      return false;
    }

    const sheets = await getUncachableGoogleSheetClient();
    const orderRef = `CMD-${orderId}`;

    // First, find the row with this order reference
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A:A', // Get all order references in column A
    });

    const rows = response.data.values || [];
    let rowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === orderRef) {
        rowIndex = i + 1; // Sheets are 1-indexed
        break;
      }
    }

    if (rowIndex === -1) {
      console.log(`Order ${orderRef} not found in Google Sheet`);
      return false;
    }

    // Update the Status column (J) for this row
    const statusValue = error ? `Error: ${error}` : status;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `J${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[statusValue]],
      },
    });

    console.log(`Updated Google Sheet status for order ${orderId}: ${statusValue}`);
    return true;
  } catch (error: any) {
    console.error('Error updating order status in Google Sheets:', error);
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

// Read corrected order data from Google Sheets and update the database
export async function syncOrderFromSheet(orderId: number): Promise<{ success: boolean; message: string; updates?: any }> {
  try {
    const spreadsheetIdSetting = await storage.getSetting('google_sheets_id');
    const spreadsheetId = spreadsheetIdSetting?.value;

    if (!spreadsheetId) {
      return { success: false, message: 'Google Sheets ID not configured' };
    }

    const sheets = await getUncachableGoogleSheetClient();
    const orderRef = `CMD-${orderId}`;

    // Get all data from the sheet (columns A to J)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A:J',
    });

    const rows = response.data.values || [];
    let orderRow: string[] | null = null;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === orderRef) {
        orderRow = rows[i];
        break;
      }
    }

    if (!orderRow) {
      return { success: false, message: `Order ${orderRef} not found in Google Sheet` };
    }

    // Parse the row data
    // A: Order Reference, B: Name, C: Phone, D: City, E: Address, 
    // F: COD Amount, G: Product SKU, H: Quantity, I: Notes, J: Status
    const updates = {
      customerName: orderRow[1] || '',
      phone: orderRow[2] || '',
      city: orderRow[3] || '',
      address: orderRow[4] || '',
      notes: orderRow[8] || '',
    };

    // Update the order in the database
    await storage.updateOrderDetails(orderId, updates);

    // Clear the error status in the sheet (set to empty for retry)
    const rowIndex = rows.findIndex(r => r[0] === orderRef) + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `J${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['']],
      },
    });

    return { 
      success: true, 
      message: `Order ${orderId} updated from Google Sheets`, 
      updates 
    };
  } catch (error: any) {
    console.error('Error syncing order from Google Sheets:', error);
    return { success: false, message: error.message };
  }
}

// Sync all orders with errors from Google Sheets
export async function syncAllErrorOrdersFromSheet(): Promise<{ updated: number; failed: number; details: string[] }> {
  try {
    const spreadsheetIdSetting = await storage.getSetting('google_sheets_id');
    const spreadsheetId = spreadsheetIdSetting?.value;

    if (!spreadsheetId) {
      return { updated: 0, failed: 0, details: ['Google Sheets ID not configured'] };
    }

    const sheets = await getUncachableGoogleSheetClient();

    // Get all data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A:J',
    });

    const rows = response.data.values || [];
    let updated = 0;
    let failed = 0;
    const details: string[] = [];

    for (let i = 1; i < rows.length; i++) { // Skip header row
      const row = rows[i];
      const orderRef = row[0];
      const status = row[9] || '';

      // Only process orders with error status
      if (!orderRef?.startsWith('CMD-') || !status.startsWith('Error:')) {
        continue;
      }

      const orderId = parseInt(orderRef.replace('CMD-', ''));
      if (isNaN(orderId)) continue;

      try {
        const result = await syncOrderFromSheet(orderId);
        if (result.success) {
          updated++;
          details.push(`Order #${orderId}: Updated from sheet`);
        } else {
          failed++;
          details.push(`Order #${orderId}: ${result.message}`);
        }
      } catch (err: any) {
        failed++;
        details.push(`Order #${orderId}: ${err.message}`);
      }
    }

    return { updated, failed, details };
  } catch (error: any) {
    console.error('Error syncing error orders from Google Sheets:', error);
    return { updated: 0, failed: 0, details: [error.message] };
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
