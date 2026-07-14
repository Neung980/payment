import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import generatePayload from 'promptpay-qr';
import { subscribeItems, addTransaction } from '../services/db';
import { colors, PROMPTPAY_PHONE } from '../constants';
import { formatAmount, todayStr, toTimeStr } from '../utils/format';
import Modal from '../components/Modal';

const styles = {
  page: { padding: 16, maxWidth: 640, margin: '0 auto' },
  title: { fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: 16 },
  typeToggle: { display: 'flex', gap: 8, marginBottom: 20 },
  typeBtn: (active, kind) => ({
    flex: 1,
    padding: '14px 0',
    borderRadius: 10,
    border: `2px solid ${active ? (kind === 'income' ? colors.income : colors.expense) : colors.border}`,
    backgroundColor: active ? (kind === 'income' ? colors.incomeBg : colors.expenseBg) : colors.white,
    color: active ? (kind === 'income' ? colors.income : colors.expense) : colors.muted,
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer',
  }),
  sectionLabel: { fontSize: 14, fontWeight: 700, color: colors.muted, marginBottom: 8, marginTop: 20 },
  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 },
  quickCard: (active) => ({
    padding: '12px 10px',
    borderRadius: 10,
    border: `2px solid ${active ? colors.primary : colors.border}`,
    backgroundColor: active ? '#eff6ff' : colors.white,
    textAlign: 'left',
    cursor: 'pointer',
  }),
  quickName: { fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 4 },
  quickAmount: { fontSize: 13, color: colors.muted },
  emptyHint: { fontSize: 13, color: colors.muted, padding: '10px 0' },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    padding: 16,
    marginTop: 20,
  },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: colors.muted, marginBottom: 6 },
  input: {
    width: '100%',
    padding: '12px 14px',
    fontSize: 16,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    boxSizing: 'border-box',
  },
  paymentToggle: { display: 'flex', gap: 8 },
  paymentBtn: (active) => ({
    flex: 1,
    padding: '10px 0',
    borderRadius: 8,
    border: `2px solid ${active ? colors.primary : colors.border}`,
    backgroundColor: active ? '#eff6ff' : colors.white,
    color: active ? colors.primary : colors.muted,
    fontWeight: 600,
    cursor: 'pointer',
  }),
  saveBtn: (kind) => ({
    width: '100%',
    padding: '14px 0',
    marginTop: 18,
    borderRadius: 10,
    border: 'none',
    backgroundColor: kind === 'income' ? colors.income : colors.expense,
    color: colors.white,
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer',
  }),
  toast: (type) => ({
    position: 'fixed',
    bottom: 90,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    backgroundColor: type === 'error' ? colors.expense : colors.income,
    color: colors.white,
    padding: '10px 14px 10px 20px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    zIndex: 1200,
    maxWidth: '90vw',
  }),
  toastClose: {
    background: 'none',
    border: 'none',
    color: colors.white,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
  },
  qrWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  qrAmount: { fontSize: 24, fontWeight: 700, color: colors.text },
  qrHint: { fontSize: 13, color: colors.muted, textAlign: 'center' },
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
  confirmBtn: {
    flex: 1,
    padding: '12px 0',
    borderRadius: 8,
    border: 'none',
    backgroundColor: colors.income,
    color: colors.white,
    fontWeight: 700,
    cursor: 'pointer',
  },
};

export default function RecordPage() {
  const [type, setType] = useState('income');
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showQrModal, setShowQrModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeItems(setItems);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (type === 'expense') setPaymentMethod('cash');
  }, [type]);

  useEffect(() => {
    // ข้อความสำเร็จหายเองได้ แต่ข้อความ error ต้องให้ผู้ใช้กดปิดเอง
    // เพื่อไม่ให้ความล้มเหลวในการบันทึกหลุดรอดไปโดยไม่มีใครเห็น
    if (!toast || toast.type === 'error') return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const quickItems = useMemo(() => items.filter((it) => it.type === type), [items, type]);

  const qrPayload = useMemo(() => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return '';
    try {
      return generatePayload(PROMPTPAY_PHONE, { amount: amt });
    } catch {
      return '';
    }
  }, [amount]);

  function handleSelectItem(item) {
    setName(item.name);
    setAmount(String(item.amount));
  }

  function resetForm() {
    setName('');
    setAmount('');
  }

  function validate() {
    if (!name.trim()) {
      setToast({ type: 'error', message: 'กรุณากรอกชื่อรายการ' });
      return false;
    }
    if (!amount || Number(amount) <= 0) {
      setToast({ type: 'error', message: 'กรุณากรอกจำนวนเงินให้ถูกต้อง' });
      return false;
    }
    return true;
  }

  function buildTransaction(finalPaymentMethod) {
    const now = new Date();
    return {
      name: name.trim(),
      type,
      paymentMethod: finalPaymentMethod,
      amount: Number(amount),
      date: todayStr(),
      time: toTimeStr(now),
      createdAt: now.getTime(),
      synced: false,
    };
  }

  async function handleSaveCash() {
    if (!validate()) return;
    setSaving(true);
    try {
      await addTransaction(buildTransaction('cash'));
      setToast({ type: 'success', message: 'บันทึกรายการสำเร็จ' });
      resetForm();
    } catch (err) {
      setToast({ type: 'error', message: 'บันทึกไม่สำเร็จ: ' + err.message });
    } finally {
      setSaving(false);
    }
  }

  function handleOpenQr() {
    if (!validate()) return;
    setShowQrModal(true);
  }

  async function handleConfirmQr() {
    setSaving(true);
    try {
      await addTransaction(buildTransaction('qr'));
      setToast({ type: 'success', message: 'บันทึกรายการสำเร็จ' });
      setShowQrModal(false);
      resetForm();
    } catch (err) {
      setToast({ type: 'error', message: 'บันทึกไม่สำเร็จ: ' + err.message });
    } finally {
      setSaving(false);
    }
  }

  const isQrFlow = type === 'income' && paymentMethod === 'qr';

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>บันทึกรายรับ-รายจ่าย</h1>

      <div style={styles.typeToggle}>
        <button style={styles.typeBtn(type === 'income', 'income')} onClick={() => setType('income')}>
          รายรับ
        </button>
        <button style={styles.typeBtn(type === 'expense', 'expense')} onClick={() => setType('expense')}>
          รายจ่าย
        </button>
      </div>

      <div style={styles.sectionLabel}>รายการด่วน (แตะเพื่อเลือก)</div>
      {quickItems.length === 0 ? (
        <div style={styles.emptyHint}>ยังไม่มีรายการด่วน — ไปที่หน้า "จัดการรายการ" เพื่อเพิ่ม</div>
      ) : (
        <div style={styles.quickGrid}>
          {quickItems.map((item) => (
            <button
              key={item.id}
              style={styles.quickCard(name === item.name && amount === String(item.amount))}
              onClick={() => handleSelectItem(item)}
            >
              <div style={styles.quickName}>{item.name}</div>
              <div style={styles.quickAmount}>{formatAmount(item.amount)} บาท</div>
            </button>
          ))}
        </div>
      )}

      <div style={styles.formCard}>
        <div style={styles.field}>
          <label style={styles.label}>รายการ</label>
          <input
            style={styles.input}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น ค่าขนม, ค่าน้ำ, ขายสินค้า"
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>จำนวนเงิน (บาท)</label>
          <input
            style={styles.input}
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>

        {type === 'income' && (
          <div style={styles.field}>
            <label style={styles.label}>วิธีชำระเงิน</label>
            <div style={styles.paymentToggle}>
              <button style={styles.paymentBtn(paymentMethod === 'cash')} onClick={() => setPaymentMethod('cash')}>
                เงินสด
              </button>
              <button style={styles.paymentBtn(paymentMethod === 'qr')} onClick={() => setPaymentMethod('qr')}>
                QR พร้อมเพย์
              </button>
            </div>
          </div>
        )}

        <button
          style={styles.saveBtn(type)}
          disabled={saving}
          onClick={isQrFlow ? handleOpenQr : handleSaveCash}
        >
          {isQrFlow ? 'สร้าง QR รับเงิน' : 'บันทึกรายการ'}
        </button>
      </div>

      <Modal open={showQrModal} onClose={() => setShowQrModal(false)} width={340}>
        <div style={styles.modalTitle}>สแกนจ่ายผ่านพร้อมเพย์</div>
        <div style={styles.qrWrap}>
          {qrPayload ? <QRCodeSVG value={qrPayload} size={220} /> : null}
          <div style={styles.qrAmount}>{formatAmount(amount)} บาท</div>
          <div style={styles.qrHint}>ให้ลูกค้าสแกน QR นี้ แล้วกด "ยืนยันชำระเงินแล้ว" เมื่อจ่ายเสร็จ</div>
        </div>
        <div style={styles.modalActions}>
          <button style={styles.cancelBtn} onClick={() => setShowQrModal(false)}>
            ยกเลิก
          </button>
          <button style={styles.confirmBtn} disabled={saving} onClick={handleConfirmQr}>
            ยืนยันชำระเงินแล้ว
          </button>
        </div>
      </Modal>

      {toast && (
        <div style={styles.toast(toast.type)}>
          <span>{toast.message}</span>
          {toast.type === 'error' && (
            <button style={styles.toastClose} onClick={() => setToast(null)} aria-label="ปิด">
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}
