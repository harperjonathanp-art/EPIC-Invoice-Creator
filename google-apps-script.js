// =====================================================
//  EPIC STEM Invoice Logger — Google Apps Script
// =====================================================
//
//  SETUP INSTRUCTIONS:
//
//  1. Go to https://sheets.google.com and create a new spreadsheet
//  2. Name it "EPIC STEM Invoices" (or whatever you like)
//  3. In Row 1, add these headers (exactly as written):
//     A1: Invoice #
//     B1: Date
//     C1: Due Date
//     D1: Customer
//     E1: Email
//     F1: Address
//     G1: Items
//     H1: Subtotal
//     I1: Tax Rate
//     J1: Tax
//     K1: Total
//     L1: Notes
//     M1: Saved At
//
//  4. Click Extensions > Apps Script
//  5. Delete any code in the editor and paste this ENTIRE file
//  6. Click Deploy > New Deployment
//  7. Set type to "Web app"
//  8. Set "Execute as" to your account
//  9. Set "Who has access" to "Anyone"
//  10. Click Deploy and copy the new URL
//
//  *** IMPORTANT: Every time you update this code, you must
//  *** create a NEW deployment for changes to go live.
//  *** (Deploy > New Deployment, NOT Manage Deployments)
//
// =====================================================

function doGet(e) {
  var action = (e.parameter.action || 'load').toLowerCase();
  var callback = e.parameter.callback || '';

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // ——— PING (test connection) ———
    if (action === 'ping') {
      return respond(callback, { status: 'success', action: 'ping', message: 'Connected!' });
    }

    // ——— SAVE an invoice ———
    if (action === 'save') {
      var raw = e.parameter.payload || '{}';
      var data = JSON.parse(raw);

      var itemsText = (data.items || []).map(function(item) {
        return item.qty + 'x ' + item.description + ' @ $' + Number(item.price).toFixed(2);
      }).join(' | ');

      sheet.appendRow([
        data.invoiceNumber || '',
        data.invoiceDate || '',
        data.dueDate || '',
        data.customerName || '',
        data.customerEmail || '',
        data.customerAddress || '',
        itemsText,
        '$' + Number(data.subtotal || 0).toFixed(2),
        (Number(data.taxRate || 0) * 100).toFixed(0) + '%',
        '$' + Number(data.tax || 0).toFixed(2),
        '$' + Number(data.total || 0).toFixed(2),
        data.notes || '',
        new Date().toLocaleString()
      ]);

      return respond(callback, { status: 'success', action: 'save' });
    }

    // ——— LOAD invoice history ———
    var allData = sheet.getDataRange().getValues();
    var headers = allData[0];
    var rows = [];

    for (var i = 1; i < allData.length; i++) {
      var row = {};
      for (var j = 0; j < headers.length; j++) {
        // Convert dates to strings so JSON.stringify doesn't mangle them
        var val = allData[i][j];
        if (val instanceof Date) {
          val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        }
        row[headers[j]] = val;
      }
      rows.push(row);
    }

    return respond(callback, { status: 'success', invoices: rows });

  } catch (err) {
    return respond(callback, { status: 'error', message: err.toString() });
  }
}

// Helper: Returns JSONP if callback provided, otherwise plain JSON
function respond(callback, data) {
  var json = JSON.stringify(data);

  if (callback) {
    // JSONP: wrap in function call, return as JavaScript
    // This is what makes it work from file:// origins
    return ContentService
      .createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
