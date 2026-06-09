const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// เปิดใช้งาน CORS และการอ่านข้อมูลรูปแบบ JSON
app.use(cors());
app.use(express.json());

/* 🔑 [ระบบฐานข้อมูลคีย์เริ่มต้น] เพิ่ม-ลด คีย์หลักตรงนี้ได้เลย */
let DATABASE_KEYS = [
    "REVEZY-ULTRA-FREE-777",
    "REVEZY-VIP-9999-XXXX",
    "REVEZY-CORE-KEY-2026",
    "TEST-KEY-NOT-BEAM"
];

// -------------------------------------------------------------
// [ระบบหน้าบ้านแผงควบคุม Dashboard]
// -------------------------------------------------------------

// หน้าแรกเซิร์ฟเวอร์: ส่งหน้าตาเว็บ HTML แผงควบคุมไปแสดงผล
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(generateDashboardHTML());
});

// API สำหรับดึงรายการคีย์ทั้งหมดไปโชว์บนหน้าเว็บ
app.get('/api/keys', (req, res) => {
    res.status(200).json({
        success: true,
        keys: DATABASE_KEYS
    });
});

// API สำหรับเพิ่มคีย์ใหม่ผ่านหน้าเว็บ
app.post('/api/keys/add', (req, res) => {
    const { newKey } = req.body;
    if (!newKey || newKey.trim() === "") {
        return res.status(400).json({ success: false, message: "กรุณากรอกรหัสคีย์ที่ต้องการเพิ่ม" });
    }
    
    const formattedKey = newKey.trim();
    if (DATABASE_KEYS.includes(formattedKey)) {
        return res.status(400).json({ success: false, message: "มีคีย์นี้อยู่ในระบบเรียบร้อยแล้ว" });
    }

    DATABASE_KEYS.push(formattedKey);
    res.status(200).json({ success: true, message: `เพิ่มคีย์ ${formattedKey} สำเร็จ!`, keys: DATABASE_KEYS });
});

// API สำหรับลบคีย์ออกผ่านหน้าเว็บ
app.post('/api/keys/delete', (req, res) => {
    const { keyToDelete } = req.body;
    if (!keyToDelete) {
        return res.status(400).json({ success: false, message: "ไม่พบคีย์ที่ต้องการลบ" });
    }

    DATABASE_KEYS = DATABASE_KEYS.filter(k => k !== keyToDelete.trim());
    res.status(200).json({ success: true, message: "ลบคีย์ออกจากระบบสำเร็จ!", keys: DATABASE_KEYS });
});

// -------------------------------------------------------------
// [ระบบตรวจสอบคีย์ของโปรแกรม Electron]
// -------------------------------------------------------------

// API เส้นทางหลักที่แอป Electron จะเข้ามายิงเพื่อตรวจสอบสิทธิ์คีย์
app.post('/api/verify', (req, res) => {
    const { key } = req.body;

    if (!key) {
        return res.status(400).json({
            success: false,
            message: "กรุณาระบุรหัสคีย์เพื่อตรวจสอบสิทธิ์"
        });
    }

    const isKeyValid = DATABASE_KEYS.includes(key.trim());

    if (isKeyValid) {
        return res.status(200).json({
            success: true,
            message: "ยืนยันสิทธิ์สำเร็จ ยินดีต้อนรับเข้าสู่ระบบ"
        });
    } else {
        return res.status(403).json({
            success: false,
            message: "รหัสคีย์ไม่ถูกต้อง ไม่ได้รับอนุญาตให้เข้าใช้งาน"
        });
    }
});

// 🎨 ฟังก์ชันสร้างหน้าตาเว็บ HTML UI แผงควบคุมธีม ดำ-ม่วงนีออน (REVEZY STYLE)
function generateDashboardHTML() {
    return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>REVEZY ULTRA CORE - KEY MANAGER</title>
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&family=Poppins:wght@400;600&display=swap" rel="stylesheet">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', 'Kanit', sans-serif; }
            body { background-color: #0b0c10; color: #ecf0f1; padding: 40px 20px; display: flex; justify-content: center; }
            .container { width: 100%; max-width: 700px; background: #1f2833; padding: 30px; border-radius: 16px; box-shadow: 0 8px 32px 0 rgba(138, 43, 226, 0.2); border: 1px solid #45f3ff33; }
            h1 { font-size: 24px; font-weight: 600; color: #a144f3; text-shadow: 0 0 10px rgba(161,68,243,0.5); text-align: center; margin-bottom: 5px; }
            .subtitle { font-size: 13px; color: #45f3ff; text-align: center; margin-bottom: 25px; letter-spacing: 1px; }
            .form-group { display: flex; gap: 10px; margin-bottom: 25px; }
            input { flex: 1; background: #0b0c10; border: 1px solid #45f3ff55; padding: 12px 15px; border-radius: 8px; color: #fff; font-size: 15px; outline: none; transition: 0.3s; }
            input:focus { border-color: #a144f3; box-shadow: 0 0 8px rgba(161,68,243,0.4); }
            button { background: linear-gradient(45deg, #a144f3, #45f3ff); border: none; color: #0b0c10; font-weight: 600; padding: 0 25px; border-radius: 8px; cursor: pointer; font-size: 15px; transition: 0.3s; }
            button:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(69,243,255,0.4); }
            .key-list-title { font-size: 16px; font-weight: 600; color: #fff; margin-bottom: 12px; display: flex; justify-content: space-between; border-bottom: 1px solid #333; padding-bottom: 8px; }
            .key-item { display: flex; justify-content: space-between; align-items: center; background: #131921; padding: 14px 18px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #a144f3; transition: 0.2s; }
            .key-item:hover { background: #18202a; transform: scale(1.01); }
            .key-text { font-family: 'Courier New', Courier, monospace; font-weight: 600; color: #45f3ff; font-size: 15px; }
            .btn-delete { background: #ff4757; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 400; }
            .btn-delete:hover { background: #ff6b81; box-shadow: 0 0 10px rgba(255,71,87,0.4); transform: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>REVEZY ULTRA CONTROL PANEL</h1>
            <div class="subtitle">ระบบจัดการคีย์หลังบ้านสำหรับแอปพลิเคชัน</div>
            
            <div class="form-group">
                <input type="text" id="keyInput" placeholder="พิมพ์หรือเจนคีย์ใหม่ที่นี่... (เช่น REVEZY-XYZ-123)">
                <button onclick="addKey()">เพิ่มคีย์ระบบ</button>
            </div>

            <div class="key-list-title">
                <span>🔑 รายการคีย์ที่เปิดใช้งานอยู่</span>
                <span id="keyCount" style="color: #45f3ff">0 คีย์</span>
            </div>
            <div id="keyList"></div>
        </div>

        <script>
            // โหลดข้อมูลคีย์เมื่อเปิดหน้าเว็บ
            async function fetchKeys() {
                try {
                    const res = await fetch('/api/keys');
                    const data = await res.json();
                    if(data.success) {
                        renderKeys(data.keys);
                    }
                } catch(err) { alert('ไม่สามารถเชื่อมต่อดึงข้อมูลคีย์ได้'); }
            }

            function renderKeys(keys) {
                const list = document.getElementById('keyList');
                document.getElementById('keyCount').innerText = keys.length + ' คีย์';
                list.innerHTML = '';
                
                keys.forEach(key => {
                    list.innerHTML += \`
                        <div class="key-item">
                            <span class="key-text">\${key}</span>
                            <button class="btn-delete" onclick="deleteKey('\${key}')">ลบออก</button>
                        </div>
                    \`;
                });
            }

            async function addKey() {
                const input = document.getElementById('keyInput');
                const newKey = input.value.trim();
                if(!newKey) return;

                const res = await fetch('/api/keys/add', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ newKey })
                });
                const data = await res.json();
                
                if(res.ok) {
                    input.value = '';
                    renderKeys(data.keys);
                } else {
                    alert(data.message);
                }
            }

            async function deleteKey(keyToDelete) {
                if(!confirm('คุณแน่ใจไหมที่จะลบคีย์นี้: ' + keyToDelete)) return;

                const res = await fetch('/api/keys/delete', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ keyToDelete })
                });
                const data = await res.json();
                
                if(res.ok) {
                    renderKeys(data.keys);
                } else {
                    alert(data.message);
                }
            }

            // รันระบบโหลดคีย์ทันทีเมื่อเปิดหน้าเว็บ
            fetchKeys();
        </script>
    </body>
    </html>
    `;
}

// 🎯 ส่งออกโมดูลแอปตัวนี้ไปให้ Vercel Serverless
module.exports = app;
