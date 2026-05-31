const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

let activeKeys = [
    { key: "REVEZY-VIP-BEAM", expiry: "2026-12-31T23:59:59" }
];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// UI จัดเต็ม: ใช้ระบบ CSS Flexbox, Glassmorphism, และ Neon Effect
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
            body { background: #050505; color: #fff; font-family: 'Orbitron', sans-serif; display: flex; justify-content: center; padding: 40px; }
            .panel { width: 100%; max-width: 500px; background: #0d0d0d; padding: 30px; border-radius: 20px; border: 1px solid #333; box-shadow: 0 0 30px rgba(255,0,0,0.1); }
            h2 { text-align: center; color: #ff003c; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 30px; text-shadow: 0 0 10px #ff003c; }
            input { width: 100%; padding: 12px; margin-bottom: 10px; background: #1a1a1a; border: 1px solid #333; color: #fff; border-radius: 8px; box-sizing: border-box; }
            button { width: 100%; padding: 14px; background: #ff003c; border: none; color: #fff; font-weight: bold; cursor: pointer; border-radius: 8px; transition: 0.3s; margin-top: 10px; }
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
                <input type="datetime-local" name="expiry" required>
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

// ระบบหลังบ้านคงเดิม
app.get('/verify', (req, res) => {
    const foundKey = activeKeys.find(k => k.key === req.query.key);
    if (!foundKey || new Date(foundKey.expiry) < new Date()) {
        return res.json({ success: false, message: "INVALID OR EXPIRED" });
    }
    res.json({ success: true, message: "ACCESS GRANTED" });
});

app.post('/add', (req, res) => {
    const { key, expiry } = req.body;
    if(key && expiry && !activeKeys.find(k => k.key === key)) activeKeys.push({ key, expiry });
    res.redirect('/');
});

app.post('/remove', (req, res) => {
    activeKeys = activeKeys.filter(k => k.key !== req.body.key);
    res.redirect('/');
});

app.listen(PORT, () => console.log(`Revezy Core Online`));
