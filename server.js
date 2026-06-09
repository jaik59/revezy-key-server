const express = require('express');
const cors = require('cors');
const app = express();

// เปิดใช้งาน CORS และการอ่านข้อมูลรูปแบบ JSON
app.use(cors());
app.use(express.json());

/* 🔑 [ระบบกำหนดคีย์] เพิ่ม-ลด คีย์ที่ต้องการตรงนี้ได้เลย */
const DATABASE_KEYS = [
    "REVEZY-ULTRA-FREE-777",
    "REVEZY-VIP-9999-XXXX",
    "REVEZY-CORE-KEY-2026",
    "TEST-KEY-NOT-BEAM"
];

// หน้าแรกเซิร์ฟเวอร์ แสดงสถานะออนไลน์ของระบบคีย์
app.get('/', (req, res) => {
    res.status(200).json({
        status: "online",
        server: "REVEZY KEY SERVER",
        total_active_keys: DATABASE_KEYS.length
    });
});

// API เส้นทางหลักที่แอป Electron จะเข้ามายิงเพื่อตรวจสอบสิทธิ์คีย์
app.post('/api/verify', (req, res) => {
    const { key } = req.body;

    if (!key) {
        return res.status(400).json({
            success: false,
            message: "กรุณาระบุรหัสคีย์เพื่อตรวจสอบสิทธิ์"
        });
    }

    const isKeyValid = DATABASE_KEYS.includes(key.trim());

    if (isKeyValid) {
        return res.status(200).json({
            success: true,
            message: "ยืนยันสิทธิ์สำเร็จ ยินดีต้อนรับเข้าสู่ระบบ"
        });
    } else {
        return res.status(403).json({
            success: false,
            message: "รหัสคีย์ไม่ถูกต้อง ไม่ได้รับอนุญาตให้เข้าใช้งาน"
        });
    }
});

// 🎯 [FIX] ส่งออกโมดูลแอปตัวนี้ไปให้ Vercel Serverless เรียกใช้งานโดยตรง (ห้ามมี app.listen)
module.exports = app;
