const express = require('express');
const axios = require('axios');
const app = express();

// เปิดให้หน้าเว็บ HTML (หน้าบ้าน) ยิงเข้ามาดึงข้อมูลได้ ไม่ติด CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// หน้าแรกสุด เอาไว้เช็กสถานะการทำงานของ Vercel (เข้าลิงก์หลักแล้วเจอคำนี้แปลว่าทำงานปกติ)
app.get('/', (req, res) => {
    res.send('🚀 Revezy Server API Online & Ready!');
});

// ==========================================
// 🎮 1. ROUTE สำหรับเช็กผู้เล่น FIVEM (เวอร์ชันอัปเกรดทะลุ Firewall)
// ==========================================
app.get('/api/fivem', async (req, res) => {
    let serverIp = req.query.ip;
    if (!serverIp) {
        return res.status(400).json({ error: 'กรุณาระบุ IP หรือ CFX Join Code' });
    }

    // ล้างค่าที่ผู้ใช้พิมพ์เกินมา เช่น http:// หรือ https://
    serverIp = serverIp.replace('https://', '').replace('http://', '');

    try {
        let playersData = [];
        let infoData = null;

        // ถ้าใส่มาเป็น Join Code 6 หลัก หรือลิงก์ cfx.re ให้ดึงข้อมูลผ่านส่วนกลางของ FiveM (ไม่โดนบล็อก)
        if (serverIp.includes('cfx.re/join/') || !serverIp.includes(':')) {
            const endpointCode = serverIp.split('/').pop(); 
            
            const response = await axios.get(`https://servers-frontend.cfx.re/api/servers/single/${endpointCode}`, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            
            playersData = response.data.Data.players || [];
            infoData = { vars: { sv_maxclients: response.data.Data.maxclients } };
        } else {
            // หากใส่เป็น IP:Port ตรงๆ ก็ให้ยิงแบบเดิม
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
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลเซิร์ฟเวอร์ได้ (อาจระบุข้อมูลผิด หรือเซิร์ฟเวอร์ปิดอยู่)' });
    }
});

// ==========================================
// 💳 2. ROUTE สำหรับระบบรับเงิน "ซองอั่งเปา TrueMoney Wallet"
// ==========================================
app.get('/api/wallet/angpao', async (req, res) => {
    const { link } = req.query; // รับลิงก์ซองอั่งเปาที่ส่งมาจากหน้าบ้าน

    if (!link) {
        return res.status(400).json({ error: 'กรุณาระบุลิงก์ซองอั่งเปา' });
    }

    // ตรวจสอบขั้นต้นว่าใช่ลิงก์อั่งเปาจริงไหม
    if (!link.includes('https://gift.truemoney.com/campaign/?v=')) {
        return res.status(400).json({ error: 'รูปแบบลิงก์ซองอั่งเปาไม่ถูกต้อง' });
    }

    try {
        /* ⚠️ คำแนะนำสำหรับระบบรับเงินจริง:
        ให้คุณนำสคริปต์/URL หรือ API Key ของผู้ให้บริการตัวกลางที่คุณเลือกสมัคร (เช่น ค่ายรับเติมเงินต่างๆ) มาใส่ตรงนี้ครับ
        ด้านล่างนี้คือโครงสร้างตัวอย่างการยิงเพื่อตัดยอดเงิน:
        */
        
        // ตัวอย่างการส่งลิงก์ไปให้เซิร์ฟเวอร์ไทยค่ายกลางเคลมซองเงินเข้าเบอร์เรา
        /*
        const gatewayRes = await axios.post('https://api.ค่ายกลางที่คุณใช้.com/v1/redeem', {
            api_key: "ใส่คีย์ลับของคุณตรงนี้",
            url: link
        });

        const result = gatewayRes.data;
        */

        // 📝 จำลองผลลัพธ์เพื่อทดสอบระบบ (เมื่อเอาไปทำระบบจริง ให้เปลี่ยนไปใช้ข้อมูลด้านบนนะครับ)
        const mockSuccess = true; // สมมติว่าดึงเงินผ่านสำเร็จ
        const mockAmount = 50.00; // สมมติยอดเงินในซองคือ 50 บาท

        if (mockSuccess) {
            // 🌟 [จุดเด่น] สามารถเขียนโค้ดสั่งสร้าง "คีย์ใช้งาน" หรือบันทึกแต้มลง Database ต่อตรงนี้ได้เลย!
            
            return res.json({
                success: true,
                message: 'ระบบได้รับเงินเรียบร้อยแล้ว!',
                amount: mockAmount
            });
        } else {
            return res.status(400).json({ error: 'ซองอั่งเปานี้ถูกใช้งานไปแล้ว หรือหมดอายุ' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'ระบบตรวจสอบซองขัดข้อง หรือค่ายกลางปิดปรับปรุง' });
    }
});

// บรรทัดนี้สำคัญมากสำหรับ Vercel: ต้อง Export app ออกไปแทนการใช้ app.listen() เดิม
module.exports = app;
