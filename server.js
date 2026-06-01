const express = require('express');
const { createClient } = require('@vercel/kv'); // ติดตั้งโดยใช้ npm install @vercel/kv
const app = express();

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

app.use(express.json());

// 1. ตรวจสอบคีย์ (ดึงจาก Database)
app.get('/verify', async (req, res) => {
    const userKey = req.query.key;
    const isValid = await kv.sismember('activeKeys', userKey); // เช็คในเซตของ Redis
    
    if (isValid) {
        res.json({ success: true, message: "คีย์ใช้งานได้!" });
    } else {
        res.json({ success: false, message: "คีย์ไม่ถูกต้อง" });
    }
});

// 2. เพิ่มคีย์ (บันทึกถาวรใน Database)
app.get('/add', async (req, res) => {
    const newKey = req.query.key;
    await kv.sadd('activeKeys', newKey); // เพิ่มลงเซตใน Redis
    res.send(`เพิ่มคีย์ ${newKey} สำเร็จ!`);
});

// 3. ลบคีย์
app.get('/remove', async (req, res) => {
    const targetKey = req.query.key;
    await kv.srem('activeKeys', targetKey); // ลบออกจากเซต
    res.send(`ลบคีย์ ${targetKey} สำเร็จ!`);
});

app.listen(3000);
