import { useEffect, useMemo, useState } from 'react';
import { subscribeTransactions, deleteTransaction } from '../services/db';
import { syncToSheets, getLastSyncTime } from '../services/sheets';
import { colors } from '../constants';
import { formatAmount, todayStr } from '../utils/format';
import Modal from '../components/Modal';

const styles = {
  page: { padding: 16, maxWidth: 900, margin: '0 auto' },
  header: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 700, color: colors.text },
  filterRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 16 },
  dateInput: {
    padding: '10px 12px',
    fontSize: 15,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
  },
  todayBtn: {
    padding: '10px 16px',
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.white,
    color: colors.text,
    fontWeight: 600,
    cursor: 'pointer',
  },
  actionsRow: { display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  csvBtn: {
    padding: '10px 16px',
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.white,
    color: colors.text,
    fontWeight: 600,
    cursor: 'pointer',
  },
  syncBtn: {
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: colors.primary,
    color: colors.white,
    fontWeight: 700,
    cursor: 'pointer',
  },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 20 },
  summaryCard: (color) => ({
    padding: '14px 16px',
    borderRadius: 10,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.white,
    borderLeft: `4px solid ${color}`,
  }),
  summaryLabel: { fontSize: 13, color: colors.muted, marginBottom: 4 },
  summaryValue: (color) => ({ fontSize: 20, fontWeight: 700, color }),
  tableWrap: { overflowX: 'auto', border: `1px solid ${colors.border}`, borderRadius: 10 },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: colors.white, minWidth: 640 },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    fontSize: 13,
    color: colors.muted,
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.bg,
  },
  td: { padding: '10px 12px', fontSize: 14, color: colors.text, borderBottom: `1px solid ${colors.border}` },
  typeTag: (kind) => ({
    padding: '3px 8px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    color: kind === 'income' ? colors.income : colors.expense,
    backgroundColor: kind === 'income' ? colors.incomeBg : colors.expenseBg,
  }),
  deleteLink: { color: colors.expense, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  emptyRow: { padding: '20px', textAlign: 'center', color: colors.muted },
  syncStatusBar: (kind) => ({
    marginTop: 12,
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    color: kind === 'error' ? colors.expense : kind === 'success' ? colors.income : colors.muted,
    backgroundColor: kind === 'error' ? colors.expenseBg : kind === 'success' ? colors.incomeBg : colors.bg,
  }),
  lastSyncText: { fontSize: 12, color: colors.muted, marginTop: 6 },
  modalTitle: { fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 12 },
  modalActions: { display: 'flex', gap: 10, marginTop: 18 },
  cancelBtn: {
    flex: 1,
    padding: '12px 0',
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.white,
    color: colors.muted,
    fontWeight: 600,
    cursor: 'pointer',
  },
  deleteConfirmBtn: {
    flex: 1,
    padding: '12px 0',
    borderRadius: 8,
    border: 'none',
    backgroundColor: colors.expense,
    color: colors.white,
    fontWeight: 700,
    cursor: 'pointer',
  },
};

function csvEscape(value) {
  const str = String(value);
  if (/[",\r\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

function formatSyncTime(iso) {
  if (!iso) return 'ยังไม่เคยซิงค์';
  const d = new Date(iso);
  return d.toLocaleString('th-TH');
}

export default function HistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [dateFilter, setDateFilter] = useState(todayStr());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState(getLastSyncTime());

  useEffect(() => {
    const unsubscribe = subscribeTransactions(setTransactions);
    return unsubscribe;
  }, []);

  const filtered = useMemo(
    () =>
      transactions
        .filter((t) => t.date === dateFilter)
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)),
    [transactions, dateFilter]
  );

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filtered.forEach((t) => {
      if (t.type === 'income') income += Number(t.amount) || 0;
      else expense += Number(t.amount) || 0;
    });
    return { income, expense, net: income - expense };
  }, [filtered]);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    await deleteTransaction(deleteTarget.id);
    setDeleteTarget(null);
  }

  function handleExportCsv() {
    const header = ['ลำดับ', 'รายการ', 'ประเภท', 'วิธีชำระ', 'วันที่', 'เวลา', 'ยอด'];
    const rows = filtered.map((t, i) => [
      i + 1,
      t.name,
      t.type === 'income' ? 'รายรับ' : 'รายจ่าย',
      t.paymentMethod === 'qr' ? 'QR' : 'เงินสด',
      t.date,
      t.time,
      formatAmount(t.amount),
    ]);
    const csvContent = [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\r\n');
    const BOM = String.fromCharCode(0xfeff);
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${dateFilter}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleManualSync() {
    setSyncStatus('syncing');
    setSyncMessage('กำลังซิงค์ข้อมูล...');
    try {
      const result = await syncToSheets(transactions);
      setSyncStatus('success');
      setSyncMessage(
        result.count > 0 ? `ซิงค์สำเร็จ ${result.count} รายการ` : 'ไม่มีรายการใหม่ที่ต้องซิงค์'
      );
      setLastSyncTime(getLastSyncTime());
    } catch (err) {
      setSyncStatus('error');
      setSyncMessage(err.message);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>ประวัติรายการ</h1>
      </div>

      <div style={styles.filterRow}>
        <input
          style={styles.dateInput}
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
        <button style={styles.todayBtn} onClick={() => setDateFilter(todayStr())}>
          วันนี้
        </button>
      </div>

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard(colors.income)}>
          <div style={styles.summaryLabel}>รายรับรวม</div>
          <div style={styles.summaryValue(colors.income)}>{formatAmount(totals.income)}</div>
        </div>
        <div style={styles.summaryCard(colors.expense)}>
          <div style={styles.summaryLabel}>รายจ่ายรวม</div>
          <div style={styles.summaryValue(colors.expense)}>{formatAmount(totals.expense)}</div>
        </div>
        <div style={styles.summaryCard(totals.net >= 0 ? colors.primary : colors.expense)}>
          <div style={styles.summaryLabel}>ยอดสุทธิ</div>
          <div style={styles.summaryValue(totals.net >= 0 ? colors.primary : colors.expense)}>
            {formatAmount(totals.net)}
          </div>
        </div>
      </div>

      <div style={styles.actionsRow}>
        <button style={styles.csvBtn} onClick={handleExportCsv}>
          ส่งออก CSV
        </button>
        <button style={styles.syncBtn} disabled={syncStatus === 'syncing'} onClick={handleManualSync}>
          บันทึกลง Google Sheets
        </button>
      </div>

      {syncMessage && <div style={styles.syncStatusBar(syncStatus)}>{syncMessage}</div>}
      <div style={styles.lastSyncText}>ซิงค์ล่าสุด: {formatSyncTime(lastSyncTime)}</div>

      <div style={{ ...styles.tableWrap, marginTop: 16 }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ลำดับ</th>
              <th style={styles.th}>รายการ</th>
              <th style={styles.th}>ประเภท</th>
              <th style={styles.th}>วิธีชำระ</th>
              <th style={styles.th}>วันที่</th>
              <th style={styles.th}>เวลา</th>
              <th style={styles.th}>ยอด</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td style={styles.emptyRow} colSpan={8}>
                  ไม่มีรายการในวันที่เลือก
                </td>
              </tr>
            ) : (
              filtered.map((t, i) => (
                <tr key={t.id}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}>{t.name}</td>
                  <td style={styles.td}>
                    <span style={styles.typeTag(t.type)}>{t.type === 'income' ? 'รายรับ' : 'รายจ่าย'}</span>
                  </td>
                  <td style={styles.td}>{t.paymentMethod === 'qr' ? 'QR' : 'เงินสด'}</td>
                  <td style={styles.td}>{t.date}</td>
                  <td style={styles.td}>{t.time}</td>
                  <td style={styles.td}>{formatAmount(t.amount)}</td>
                  <td style={styles.td}>
                    <button style={styles.deleteLink} onClick={() => setDeleteTarget(t)}>
                      ลบ
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} width={340}>
        <div style={styles.modalTitle}>ยืนยันการลบรายการ</div>
        <p style={{ color: colors.muted, fontSize: 14 }}>
          ต้องการลบรายการ "{deleteTarget?.name}" จำนวน {deleteTarget ? formatAmount(deleteTarget.amount) : ''} บาท
          ใช่หรือไม่?
        </p>
        <div style={styles.modalActions}>
          <button style={styles.cancelBtn} onClick={() => setDeleteTarget(null)}>
            ยกเลิก
          </button>
          <button style={styles.deleteConfirmBtn} onClick={handleConfirmDelete}>
            ลบรายการ
          </button>
        </div>
      </Modal>
    </div>
  );
}
