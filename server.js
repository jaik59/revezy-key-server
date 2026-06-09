const express = require('express');
const cors = require('cors');
const app = express();

// เปิดใช้งาน CORS และการอ่านข้อมูลรูปแบบ JSON
app.use(cors());
app.use(express.json());

/* 🔑 [ระบบกำหนดคีย์] เพิ่ม-ลบ คีย์ของระบบคุณที่นี่ได้เลยครับ */
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

    // ตรวจสอบว่าผู้ใช้งานป้อนคีย์เข้ามาหรือไม่
    if (!key) {
        return res.status(400).json({
            success: false,
            message: "กรุณาระบุรหัสคีย์เพื่อตรวจสอบสิทธิ์"
        });
    }

    // ตรวจสอบความถูกต้องของคีย์ในระบบ
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

// เริ่มทำงานเซิร์ฟเวอร์ (รองรับทั้ง Vercel Serverless และการรันแบบ Local)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Revezy Key Server runs smoothly on port ${PORT}`);
});

module.exports = app;
