const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint สำหรับรับลิ้งอั่งเปาจาก PHP ไปตรวจสอบ
app.post('/api/topup', async (req, res) => {
    const { link, phone } = req.body;
    if (!link || !phone) return res.status(400).json({ status: 'fail', message: 'ข้อมูลไม่ครบ' });

    // ตรงนี้คุณสามารถเพิ่ม Logic ตรวจสอบ Key หรือ Database ได้
    // แต่ในเบื้องต้น เราส่งต่อให้ PHP เป็นตัวจัดการหลัก
    return res.status(200).json({ status: 'success', message: 'พร้อมใช้งาน' });
});

module.exports = app;
