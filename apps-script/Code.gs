/**
 * Payment - Google Apps Script Web App
 * รับรายการธุรกรรม (JSON array) จากแอป แล้วเพิ่มลงชีทแบบไม่ซ้ำ (idempotent)
 * โดยเช็คคอลัมน์ ID ก่อนเพิ่มทุกครั้ง
 *
 * วิธีติดตั้ง: ดู SETUP.md ในโปรเจกต์
 */

var SHEET_NAME = 'Transactions';
var HEADER_ROW = ['ลำดับ', 'รายการ', 'ประเภท', 'วิธีชำระ', 'วันที่', 'เวลา', 'ยอด', 'ID'];
var ID_COLUMN_INDEX = 8; // คอลัมน์ H

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var sheet = getOrCreateSheet_();
    var payload = JSON.parse(e.postData.contents);

    if (!Array.isArray(payload)) {
      return jsonResponse_({ ok: false, error: 'รูปแบบข้อมูลไม่ถูกต้อง ต้องเป็น array' });
    }

    var existingIds = getExistingIds_(sheet);
    var lastRow = sheet.getLastRow();
    var seq = lastRow > 1 ? lastRow - 1 : 0;

    var rowsToAppend = [];
    var added = 0;

    payload.forEach(function (t) {
      var id = String(t.id || '');
      if (!id || existingIds[id]) {
        return; // ข้ามรายการที่ไม่มี id หรือมีอยู่แล้วในชีท
      }
      existingIds[id] = true;
      seq += 1;
      rowsToAppend.push([
        seq,
        t.name || '',
        t.type === 'income' ? 'รายรับ' : 'รายจ่าย',
        t.paymentMethod === 'qr' ? 'QR' : 'เงินสด',
        t.date || '',
        t.time || '',
        Number(t.amount) || 0,
        id,
      ]);
      added += 1;
    });

    if (rowsToAppend.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, HEADER_ROW.length).setValues(rowsToAppend);
    }

    return jsonResponse_({ ok: true, added: added, skipped: payload.length - added });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return jsonResponse_({ ok: true, message: 'Payment Sync Web App กำลังทำงานอยู่' });
}

function getOrCreateSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER_ROW);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getExistingIds_(sheet) {
  var existingIds = {};
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var idValues = sheet.getRange(2, ID_COLUMN_INDEX, lastRow - 1, 1).getValues();
    idValues.forEach(function (row) {
      if (row[0]) existingIds[String(row[0])] = true;
    });
  }
  return existingIds;
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
