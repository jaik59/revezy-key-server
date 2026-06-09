const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

/* 🔑 [ระบบฐานข้อมูลคีย์เริ่มต้น] กำหนดรูปแบบ { key, expiresAt: 'YYYY-MM-DD' หรือ 'Permanent' } */
let DATABASE_KEYS = [
    { key: "REVEZY-ULTRA-FREE-777", expiresAt: "Permanent" },
    { key: "REVEZY-VIP-9999-XXXX", expiresAt: "2026-12-31" },
    { key: "REVEZY-CORE-KEY-2026", expiresAt: "2026-07-15" },
    { key: "TEST-KEY-NOT-BEAM", expiresAt: "Permanent" }
];

// ฟังก์ชันช่วยเช็คว่าคีย์หมดอายุหรือยัง (อิงตามเขตเวลาประเทศไทย)
function isKeyExpired(keyObj) {
    if (keyObj.expiresAt === "Permanent") return false;
    
    // ตั้งค่าเวลาปัจจุบันอิงตาม Timezone ไทย (GMT+7)
    const tzOffset = 7 * 60 * 60 * 1000;
    const nowInTH = new Date(Date.now() + tzOffset);
    const todayStr = nowInTH.toISOString().split('T')[0]; // ได้ฟอร์แมต 'YYYY-MM-DD'
    
    return todayStr > keyObj.expiresAt;
}

// -------------------------------------------------------------
// [ระบบหน้าบ้านแผงควบคุม Dashboard สไตล์โปร]
// -------------------------------------------------------------

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(generateProDashboardHTML());
});

app.get('/api/keys', (req, res) => {
    // ปรับปรุงการส่งข้อมูล: ระบุสถานะหมดอายุให้หน้าบ้านรับรู้ด้วย
    const updatedKeys = DATABASE_KEYS.map(k => ({
        ...k,
        isExpired: isKeyExpired(k)
    }));
    res.status(200).json({ success: true, keys: updatedKeys });
});

app.post('/api/keys/add', (req, res) => {
    const { newKey, duration } = req.body;
    if (!newKey || newKey.trim() === "") {
        return res.status(400).json({ success: false, message: "กรุณาระบุรหัสคีย์" });
    }
    
    const formattedKey = newKey.trim();
    if (DATABASE_KEYS.some(k => k.key === formattedKey)) {
        return res.status(400).json({ success: false, message: "มีคีย์นี้อยู่ในระบบแล้ว" });
    }

    // คำนวณวันหมดอายุตามที่เลือกมาจากหน้าเว็บ
    let expiresAt = "Permanent";
    if (duration !== "Permanent") {
        const tzOffset = 7 * 60 * 60 * 1000;
        const targetDate = new Date(Date.now() + tzOffset + (parseInt(duration) * 24 * 60 * 60 * 1000));
        expiresAt = targetDate.toISOString().split('T')[0];
    }

    DATABASE_KEYS.push({ key: formattedKey, expiresAt });
    res.status(200).json({ success: true, message: "เพิ่มคีย์สำเร็จ" });
});

app.post('/api/keys/delete', (req, res) => {
    const { keyToDelete } = req.body;
    DATABASE_KEYS = DATABASE_KEYS.filter(k => k.key !== keyToDelete.trim());
    res.status(200).json({ success: true, message: "ลบคีย์สำเร็จ" });
});

// -------------------------------------------------------------
// [ระบบตรวจสอบคีย์เชื่อมต่อโปรแกรม Electron]
// -------------------------------------------------------------

app.post('/api/verify', (req, res) => {
    const { key } = req.body;

    if (!key) {
        return res.status(400).json({ success: false, message: "กรุณาระบุรหัสคีย์เพื่อตรวจสอบสิทธิ์" });
    }

    // ค้นหาคีย์ในระบบ
    const foundKey = DATABASE_KEYS.find(k => k.key === key.trim());

    if (!foundKey) {
        return res.status(403).json({ success: false, message: "รหัสคีย์ไม่ถูกต้องในระบบ" });
    }

    // ตรวจสอบวันหมดอายุของคีย์
    if (isKeyExpired(foundKey)) {
        return res.status(403).json({ success: false, message: `รหัสคีย์นี้หมดอายุการใช้งานแล้วเมื่อ (${foundKey.expiresAt})` });
    }

    return res.status(200).json({
        success: true,
        message: foundKey.expiresAt === "Permanent" 
            ? "ยืนยันสิทธิ์สำเร็จ (ใช้งานได้ถาวร)" 
            : `ยืนยันสิทธิ์สำเร็จ (ใช้งานได้ถึง: ${foundKey.expiresAt})`
    });
});

// 🎨 หน้าตาเว็บดีไซน์สไตล์ซอฟต์แวร์ระดับมืออาชีพ (Dark Minimalist & Premium Purple)
function generateProDashboardHTML() {
    return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Revezy Hub — Key Management</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Kanit:wght@300;400;500&display=swap" rel="stylesheet">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', 'Kanit', sans-serif; }
            body { background-color: #090a0f; color: #f1f2f6; padding: 60px 20px; display: flex; justify-content: center; -webkit-font-smoothing: antialiased; }
            .wrapper { width: 100%; max-width: 800px; }
            
            /* Header */
            .header-panel { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; border-bottom: 1px solid #1e2230; padding-bottom: 20px; }
            .brand-title { font-size: 20px; font-weight: 600; color: #ffffff; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px; }
            .brand-title span { color: #8b5cf6; }
            .server-status { font-size: 12px; background: #10b98115; color: #10b981; padding: 4px 10px; border-radius: 20px; font-weight: 500; border: 1px solid #10b98133; }
            
            /* Dashboard Card */
            .main-card { background: #12141c; border: 1px solid #1e2230; border-radius: 12px; padding: 28px; box-shadow: 0 4px 24px rgba(0,0,0,0.4); margin-bottom: 24px; }
            .section-title { font-size: 14px; font-weight: 500; color: #94a3b8; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
            
            /* Input & Select Grid */
            .control-grid { display: grid; grid-template-columns: 2fr 1fr auto; gap: 12px; margin-bottom: 12px; }
            input, select { background: #1a1d29; border: 1px solid #2e344a; border-radius: 6px; padding: 12px 14px; color: #ffffff; font-size: 14px; outline: none; transition: all 0.2s; }
            input:focus, select:focus { border-color: #8b5cf6; box-shadow: 0 0 0 2px rgba(139,92,246,0.2); }
            
            /* Action Buttons */
            .btn { background: #8b5cf6; border: none; color: #ffffff; font-weight: 500; font-size: 14px; padding: 0 20px; border-radius: 6px; cursor: pointer; transition: background 0.2s; display: inline-flex; align-items: center; justify-content: center; }
            .btn:hover { background: #7c3aed; }
            .btn-secondary { background: #1e2230; border: 1px solid #2e344a; color: #94a3b8; font-size: 12px; padding: 6px 12px; border-radius: 4px; margin-top: 8px; cursor: pointer; }
            .btn-secondary:hover { color: #fff; border-color: #475569; }
            
            /* Data Table Style */
            .key-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            .key-table th { text-align: left; padding: 12px 16px; font-size: 13px; font-weight: 500; color: #64748b; border-bottom: 1px solid #1e2230; }
            .key-table td { padding: 14px 16px; font-size: 14px; color: #e2e8f0; border-bottom: 1px solid #141722; }
            .key-row:hover { background: #161923; }
            
            /* Badges */
            .key-code { font-family: 'Courier New', Courier, monospace; font-weight: 600; color: #38bdf8; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
            .badge-active { background: #0284c715; color: #38bdf8; border: 1px solid #0284c733; }
            .badge-expired { background: #ef444415; color: #f87171; border: 1px solid #ef444433; }
            .badge-perm { background: #8b5cf615; color: #c084fc; border: 1px solid #8b5cf633; }
            
            .action-cell { text-align: right; }
            .btn-delete { background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 13px; padding: 4px 8px; border-radius: 4px; transition: all 0.2s; }
            .btn-delete:hover { color: #f87171; background: #ef444415; }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="header-panel">
                <div class="brand-title">REVEZY <span>CORE</span> <small style="font-size:12px; color:#64748b; font-weight:400;">v2.0</small></div>
                <div class="server-status" id="totalStatus">Loading Platform...</div>
            </div>

            <div class="main-card">
                <div class="section-title">ออกสิทธิ์การเข้าใช้งานใหม่</div>
                <div class="control-grid">
                    <input type="text" id="keyInput" placeholder="ระบุคีย์ระบบ หรือกดปุ่มด้านล่างเพื่อสุ่ม">
                    <select id="durationSelect">
                        <option value="1">อายุ 1 วัน (Daily)</option>
                        <option value="7">อายุ 7 วัน (Weekly)</option>
                        <option value="30">อายุ 30 วัน (Monthly)</option>
                        <option value="Permanent" selected>ใช้งานถาวร (Permanent)</option>
                    </select>
                    <button class="btn" onclick="addKey()">สร้างคีย์</button>
                </div>
                <button class="btn-secondary" onclick="generateRandomKey()">⚡ สุ่มคีย์อัตโนมัติ</button>
            </div>

            <div class="main-card" style="padding: 16px 0;">
                <div class="section-title" style="padding: 12px 28px 4px 28px;">คีย์ในคลังข้อมูลระบบ</div>
                <table class="key-table">
                    <thead>
                        <tr>
                            <th>รหัสเปิดใช้งาน (LICENSE KEY)</th>
                            <th>วันหมดอายุ (EXPIRATION)</th>
                            <th>สถานะ (STATUS)</th>
                            <th class="action-cell">การจัดการ</th>
                        </tr>
                    </thead>
                    <tbody id="keyTableBody">
                        </tbody>
                </table>
            </div>
        </div>

        <script>
            async function loadKeys() {
                try {
                    const res = await fetch('/api/keys');
                    const data = await res.json();
                    if(data.success) {
                        renderTable(data.keys);
                    }
                } catch(err) { console.error('Error fetching data'); }
            }

            function generateRandomKey() {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                let segment1 = '', segment2 = '';
                for (let i = 0; i < 4; i++) segment1 += chars.charAt(Math.floor(Math.random() * chars.length));
                for (let i = 0; i < 4; i++) segment2 += chars.charAt(Math.floor(Math.random() * chars.length));
                document.getElementById('keyInput').value = \`REVEZY-\${segment1}-\${segment2}\`;
            }

            function renderTable(keys) {
                const tbody = document.getElementById('keyTableBody');
                document.getElementById('totalStatus').innerText = 'ACTIVE KEYS: ' + keys.length;
                tbody.innerHTML = '';

                if(keys.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#64748b; padding:30px;">ไม่มีคีย์เปิดใช้งานในระบบ</td></tr>';
                    return;
                }

                keys.forEach(k => {
                    let statusBadge = '';
                    if(k.isExpired) {
                        statusBadge = '<span class="badge badge-expired">Expired</span>';
                    } else if(k.expiresAt === 'Permanent') {
                        statusBadge = '<span class="badge badge-perm">Lifetime</span>';
                    } else {
                        statusBadge = '<span class="badge badge-active">Active</span>';
                    }

                    tbody.innerHTML += \`
                        <tr class="key-row">
                            <td><span class="key-code">\${k.key}</span></td>
                            <td><span style="font-size:13px; color:\${k.isExpired ? '#f87171' : '#cbd5e1'}">\${k.expiresAt}</span></td>
                            <td>\${statusBadge}</td>
                            <td class="action-cell">
                                <button class="btn-delete" onclick="deleteKey('\${k.key}')">ลบสิทธิ์</button>
                            </td>
                        </tr>
                    \`;
                });
            }

            async function addKey() {
                const keyInput = document.getElementById('keyInput');
                const durationSelect = document.getElementById('durationSelect');
                
                const newKey = keyInput.value.trim();
                const duration = durationSelect.value;
                if(!newKey) return;

                const res = await fetch('/api/keys/add', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ newKey, duration })
                });
                
                if(res.ok) {
                    keyInput.value = '';
                    loadKeys();
                } else {
                    const data = await res.json();
                    alert(data.message);
                }
            }

            async function deleteKey(keyToDelete) {
                if(!confirm('ยืนยันที่จะถอนการสิทธิ์การใช้งานคีย์นี้หรือไม่?')) return;
                const res = await fetch('/api/keys/delete', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ keyToDelete })
                });
                if(res.ok) loadKeys();
            }

            loadKeys();
        </script>
    </body>
    </html>
    `;
}

module.exports = app;
