const express = require('express');
const axios = require('axios');
const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', (req, res) => {
    res.send('🚀 Revezy Real-Money API Online!');
});

// ==========================================
// 🎮 1. ROUTE สำหรับเช็กผู้เล่น FIVEM (เหมือนเดิม)
// ==========================================
app.get('/api/fivem', async (req, res) => {
    let serverIp = req.query.ip;
    if (!serverIp) return res.status(400).json({ error: 'กรุณาระบุ IP หรือ CFX Join Code' });
    serverIp = serverIp.replace('https://', '').replace('http://', '');

    try {
        let playersData = [];
        let infoData = null;
        if (serverIp.includes('cfx.re/join/') || !serverIp.includes(':')) {
            const endpointCode = serverIp.split('/').pop(); 
            const response = await axios.get(`https://servers-frontend.cfx.re/api/servers/single/${endpointCode}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            playersData = response.data.Data.players || [];
            infoData = { vars: { sv_maxclients: response.data.Data.maxclients } };
        } else {
            const playersResponse = await axios.get(`http://${serverIp}/players.json`, { timeout: 4000 });
            const infoResponse = await axios.get(`http://${serverIp}/info.json`, { timeout: 4000 }).catch(() => null);
            playersData = playersResponse.data;
            infoData = infoResponse ? infoResponse.data : null;
        }
        res.json({ players: playersData, info: infoData });
    } catch (error) {
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลเซิร์ฟเวอร์ได้' });
    }
});

// ==========================================
// 💳 2. ROUTE ระบบรับเงินซองอั่งเปาของจริง (ดึงเงินจริงทุกลิ้งก์)
// ==========================================
app.get('/api/wallet/angpao', async (req, res) => {
    const { link } = req.query;

    if (!link) {
        return res.status(400).json({ error: 'กรุณาระบุลิงก์ซองอั่งเปา' });
    }

    // 🛠️ ระบบซ่อมแซมลิงก์อัตโนมัติ: ถ้าผู้ใช้ส่งลิงก์แบบ มี voucher_detail มา ระบบจะแปลงให้เป็นลิงก์รับเงินปกติให้ทันที
    let cleanLink = link;
    if (cleanLink.includes('voucher_detail')) {
        cleanLink = cleanLink.replace('voucher_detail', '');
    }

    // ตรวจสอบเช็กความถูกต้องโครงสร้างลิงก์อั่งเปา
    if (!cleanLink.includes('https://gift.truemoney.com/campaign/?v=')) {
        return res.status(400).json({ error: 'ลิงก์ซองอั่งเปาไม่ถูกต้อง (ต้องเป็นของ TrueMoney เท่านั้น)' });
    }

    try {
        /* ============================================================
        🌟 ขั้นตอนสำคัญเพื่อให้เงินเข้าเบอร์คุณจริงๆ 🌟
        เปลี่ยน URL ด้านล่างนี้ให้เป็นของค่ายตัวกลางที่คุณไปสมัครใช้งาน
        เช่น สมมติเป็นเว็บ Sarika API หรือเว็บรับเติมเงินออโต้เจ้าต่างๆ
        ============================================================
        */

        // 📝 ตัวอย่างโค้ดมาตรฐานเวลารับส่งข้อมูลกับค่ายหลังบ้านในไทย
        const gatewayResponse = await axios.post('https://api.sarika-api.com/api/v1/angpao', {
            token: "ใส่_TOKEN_ลับที่คุณได้มาจากเว็บตัวกลางตรงนี้", // 🔑 เอาคีย์ที่ได้หลังสมัครมาใส่
            url: cleanLink
        }).catch(err => err.response);

        const result = gatewayResponse.data;

        // ถ้าระบบตัวกลางแจ้งกลับมาว่า ดึงเงินจากซองเข้าเบอร์เราสำเร็จ!
        if (result && result.status === "success") {
            
            // 💰 ดึงยอดเงินจริงที่ระบบดึงมาได้จากซองอั่งเปานั้นๆ (เช่น 10, 20, 100, 500 บาท)
            const realAmount = parseFloat(result.amount); 

            // 🌟 [จุดต่อยอด] เขียนสคริปต์ทำระบบสุ่มคีย์ หรือแจก Key ล็อกอินให้ลูกค้าตามจำนวนเงินตรงนี้ได้เลย!
            
            return res.json({
                success: true,
                message: 'ระบบดึงเงินจากซองอั่งเปาเข้าบัญชีสำเร็จ!',
                amount: realAmount // ส่งยอดเงินจริงไปแสดงผลที่หน้าบ้าน HTML
            });
            
        } else {
            // ถ้าซองโดนเคลมไปแล้ว, ซองหมดอายุ หรือยอดเงินเหลือ 0 บาท
            const errorReason = result?.message || 'ซองอั่งเปานี้ถูกใช้งานไปแล้ว หรือหมดอายุ';
            return res.status(400).json({ error: errorReason });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'ระบบตรวจสอบซองขัดข้อง หรือเชื่อมต่อค่ายกลางไม่ได้' });
    }
});

module.exports = app;
