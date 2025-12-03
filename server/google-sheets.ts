import { google } from 'googleapis';
import { storage } from './storage';
import type { Order, OrderItem, Product } from '@shared/schema';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Sheet not connected');
  }
  return accessToken;
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
      throw new Error('Google Sheets ID not configured');
    }

    const sheets = await getUncachableGoogleSheetClient();

    const productsJson = JSON.stringify(
      items.map((item) => ({
        productId: item.productId,
        title: item.product?.title,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }))
    );

    const values = [
      [
        order.id.toString(),
        new Date(order.createdAt).toISOString(),
        order.customerName,
        order.phone,
        order.address,
        order.city,
        productsJson,
        order.totalPrice,
        order.status,
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Orders!A:I',
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

    await storage.createSyncLog({
      orderId: order.id,
      action: 'SYNC_TO_SHEETS',
      result: 'FAILURE',
      details: error.message || 'Unknown error',
    });

    return false;
  }
}

export async function syncAllUnSyncedOrders(): Promise<{ synced: number; failed: number }> {
  const unSyncedOrders = await storage.getUnSyncedOrders();
  let synced = 0;
  let failed = 0;

  for (const order of unSyncedOrders) {
    const items = await storage.getOrderItems(order.id);
    const success = await syncOrderToGoogleSheets(order, items);
    if (success) {
      synced++;
    } else {
      failed++;
    }
  }

  return { synced, failed };
}

export async function ensureSheetExists(): Promise<void> {
  try {
    const spreadsheetIdSetting = await storage.getSetting('google_sheets_id');
    const spreadsheetId = spreadsheetIdSetting?.value;

    if (!spreadsheetId) {
      return;
    }

    const sheets = await getUncachableGoogleSheetClient();

    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const ordersSheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === 'Orders'
    );

    if (!ordersSheet) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'Orders',
                },
              },
            },
          ],
        },
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Orders!A1:I1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [
            [
              'ID_commande',
              'Date',
              'Nom',
              'Téléphone',
              'Adresse',
              'Ville',
              'Produits',
              'Prix_total',
              'Statut',
            ],
          ],
        },
      });
    }
  } catch (error) {
    console.error('Error ensuring sheet exists:', error);
  }
}
