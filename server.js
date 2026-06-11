const express = require('express');
const cors = require('cors');
const { Wallet } = require('truemoney-wallet-api'); // ติดตั้งโดย npm install truemoney-wallet-api

const app = express();
app.use(cors());
app.use(express.json());

// ข้อมูลบัญชีรับเงิน (ควรเก็บเป็น Environment Variable เพื่อความปลอดภัย)
const WALLET_PHONE = "08XXXXXXXX"; 
const DEVICE_TOKEN = "ใส่_Device_Token_ของคุณที่นี่";
const wallet = new Wallet(DEVICE_TOKEN);

app.post('/api/redeem', async (req, res) => {
    const { link, userId } = req.body;

    try {
        // 1. ดึง Voucher Hash จากลิงก์
        const voucherHash = link.split('v=')[1];
        
        // 2. สั่ง Redeem
        const response = await wallet.redeemVoucher(voucherHash, WALLET_PHONE);
        
        if (response.status.code === 'SUCCESS') {
            const amount = response.data.voucher.amount_baht;
            
            // 3. TODO: ตรงนี้คือจุดที่คุณต้องเขียน Code อัปเดต Database ของเกม
            // db.query("UPDATE users SET balance = balance + ? WHERE id = ?", [amount, userId]);
            
            return res.json({ success: true, message: `เติมเงินสำเร็จ ${amount} บาท!` });
        } else {
            return res.json({ success: false, message: "ซองไม่ถูกต้องหรือถูกใช้ไปแล้ว" });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดจากระบบ" });
    }
});

app.listen(3000, () => console.log('Top-up Service Ready!'));
