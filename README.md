# Payment

ระบบบันทึกรายรับ-รายจ่ายสำหรับร้านค้าขนาดเล็ก ใช้แทนระบบ POS เดิม

## เทคโนโลยีที่ใช้

- React + Vite (JavaScript)
- Firebase Realtime Database (region: Singapore)
- React Router DOM
- `promptpay-qr` + `qrcode.react` สำหรับสร้าง QR พร้อมเพย์
- Inline styles ล้วน (ไม่ใช้ CSS framework)

## เริ่มต้นใช้งาน

1. ติดตั้ง dependencies:

   ```bash
   npm install
   ```

2. ตั้งค่า Firebase และ Google Apps Script ตามขั้นตอนใน [`SETUP.md`](./SETUP.md)
   (ต้องทำก่อนใช้งานจริง ไม่งั้นจะบันทึก/ซิงค์ข้อมูลไม่ได้)

3. รันโปรเจกต์:

   ```bash
   npm run dev
   ```

   แล้วเปิดเบราว์เซอร์ไปที่ URL ที่แสดงในเทอร์มินัล (ปกติคือ http://localhost:5173)

## โครงสร้างโปรเจกต์

```
src/
├── App.jsx                 ← BrowserRouter + routes + responsive layout
├── firebase.js             ← Firebase config
├── constants.js            ← ค่าคงที่ (เบอร์พร้อมเพย์, สีธีม)
├── hooks/
│   ├── useIsMobile.js       ← ตรวจสอบขนาดจอเพื่อสลับ sidebar/bottom nav
│   └── useAutoSync.js       ← ซิงค์ Google Sheets อัตโนมัติเวลา 22:00
├── components/
│   └── Modal.jsx            ← popup กลาง ใช้ร่วมกันทุกหน้า
├── utils/
│   └── format.js            ← ฟอร์แมตตัวเลข/วันที่/เวลา
├── services/
│   ├── db.js                ← Firebase CRUD + listeners (transactions, items)
│   └── sheets.js             ← ซิงค์ข้อมูลไป Google Apps Script Web App
└── pages/
    ├── RecordPage.jsx       ← หน้าบันทึกรายรับ-รายจ่าย (รายการด่วน/QR/เงินสด)
    ├── HistoryPage.jsx      ← ประวัติ + สรุปยอด + export CSV + ซิงค์ Sheets
    ├── ItemsPage.jsx        ← จัดการรายการด่วน
    └── SettingsPage.jsx     ← ตั้งค่า Apps Script URL
```

## ฟีเจอร์หลัก

- บันทึกรายรับ/รายจ่าย พร้อมรายการด่วน (แตะครั้งเดียว) และกรอกเองได้
- รับเงินผ่าน QR พร้อมเพย์ (เบอร์ 0624419640) หรือเงินสด
- ดูประวัติรายการ กรองตามวันที่ พร้อมสรุปยอดรายวัน
- ส่งออกเป็น CSV (UTF-8 with BOM รองรับภาษาไทยใน Excel)
- ซิงค์ข้อมูลไป Google Sheets แบบไม่ซ้ำ ทั้งแบบกดเองและอัตโนมัติเวลา 22:00
