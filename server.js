const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const MYSTRIX_VOUCHER_API = 'https://api.mystrix2.me/';

// Vercel จะรับช่วงต่อ ยิงไปหา Mystrix ให้เอง
app.post('/api/topup', async (req, res) => {
    try {
        const { link, phone } = req.body;

        if (!link || !phone) {
            return res.status(400).json({ status: 'fail', message: 'ข้อมูลลิงก์หรือเบอร์โทรศัพท์ไม่ครบถ้วน' });
        }

        // ยิงไป Mystrix จากฝั่ง Vercel (ข้ามผ่านการบล็อกไอพีโฮสติ้งหลัก)
        const response = await axios.post(MYSTRIX_VOUCHER_API, new URLSearchParams({
            phone: phone,
            gift: link
        }).toString(), {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'sellzone24'
            },
            timeout: 15000 // กำหนดเวลา Timeout 15 วินาที
        });

        // ส่งผลลัพธ์ดิบที่ได้จาก Mystrix กลับไปให้ PHP ของคุณประมวลผลต่อ
        return res.status(200).json({ 
            status: 'success', 
            mystrix_data: response.data 
        });

    } catch (error) {
        if (error.response) {
            // กรณีที่ Mystrix ตอบกลับมาแต่สถานะพัง (เช่น 400, 403, 500)
            return res.status(400).json({ 
                status: 'fail', 
                message: `Mystrix ปฏิเสธการเชื่อมต่อผ่าน Vercel (Code ${error.response.status})` 
            });
        }
        return res.status(500).json({ 
            status: 'fail', 
            message: 'Vercel ไม่สามารถติดต่อ Mystrix ได้: ' + error.message 
        });
    }
});

module.exports = app;
