const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ระบบเก็บข้อมูลไฟล์ JSON ง่ายๆ (แทน DB)
const DB_FILE = './db.json';
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([]));

const getDB = () => JSON.parse(fs.readFileSync(DB_FILE));
const saveDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// --- API Endpoints ---

// จองคิว
app.post('/api/book', (req, res) => {
    const { name, phone } = req.body;
    const db = getDB();
    const queueCode = `FPS-${Math.floor(1000 + Math.random() * 9000)}`;
    
    db.push({ id: queueCode, name, phone, status: 'pending', created: new Date() });
    saveDB(db);
    
    res.json({ success: true, queueCode });
});

// หน้า Admin ดูคิว (โหดๆ แบบ Text-based)
app.get('/admin/queue', (req, res) => {
    const db = getDB();
    let html = `<h1>ADMIN PANEL - FPS QUEUE</h1><table border="1"><tr><th>Code</th><th>Name</th><th>Phone</th><th>Status</th><th>Action</th></tr>`;
    db.forEach(item => {
        html += `<tr><td>${item.id}</td><td>${item.name}</td><td>${item.phone}</td><td>${item.status}</td>
        <td><button onclick="confirm('${item.id}')">ยืนยันการจ่าย</button></td></tr>`;
    });
    res.send(html + `</table><script>function confirm(id){ alert('Confirming ' + id); }</script>`);
});

// หน้าเว็บหลัก
app.get('/', (req, res) => {
    res.send(`
    <style>body{background:#0a0a0a; color:#fff; font-family:monospace; display:flex; justify-content:center; padding-top:50px;}</style>
    <div style="width:300px; border:1px solid #333; padding:20px;">
        <h2>FPS BOOST BOOKING</h2>
        <input id="name" placeholder="Name" style="width:100%; margin-bottom:10px;"><br>
        <input id="phone" placeholder="Phone (Ref)" style="width:100%; margin-bottom:10px;"><br>
        <button onclick="book()">จองคิว</button>
        <div id="res"></div>
    </div>
    <script>
        async function book(){
            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            const res = await fetch('/api/book', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name, phone})});
            const data = await res.json();
            document.getElementById('res').innerHTML = '<h3>รหัสคิวของคุณ: ' + data.queueCode + '</h3>';
        }
    </script>
    `);
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));
