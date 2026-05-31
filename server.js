const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// เก็บข้อมูลในรูปแบบ Object { key, expiry }
let activeKeys = [
    { key: "REVEZY-FREE-9999", expiry: "2026-12-31T23:59:59" },
    { key: "REVEZY-VIP-BEAM", expiry: "2026-06-30T23:59:59" }
];

app.use(express.urlencoded({ extended: true }));

// 1. หน้าหลัก (แสดงเวลาหมดอายุด้วย)
app.get('/', (req, res) => {
    res.send(`
        <body style="background:#111; color:#fff; font-family:sans-serif; padding:40px;">
            <h2>REVEZY KEY MANAGER (AUTO-EXPIRY)</h2>
            <form action="/add" method="POST" style="margin-bottom:20px;">
                <input type="text" name="key" placeholder="ชื่อคีย์" required>
                <input type="datetime-local" name="expiry" required>
                <button type="submit">เพิ่มคีย์พร้อมตั้งเวลา</button>
            </form>
            <ul>
                ${activeKeys.map(k => `
                    <li>
                        <code>${k.key}</code> (หมดอายุ: ${k.expiry})
                        <a href="/remove?key=${k.key}" style="color:red; margin-left:10px;">[ลบ]</a>
                    </li>
                `).join('')}
            </ul>
        </body>
    `);
});

// 2. API ตรวจสอบคีย์ + เช็คเวลาอัตโนมัติ
app.get('/verify', (req, res) => {
    const userKey = req.query.key;
    const now = new Date();
    
    // หาคีย์ในอาร์เรย์
    const foundKey = activeKeys.find(k => k.key === userKey);

    if (!foundKey) {
        return res.json({ success: false, message: "ไม่พบข้อมูลคีย์" });
    }

    // เช็คว่าหมดอายุหรือยัง
    if (new Date(foundKey.expiry) < now) {
        // ถ้าหมดอายุแล้ว ให้ลบออกไปเลย
        activeKeys = activeKeys.filter(k => k.key !== userKey);
        return res.json({ success: false, message: "คีย์หมดอายุแล้วและถูกลบออกจากระบบ" });
    }

    res.json({ success: true, message: "คีย์ใช้งานได้!" });
});

// 3. เพิ่มคีย์พร้อมตั้งเวลา
app.post('/add', (req, res) => {
    const { key, expiry } = req.body;
    if(key && expiry && !activeKeys.find(k => k.key === key)) {
        activeKeys.push({ key, expiry });
    }
    res.redirect('/');
});

// 4. ลบคีย์
app.get('/remove', (req, res) => {
    activeKeys = activeKeys.filter(k => k.key !== req.query.key);
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
