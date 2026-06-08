const express = require('express');
const app = express();
app.use(express.json());

// ตัวแปรเก็บประกาศ (ถ้าจะเอาแบบปิดเครื่องแล้วไม่หาย ต้องต่อ Database แต่เริ่มจากตัวนี้ก่อนได้ครับ)
let announcementData = {
    title: "ยินดีต้อนรับสู่ Hyzen",
    message: "ระบบพร้อมใช้งาน",
    show: true
};

// 1. แอปวิ่งมาดึงประกาศที่นี่
app.get('/api/announcement', (req, res) => {
    res.json(announcementData);
});

// 2. แอดมิน (บีม) ส่งข้อความมาอัปเดตที่นี่
app.post('/api/update-announcement', (req, res) => {
    const { title, message, show, secretKey } = req.body;
    
    // กันคนอื่นมาแก้ ต้องมีรหัสลับ!
    if (secretKey !== "MySecretPassword123") {
        return res.status(403).send("Unauthorized");
    }

    announcementData = { title, message, show };
    res.send("Announcement updated!");
});

app.listen(3000);
