import { useEffect, useState } from 'react';
import { subscribeItems, addItem, updateItem, deleteItem } from '../services/db';
import { colors } from '../constants';
import { formatAmount } from '../utils/format';
import Modal from '../components/Modal';

const styles = {
  page: { padding: 16, maxWidth: 640, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 700, color: colors.text },
  addBtn: {
    padding: '10px 18px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: colors.primary,
    color: colors.white,
    fontWeight: 700,
    cursor: 'pointer',
  },
  sectionLabel: { fontSize: 14, fontWeight: 700, color: colors.muted, marginTop: 20, marginBottom: 8 },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    borderRadius: 10,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.white,
    marginBottom: 8,
  },
  itemName: { fontSize: 15, fontWeight: 600, color: colors.text },
  itemAmount: { fontSize: 13, color: colors.muted, marginTop: 2 },
  itemActions: { display: 'flex', gap: 8 },
  iconBtn: (danger) => ({
    padding: '6px 12px',
    borderRadius: 6,
    border: `1px solid ${danger ? colors.expense : colors.border}`,
    backgroundColor: colors.white,
    color: danger ? colors.expense : colors.muted,
    fontSize: 13,
    cursor: 'pointer',
  }),
  emptyHint: { fontSize: 13, color: colors.muted, padding: '10px 0' },
  modalTitle: { fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 12 },
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
  typeBtn: (active, kind) => ({
    flex: 1,
    padding: '10px 0',
    borderRadius: 8,
    border: `2px solid ${active ? (kind === 'income' ? colors.income : colors.expense) : colors.border}`,
    backgroundColor: active ? (kind === 'income' ? colors.incomeBg : colors.expenseBg) : colors.white,
    color: active ? (kind === 'income' ? colors.income : colors.expense) : colors.muted,
    fontWeight: 700,
    cursor: 'pointer',
  }),
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
  errorText: { color: colors.expense, fontSize: 13, marginBottom: 10 },
};

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formType, setFormType] = useState('income');
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeItems(setItems);
    return unsubscribe;
  }, []);

  const incomeItems = items.filter((it) => it.type === 'income');
  const expenseItems = items.filter((it) => it.type === 'expense');

  function openAddForm() {
    setEditingItem(null);
    setFormName('');
    setFormAmount('');
    setFormType('income');
    setFormError('');
    setShowForm(true);
  }

  function openEditForm(item) {
    setEditingItem(item);
    setFormName(item.name);
    setFormAmount(String(item.amount));
    setFormType(item.type);
    setFormError('');
    setShowForm(true);
  }

  async function handleSubmitForm() {
    if (!formName.trim()) {
      setFormError('กรุณากรอกชื่อรายการ');
      return;
    }
    if (!formAmount || Number(formAmount) <= 0) {
      setFormError('กรุณากรอกจำนวนเงินให้ถูกต้อง');
      return;
    }
    const data = { name: formName.trim(), amount: Number(formAmount), type: formType };
    if (editingItem) {
      await updateItem(editingItem.id, data);
    } else {
      await addItem(data);
    }
    setShowForm(false);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    await deleteItem(deleteTarget.id);
    setDeleteTarget(null);
  }

  function renderGroup(title, list) {
    return (
      <>
        <div style={styles.sectionLabel}>{title}</div>
        {list.length === 0 ? (
          <div style={styles.emptyHint}>ยังไม่มีรายการ</div>
        ) : (
          list.map((item) => (
            <div key={item.id} style={styles.itemRow}>
              <div>
                <div style={styles.itemName}>{item.name}</div>
                <div style={styles.itemAmount}>{formatAmount(item.amount)} บาท</div>
              </div>
              <div style={styles.itemActions}>
                <button style={styles.iconBtn(false)} onClick={() => openEditForm(item)}>
                  แก้ไข
                </button>
                <button style={styles.iconBtn(true)} onClick={() => setDeleteTarget(item)}>
                  ลบ
                </button>
              </div>
            </div>
          ))
        )}
      </>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>จัดการรายการด่วน</h1>
        <button style={styles.addBtn} onClick={openAddForm}>
          + เพิ่มรายการ
        </button>
      </div>

      {renderGroup('รายรับ', incomeItems)}
      {renderGroup('รายจ่าย', expenseItems)}

      <Modal open={showForm} onClose={() => setShowForm(false)} width={380}>
        <div style={styles.modalTitle}>{editingItem ? 'แก้ไขรายการ' : 'เพิ่มรายการด่วน'}</div>
        {formError && <div style={styles.errorText}>{formError}</div>}
        <div style={styles.field}>
          <label style={styles.label}>ประเภท</label>
          <div style={styles.typeToggle}>
            <button style={styles.typeBtn(formType === 'income', 'income')} onClick={() => setFormType('income')}>
              รายรับ
            </button>
            <button style={styles.typeBtn(formType === 'expense', 'expense')} onClick={() => setFormType('expense')}>
              รายจ่าย
            </button>
          </div>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>ชื่อรายการ</label>
          <input style={styles.input} type="text" value={formName} onChange={(e) => setFormName(e.target.value)} />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>จำนวนเงินเริ่มต้น (บาท)</label>
          <input
            style={styles.input}
            type="number"
            inputMode="decimal"
            value={formAmount}
            onChange={(e) => setFormAmount(e.target.value)}
          />
        </div>
        <div style={styles.modalActions}>
          <button style={styles.cancelBtn} onClick={() => setShowForm(false)}>
            ยกเลิก
          </button>
          <button style={styles.confirmBtn} onClick={handleSubmitForm}>
            บันทึก
          </button>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} width={340}>
        <div style={styles.modalTitle}>ยืนยันการลบ</div>
        <p style={{ color: colors.muted, fontSize: 14 }}>
          ต้องการลบรายการ "{deleteTarget?.name}" ใช่หรือไม่?
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
