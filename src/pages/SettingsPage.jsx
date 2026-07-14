import { useState } from 'react';
import { getSheetsUrl, setSheetsUrl, getLastSyncTime } from '../services/sheets';
import { colors, PROMPTPAY_PHONE } from '../constants';

const styles = {
  page: { padding: 16, maxWidth: 560, margin: '0 auto' },
  title: { fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 10 },
  field: { marginBottom: 12 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: colors.muted, marginBottom: 6 },
  input: {
    width: '100%',
    padding: '12px 14px',
    fontSize: 15,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    boxSizing: 'border-box',
  },
  readonlyValue: {
    padding: '12px 14px',
    fontSize: 15,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.bg,
    color: colors.text,
  },
  saveBtn: {
    padding: '12px 20px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: colors.primary,
    color: colors.white,
    fontWeight: 700,
    cursor: 'pointer',
  },
  hint: { fontSize: 12, color: colors.muted, marginTop: 8 },
  savedNote: { fontSize: 13, color: colors.income, fontWeight: 600, marginTop: 10 },
};

export default function SettingsPage() {
  const [url, setUrl] = useState(getSheetsUrl());
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSheetsUrl(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>ตั้งค่า</h1>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Google Apps Script Web App URL</div>
        <div style={styles.field}>
          <label style={styles.label}>URL สำหรับซิงค์ข้อมูลไป Google Sheets</label>
          <input
            style={styles.input}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/xxxxx/exec"
          />
        </div>
        <button style={styles.saveBtn} onClick={handleSave}>
          บันทึก URL
        </button>
        {saved && <div style={styles.savedNote}>บันทึกแล้ว</div>}
        <div style={styles.hint}>ดูวิธีสร้าง URL นี้ได้ในไฟล์ SETUP.md ของโปรเจกต์</div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>หมายเลขพร้อมเพย์สำหรับรับเงิน</div>
        <div style={styles.readonlyValue}>{PROMPTPAY_PHONE}</div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>สถานะการซิงค์</div>
        <div style={styles.readonlyValue}>
          {getLastSyncTime() ? new Date(getLastSyncTime()).toLocaleString('th-TH') : 'ยังไม่เคยซิงค์'}
        </div>
      </div>
    </div>
  );
}
