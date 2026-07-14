import { markTransactionsSynced } from './db';

const URL_KEY = 'payment-sheets-url';
const LAST_SYNC_KEY = 'payment-last-sync-time';
const LAST_AUTO_SYNC_DATE_KEY = 'payment-last-auto-sync-date';

export function getSheetsUrl() {
  return localStorage.getItem(URL_KEY) || '';
}

export function setSheetsUrl(url) {
  localStorage.setItem(URL_KEY, url.trim());
}

export function getLastSyncTime() {
  return localStorage.getItem(LAST_SYNC_KEY);
}

export function getLastAutoSyncDate() {
  return localStorage.getItem(LAST_AUTO_SYNC_DATE_KEY);
}

export function setLastAutoSyncDate(dateStr) {
  localStorage.setItem(LAST_AUTO_SYNC_DATE_KEY, dateStr);
}

// ส่งเฉพาะรายการที่ยังไม่ synced ไปยัง Google Apps Script Web App
// แล้วมาร์คว่า synced=true ใน Firebase เมื่อสำเร็จ เพื่อไม่ให้ส่งซ้ำในครั้งถัดไป
export async function syncToSheets(transactions) {
  const url = getSheetsUrl();
  if (!url) {
    throw new Error('ยังไม่ได้ตั้งค่า Apps Script URL ในหน้าตั้งค่า');
  }

  const unsynced = (transactions || []).filter((t) => !t.synced);
  if (unsynced.length === 0) {
    return { count: 0 };
  }

  let res;
  try {
    res = await fetch(url, {
      // ใช้ text/plain เพื่อให้เป็น "simple request" ตาม CORS spec
      // (ไม่ trigger preflight OPTIONS ซึ่ง Apps Script เว็บแอปไม่รองรับ)
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(unsynced),
    });
  } catch {
    throw new Error('เชื่อมต่อ Google Sheets ไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตหรือ URL ในหน้าตั้งค่า');
  }

  if (!res.ok) {
    throw new Error('เซิร์ฟเวอร์ตอบกลับผิดพลาด (HTTP ' + res.status + ')');
  }

  const result = await res.json();
  if (!result.ok) {
    throw new Error(result.error || 'ซิงค์ไม่สำเร็จ');
  }

  await markTransactionsSynced(unsynced.map((t) => t.id));
  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

  return { count: result.added ?? unsynced.length };
}
