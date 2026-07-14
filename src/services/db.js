import { ref, push, set, update, remove, onValue, off } from 'firebase/database';
import { db } from '../firebase';

// ---------- Transactions ----------

export function subscribeTransactions(callback) {
  const transactionsRef = ref(db, 'transactions');
  const handleValue = (snapshot) => {
    const val = snapshot.val() || {};
    callback(Object.values(val));
  };
  onValue(transactionsRef, handleValue);
  return () => off(transactionsRef, 'value', handleValue);
}

export async function addTransaction(data) {
  const transactionsRef = ref(db, 'transactions');
  const newRef = push(transactionsRef);
  const id = newRef.key;
  await set(newRef, { ...data, id });
  return id;
}

export async function deleteTransaction(id) {
  await remove(ref(db, `transactions/${id}`));
}

export async function markTransactionsSynced(ids) {
  if (!ids || ids.length === 0) return;
  const updates = {};
  ids.forEach((id) => {
    updates[`transactions/${id}/synced`] = true;
  });
  await update(ref(db), updates);
}

// ---------- Saved item templates ----------

export function subscribeItems(callback) {
  const itemsRef = ref(db, 'items');
  const handleValue = (snapshot) => {
    const val = snapshot.val() || {};
    callback(Object.values(val));
  };
  onValue(itemsRef, handleValue);
  return () => off(itemsRef, 'value', handleValue);
}

export async function addItem(data) {
  const itemsRef = ref(db, 'items');
  const newRef = push(itemsRef);
  const id = newRef.key;
  await set(newRef, { ...data, id });
  return id;
}

export async function updateItem(id, data) {
  await update(ref(db, `items/${id}`), data);
}

export async function deleteItem(id) {
  await remove(ref(db, `items/${id}`));
}
