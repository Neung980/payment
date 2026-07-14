import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyBf4CvYznt4bhuv7OeSGzGWHpUjEmMdcsM',
  authDomain: 'payment-app-aa85e.firebaseapp.com',
  databaseURL: 'https://payment-app-aa85e-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'payment-app-aa85e',
  storageBucket: 'payment-app-aa85e.firebasestorage.app',
  messagingSenderId: '566113347572',
  appId: '1:566113347572:web:b0b408207c8d4f067bbba1',
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
