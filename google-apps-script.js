/**
 * Metro Lyallpur EV — Invoice Manager
 * Google Apps Script Backend
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open Google Sheets → Extensions → Apps Script
 * 2. Paste this entire file
 * 3. Click Deploy → New Deployment → Web App
 * 4. Execute as: Me | Who has access: Anyone
 * 5. Copy the Web App URL and paste it in the app Settings page
 */

const SHEET_NAME_INVOICES = 'Invoices';
const SHEET_NAME_VINS = 'VINs';

// ─── GET handler (ping / read) ───────────────────────────────────────────────
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';

  if (action === 'ping') {
    return jsonResponse({ status: 'ok', message: 'Metro EV Invoice Manager connected' });
  }

  if (action === 'getInvoices') {
    return jsonResponse({ status: 'ok', records: getSheetRecords(SHEET_NAME_INVOICES, INVOICE_HEADERS) });
  }

  if (action === 'getVins') {
    return jsonResponse({ status: 'ok', records: getSheetRecords(SHEET_NAME_VINS, VIN_HEADERS) });
  }

  return jsonResponse({ status: 'ok', message: 'Metro EV API ready' });
}

// ─── POST handler (sync / upsert) ────────────────────────────────────────────
function doPost(e) {
  try {
    // The browser sends form-encoded data to avoid a CORS preflight.
    // Keep accepting raw JSON as well for callers that post JSON directly.
    const body = e.parameter && e.parameter.data
      ? JSON.parse(e.parameter.data)
      : JSON.parse(e.postData.contents);
    const action = body.action || 'sync';

    if (action === 'sync' || action === 'upsert') {
      const records = body.records || [];
      upsertInvoices(records);
      return jsonResponse({ status: 'ok', count: records.length });
    }

    if (action === 'syncVins') {
      const vins = body.vins || [];
      syncVins(vins);
      return jsonResponse({ status: 'ok', count: vins.length });
    }

    if (action === 'deleteInvoice') {
      deleteInvoiceById(body.id);
      return jsonResponse({ status: 'ok' });
    }

    return jsonResponse({ status: 'error', message: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

// ─── INVOICES ─────────────────────────────────────────────────────────────────
const INVOICE_HEADERS = [
  'id','ref','date','name','cnic','contact','address',
  'vin','motor','colour','particular','quantity',
  'amount','amtEx','salesTx','total',
  'mode','bank','dealtBy','timestamp','legacy'
];

function upsertInvoices(records) {
  const sheet = getSheet(SHEET_NAME_INVOICES);
  ensureHeaders(sheet, INVOICE_HEADERS);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id');

  records.forEach(record => {
    const id = record.id;
    let rowIdx = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] == id) { rowIdx = i + 1; break; }
    }

    const row = INVOICE_HEADERS.map(h => record[h] !== undefined ? record[h] : '');

    if (rowIdx > 0) {
      sheet.getRange(rowIdx, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }
  });
}

function deleteInvoiceById(id) {
  const sheet = getSheet(SHEET_NAME_INVOICES);
  const data = sheet.getDataRange().getValues();
  const idCol = data[0].indexOf('id');
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] == id) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
}

// ─── VINS ─────────────────────────────────────────────────────────────────────
const VIN_HEADERS = ['vin','desc','colour','motor'];

function syncVins(vins) {
  const sheet = getSheet(SHEET_NAME_VINS);
  ensureHeaders(sheet, VIN_HEADERS);
  // Clear existing and rewrite
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  vins.forEach(v => {
    sheet.appendRow([v.vin || '', v.desc || '', v.colour || '', v.motor || '']);
  });
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function getSheetRecords(name, headers) {
  const sheet = getSheet(name);
  ensureHeaders(sheet, headers);
  const rows = sheet.getDataRange().getValues();
  const columns = rows[0];
  const timeZone = SpreadsheetApp.getActive().getSpreadsheetTimeZone();

  return rows.slice(1).map(row => {
    const record = {};
    columns.forEach((column, index) => {
      const value = row[index];
      record[column] = column === 'date' && value instanceof Date
        ? Utilities.formatDate(value, timeZone, 'yyyy-MM-dd')
        : value;
    });
    return record;
  });
}

function ensureHeaders(sheet, headers) {
  const existing = sheet.getLastRow() === 0 ? [] : sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (existing.join(',') !== headers.join(',')) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    // Style the header row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1a7a4a');
    headerRange.setFontColor('#ffffff');
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
