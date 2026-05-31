const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// อาร์เรย์เก็บข้อมูลคีย์ในระบบ
let activeKeys = [
    "REVEZY-FREE-9999",
    "REVEZY-VIP-BEAM"
];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 1. หน้าเว็บหลัก Dashboard (UI โทนดำดุดัน) ---
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>REVEZY CONTROL PANEL</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; }
            body { 
                background: #0a0a0a; 
                color: #ffffff; 
                padding: 40px 20px;
                display: flex;
                justify-content: center;
            }
            .panel-container {
                width: 100%;
                max-width: 600px;
                background: #111111;
                border: 1px solid #222222;
                border-radius: 16px;
                padding: 30px;
                box-shadow: 0 20px 50px rgba(0,0,0,0.7);
            }
            h1 { font-size: 24px; font-weight: 800; letter-spacing: 2px; margin-bottom: 5px; text-transform: uppercase; }
            .subtitle { font-size: 12px; color: #555; margin-bottom: 30px; letter-spacing: 1px; }
            
            /* โซนสร้างคีย์ */
            .action-box {
                background: #161616;
                border: 1px solid #252525;
                padding: 20px;
                border-radius: 12px;
                margin-bottom: 30px;
            }
            .form-group { display: flex; gap: 10px; margin-top: 10px; }
            input[type="text"] {
                flex: 1;
                padding: 12px;
                background: #0a0a0a;
                border: 1px solid #333;
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
                outline: none;
            }
            input[type="text"]:focus { border-color: #fff; }
            
            button {
                padding: 12px 20px;
                border-radius: 8px;
                border: none;
                font-weight: 700;
                cursor: pointer;
                transition: 0.2s;
            }
            .btn-add { background: #ffffff; color: #000000; }
            .btn-add:hover { background: #cccccc; }
            .btn-gen { background: #222; color: #fff; border: 1px solid #444; }
            .btn-gen:hover { background: #333; }
            .btn-delete { background: #ff3333; color: #fff; padding: 6px 12px; font-size: 12px; }
            .btn-delete:hover { background: #cc0000; }

            /* ตารางแสดงคีย์ */
            h3 { font-size: 16px; margin-bottom: 15px; color: #888; letter-spacing: 1px; }
            .key-list { list-style: none; }
            .key-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 15px;
                background: #141414;
                border: 1px solid #222;
                border-radius: 8px;
                margin-bottom: 8px;
            }
            .key-text { font-family: monospace; font-size: 14px; color: #00ff77; letter-spacing: 1px; }
        </style>
    </head>
    <body>
        <div class="panel-container">
            <h1>REVEZY CENTER</h1>
            <div class="subtitle">ONLINE LICENSE KEY MANAGER</div>

            <div class="action-box">
                <h3>CREATE LICENSE KEY</h3>
                <form action="/add" method="POST">
                    <div class="form-group">
                        <input type="text" id="key-input" name="key" placeholder="พิมพ์คีย์เอง หรือกดสุ่มด้านขวา" required>
                        <button type="button" class="btn-gen" onclick="generateRandomKey()">สุ่มคีย์</button>
                        <button type="submit" class="btn-add">เพิ่มคีย์</button>
                    </div>
                </form>
            </div>

            <h3>ACTIVE KEYS (${activeKeys.length})</h3>
            <ul class="key-list">
                ${activeKeys.length === 0 ? '<li style="color:#444; text-align:center; font-size:14px; padding:20px;">ไม่มีคีย์ในระบบในขณะนี้</li>' : ''}
                ${activeKeys.map(k => `
                    <li class="key-item">
                        <span class="key-text">${k}</span>
                        <a href="/remove?key=${encodeURIComponent(k)}">
                            <button class="btn-delete">ลบ</button>
                        </a>
                    </li>
                `).join('')}
            </ul>
        </div>

        <script>
            function generateRandomKey() {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                let part1 = '';
                let part2 = '';
                for (let i = 0; i < 4; i++) {
                    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
                    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                document.getElementById('key-input').value = 'REVEZY-' + part1 + '-' + part2;
            }
        </script>
    </body>
    </html>
    `);
});

// --- 2. API สำหรับตรวจสอบคีย์ (ที่ตัวโปรแกรม Electron ยิงมาเช็ค) ---
app.get('/verify', (req, res) => {
    const userKey = req.query.key;
    if (activeKeys.includes(userKey)) {
        res.json({ success: true, message: "คีย์ผ่านการตรวจสอบสำเร็จ!" });
    } else {
        res.json({ success: false, message: "ไม่พบข้อมูลคีย์นี้ หรือคีย์อาจจะหมดอายุแล้ว" });
    }
});

// --- 3. ระบบกดเพิ่มคีย์จากหน้าเว็บ ---
app.post('/add', (req, res) => {
    const newKey = req.body.key.trim();
    if (newKey && !activeKeys.includes(newKey)) {
        activeKeys.push(newKey);
    }
    res.redirect('/');
});

// --- 4. ระบบกดลบคีย์จากหน้าเว็บ ---
app.get('/remove', (req, res) => {
    const targetKey = req.query.key;
    activeKeys = activeKeys.filter(k => k !== targetKey);
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`Hacker Dashboard running on port ${PORT}`);
});
