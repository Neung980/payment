/**
 * Payment - Google Apps Script Web App
 * รับรายการธุรกรรม (JSON array) จากแอป แล้วเพิ่มลงชีทแบบไม่ซ้ำ (idempotent)
 * โดยเช็คคอลัมน์ ID ก่อนเพิ่มทุกครั้ง พร้อมแถวสรุปยอดรวมที่ท้ายชีทเสมอ
 *
 * เค้าโครงแถวสรุปยอด (แถวสุดท้ายของชีทเสมอ ระบุตัวตนด้วยข้อความ "ยอดรวม" ในคอลัมน์ B):
 *   A: (ว่าง)     B: "ยอดรวม"          C: "รายรับ: <รวม>"   D: "รายจ่าย: <รวม>"
 *   E: (ว่าง)     F: "สุทธิ"            G: <ยอดสุทธิ ตัวเลข>   H: (ว่าง)
 * ทุกครั้งที่ doPost ทำงาน จะลบแถวสรุปเดิมออกก่อน แล้วค่อยเพิ่มแถวข้อมูลใหม่ (ถ้ามี)
 * แล้วคำนวณยอดจากแถวข้อมูลทั้งหมดใหม่ แล้วเติมแถวสรุปกลับไปท้ายชีทอีกครั้ง
 * ผลคือแถวสรุปจะ "เลื่อนลง" ไปอยู่ใต้รายการล่าสุดเสมอ และค่าจะถูกต้องเสมอ
 *
 * วิธีติดตั้ง: ดู SETUP.md ในโปรเจกต์
 */

var SHEET_NAME = 'Transactions';
var HEADER_ROW = ['ลำดับ', 'รายการ', 'ประเภท', 'วิธีชำระ', 'วันที่', 'เวลา', 'ยอด', 'ID'];
var ID_COLUMN_INDEX = 8; // คอลัมน์ H
var SUMMARY_LABEL = 'ยอดรวม';

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var sheet = getOrCreateSheet_();
    var payload = JSON.parse(e.postData.contents);

    if (!Array.isArray(payload)) {
      return jsonResponse_({ ok: false, error: 'รูปแบบข้อมูลไม่ถูกต้อง ต้องเป็น array' });
    }

    // 1) ลบแถวสรุปยอดเดิมออกก่อนเสมอ กันไม่ให้ถูกนับปนกับแถวข้อมูลจริง
    removeSummaryRow_(sheet);

    // 2) กันข้อมูลซ้ำด้วยการเช็คคอลัมน์ ID เทียบกับแถวข้อมูลเท่านั้น (ข้ามแถวสรุปยอดเสมอ)
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

    // 3) เพิ่มแถวข้อมูลใหม่ (ถ้ามี)
    if (rowsToAppend.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, HEADER_ROW.length).setValues(rowsToAppend);
    }

    // 4) คำนวณยอดรวมจากแถวข้อมูลทั้งหมด แล้วเติมแถวสรุปยอดใหม่ท้ายชีท
    appendSummaryRow_(sheet);

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

// ลบแถวสรุปยอด (ถ้ามี) โดยหาแถวที่คอลัมน์ B (รายการ) มีข้อความตรงกับ SUMMARY_LABEL เป๊ะ
// เผื่อไว้เสมอว่ามีได้แค่แถวเดียว เจอแล้วลบแล้วหยุดค้นทันที
function removeSummaryRow_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  var nameValues = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  for (var i = 0; i < nameValues.length; i++) {
    if (nameValues[i][0] === SUMMARY_LABEL) {
      sheet.deleteRow(i + 2);
      return;
    }
  }
}

// อ่าน ID ของแถวข้อมูลทั้งหมด โดยข้ามแถวสรุปยอดเสมอ (เผื่อกรณีที่ removeSummaryRow_
// หาไม่เจอด้วยเหตุผลใดก็ตาม เช่นมีคนแก้ไขชีทเองด้วยมือ) เพื่อไม่ให้แถวสรุปถูกเข้าใจผิด
// ว่าเป็นแถวข้อมูลที่มี id ซ้ำ/ไม่ซ้ำ
function getExistingIds_(sheet) {
  var existingIds = {};
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var rows = sheet.getRange(2, 1, lastRow - 1, HEADER_ROW.length).getValues();
    rows.forEach(function (row) {
      var name = row[1];
      if (name === SUMMARY_LABEL) return;
      var id = row[ID_COLUMN_INDEX - 1];
      if (id) existingIds[String(id)] = true;
    });
  }
  return existingIds;
}

// คำนวณยอดรวมจากแถวข้อมูลทั้งหมดในชีท (ไม่รวมแถวสรุปยอดเดิม ซึ่งถูกลบไปแล้วก่อนหน้านี้)
// แล้วเติมแถวสรุปยอดใหม่ต่อท้ายชีท พร้อมจัดรูปแบบให้เด่น
function appendSummaryRow_(sheet) {
  var lastRow = sheet.getLastRow();
  var income = 0;
  var expense = 0;

  if (lastRow > 1) {
    var rows = sheet.getRange(2, 1, lastRow - 1, HEADER_ROW.length).getValues();
    rows.forEach(function (row) {
      var name = row[1];
      if (name === SUMMARY_LABEL) return;
      var typeLabel = row[2];
      var amount = Number(row[6]) || 0;
      if (typeLabel === 'รายรับ') income += amount;
      else if (typeLabel === 'รายจ่าย') expense += amount;
    });
  }

  var net = income - expense;
  sheet.appendRow([
    '',
    SUMMARY_LABEL,
    'รายรับ: ' + income.toFixed(2),
    'รายจ่าย: ' + expense.toFixed(2),
    '',
    'สุทธิ',
    net,
    '',
  ]);
  formatSummaryRow_(sheet, sheet.getLastRow());
}

function formatSummaryRow_(sheet, rowIndex) {
  var range = sheet.getRange(rowIndex, 1, 1, HEADER_ROW.length);
  range.setFontWeight('bold');
  range.setBackground('#fff2cc');
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
