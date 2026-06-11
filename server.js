const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint ยิงมาที่ /api/topup เพื่อตรวจสอบระบบก่อนตัดอั่งเปาจริง
app.post('/api/topup', async (req, res) => {
    try {
        const { link, phone, user_id } = req.body;

        // เช็คความครบถ้วนของข้อมูลเบื้องต้น
        if (!link || !phone) {
            return res.status(400).json({ 
                status: 'fail', 
                message: 'คีย์เซิร์ฟเวอร์พบว่าข้อมูลลิงก์หรือเบอร์โทรศัพท์ส่งมาไม่ครบ' 
            });
        }

        // [คุณสามารถเขียน Logic บล็อกบอท ตรวจคีย์สิทธิ์ หรือการเข้ารหัสเพิ่มตรงนี้ได้ในอนาคต]

        // หากทุกอย่างปกติ ให้ส่ง success กลับไปเพื่อให้ PHP รันงานต่อได้ทันที
        return res.status(200).json({ 
            status: 'success', 
            message: 'ผ่านด่านตรวจสอบความปลอดภัยเรียบร้อย' 
        });

    } catch (error) {
        return res.status(500).json({ 
            status: 'fail', 
            message: 'เกิดข้อผิดพลาดภายในระบบคีย์เซิร์ฟเวอร์: ' + error.message 
        });
    }
});

module.exports = app;
