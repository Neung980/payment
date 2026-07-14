# คู่มือติดตั้ง Payment

เอกสารนี้อธิบายวิธีตั้งค่า Firebase Realtime Database และ Google Apps Script
Web App เพื่อให้แอป Payment ทำงานได้ครบทุกฟีเจอร์

---

## ส่วนที่ 1: ตั้งค่า Firebase Realtime Database

1. เปิด [Firebase Console](https://console.firebase.google.com/) แล้วกด **เพิ่มโปรเจกต์ (Add project)**
   ตั้งชื่อโปรเจกต์ตามต้องการ (เช่น `payment-shop`) แล้วทำตามขั้นตอนจนสร้างเสร็จ
2. ในเมนูซ้าย เลือก **Build > Realtime Database** แล้วกด **สร้างฐานข้อมูล (Create Database)**
3. **สำคัญมาก:** ในขั้นตอนเลือก location ให้เลือก **Singapore (asia-southeast1)**
   เพราะข้อมูลที่เก็บควรอยู่ใกล้ผู้ใช้งานในไทยมากที่สุด
4. เลือกโหมดเริ่มต้นเป็น **Start in test mode** ก่อน (เพื่อความง่ายในการพัฒนา)
   จากนั้นค่อยตั้งกฎ (Rules) ความปลอดภัยเพิ่มเติมภายหลังตามความเหมาะสมของร้านคุณ
5. เมื่อสร้างเสร็จ จะเห็น **databaseURL** ที่หน้า Realtime Database เช่น
   `https://payment-shop-default-rtdb.asia-southeast1.firebasedatabase.app`
6. กลับไปที่หน้าโปรเจกต์หลัก กด **⚙️ (Project settings) > General** แล้วเลื่อนลงมาที่
   "Your apps" กด **</> (เพิ่มเว็บแอป)** ตั้งชื่อแอปแล้วกด "Register app"
7. Firebase จะแสดงโค้ด config ที่มีค่า `apiKey`, `authDomain`, `projectId` ฯลฯ
8. เปิดไฟล์ `src/firebase.js` ในโปรเจกต์ แล้วแทนที่ค่า placeholder (`YOUR_API_KEY` ฯลฯ)
   ด้วยค่าจริงที่ได้จาก Firebase รวมถึง `databaseURL` จากข้อ 5

```js
const firebaseConfig = {
  apiKey: 'AIzaSy...',
  authDomain: 'payment-shop.firebaseapp.com',
  databaseURL: 'https://payment-shop-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'payment-shop',
  storageBucket: 'payment-shop.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef',
};
```

9. บันทึกไฟล์ แล้วรัน `npm run dev` — ถ้าตั้งค่าถูกต้อง หน้า "บันทึกรายการ" จะบันทึกข้อมูล
   ลง Firebase ได้ทันที (ตรวจสอบได้จากแท็บ Realtime Database ใน Firebase Console)

---

## ส่วนที่ 2: ตั้งค่า Google Apps Script Web App (ซิงค์ไป Google Sheets)

Google Sheet เป้าหมาย: https://docs.google.com/spreadsheets/d/1ZtQ_IAOh_HQAkbceDO0q4AUzkoxqGQaMJfJriMJs1VY/edit

1. เปิด Google Sheet ตามลิงก์ด้านบน
2. ไปที่เมนู **ส่วนขยาย (Extensions) > Apps Script**
3. จะเปิดหน้าต่าง Apps Script Editor ขึ้นมา พร้อมไฟล์ `Code.gs` เปล่าๆ
4. ลบโค้ดเดิมทั้งหมดในไฟล์ `Code.gs` แล้วคัดลอกโค้ดทั้งหมดจากไฟล์
   `apps-script/Code.gs` ของโปรเจกต์นี้ไปวางแทน
5. กด **บันทึก (ไอคอนแผ่นดิสก์)** หรือ Ctrl+S
6. กดปุ่ม **Deploy (ปรับใช้) > New deployment (ปรับใช้ใหม่)** ที่มุมขวาบน
7. ที่ "Select type" กดไอคอนเฟือง แล้วเลือก **Web app**
8. ตั้งค่าดังนี้:
   - **Description**: ตั้งชื่ออะไรก็ได้ เช่น "Payment Sync"
   - **Execute as**: `Me` (บัญชีของคุณ)
   - **Who has access**: `Anyone` (จำเป็น เพื่อให้เว็บแอปเรียกได้โดยไม่ต้องล็อกอิน)
9. กด **Deploy** ระบบจะขอ **Authorize access** — กด **Authorize access**
   เลือกบัญชี Google ของคุณ แล้วถ้าเจอหน้าเตือน "Google hasn't verified this app"
   ให้กด **Advanced > Go to (โปรเจกต์ของคุณ) (unsafe)** แล้วกด **Allow**
   (ปลอดภัย เพราะเป็นสคริปต์ที่คุณเขียนเอง ไม่ใช่แอปของบุคคลที่สาม)
10. หลัง Deploy สำเร็จ จะได้ **Web app URL** รูปแบบ
    `https://script.google.com/macros/s/xxxxxxxxxxxxx/exec`
    กด **Copy** เพื่อคัดลอก URL นี้
11. เปิดแอป Payment ไปที่หน้า **ตั้งค่า** วาง URL ที่คัดลอกมาลงในช่อง
    "URL สำหรับซิงค์ข้อมูลไป Google Sheets" แล้วกด **บันทึก URL**
12. ทดสอบโดยไปที่หน้า **ประวัติ** แล้วกดปุ่ม **บันทึกลง Google Sheets**
    ถ้าตั้งค่าถูกต้อง จะขึ้นข้อความ "ซิงค์สำเร็จ X รายการ" และข้อมูลจะไปปรากฏใน
    ชีทชื่อ **Transactions** ของสเปรดชีต (สคริปต์จะสร้างชีทนี้ให้อัตโนมัติถ้ายังไม่มี)

### หมายเหตุสำคัญ

- ทุกครั้งที่แก้โค้ดใน `Code.gs` แล้วต้องการให้มีผลจริง ต้องกด **Deploy > Manage deployments**
  แล้วกดไอคอนดินสอ (Edit) ที่ deployment เดิม เปลี่ยน **Version** เป็น **New version**
  แล้วกด **Deploy** อีกครั้ง (ไม่ต้องสร้าง deployment ใหม่ URL จะเหมือนเดิม)
- สคริปต์กันข้อมูลซ้ำโดยเช็คคอลัมน์ **ID** (คอลัมน์ H) — ถ้ารายการใดมี ID ที่มีอยู่แล้ว
  ในชีท จะถูกข้ามโดยอัตโนมัติ ไม่ต้องกังวลเรื่องกดซิงค์ซ้ำ
- แอปจะซิงค์เฉพาะรายการที่ยังไม่เคยซิงค์สำเร็จ (`synced: false`) เท่านั้น
  เมื่อซิงค์สำเร็จ ระบบจะมาร์คว่า `synced: true` ใน Firebase ให้อัตโนมัติ
- แอปจะพยายามซิงค์อัตโนมัติทุกวันเวลา 22:00 น. **โดยต้องเปิดแอปทิ้งไว้ในเบราว์เซอร์**
  (เป็นการทำงานฝั่ง client ไม่ใช่ server-side cron) ถ้าปิดแอปไว้ ให้กดปุ่ม
  "บันทึกลง Google Sheets" ด้วยตนเองแทน

---

## ส่วนที่ 3: การรันโปรเจกต์

```bash
npm install
npm run dev
```

เปิดเบราว์เซอร์ไปที่ URL ที่แสดงในเทอร์มินัล (ปกติคือ http://localhost:5173)
