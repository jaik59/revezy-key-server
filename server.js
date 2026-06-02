const express = require('express');
const axios = require('axios');
const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// หน้าแรกสุด เอาไว้เช็กว่า Vercel ทำงานไหม
app.get('/', (req, res) => {
    res.send('🚀 FiveM Proxy API Online!');
});

app.get('/api/fivem', async (req, res) => {
    let serverIp = req.query.ip;
    if (!serverIp) {
        return res.status(400).json({ error: 'กรุณาระบุ IP หรือ CFX Join Code' });
    }

    // ลบ http:// หรือ https:// ออกหากผู้ใช้พิมพ์เกินมา
    serverIp = serverIp.replace('https://', '').replace('http://', '');

    try {
        let playersData = [];
        let infoData = null;

        // 🌟 สูตรลับ: ถ้าผู้ใช้ใส่มาเป็น cfx.re/join/xxxxxx ให้ดึงข้อมูลผ่านส่วนกลางของ FiveM ทันที
        if (serverIp.includes('cfx.re/join/') || !serverIp.includes(':')) {
            // ดึงเฉพาะโค้ด 6 หลักท้ายมา เช่น cfx.re/join/abcde -> abcde
            const endpointCode = serverIp.split('/').pop(); 
            
            // ยิงไปที่ API ส่วนกลางของ FiveM (ไม่มีวันติดบล็อก Firewall ของเซิร์ฟเวอร์เกม)
            const response = await axios.get(`https://servers- those-frontend.cfx.re/api/servers/single/${endpointCode}`, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            
            playersData = response.data.Data.players || [];
            infoData = { vars: { sv_maxclients: response.data.Data.maxclients } };
        } else {
            // หากใส่เป็น IP:Port ตรงๆ ก็ให้ยิงแบบเดิม (แต่เสี่ยงโดนเซิร์ฟเกมบล็อก)
            const playersResponse = await axios.get(`http://${serverIp}/players.json`, { timeout: 4000 });
            const infoResponse = await axios.get(`http://${serverIp}/info.json`, { timeout: 4000 }).catch(() => null);
            
            playersData = playersResponse.data;
            infoData = infoResponse ? infoResponse.data : null;
        }

        res.json({
            players: playersData,
            info: infoData
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลเซิร์ฟเวอร์นี้ได้ (อาจเป็นเซิร์ฟเวอร์ส่วนตัว หรือระบุ IP/Code ผิด)' });
    }
});

module.exports = app;
