const express = require('express');
const axios = require('axios');
const app = express();

// เปิดให้หน้าเว็บ HTML (หน้าบ้าน) ยิงเข้ามาดึงข้อมูลได้ ไม่ติด CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// สร้าง Route สำหรับเช็กผู้เล่น FiveM
app.get('/api/fivem', async (req, res) => {
    const serverIp = req.query.ip;
    if (!serverIp) {
        return res.status(400).json({ error: 'กรุณาระบุ IP เซิร์ฟเวอร์' });
    }

    try {
        // ยิงไปดึงข้อมูลจาก FiveM โดยตรงผ่านหลังบ้าน (ไม่ติด CORS)
        const playersResponse = await axios.get(`http://${serverIp}/players.json`, { timeout: 5000 });
        const infoResponse = await axios.get(`http://${serverIp}/info.json`, { timeout: 5000 }).catch(() => null);

        res.json({
            players: playersResponse.data,
            info: infoResponse ? infoResponse.data : null
        });
    } catch (error) {
        res.status(500).json({ error: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ FiveM ได้ หรือเซิร์ฟเวอร์ปิดกั้น' });
    }
});

// บรรทัดนี้สำคัญมากสำหรับ Vercel: ต้อง Export app ออกไปแทนการใช้ app.listen() เดิม
module.exports = app;
