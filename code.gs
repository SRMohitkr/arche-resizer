function doPost(e) {
  // 1. Get the active spreadsheet and the first sheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // 2. Parse the incoming form data (URL-encoded)
  // The frontend now sends data as application/x-www-form-urlencoded
  var troubleSelling = e.parameter.trouble_selling;
  var paymentPreference = e.parameter.payment_preference;
  var platformInterest = e.parameter.platform_interest;
  var location = e.parameter.location;
  // Log received values for debugging
  Logger.log('Received: ' + JSON.stringify({troubleSelling, paymentPreference, platformInterest, location}));

  // 4. Create a timestamp
  var timestamp = new Date();

  // 5. Append the data as a new row
  sheet.appendRow([
    timestamp,
    troubleSelling,
    paymentPreference,
    platformInterest,
    location
  ]);

  // 6. Return a success response
  // Note: 'no-cors' mode in fetch means the browser won't read this, but it's good practice.
  return ContentService.createTextOutput(JSON.stringify({ 'result': 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Run this function once to set up the headers in your Google Sheet.
 */
function setupHeaders() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Check if the sheet is empty (or just check first row)
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Timestamp",
      "Trouble Selling Scrap",
      "Payment Preference", 
      "Interest in Platform",
      "Location"
    ]);
    
    // Optional: Freeze the first row and make it bold
    sheet.setFrozenRows(1);
    var range = sheet.getRange(1, 1, 1, 5);
    range.setFontWeight("bold");
  }
}
