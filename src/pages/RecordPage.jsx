import { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import generatePayload from 'promptpay-qr';
import { subscribeItems, addItem, addTransaction } from '../services/db';
import { colors, PROMPTPAY_PHONE } from '../constants';
import { formatAmount, todayStr, toTimeStr } from '../utils/format';
import Modal from '../components/Modal';

const styles = {
  page: { padding: 16, maxWidth: 720, margin: '0 auto' },
  title: { fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: 16 },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 8 },
  sectionLabel: { fontSize: 14, fontWeight: 700, color: colors.muted },
  quickActionsRow: { display: 'flex', gap: 8 },
  smallActionBtn: {
    padding: '7px 12px',
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.white,
    color: colors.text,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  typeGroupLabel: (kind) => ({
    fontSize: 13,
    fontWeight: 700,
    color: kind === 'income' ? colors.income : colors.expense,
    marginTop: 12,
    marginBottom: 6,
  }),
  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 },
  quickCard: (kind) => ({
    padding: '12px 10px',
    borderRadius: 10,
    border: `2px solid ${kind === 'income' ? colors.income : colors.expense}`,
    backgroundColor: kind === 'income' ? colors.incomeBg : colors.expenseBg,
    textAlign: 'left',
    cursor: 'pointer',
  }),
  quickName: { fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 4 },
  quickAmount: { fontSize: 13, color: colors.muted },
  emptyHint: { fontSize: 13, color: colors.muted, padding: '10px 0' },

  cartCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    padding: 16,
    marginTop: 20,
  },
  cartEmpty: { fontSize: 14, color: colors.muted, textAlign: 'center', padding: '20px 0' },
  cartLine: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    padding: '10px 0',
    borderBottom: `1px solid ${colors.border}`,
  },
  cartLineNameWrap: { flex: '1 1 140px', minWidth: 140 },
  cartLineName: { fontSize: 14, fontWeight: 600, color: colors.text },
  typeTag: (kind) => ({
    display: 'inline-block',
    marginTop: 2,
    padding: '2px 7px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    color: kind === 'income' ? colors.income : colors.expense,
    backgroundColor: kind === 'income' ? colors.incomeBg : colors.expenseBg,
  }),
  lineAmountInput: {
    width: 100,
    padding: '8px 10px',
    fontSize: 14,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    boxSizing: 'border-box',
  },
  lineToggle: { display: 'flex', gap: 4 },
  lineToggleBtn: (active) => ({
    padding: '7px 10px',
    borderRadius: 7,
    border: `1.5px solid ${active ? colors.primary : colors.border}`,
    backgroundColor: active ? '#eff6ff' : colors.white,
    color: active ? colors.primary : colors.muted,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  }),
  lineCashLabel: { fontSize: 12, fontWeight: 600, color: colors.muted, padding: '7px 4px' },
  removeBtn: {
    border: 'none',
    background: 'none',
    color: colors.expense,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    padding: '4px 6px',
  },

  summaryBox: { marginTop: 12, paddingTop: 12, borderTop: `2px solid ${colors.border}` },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: colors.muted, marginBottom: 4 },
  summaryRowTotal: { display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: colors.text, marginTop: 6 },

  saveBtn: {
    width: '100%',
    padding: '14px 0',
    marginTop: 16,
    borderRadius: 10,
    border: 'none',
    backgroundColor: colors.primary,
    color: colors.white,
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer',
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
  typeToggle: { display: 'flex', gap: 8 },
  typeToggleBtn: (active, kind) => ({
    flex: 1,
    padding: '10px 0',
    borderRadius: 8,
    border: `2px solid ${active ? (kind === 'income' ? colors.income : colors.expense) : colors.border}`,
    backgroundColor: active ? (kind === 'income' ? colors.incomeBg : colors.expenseBg) : colors.white,
    color: active ? (kind === 'income' ? colors.income : colors.expense) : colors.muted,
    fontWeight: 700,
    cursor: 'pointer',
  }),

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
    backgroundColor: colors.primary,
    color: colors.white,
    fontWeight: 700,
    cursor: 'pointer',
  },

  qrWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  qrAmount: { fontSize: 22, fontWeight: 700, color: colors.text },
  qrHint: { fontSize: 13, color: colors.muted, textAlign: 'center' },

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
};

// สร้าง id ให้แต่ละแถวในตะกร้าแบบไม่ต้องพึ่ง crypto.randomUUID()
// เพราะแอปนี้เปิดใช้งานผ่าน LAN ด้วย http ธรรมดา (ไม่ใช่ secure context)
function makeLineIdFactory() {
  let counter = 0;
  return () => {
    counter += 1;
    return `line-${Date.now()}-${counter}`;
  };
}

export default function RecordPage() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);

  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemType, setNewItemType] = useState('income');
  const [creatingItem, setCreatingItem] = useState(false);

  const [showManualForm, setShowManualForm] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualType, setManualType] = useState('income');

  const [showQrModal, setShowQrModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const makeLineId = useRef(makeLineIdFactory()).current;

  useEffect(() => {
    const unsubscribe = subscribeItems(setItems);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!toast || toast.type === 'error') return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const incomeItems = useMemo(() => items.filter((it) => it.type === 'income'), [items]);
  const expenseItems = useMemo(() => items.filter((it) => it.type === 'expense'), [items]);

  const cartSummary = useMemo(() => {
    let cashTotal = 0;
    let qrTotal = 0;
    cart.forEach((line) => {
      const amt = Number(line.amount) || 0;
      if (line.paymentMethod === 'qr') qrTotal += amt;
      else cashTotal += amt;
    });
    return { count: cart.length, cashTotal, qrTotal, grandTotal: cashTotal + qrTotal };
  }, [cart]);

  const qrLines = useMemo(() => cart.filter((l) => l.paymentMethod === 'qr'), [cart]);
  const qrTotalAmount = useMemo(
    () => qrLines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0),
    [qrLines]
  );
  const cashTotalAmount = cartSummary.cashTotal;

  const qrPayload = useMemo(() => {
    if (qrTotalAmount <= 0) return '';
    try {
      return generatePayload(PROMPTPAY_PHONE, { amount: qrTotalAmount });
    } catch {
      return '';
    }
  }, [qrTotalAmount]);

  function addLineToCart({ name, type, amount }) {
    setCart((prev) => [
      ...prev,
      { lineId: makeLineId(), name, type, amount: String(amount), paymentMethod: 'cash' },
    ]);
  }

  function handleSelectTemplate(item) {
    addLineToCart({ name: item.name, type: item.type, amount: item.amount });
  }

  function updateLineAmount(lineId, value) {
    setCart((prev) => prev.map((l) => (l.lineId === lineId ? { ...l, amount: value } : l)));
  }

  function updateLinePaymentMethod(lineId, method) {
    setCart((prev) => prev.map((l) => (l.lineId === lineId ? { ...l, paymentMethod: method } : l)));
  }

  function removeLine(lineId) {
    setCart((prev) => prev.filter((l) => l.lineId !== lineId));
  }

  function openNewItemForm() {
    setNewItemName('');
    setNewItemAmount('');
    setNewItemType('income');
    setShowNewItemForm(true);
  }

  async function handleCreateNewItem() {
    if (!newItemName.trim()) {
      setToast({ type: 'error', message: 'กรุณากรอกชื่อรายการ' });
      return;
    }
    if (!newItemAmount || Number(newItemAmount) <= 0) {
      setToast({ type: 'error', message: 'กรุณากรอกจำนวนเงินให้ถูกต้อง' });
      return;
    }
    setCreatingItem(true);
    try {
      const data = { name: newItemName.trim(), amount: Number(newItemAmount), type: newItemType };
      await addItem(data);
      addLineToCart(data);
      setShowNewItemForm(false);
    } catch (err) {
      setToast({ type: 'error', message: 'สร้างรายการไม่สำเร็จ: ' + err.message });
    } finally {
      setCreatingItem(false);
    }
  }

  function openManualForm() {
    setManualName('');
    setManualAmount('');
    setManualType('income');
    setShowManualForm(true);
  }

  function handleAddManualLine() {
    if (!manualName.trim()) {
      setToast({ type: 'error', message: 'กรุณากรอกชื่อรายการ' });
      return;
    }
    if (!manualAmount || Number(manualAmount) <= 0) {
      setToast({ type: 'error', message: 'กรุณากรอกจำนวนเงินให้ถูกต้อง' });
      return;
    }
    addLineToCart({ name: manualName.trim(), type: manualType, amount: manualAmount });
    setShowManualForm(false);
  }

  function handleSaveAll() {
    if (cart.length === 0) return;
    for (const line of cart) {
      if (!line.amount || Number(line.amount) <= 0) {
        setToast({ type: 'error', message: `จำนวนเงินของ "${line.name}" ไม่ถูกต้อง` });
        return;
      }
    }
    if (qrLines.length > 0) {
      setShowQrModal(true);
      return;
    }
    void saveCartLines();
  }

  async function saveCartLines() {
    setSaving(true);
    try {
      const now = new Date();
      const date = todayStr();
      const time = toTimeStr(now);
      await Promise.all(
        cart.map((line, index) =>
          addTransaction({
            name: line.name,
            type: line.type,
            paymentMethod: line.paymentMethod,
            amount: Number(line.amount),
            date,
            time,
            createdAt: now.getTime() + index,
            synced: false,
          })
        )
      );
      setToast({ type: 'success', message: `บันทึกสำเร็จ ${cart.length} รายการ` });
      setCart([]);
      setShowQrModal(false);
    } catch (err) {
      setToast({ type: 'error', message: 'บันทึกไม่สำเร็จ: ' + err.message });
    } finally {
      setSaving(false);
    }
  }

  function renderTemplateGroup(label, list, kind) {
    if (list.length === 0) return null;
    return (
      <>
        <div style={styles.typeGroupLabel(kind)}>{label}</div>
        <div style={styles.quickGrid}>
          {list.map((item) => (
            <button key={item.id} style={styles.quickCard(kind)} onClick={() => handleSelectTemplate(item)}>
              <div style={styles.quickName}>{item.name}</div>
              <div style={styles.quickAmount}>{formatAmount(item.amount)} บาท</div>
            </button>
          ))}
        </div>
      </>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>บันทึกรายรับ-รายจ่าย</h1>

      <div style={styles.sectionHeader}>
        <div style={styles.sectionLabel}>รายการด่วน (แตะเพื่อเพิ่มลงตะกร้า)</div>
        <div style={styles.quickActionsRow}>
          <button style={styles.smallActionBtn} onClick={openNewItemForm}>
            + เพิ่มรายการใหม่
          </button>
          <button style={styles.smallActionBtn} onClick={openManualForm}>
            รายการครั้งเดียว
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div style={styles.emptyHint}>ยังไม่มีรายการด่วน — กด "+ เพิ่มรายการใหม่" เพื่อสร้าง</div>
      ) : (
        <>
          {renderTemplateGroup('รายรับ', incomeItems, 'income')}
          {renderTemplateGroup('รายจ่าย', expenseItems, 'expense')}
        </>
      )}

      <div style={styles.cartCard}>
        <div style={styles.sectionLabel}>ตะกร้ารายการที่จะบันทึก</div>
        {cart.length === 0 ? (
          <div style={styles.cartEmpty}>ยังไม่มีรายการในตะกร้า — แตะรายการด่วนด้านบนเพื่อเพิ่ม</div>
        ) : (
          <>
            {cart.map((line) => (
              <div key={line.lineId} style={styles.cartLine}>
                <div style={styles.cartLineNameWrap}>
                  <div style={styles.cartLineName}>{line.name}</div>
                  <span style={styles.typeTag(line.type)}>{line.type === 'income' ? 'รายรับ' : 'รายจ่าย'}</span>
                </div>
                <input
                  style={styles.lineAmountInput}
                  type="number"
                  inputMode="decimal"
                  value={line.amount}
                  onChange={(e) => updateLineAmount(line.lineId, e.target.value)}
                />
                {line.type === 'income' ? (
                  <div style={styles.lineToggle}>
                    <button
                      style={styles.lineToggleBtn(line.paymentMethod === 'cash')}
                      onClick={() => updateLinePaymentMethod(line.lineId, 'cash')}
                    >
                      เงินสด
                    </button>
                    <button
                      style={styles.lineToggleBtn(line.paymentMethod === 'qr')}
                      onClick={() => updateLinePaymentMethod(line.lineId, 'qr')}
                    >
                      QR
                    </button>
                  </div>
                ) : (
                  <span style={styles.lineCashLabel}>เงินสด</span>
                )}
                <button style={styles.removeBtn} onClick={() => removeLine(line.lineId)} aria-label="ลบรายการนี้">
                  ✕
                </button>
              </div>
            ))}

            <div style={styles.summaryBox}>
              <div style={styles.summaryRow}>
                <span>จำนวนรายการ</span>
                <span>{cartSummary.count}</span>
              </div>
              <div style={styles.summaryRow}>
                <span>ยอดรวมเงินสด</span>
                <span>{formatAmount(cartSummary.cashTotal)} บาท</span>
              </div>
              <div style={styles.summaryRow}>
                <span>ยอดรวม QR</span>
                <span>{formatAmount(cartSummary.qrTotal)} บาท</span>
              </div>
              <div style={styles.summaryRowTotal}>
                <span>ยอดรวมทั้งหมด</span>
                <span>{formatAmount(cartSummary.grandTotal)} บาท</span>
              </div>
            </div>

            <button style={styles.saveBtn} disabled={saving} onClick={handleSaveAll}>
              บันทึกทั้งหมด ({cartSummary.count} รายการ)
            </button>
          </>
        )}
      </div>

      {/* Modal สร้างรายการด่วนใหม่ */}
      <Modal open={showNewItemForm} onClose={() => setShowNewItemForm(false)} width={380}>
        <div style={styles.modalTitle}>เพิ่มรายการด่วนใหม่</div>
        <div style={styles.field}>
          <label style={styles.label}>ประเภท</label>
          <div style={styles.typeToggle}>
            <button
              style={styles.typeToggleBtn(newItemType === 'income', 'income')}
              onClick={() => setNewItemType('income')}
            >
              รายรับ
            </button>
            <button
              style={styles.typeToggleBtn(newItemType === 'expense', 'expense')}
              onClick={() => setNewItemType('expense')}
            >
              รายจ่าย
            </button>
          </div>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>ชื่อรายการ</label>
          <input
            style={styles.input}
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>จำนวนเงินเริ่มต้น (บาท)</label>
          <input
            style={styles.input}
            type="number"
            inputMode="decimal"
            value={newItemAmount}
            onChange={(e) => setNewItemAmount(e.target.value)}
          />
        </div>
        <div style={styles.modalActions}>
          <button style={styles.cancelBtn} onClick={() => setShowNewItemForm(false)}>
            ยกเลิก
          </button>
          <button style={styles.confirmBtn} disabled={creatingItem} onClick={() => void handleCreateNewItem()}>
            บันทึกและเพิ่มลงตะกร้า
          </button>
        </div>
      </Modal>

      {/* Modal รายการครั้งเดียว (ไม่บันทึกเป็นรายการด่วน) */}
      <Modal open={showManualForm} onClose={() => setShowManualForm(false)} width={380}>
        <div style={styles.modalTitle}>รายการครั้งเดียว</div>
        <div style={styles.field}>
          <label style={styles.label}>ประเภท</label>
          <div style={styles.typeToggle}>
            <button
              style={styles.typeToggleBtn(manualType === 'income', 'income')}
              onClick={() => setManualType('income')}
            >
              รายรับ
            </button>
            <button
              style={styles.typeToggleBtn(manualType === 'expense', 'expense')}
              onClick={() => setManualType('expense')}
            >
              รายจ่าย
            </button>
          </div>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>รายการ</label>
          <input
            style={styles.input}
            type="text"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="เช่น ค่าขนม, ค่าน้ำ, ขายสินค้า"
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>จำนวนเงิน (บาท)</label>
          <input
            style={styles.input}
            type="number"
            inputMode="decimal"
            value={manualAmount}
            onChange={(e) => setManualAmount(e.target.value)}
          />
        </div>
        <div style={styles.modalActions}>
          <button style={styles.cancelBtn} onClick={() => setShowManualForm(false)}>
            ยกเลิก
          </button>
          <button style={styles.confirmBtn} onClick={handleAddManualLine}>
            เพิ่มลงตะกร้า
          </button>
        </div>
      </Modal>

      {/* Modal ยืนยันรับเงิน QR */}
      <Modal open={showQrModal} onClose={() => setShowQrModal(false)} width={340}>
        <div style={styles.modalTitle}>สแกนจ่ายผ่านพร้อมเพย์</div>
        <div style={styles.qrWrap}>
          {qrPayload ? <QRCodeSVG value={qrPayload} size={220} /> : null}
          <div style={styles.qrAmount}>{formatAmount(qrTotalAmount)} บาท (ยอด QR)</div>
          {cashTotalAmount > 0 && (
            <div style={styles.qrHint}>
              * มีส่วนเงินสดแยกต่างหากอีก {formatAmount(cashTotalAmount)} บาท ซึ่งจะถูกบันทึกพร้อมกันเมื่อกดยืนยัน
            </div>
          )}
          <div style={styles.qrHint}>ให้ลูกค้าสแกน QR นี้ แล้วกด "ยืนยันรับเงินแล้ว" เมื่อจ่ายเสร็จ</div>
        </div>
        <div style={styles.modalActions}>
          <button style={styles.cancelBtn} onClick={() => setShowQrModal(false)}>
            ยกเลิก
          </button>
          <button style={styles.confirmBtn} disabled={saving} onClick={() => void saveCartLines()}>
            ยืนยันรับเงินแล้ว
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
