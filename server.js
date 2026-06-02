const express = require('express');
const axios = require('axios');
const app = express();
const cors = require('cors');

// เปิดใช้งาน CORS เพื่อให้หน้าเว็บยิง API เข้ามาได้
app.use(cors());
app.use(express.json());

// หน้าแรกกัน Error "Cannot GET /"
app.get('/', (req, res) => {
    res.json({ status: "ONLINE", message: "FiveM Interceptor API Ready" });
});

// API หลักสำหรับสแกนข้อมูล
app.get('/api/fivem', async (req, res) => {
    const serverIp = req.query.ip;
    if (!serverIp) return res.status(400).json({ error: 'กรุณาระบุ IP เป้าหมาย' });

    try {
        // ใช้ timeout เพื่อกัน Vercel ล่ม
        const response = await axios.get(`http://${serverIp}/players.json`, { timeout: 5000 });
        
        // ส่งข้อมูลกลับไปให้หน้าบ้าน
        res.json({
            players: response.data || [],
            info: { host: serverIp, status: "SUCCESS" }
        });
    } catch (err) {
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลจากเซิร์ฟเวอร์ได้: ' + err.message });
    }
});

// ✅ ส่วนนี้สำคัญที่สุด: เพิ่มเข้าไปที่บรรทัดสุดท้าย
module.exports = app;
