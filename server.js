const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ค่าคงที่
const MYSTRIX_VOUCHER_API = 'https://api.mystrix2.me/';
const REVEZY_KEY_SERVER = 'https://revezy-key-server.vercel.app/'; 

app.post('/api/topup', async (req, res) => {
    // 1. ตรวจสอบการ Login (คุณต้องมีระบบ Auth ของคุณเอง เช่น check JWT หรือ Session)
    const { link, phone, user_id, username } = req.body; 

    if (!link) return res.status(400).json({ status: 'fail', message: 'ลิ้งอั่งเปาไม่ถูกต้อง' });
    if (!phone) return res.status(400).json({ status: 'fail', message: 'ยังไม่ได้ตั้งค่าเบอร์รับเงิน' });

    try {
        // 2. เรียกใช้งาน Revezy Key Server (ตามที่คุณต้องการ)
        // สมมติว่าต้องส่ง token หรือ key ไปตรวจสอบ
        const keyResponse = await axios.post(REVEZY_KEY_SERVER, { /* ใส่ parameters ของคุณ */ });

        // 3. ส่ง Request ไปที่ Mystrix
        const response = await axios.post(MYSTRIX_VOUCHER_API, `phone=${phone}&gift=${link}`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'sellzone24'
            }
        });

        const result = response.data;

        // 4. ตรวจสอบสถานะ (Logic เดิม)
        if (result.status && result.status.code === 'SUCCESS') {
            const amount = result.data.voucher.redeemed_amount_baht || 0;
            
            // TODO: เชื่อมต่อ Database (MySQL) เพื่อ Update ยอดเงินตรงนี้
            // await db.execute("UPDATE users SET point = point + ? WHERE id = ?", [amount, user_id]);

            // 5. ส่ง Discord Webhook (เหมือนโค้ดเดิม)
            // await axios.post(WEBHOOK_URL, { ...json_data });

            return res.status(200).json({ status: 'success', message: `คุณได้รับเงินจำนวน ${amount} พ้อยท์` });
        } else {
            return res.status(400).json({ status: 'fail', message: result.status?.message || 'ทำรายการไม่สำเร็จ' });
        }

    } catch (error) {
        return res.status(500).json({ status: 'fail', message: 'เชื่อมต่อระบบอั่งเปาไม่สำเร็จ' });
    }
});

app.listen(3000, () => console.log('API Server running on port 3000'));
