const express = require('express');
const axios = require('axios');
const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// 💳 ROUTE สำหรับรับเงินซองอั่งเปาตรงเข้าเบอร์เรา (ฟรี ไม่ผ่านตัวกลาง)
app.get('/api/wallet/angpao', async (req, res) => {
    const { link } = req.query;
    
    // 📞 ⚠️ ใส่เบอร์ TrueMoney Wallet ของคุณตรงนี้เพื่อรับเงิน!
    const myTargetPhone = "0981637594"; 

    if (!link) {
        return res.status(400).json({ error: 'กรุณาระบุลิงก์ซองอั่งเปา' });
    }

    // ตัดแต่งสตริงล้างค่าพารามิเตอร์ที่เกินมาให้เหลือแค่รหัสซอง
    let voucherCode = link.split('v=').pop().split('&').shift();

    if (!voucherCode || voucherCode.length < 10) {
        return res.status(400).json({ error: 'ลิงก์ซองอั่งเปาไม่ถูกต้อง' });
    }

    try {
        // ยิงคำขอตรงไปที่เซิร์ฟเวอร์ของ TrueMoney เพื่อขอรับเงิน (ต้องรันจาก IP ไทยเท่านั้น)
        const tmnResponse = await axios.post(`https://gift.truemoney.com/campaign/v1/vouchers/${voucherCode}/redeem`, {
            mobile: myTargetPhone,
            voucher_hash: voucherCode
        }, {
            headers: { 
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
            }
        });

        const resData = tmnResponse.data;

        // ถ้า TrueMoney ตอบกลับว่าสำเร็จ (SUCCESS)
        if (resData.status && resData.status.code === 'SUCCESS') {
            // ดึงยอดเงินบาทจริงในซองนั้นๆ ออกมา
            const amountReceived = parseFloat(resData.data.voucher.redeemed_amount_baht);

            // 🌟 ตรงนี้ระบบดึงเงินเข้าเบอร์คุณสำเร็จแล้ว! สามารถเขียนโค้ดแจกคีย์ต่อได้เลย
            return res.json({
                success: true,
                message: 'ระบบดึงเงินเข้าบัญชีสำเร็จ! (ฟรี 100%)',
                amount: amountReceived
            });
        } else {
            return res.status(400).json({ error: resData.status.message || 'ซองนี้ถูกใช้งานไปแล้ว หรือหมดอายุ' });
        }

    } catch (error) {
        // แฮนเดิลกรณีโดน TrueMoney บล็อกไอพี หรือซองมีปัญหา
        const apiError = error.response?.data?.status?.message || 'TrueMoney บล็อกการเชื่อมต่อ (หากรันบน Vercel จะติดตรงนี้)';
        return res.status(500).json({ error: apiError });
    }
});

// ถ้าคุณรันในคอมตัวเอง ให้เปิดพอร์ต 3000 ไว้ทดสอบ
app.listen(3000, () => {
    console.log('🚀 Local Server running on port 3000 (เปิดเช็กอั่งเปาฟรีรันในไทย)');
});
