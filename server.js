const express = require('express');
const { Wallet } = require('truemoney-wallet-api');
const app = express();

app.use(express.json());

// ข้อมูลส่วนตัว (ห้ามเผยแพร่)
const WALLET_PHONE = process.env.WALLET_PHONE; 
const DEVICE_TOKEN = process.env.DEVICE_TOKEN; 
const wallet = new Wallet(DEVICE_TOKEN);

/**
 * API: POST /api/topup
 * รับค่า: { "link": "https://gift.truemoney.com/campaign/?v=...", "userId": "user123" }
 */
app.post('/api/topup', async (req, res) => {
    const { link, userId } = req.body;

    if (!link || !userId) {
        return res.status(400).json({ success: false, message: "กรุณาระบุ Link และ UserId" });
    }

    try {
        // 1. สกัดเอา Voucher Hash ออกจาก URL
        const voucherHash = link.split('v=')[1];
        if (!voucherHash) return res.status(400).json({ success: false, message: "ลิงก์ไม่ถูกต้อง" });

        // 2. ทำการ Redeem
        const response = await wallet.redeemVoucher(voucherHash, WALLET_PHONE);

        // 3. ตรวจสอบสถานะการเติมเงิน
        if (response.status.code === 'SUCCESS') {
            const amount = response.data.voucher.amount_baht;

            // TODO: เชื่อมต่อ Database ของคุณที่นี่
            // await db.execute("UPDATE users SET credit = credit + ? WHERE id = ?", [amount, userId]);
            // await db.execute("INSERT INTO transactions (user_id, amount, link) VALUES (?, ?, ?)", [userId, amount, link]);

            console.log(`User ${userId} เติมเงินสำเร็จ: ${amount} บาท`);
            return res.json({ success: true, message: "เติมเงินสำเร็จ", amount });
        } else {
            return res.status(400).json({ success: false, message: response.status.message || "ไม่สามารถทำรายการได้" });
        }
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({ success: false, message: "ระบบขัดข้อง กรุณาลองใหม่ภายหลัง" });
    }
});

app.listen(3000, () => console.log('Top-up API running on port 3000'));
