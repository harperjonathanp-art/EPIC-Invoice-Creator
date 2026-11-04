// =====================================================
//  EPIC STEM Invoice Logger — Google Apps Script
// =====================================================
//
//  SETUP (first time):
//
//  1. Create a Google Sheet (e.g. "EPIC STEM Invoices"). You don't need to type
//     headers — the script adds any missing ones to Row 1 the first time it saves.
//  2. Click Extensions > Apps Script
//  3. Delete any code in the editor and paste this ENTIRE file
//  4. Click Deploy > New deployment, type "Web app"
//     Execute as: Me · Who has access: Anyone
//  5. Click Deploy and copy the Web App URL into SHEET_URL in index.html
//
//  UPDATING THIS CODE LATER (keeps the same URL):
//  Deploy > Manage deployments > pencil icon > Version: "New version" > Deploy.
//  (Deploy > New deployment also works, but gives you a NEW URL to paste.)
//
//  Columns it writes (by header name, so the order in your sheet can be anything):
//  Invoice # | Date | Due Date | Customer | Email | Address | Items | Subtotal |
//  Tax Rate | Tax | Total | Notes | Saved At | Credits | Balance Due | Created By
//
//  Saving an invoice number that's already in the sheet updates that row
//  instead of adding a duplicate.
//
//  Invoice numbers come from here in order (EPIC-2026-0001, -0002, …), starting
//  over each January. The last number used is kept in Project Settings >
//  Script Properties (lastInvoice2026, …) — change it there to skip ahead.
// =====================================================

var HEADERS = ['Invoice #', 'Date', 'Due Date', 'Customer', 'Email', 'Address', 'Items',
  'Subtotal', 'Tax Rate', 'Tax', 'Total', 'Notes', 'Saved At', 'Credits', 'Balance Due', 'Created By'];

function doGet(e) {
  var p = (e && e.parameter) || {};
  var action = String(p.action || 'load').toLowerCase();
  var callback = p.callback || '';

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // ——— NEXT invoice number (EPIC-2026-0001, EPIC-2026-0002, …) ———
    // Handed out under a lock, so two people starting invoices at once never get the same one.
    if (action === 'next') {
      var nlock = LockService.getScriptLock();
      nlock.waitLock(20000);
      try {
        var year = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy');
        var props = PropertiesService.getScriptProperties();
        var key = 'lastInvoice' + year;
        var n = Math.max(Number(props.getProperty(key)) || 0, highestNumber(sheet, year)) + 1;
        props.setProperty(key, String(n));
        return respond(callback, { status: 'success', action: 'next', invoiceNumber: 'EPIC-' + year + '-' + ('000' + n).slice(-4) });
      } finally {
        nlock.releaseLock();
      }
    }

    // ——— PING (test connection) ———
    if (action === 'ping') {
      return respond(callback, { status: 'success', action: 'ping', message: 'Connected' });
    }

    // ——— SAVE (insert, or update the row with the same invoice #) ———
    if (action === 'save') {
      var data = JSON.parse(p.payload || '{}');
      var lock = LockService.getScriptLock();
      lock.waitLock(20000);
      try {
        var headers = ensureHeaders(sheet);
        var values = rowValues(data);
        var row = headers.map(function (h) { return values.hasOwnProperty(h) ? values[h] : ''; });
        var existing = findRow(sheet, headers, data.invoiceNumber);
        if (existing) {
          sheet.getRange(existing, 1, 1, row.length).setValues([row]);
        } else {
          sheet.appendRow(row); // appendRow adds a row to the sheet if it's full
        }
        // No formatting calls here: a sheet formatted as a Table won't let a script
        // change a typed column's format. Writing "$8.00" lets Sheets format it.
      } finally {
        lock.releaseLock();
      }
      return respond(callback, { status: 'success', action: 'save', updated: !!existing });
    }

    // ——— LOAD invoice history ———
    var all = sheet.getDataRange().getValues();
    var head = all[0] || [];
    var rows = [];
    for (var i = 1; i < all.length; i++) {
      var r = {};
      for (var j = 0; j < head.length; j++) {
        var val = all[i][j];
        // Dates become strings so JSON doesn't mangle them
        if (val instanceof Date) val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        r[head[j]] = val;
      }
      rows.push(r);
    }
    return respond(callback, { status: 'success', invoices: rows });

  } catch (err) {
    return respond(callback, { status: 'error', message: err.toString() });
  }
}

// Dollar text like "$8.00" (the original script's format); Sheets turns it into a currency number
function money(n) { var v = Math.round((Number(n) || 0) * 100) / 100; return (v < 0 ? '-$' : '$') + Math.abs(v).toFixed(2); }

function rowValues(d) {
  var items = (d.items || []).map(function (it) {
    return it.qty + 'x ' + it.description + ' @ $' + Number(it.price).toFixed(2);
  }).join(' | ');
  var credits = (d.credits || []).map(function (c) {
    return '$' + Number(c.amount).toFixed(2) + (c.description ? ' (' + c.description + ')' : '');
  }).join(' | ');
  return {
    'Invoice #': d.invoiceNumber || '',
    'Date': d.invoiceDate || '',
    'Due Date': d.dueDate || '',
    'Customer': d.customerName || '',
    'Email': d.customerEmail || '',
    'Address': d.customerAddress || '',
    'Items': items,
    'Subtotal': money(d.subtotal),
    'Tax Rate': (Number(d.taxRate || 0) * 100).toFixed(0) + '%',
    'Tax': money(d.tax),
    'Total': money(d.total),
    'Notes': d.notes || '',
    'Saved At': new Date().toLocaleString(),
    'Credits': credits,
    'Balance Due': money(d.balanceDue != null ? d.balanceDue : d.total),
    'Created By': d.createdBy || ''
  };
}

// Adds any missing headers to the end of Row 1 and returns the full header list.
function ensureHeaders(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var current = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  if (current.length === 1 && current[0] === '') current = [];
  var missing = HEADERS.filter(function (h) { return current.indexOf(h) === -1; });
  if (missing.length) {
    // Make room if the sheet has been trimmed to fewer columns than we need
    var need = current.length + missing.length - sheet.getMaxColumns();
    if (need > 0) sheet.insertColumnsAfter(sheet.getMaxColumns(), need);
    sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]).setFontWeight('bold');
    current = current.concat(missing);
  }
  return current;
}

// Returns the sheet row number holding this invoice #, or 0.
// Highest NNNN among this year's EPIC-YYYY-NNNN numbers already in the sheet (0 if none)
function highestNumber(sheet, year) {
  if (sheet.getLastRow() < 2) return 0;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  var col = headers.indexOf('Invoice #') + 1;
  if (!col) return 0;
  var re = new RegExp('^EPIC-' + year + '-(\\d+)$'), max = 0;
  sheet.getRange(2, col, sheet.getLastRow() - 1, 1).getValues().forEach(function (r) {
    var m = re.exec(String(r[0]).trim());
    if (m) max = Math.max(max, Number(m[1]));
  });
  return max;
}

function findRow(sheet, headers, invoiceNumber) {
  if (!invoiceNumber || sheet.getLastRow() < 2) return 0;
  var col = headers.indexOf('Invoice #') + 1;
  var ids = sheet.getRange(2, col, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(invoiceNumber)) return i + 2;
  }
  return 0;
}

// Returns JSONP when a callback is given (that's how the page talks to it), plain JSON otherwise
function respond(callback, data) {
  var json = JSON.stringify(data);
  if (callback) {
    if (!/^[A-Za-z_$][\w$]*$/.test(callback)) callback = 'callback';
    return ContentService.createTextOutput(callback + '(' + json + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
