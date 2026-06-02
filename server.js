const express = require('express');
const axios = require('axios');
const app = express();

// Middleware
app.use(express.json());

// API Endpoint (ต้องขึ้นต้นด้วย /api เพื่อให้ Vercel ทำงานในรูปแบบ Serverless)
app.get('/api/fivem', async (req, res) => {
    const serverIp = req.query.ip;
    if (!serverIp) return res.status(400).json({ error: 'ระบุ IP' });

    try {
        // ใช้ axios แบบตั้งค่า timeout เพื่อกัน Crash
        const response = await axios.get(`http://${serverIp}/players.json`, { timeout: 5000 });
        res.json({ players: response.data });
    } catch (err) {
        res.status(500).json({ error: 'Connection Failed' });
    }
});

// ✅ ส่วนสำคัญที่สุดสำหรับ Vercel: อย่าใช้ app.listen()
module.exports = app;
