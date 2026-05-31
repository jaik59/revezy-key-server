const express = require('express');
const Datastore = require('nedb-promises');
const app = express();
const PORT = process.env.PORT || 3000;

// โหลดฐานข้อมูล (ถ้าไม่มีไฟล์จะสร้างให้เอง)
const db = Datastore.create({ filename: 'keys.db', autoload: true });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- หน้า Dashboard ---
app.get('/', async (req, res) => {
    const keys = await db.find({});
    res.send(`
    <!DOCTYPE html>
    <html lang="th"><head><meta charset="UTF-8"><title>REVEZY PRO CONTROL</title>
    <style>
        body { background: #050505; color: #fff; font-family: monospace; padding: 20px; }
        .container { max-width: 800px; margin: auto; }
        .card { background: #111; padding: 20px; border-radius: 10px; border: 1px solid #333; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; border: 1px solid #222; text-align: left; }
        .active { color: #00ff77; }
        .banned { color: #ff3333; }
    </style></head><body>
    <div class="container">
        <h1>REVEZY PRO MANAGER</h1>
        <div class="card">
            <form action="/add" method="POST">
                <input type="text" name="key" placeholder="License Key" required>
                <input type="date" name="expiry" required>
                <button type="submit">เพิ่มคีย์</button>
            </form>
        </div>
        <div class="card">
            <table>
                <tr><th>Key</th><th>Expire</th><th>Status</th><th>Action</th></tr>
                ${keys.map(k => `<tr>
                    <td>${k.key}</td><td>${k.expiry}</td>
                    <td class="${k.status}">${k.status}</td>
                    <td>
                        <a href="/toggle?id=${k._id}">Switch</a> | 
                        <a href="/delete?id=${k._id}">ลบ</a>
                    </td>
                </tr>`).join('')}
            </table>
        </div>
    </div></body></html>`);
});

// --- API ตรวจสอบคีย์ (ที่ตัวโปรแกรมยิงมา) ---
app.get('/verify', async (req, res) => {
    const keyData = await db.findOne({ key: req.query.key });
    if (!keyData) return res.json({ success: false, message: "ไม่พบข้อมูล" });
    
    if (keyData.status === 'banned') return res.json({ success: false, message: "คีย์ของคุณถูกระงับ: " + keyData.reason });
    if (new Date() > new Date(keyData.expiry)) return res.json({ success: false, message: "คีย์หมดอายุแล้ว" });
    
    res.json({ success: true, message: "ใช้งานได้ปกติ" });
});

// --- ระบบเพิ่มคีย์ ---
app.post('/add', async (req, res) => {
    await db.insert({ key: req.body.key, expiry: req.body.expiry, status: 'active', reason: '-' });
    res.redirect('/');
});

// --- ระบบสลับสถานะ (ระงับ/ใช้งาน) ---
app.get('/toggle', async (req, res) => {
    const k = await db.findOne({ _id: req.query.id });
    const newStatus = k.status === 'active' ? 'banned' : 'active';
    const reason = newStatus === 'banned' ? 'โดนแบนโดยแอดมิน' : '-';
    await db.update({ _id: req.query.id }, { $set: { status: newStatus, reason: reason } });
    res.redirect('/');
});

app.get('/delete', async (req, res) => {
    await db.remove({ _id: req.query.id });
    res.redirect('/');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
