const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const MYSTRIX_VOUCHER_API = 'https://api.mystrix2.me/';
const REVEZY_KEY_SERVER = 'https://revezy-key-server.vercel.app/'; 

app.post('/api/topup', async (req, res) => {
    const { link, phone, user_id, username } = req.body; 

    if (!link) return res.status(400).json({ status: 'fail', message: 'ลิ้งอั่งเปาไม่ถูกต้อง' });
    if (!phone) return res.status(400).json({ status: 'fail', message: 'ยังไม่ได้ตั้งค่าเบอร์รับเงิน' });

    try {
        const keyResponse = await axios.post(REVEZY_KEY_SERVER, { key: "your-key-here" });

        const response = await axios.post(MYSTRIX_VOUCHER_API, `phone=${phone}&gift=${link}`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'sellzone24'
            }
        });

        const result = response.data;

        if (result.status && result.status.code === 'SUCCESS') {
            const amount = result.data.voucher.redeemed_amount_baht || 0;
            return res.status(200).json({ status: 'success', message: `คุณได้รับเงินจำนวน ${amount} พ้อยท์` });
        } else {
            return res.status(400).json({ status: 'fail', message: result.status?.message || 'ทำรายการไม่สำเร็จ' });
        }
    } catch (error) {
        return res.status(500).json({ status: 'fail', message: 'เชื่อมต่อระบบอั่งเปาไม่สำเร็จ' });
    }
});

// เปลี่ยนจาก app.listen เป็น module.exports สำหรับ Vercel
module.exports = app;
