const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// โครงสร้างข้อมูลคีย์ (เริ่มต้นด้วยคีย์ตัวอย่าง)
let activeKeys = [
    { key: "REVEZY-VIP-BEAM", expiry: "2026-12-31T23:59:59" }
];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 1. หน้า Dashboard แบบ Cyberpunk UI
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap" rel="stylesheet">
        <style>
            body { background: #050505; color: #fff; font-family: 'Orbitron', sans-serif; display: flex; justify-content: center; padding: 40px; }
            .panel { width: 100%; max-width: 500px; background: #0d0d0d; padding: 30px; border-radius: 20px; border: 1px solid #333; }
            h2 { text-align: center; color: #ff003c; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 30px; }
            input, select { width: 100%; padding: 12px; margin-bottom: 10px; background: #1a1a1a; border: 1px solid #444; color: #fff; border-radius: 6px; box-sizing: border-box; }
            button { width: 100%; padding: 14px; background: #ff003c; border: none; color: #fff; font-weight: bold; cursor: pointer; border-radius: 6px; transition: 0.3s; }
            button:hover { background: #ff3e6d; box-shadow: 0 0 15px #ff003c; }
            .key-card { background: #141414; margin: 15px 0; padding: 20px; border-radius: 12px; border-left: 4px solid #ff003c; display: flex; justify-content: space-between; align-items: center; }
            .key-text { color: #00ffcc; font-size: 14px; }
            .expiry-text { font-size: 10px; color: #777; }
        </style>
    </head>
    <body>
        <div class="panel">
            <h2>REVEZY CONTROL</h2>
            <form action="/add" method="POST">
                <input type="text" name="key" placeholder="LICENSE KEY" required>
                <div style="display:flex; gap:10px;">
                    <input type="number" name="amount" placeholder="จำนวน" required>
                    <select name="unit">
                        <option value="minutes">นาที</option>
                        <option value="hours">ชั่วโมง</option>
                        <option value="days">วัน</option>
                    </select>
                </div>
                <button type="submit">ACTIVATE NEW KEY</button>
            </form>
            <div style="margin-top:30px;">
                ${activeKeys.map(k => `
                    <div class="key-card">
                        <div>
                            <div class="key-text">${k.key}</div>
                            <div class="expiry-text">EXPIRES: ${k.expiry.replace('T', ' ')}</div>
                        </div>
                        <form action="/remove" method="POST">
                            <input type="hidden" name="key" value="${k.key}">
                            <button type="submit" style="width:auto; padding:8px 15px; background:#333;">KILL</button>
                        </form>
                    </div>
                `).join('')}
            </div>
        </div>
    </body>
    </html>
    `);
});

// 2. API ตรวจสอบคีย์ (คำนวณวันหมดอายุอัตโนมัติ)
app.get('/verify', (req, res) => {
    const foundKey = activeKeys.find(k => k.key === req.query.key);
    if (!foundKey) return res.json({ success: false, message: "INVALID KEY" });
    
    if (new Date(foundKey.expiry) < new Date()) {
        activeKeys = activeKeys.filter(k => k.key !== req.query.key);
        return res.json({ success: false, message: "EXPIRED" });
    }
    
    res.json({ success: true, message: "ACCESS GRANTED" });
});

// 3. ระบบคำนวณเวลาเพิ่มคีย์
app.post('/add', (req, res) => {
    const { key, amount, unit } = req.body;
    let expiryDate = new Date();
    
    if (unit === 'minutes') expiryDate.setMinutes(expiryDate.getMinutes() + parseInt(amount));
    if (unit === 'hours') expiryDate.setHours(expiryDate.getHours() + parseInt(amount));
    if (unit === 'days') expiryDate.setDate(expiryDate.getDate() + parseInt(amount));

    if(key && !activeKeys.find(k => k.key === key)) {
        activeKeys.push({ key, expiry: expiryDate.toISOString() });
    }
    res.redirect('/');
});

// 4. ระบบลบคีย์
app.post('/remove', (req, res) => {
    activeKeys = activeKeys.filter(k => k.key !== req.body.key);
    res.redirect('/');
});

app.listen(PORT, () => console.log(`System Online on port ${PORT}`));
