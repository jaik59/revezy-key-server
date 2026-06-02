const express = require('express');
const axios = require('axios');
const app = express();

// ตั้งค่า CORS ให้หน้าบ้าน HTML คุยกับ Vercel ได้อย่างไร้รอยต่อ
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// หน้าแรกสุดสำหรับเช็กสถานะการทำงานบน Vercel
app.get('/', (req, res) => {
    res.send('🚀 Revezy Ultimate Master API Online!');
});

// ============================================================
// 🎮 1. ROUTE สำหรับเช็กผู้เล่น FIVEM (เวอร์ชันแกะชื่อโปรไฟล์อัจฉริยะ)
// ============================================================
app.get('/api/fivem', async (req, res) => {
    let serverIp = req.query.ip;
    if (!serverIp) {
        return res.status(400).json({ error: 'กรุณาระบุ IP หรือ CFX Join Code' });
    }

    serverIp = serverIp.replace('https://', '').replace('http://', '');

    try {
        let rawPlayers = [];
        let infoData = null;

        // ดึงข้อมูลกรณีเป็น Cfx Join Code หรือไม่มีเครื่องหมาย : (Port)
        if (serverIp.includes('cfx.re/join/') || !serverIp.includes(':')) {
            const endpointCode = serverIp.split('/').pop(); 
            
            // เปลี่ยน URL API ส่วนกลางเป็นตัวเสถียร (แก้ไขคำผิดจากโค้ดเดิม)
            const response = await axios.get(`https://servers-frontend.cfx.re/api/servers/single/${endpointCode}`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                timeout: 5000
            });
            
            rawPlayers = response.data.Data.players || [];
            infoData = { 
                vars: { sv_maxclients: response.data.Data.maxclients },
                icon: response.data.Data.icon || null
            };
        } else {
            // ดึงข้อมูลตรงกรณีระบุเป็น IP:Port
            const playersResponse = await axios.get(`http://${serverIp}/players.json`, { timeout: 4000 });
            const infoResponse = await axios.get(`http://${serverIp}/info.json`, { timeout: 4000 }).catch(() => null);
            
            rawPlayers = playersResponse.data || [];
            infoData = infoResponse ? infoResponse.data : null;
        }

        // 🔥 [ฟังก์ชันโหด] วนลูปคัดแยกและล้างข้อมูลตัวระบุตน (Identifiers) เพื่อดึงชื่อและ ID ใช้งานง่าย
        const processedPlayers = rawPlayers.map(player => {
            let steamHex = "ไม่มี";
            let discordId = "ไม่มี";
            let license = "ไม่มี";
            let liveUsername = player.name || 'Unknown'; // ชื่อในเกม

            if (player.identifiers && Array.isArray(player.identifiers)) {
                player.identifiers.forEach(id => {
                    if (id.startsWith('steam:')) steamHex = id.replace('steam:', '');
                    if (id.startsWith('discord:')) discordId = id.replace('discord:', '');
                    if (id.startsWith('license:')) license = id.replace('license:', '');
                });
            }

            return {
                id: player.id,
                name: liveUsername,
                ping: player.ping || 0,
                identifiers: player.identifiers || [],
                // ส่งฟิลด์แยกประเภทชัดๆ ไปให้หน้าบ้านดึงแสดงผลได้ทันทีไม่ต้องไปเขียน regex สแกนซ้ำ
                steamHex: steamHex,
                discordId: discordId,
                license: license
            };
        });

        res.json({
            players: processedPlayers,
            info: infoData
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้ (โปรดตรวจสอบว่าเซิร์ฟเปิดอยู่ หรือพิมพ์ไอพีถูกต้อง)' });
    }
});

// ============================================================
// 💳 2. ROUTE ระบบเคลมซองอั่งเปาฟรี 100% ยิงตรงเข้าเบอร์เจ้าของเว็บ
// ============================================================
app.get('/api/wallet/angpao', async (req, res) => {
    const { link } = req.query;
    
    // 📞 ⚠️ สำคัญมาก: เปลี่ยนเป็นเบอร์ TrueMoney Wallet ของคุณตรงนี้เพื่อรับเงินจริง!
    const myWalletPhone = "09XXXXXXXX"; 

    if (!link) {
        return res.status(400).json({ error: 'กรุณาระบุลิงก์ซองอั่งเปา' });
    }

    // ทำความสะอาดลิงก์ ดึงเฉพาะรหัสแฮชซอง 32 หลักท้ายออกมาใช้
    let voucherCode = link.split('v=').pop().split('&').shift();

    if (!voucherCode || voucherCode.length < 10) {
        return res.status(400).json({ error: 'รูปแบบลิงก์ซองอั่งเปาไม่ถูกต้อง' });
    }

    try {
        // ยิงตรงไปเซิร์ฟเวอร์หลัก TrueMoney (หมายเหตุ: วิธีฟรีนี้ต้องนำไปรันบนคอมตัวเอง/VPS ไทย ไม่งั้น Vercel จะติดบล็อก IP นอกประเทศ)
        const tmnRes = await axios.post(`https://gift.truemoney.com/campaign/v1/vouchers/${voucherCode}/redeem`, {
            mobile: myWalletPhone,
            voucher_hash: voucherCode
        }, {
            headers: { 
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
            }
        });

        const resData = tmnRes.data;

        if (resData.status && resData.status.code === 'SUCCESS') {
            const amountReceived = parseFloat(resData.data.voucher.redeemed_amount_baht);
            
            return res.json({
                success: true,
                message: 'ระบบดึงเงินเข้าบัญชีเรียบร้อยแล้ว!',
                amount: amountReceived
            });
        } else {
            return res.status(400).json({ error: resData.status.message || 'ซองอั่งเปานี้ถูกใช้งานไปแล้ว หรือหมดอายุ' });
        }

    } catch (error) {
        const errorReason = error.response?.data?.status?.message || 'TrueMoney ปฏิเสธการเชื่อมต่อ (หากทดสอบบน Vercel จะติดบล็อกไอพีต่างประเทศ)';
        return res.status(500).json({ error: errorReason });
    }
});

module.exports = app;
