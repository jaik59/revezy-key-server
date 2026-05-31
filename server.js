const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// โครงสร้างข้อมูลคีย์ (key, expiry)
let activeKeys = [
    { key: "REVEZY-VIP-BEAM", expiry: "2026-12-31T23:59:59" }
];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 1. หน้า Dashboard แบบปุ่มกดและโทนดำดุดัน
app.get('/', (req, res) => {
    res.send(`
    <body style="background:#0a0a0a; color:#fff; font-family:'Segoe UI', sans-serif; display:flex; justify-content:center; padding:40px;">
        <div style="width:100%; max-width:450px;">
            <h2 style="letter-spacing:3px; color:#ef4444; text-align:center;">REVEZY KEY CENTER</h2>
            
            <form action="/add" method="POST" style="background:#111; padding:25px; border-radius:12px; border:1px solid #222;">
                <input type="text" name="key" placeholder="ชื่อคีย์ (เช่น REVEZY-XXXX)" required style="width:100%; padding:12px; margin-bottom:10px; background:#000; color:#fff; border:1px solid #333; border-radius:4px; box-sizing:border-box;">
                <input type="datetime-local" name="expiry" required style="width:100%; padding:12px; margin-bottom:15px; background:#000; color:#fff; border:1px solid #333; border-radius:4px; box-sizing:border-box;">
                <button type="submit" style="width:100%; padding:12px; background:#fff; font-weight:bold; cursor:pointer; border:none; border-radius:6px;">เพิ่มคีย์เข้าสู่ระบบ</button>
            </form>

            <h3 style="margin-top:30px; color:#666; font-size:14px;">รายการคีย์ที่ใช้งานได้ (${activeKeys.length})</h3>
            ${activeKeys.map(k => `
                <div style="background:#111; margin-bottom:10px; padding:15px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; border:1px solid #222;">
                    <div>
                        <div style="font-weight:bold; color:#00ff77;">${k.key}</div>
                        <div style="font-size:10px; color:#555;">หมดอายุ: ${k.expiry.replace('T', ' ')}</div>
                    </div>
                    <form action="/remove" method="POST">
                        <input type="hidden" name="key" value="${k.key}">
                        <button type="submit" style="background:#ef4444; color:#fff; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">ลบคีย์</button>
                    </form>
                </div>
            `).join('')}
        </div>
    </body>
    `);
});

// 2. API ตรวจสอบคีย์ (สำหรับ Revezy Ultra)
app.get('/verify', (req, res) => {
    const userKey = req.query.key;
    const now = new Date();
    const foundKey = activeKeys.find(k => k.key === userKey);

    if (!foundKey) {
        return res.json({ success: false, message: "คีย์ไม่ถูกต้อง" });
    }

    // ระบบเช็ควันหมดอายุ
    if (new Date(foundKey.expiry) < now) {
        activeKeys = activeKeys.filter(k => k.key !== userKey); // ลบทิ้งเองอัตโนมัติ
        return res.json({ success: false, message: "คีย์หมดอายุแล้ว" });
    }

    res.json({ success: true, message: "ผ่านการตรวจสอบ" });
});

// 3. รับค่าเพิ่มคีย์
app.post('/add', (req, res) => {
    const { key, expiry } = req.body;
    if(key && expiry && !activeKeys.find(k => k.key === key)) {
        activeKeys.push({ key, expiry });
    }
    res.redirect('/');
});

// 4. รับค่าลบคีย์
app.post('/remove', (req, res) => {
    activeKeys = activeKeys.filter(k => k.key !== req.body.key);
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`System Online on port ${PORT}`);
});
