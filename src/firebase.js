import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// TODO: แทนที่ค่าด้านล่างด้วยค่า config จริงจาก Firebase Console
// (Project settings > General > Your apps > SDK setup and configuration)
// สำคัญ: ต้องสร้าง Realtime Database โดยเลือก region เป็น Singapore (asia-southeast1)
// แล้วนำ databaseURL ที่ได้มาใส่ด้านล่างนี้ - ดูขั้นตอนละเอียดใน SETUP.md
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  databaseURL: 'https://YOUR_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
