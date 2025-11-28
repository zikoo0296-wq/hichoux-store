/**
 * =============================================
 * HICHOUX STORE - Google Apps Script
 * =============================================
 * Script pour synchroniser les commandes avec Google Sheets
 * 
 * INSTALLATION:
 * 1. Ouvrir Google Sheet: https://docs.google.com/spreadsheets/d/1qKkOSPisPkqUQEkH-stKoUaEo1d9e63pVcV1iU9yvHw/edit
 * 2. Extensions → Apps Script
 * 3. Copier/coller ce code
 * 4. Déployer → Nouveau déploiement → Application Web
 * 5. Execute as: "Moi", Who has access: "Tout le monde"
 * 6. Copier l'URL générée et l'ajouter dans config.js
 * =============================================
 */

// Configuration
const CONFIG = {
  SHEET_NAME: 'Orders', // Nom de la feuille
  HEADERS: [
    'Order Reference',
    'Name', 
    'Phone',
    'Address',
    'City',
    'COD Amount',
    'Product SKU',
    'Quantity',
    'Notes',
    'Tracking Number',
    'Status',
    'Errors',
    'Created At'
  ]
};

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'Hichoux Store API is running',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    let result;

    switch (data.action) {
      case 'addOrder':
        result = addOrder(data.order);
        break;
      case 'addOrders':
        result = addMultipleOrders(data.orders);
        break;
      case 'updateStatus':
        result = updateOrderStatus(data.orderRef, data.status, data.tracking);
        break;
      case 'getOrders':
        result = getOrders(data.status);
        break;
      default:
        result = { success: false, error: 'Unknown action' };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Initialize sheet with headers if needed
 */
function initSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }
  
  // Check if headers exist
  const firstRow = sheet.getRange(1, 1, 1, CONFIG.HEADERS.length).getValues()[0];
  const hasHeaders = firstRow[0] === CONFIG.HEADERS[0];
  
  if (!hasHeaders) {
    // Add headers
    sheet.getRange(1, 1, 1, CONFIG.HEADERS.length).setValues([CONFIG.HEADERS]);
    
    // Format headers
    sheet.getRange(1, 1, 1, CONFIG.HEADERS.length)
      .setBackground('#1a1a1a')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
    // Auto-resize columns
    for (let i = 1; i <= CONFIG.HEADERS.length; i++) {
      sheet.autoResizeColumn(i);
    }
  }
  
  return sheet;
}

/**
 * Add a single order to the sheet
 */
function addOrder(order) {
  try {
    const sheet = initSheet();
    
    // Check if order already exists
    const data = sheet.getDataRange().getValues();
    const orderExists = data.some(row => row[0] === order.orderRef);
    
    if (orderExists) {
      return { 
        success: false, 
        error: 'Order already exists',
        orderRef: order.orderRef 
      };
    }
    
    // Prepare row data
    const row = [
      order.orderRef || '',
      order.name || '',
      order.phone || '',
      order.address || '',
      order.city || '',
      order.codAmount || 0,
      order.productSku || '',
      order.quantity || 1,
      order.notes || '',
      order.tracking || '',
      order.status || 'New',
      order.errors || '',
      new Date().toISOString()
    ];
    
    // Append row
    sheet.appendRow(row);
    
    // Get last row and apply formatting
    const lastRow = sheet.getLastRow();
    
    // Status color coding
    const statusCell = sheet.getRange(lastRow, 11);
    applyStatusFormatting(statusCell, order.status || 'New');
    
    return { 
      success: true, 
      message: 'Order added successfully',
      orderRef: order.orderRef,
      row: lastRow
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: error.toString() 
    };
  }
}

/**
 * Add multiple orders at once
 */
function addMultipleOrders(orders) {
  if (!orders || !Array.isArray(orders)) {
    return { success: false, error: 'Invalid orders array' };
  }
  
  const results = {
    success: true,
    total: orders.length,
    added: 0,
    skipped: 0,
    errors: []
  };
  
  for (const order of orders) {
    const result = addOrder(order);
    if (result.success) {
      results.added++;
    } else {
      results.skipped++;
      if (result.error !== 'Order already exists') {
        results.errors.push({ orderRef: order.orderRef, error: result.error });
      }
    }
  }
  
  return results;
}

/**
 * Update order status and tracking number
 */
function updateOrderStatus(orderRef, status, tracking) {
  try {
    const sheet = initSheet();
    const data = sheet.getDataRange().getValues();
    
    // Find order row
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === orderRef) {
        rowIndex = i + 1; // +1 because array is 0-indexed but sheet is 1-indexed
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { success: false, error: 'Order not found' };
    }
    
    // Update status
    if (status) {
      const statusCell = sheet.getRange(rowIndex, 11);
      statusCell.setValue(status);
      applyStatusFormatting(statusCell, status);
    }
    
    // Update tracking
    if (tracking) {
      sheet.getRange(rowIndex, 10).setValue(tracking);
    }
    
    return { 
      success: true, 
      message: 'Order updated successfully',
      orderRef: orderRef
    };
    
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Get orders by status
 */
function getOrders(status) {
  try {
    const sheet = initSheet();
    const data = sheet.getDataRange().getValues();
    
    // Skip header row
    const orders = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const orderStatus = row[10];
      
      if (!status || orderStatus === status) {
        orders.push({
          orderRef: row[0],
          name: row[1],
          phone: row[2],
          address: row[3],
          city: row[4],
          codAmount: row[5],
          productSku: row[6],
          quantity: row[7],
          notes: row[8],
          tracking: row[9],
          status: row[10],
          errors: row[11],
          createdAt: row[12]
        });
      }
    }
    
    return { 
      success: true, 
      orders: orders,
      count: orders.length
    };
    
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Apply color formatting based on status
 */
function applyStatusFormatting(cell, status) {
  const colors = {
    'New': { bg: '#fef3c7', text: '#92400e' },
    'Confirmed': { bg: '#dbeafe', text: '#1e40af' },
    'Shipped': { bg: '#ede9fe', text: '#5b21b6' },
    'Delivered': { bg: '#d1fae5', text: '#065f46' },
    'Cancelled': { bg: '#fee2e2', text: '#991b1b' },
    'Returned': { bg: '#fed7aa', text: '#9a3412' }
  };
  
  const colorConfig = colors[status] || { bg: '#f3f4f6', text: '#374151' };
  
  cell.setBackground(colorConfig.bg)
      .setFontColor(colorConfig.text)
      .setFontWeight('bold');
}

/**
 * Create menu for manual actions
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🛍️ Hichoux Store')
    .addItem('📊 Initialize Sheet', 'initSheet')
    .addItem('🔄 Refresh Formatting', 'refreshFormatting')
    .addSeparator()
    .addItem('📈 Count by Status', 'countByStatus')
    .addItem('💰 Calculate Total Revenue', 'calculateRevenue')
    .addToUi();
}

/**
 * Refresh formatting for all rows
 */
function refreshFormatting() {
  const sheet = initSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    SpreadsheetApp.getUi().alert('No orders to format');
    return;
  }
  
  const statusColumn = sheet.getRange(2, 11, lastRow - 1, 1);
  const statuses = statusColumn.getValues();
  
  for (let i = 0; i < statuses.length; i++) {
    const cell = sheet.getRange(i + 2, 11);
    applyStatusFormatting(cell, statuses[i][0]);
  }
  
  SpreadsheetApp.getUi().alert('Formatting updated for ' + (lastRow - 1) + ' orders');
}

/**
 * Count orders by status
 */
function countByStatus() {
  const result = getOrders();
  if (!result.success) {
    SpreadsheetApp.getUi().alert('Error: ' + result.error);
    return;
  }
  
  const counts = {};
  for (const order of result.orders) {
    counts[order.status] = (counts[order.status] || 0) + 1;
  }
  
  let message = 'Orders by Status:\n\n';
  for (const [status, count] of Object.entries(counts)) {
    message += `${status}: ${count}\n`;
  }
  message += `\nTotal: ${result.orders.length}`;
  
  SpreadsheetApp.getUi().alert(message);
}

/**
 * Calculate total revenue from delivered orders
 */
function calculateRevenue() {
  const result = getOrders('Delivered');
  if (!result.success) {
    SpreadsheetApp.getUi().alert('Error: ' + result.error);
    return;
  }
  
  const total = result.orders.reduce((sum, order) => sum + (parseFloat(order.codAmount) || 0), 0);
  
  SpreadsheetApp.getUi().alert(
    `Revenue from Delivered Orders:\n\n` +
    `Orders: ${result.orders.length}\n` +
    `Total: ${total} DH`
  );
}

/**
 * Test function - can be run manually
 */
function testAddOrder() {
  const testOrder = {
    orderRef: 'TEST-' + Date.now(),
    name: 'Test Client',
    phone: '0600000000',
    address: 'Test Address',
    city: 'Casablanca',
    codAmount: 100,
    productSku: 'TEST-SKU',
    quantity: 1,
    notes: 'Test order',
    status: 'New'
  };
  
  const result = addOrder(testOrder);
  Logger.log(JSON.stringify(result, null, 2));
}
