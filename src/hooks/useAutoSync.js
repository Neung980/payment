import { useEffect, useRef } from 'react';
import { subscribeTransactions } from '../services/db';
import { syncToSheets, getLastAutoSyncDate, setLastAutoSyncDate } from '../services/sheets';
import { toDateStr } from '../utils/format';

const CHECK_INTERVAL_MS = 30000;
const AUTO_SYNC_HOUR = 22;

// ซิงค์อัตโนมัติวันละครั้งเมื่อเวลาเครื่องถึง 22:00 (ขณะที่เปิดแอปอยู่)
// กันไม่ให้ยิงซ้ำในวันเดียวกันด้วย localStorage
export function useAutoSync() {
  const transactionsRef = useRef([]);

  useEffect(() => {
    const unsubscribe = subscribeTransactions((list) => {
      transactionsRef.current = list;
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const checkAndSync = async () => {
      const now = new Date();
      const today = toDateStr(now);
      if (now.getHours() === AUTO_SYNC_HOUR && getLastAutoSyncDate() !== today) {
        try {
          await syncToSheets(transactionsRef.current);
          // มาร์คว่าซิงค์แล้วเฉพาะตอนสำเร็จ ถ้าล้มเหลวจะลองใหม่ทุก 30 วิ
          // จนกว่าจะสำเร็จหรือพ้นชั่วโมง 22:00 ไป (จำกัดรอบลองใหม่ในตัว)
          setLastAutoSyncDate(today);
        } catch (err) {
          console.error('auto-sync ล้มเหลว:', err.message);
        }
      }
    };

    const interval = setInterval(checkAndSync, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);
}
