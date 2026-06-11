const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// -------------------------------------------------------------
// [ระบบฐานข้อมูล JSON ไฟล์] ปรับปรุงให้รองรับ Vercel (Memory Cache)
// -------------------------------------------------------------
const DB_FILE = path.join(process.cwd(), 'database.json');

// สร้างตัวแปร RAM ไว้เก็บคีย์ชั่วคราว
let memoryCache = null;

function readDB() {
    if (memoryCache !== null) {
        return memoryCache;
    }

    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            memoryCache = JSON.parse(data);
            return memoryCache;
        }
        return [];
    } catch (error) {
        console.error("❌ ไม่สามารถอ่านไฟล์ฐานข้อมูลได้:", error);
        return [];
    }
}

function writeDB(data) {
    memoryCache = data;

    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 4));
    } catch (error) {
        console.warn("⚠️ แจ้งเตือน: ระบบบันทึกข้อมูลลง RAM ชั่วคราว (Vercel Read-only environment)");
    }
}

// ฟังก์ชันช่วยเช็คว่าคีย์หมดอายุหรือยัง (อิงตามเขตเวลาประเทศไทย GMT+7)
function isKeyExpired(keyObj) {
    if (keyObj.expiresAt === "Permanent") return false;
    
    const tzOffset = 7 * 60 * 60 * 1000;
    const nowInTH = new Date(Date.now() + tzOffset);
    const todayStr = nowInTH.toISOString().split('T')[0]; 
    
    return todayStr > keyObj.expiresAt;
}

// -------------------------------------------------------------
// [API Endpoints สำหรับ Dashboard]
// -------------------------------------------------------------

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(generateProDashboardHTML());
});

app.get('/api/keys', (req, res) => {
    const db = readDB();
    const updatedKeys = db.map(k => ({
        ...k,
        isExpired: isKeyExpired(k)
    }));
    res.status(200).json({ success: true, keys: updatedKeys });
});

app.post('/api/keys/add', (req, res) => {
    const { newKey, keyType, customDays } = req.body;
    
    if (!newKey || newKey.trim() === "") {
        return res.status(400).json({ success: false, message: "กรุณาระบุรหัสคีย์" });
    }
    
    const formattedKey = newKey.trim();
    const db = readDB();

    if (db.some(k => k.key === formattedKey)) {
        return res.status(400).json({ success: false, message: "มีคีย์นี้อยู่ในระบบแล้ว" });
    }

    let expiresAt = "Permanent";
    if (keyType === "custom") {
        if (!customDays || customDays <= 0) {
            return res.status(400).json({ success: false, message: "กรุณาระบุจำนวนวันที่ถูกต้อง" });
        }
        const tzOffset = 7 * 60 * 60 * 1000;
        const targetDate = new Date(Date.now() + tzOffset + (parseInt(customDays) * 24 * 60 * 60 * 1000));
        expiresAt = targetDate.toISOString().split('T')[0];
    }

    // เพิ่มคีย์ลงฐานข้อมูล (รองรับฟิลด์ suspendReason ในอนาคต)
    db.push({ key: formattedKey, expiresAt, isActive: true, suspendReason: "" });
    writeDB(db);

    res.status(200).json({ success: true, message: "เพิ่มคีย์สำเร็จ" });
});

app.post('/api/keys/delete', (req, res) => {
    const { keyToDelete } = req.body;
    let db = readDB();
    db = db.filter(k => k.key !== keyToDelete.trim());
    writeDB(db);
    res.status(200).json({ success: true, message: "ลบคีย์สำเร็จ" });
});

// Endpoint สำหรับ ระงับ/ปลดระงับ คีย์ (เพิ่มการรับค่า reason)
app.post('/api/keys/toggle-status', (req, res) => {
    const { keyToToggle, reason } = req.body;
    let db = readDB();
    const keyIndex = db.findIndex(k => k.key === keyToToggle.trim());
    
    if (keyIndex !== -1) {
        // สลับสถานะการใช้งาน
        db[keyIndex].isActive = !db[keyIndex].isActive;
        
        // ถ้าเปลี่ยนเป็นระงับ (isActive === false) ให้บันทึกสาเหตุ
        if (!db[keyIndex].isActive) {
            db[keyIndex].suspendReason = reason && reason.trim() !== "" ? reason.trim() : "ไม่ได้ระบุสาเหตุ";
        } else {
            db[keyIndex].suspendReason = ""; // ปลดระงับแล้วให้ล้างสาเหตุทิ้ง
        }

        writeDB(db);
        res.status(200).json({ success: true, message: "อัปเดตสถานะคีย์สำเร็จ" });
    } else {
        res.status(404).json({ success: false, message: "ไม่พบคีย์ในระบบ" });
    }
});

// -------------------------------------------------------------
// [ระบบตรวจสอบคีย์เชื่อมต่อโปรแกรม Electron]
// -------------------------------------------------------------

app.post('/api/verify', (req, res) => {
    const { key } = req.body;
    if (!key) return res.status(400).json({ success: false, message: "กรุณาระบุรหัสคีย์เพื่อตรวจสอบสิทธิ์" });

    const db = readDB();
    const foundKey = db.find(k => k.key === key.trim());

    if (!foundKey) {
        return res.status(403).json({ success: false, message: "รหัสคีย์ไม่ถูกต้องในระบบ" });
    }

    // 🟢 1. ตรวจสอบว่าถูกระงับการใช้งานหรือไม่ (พร้อมแจ้งสาเหตุไปยังโปรแกรม)
    if (foundKey.isActive === false) {
        const reasonStr = foundKey.suspendReason ? ` เนื่องจาก: ${foundKey.suspendReason}` : "";
        return res.status(403).json({ 
            success: false, 
            message: `รหัสคีย์นี้ถูกระงับการใช้งานชั่วคราว${reasonStr} กรุณาติดต่อแอดมิน` 
        });
    }

    // 2. ตรวจสอบวันหมดอายุ
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

// -------------------------------------------------------------
// 🎨 หน้าตาเว็บ UI (Modern Dark & Glassmorphism)
// -------------------------------------------------------------
function generateProDashboardHTML() {
    return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Revezy Core — Key Management</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Kanit:wght@300;400;500;600&display=swap" rel="stylesheet">
        <style>
            :root {
                --bg-main: #06080d;
                --card-bg: rgba(18, 20, 28, 0.7);
                --border-color: rgba(255, 255, 255, 0.08);
                --primary: #9d4edd;
                --primary-hover: #7b2cbf;
                --text-main: #f8fafc;
                --text-muted: #94a3b8;
                --success: #10b981;
                --danger: #ef4444;
                --warning: #f59e0b;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', 'Kanit', sans-serif; }
            body { 
                background-color: var(--bg-main); 
                background-image: radial-gradient(circle at 50% 0%, rgba(157, 78, 221, 0.1) 0%, transparent 50%);
                color: var(--text-main); 
                padding: 40px 20px; 
                display: flex; 
                justify-content: center; 
                min-height: 100vh;
            }
            .wrapper { width: 100%; max-width: 900px; }
            
            /* Header */
            .header-panel { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
            .brand-title { font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px; text-shadow: 0 0 20px rgba(157, 78, 221, 0.5); }
            .brand-title span { color: var(--primary); }
            .server-status { font-size: 13px; background: rgba(16, 185, 129, 0.1); color: var(--success); padding: 6px 14px; border-radius: 30px; font-weight: 500; border: 1px solid rgba(16, 185, 129, 0.2); backdrop-filter: blur(4px); }
            
            /* Cards */
            .main-card { 
                background: var(--card-bg); 
                border: 1px solid var(--border-color); 
                border-radius: 16px; 
                padding: 30px; 
                margin-bottom: 24px; 
                backdrop-filter: blur(12px);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            }
            .section-title { font-size: 15px; font-weight: 600; color: var(--text-muted); margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 8px;}
            
            /* Form Grid */
            .control-grid { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
            .input-group { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 6px; }
            .input-group label { font-size: 13px; color: var(--text-muted); }
            
            input, select { 
                background: rgba(0, 0, 0, 0.3); 
                border: 1px solid var(--border-color); 
                border-radius: 8px; 
                padding: 12px 16px; 
                color: white; 
                font-size: 14px; 
                outline: none; 
                transition: all 0.3s; 
                width: 100%;
            }
            input:focus, select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(157, 78, 221, 0.2); }
            
            /* Buttons */
            .btn { background: linear-gradient(135deg, var(--primary), var(--primary-hover)); border: none; color: white; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px; cursor: pointer; transition: all 0.3s; height: 43px; margin-top: auto; white-space: nowrap; box-shadow: 0 4px 15px rgba(157, 78, 221, 0.3); }
            .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(157, 78, 221, 0.5); }
            .btn-secondary { background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: var(--text-main); font-size: 13px; padding: 8px 16px; border-radius: 6px; cursor: pointer; transition: 0.2s; }
            .btn-secondary:hover { background: rgba(255,255,255,0.1); }
            
            /* Table */
            .table-container { overflow-x: auto; }
            .key-table { width: 100%; border-collapse: collapse; }
            .key-table th { text-align: left; padding: 16px; font-size: 13px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border-color); background: rgba(0,0,0,0.2); }
            .key-table td { padding: 16px; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.03); vertical-align: middle; }
            .key-row:hover { background: rgba(255,255,255,0.02); }
            
            /* Badges & Texts */
            .key-code { font-family: 'Courier New', Courier, monospace; font-weight: 600; color: #a78bfa; background: rgba(167, 139, 250, 0.1); padding: 4px 8px; border-radius: 6px; border: 1px dashed rgba(167, 139, 250, 0.3); letter-spacing: 1px; }
            .badge { display: inline-flex; align-items: center; justify-content: center; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; }
            .badge-active { background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2); }
            .badge-expired { background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2); }
            .badge-perm { background: rgba(157, 78, 221, 0.1); color: #c084fc; border: 1px solid rgba(157, 78, 221, 0.2); }
            .badge-suspended { background: rgba(245, 158, 11, 0.1); color: var(--warning); border: 1px solid rgba(245, 158, 11, 0.2); text-align: left; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            
            /* Action Buttons */
            .actions { display: flex; gap: 8px; justify-content: flex-end; }
            .action-btn { background: transparent; border: 1px solid var(--border-color); color: var(--text-muted); font-size: 12px; padding: 6px 12px; border-radius: 6px; cursor: pointer; transition: 0.2s; font-weight: 500; }
            .action-btn:hover { background: rgba(255,255,255,0.1); color: white; }
            .btn-suspend:hover { border-color: var(--warning); color: var(--warning); background: rgba(245, 158, 11, 0.1); }
            .btn-delete:hover { border-color: var(--danger); color: var(--danger); background: rgba(239, 68, 68, 0.1); }
            
            /* Utility */
            .hidden { display: none !important; }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="header-panel">
                <div class="brand-title">REVEZY <span>CORE</span> <small style="font-size:12px; color:var(--text-muted); font-weight:500;">v3.0 PRO</small></div>
                <div class="server-status" id="totalStatus">🟢 System Online</div>
            </div>

            <div class="main-card">
                <div class="section-title">🔑 สร้างสิทธิ์การเข้าใช้งานใหม่</div>
                <div class="control-grid">
                    <div class="input-group" style="flex: 2;">
                        <label>รหัสคีย์ (License Key)</label>
                        <input type="text" id="keyInput" placeholder="กรอกคีย์ หรือ กดปุ่มสุ่มอัตโนมัติ">
                    </div>
                    
                    <div class="input-group">
                        <label>ประเภทอายุการใช้งาน</label>
                        <select id="keyType" onchange="toggleCustomDays()">
                            <option value="custom">กำหนดวันเอง (Days)</option>
                            <option value="permanent">ใช้งานถาวร (Lifetime)</option>
                        </select>
                    </div>

                    <div class="input-group" id="customDaysGroup">
                        <label>จำนวนวัน</label>
                        <input type="number" id="customDays" placeholder="เช่น 30" min="1" value="30">
                    </div>

                    <div class="input-group" style="flex: 0;">
                        <label>&nbsp;</label>
                        <button class="btn" onclick="addKey()">+ สร้างคีย์</button>
                    </div>
                </div>
                <button class="btn-secondary" onclick="generateRandomKey()">⚡ สุ่มคีย์อัตโนมัติ</button>
            </div>

            <div class="main-card" style="padding: 0; overflow: hidden;">
                <div class="section-title" style="padding: 24px 24px 0 24px;">🗄️ คลังข้อมูลระบบ</div>
                <div class="table-container">
                    <table class="key-table">
                        <thead>
                            <tr>
                                <th>รหัสเปิดใช้งาน (LICENSE KEY)</th>
                                <th>วันหมดอายุ (EXPIRATION)</th>
                                <th>สถานะ (STATUS)</th>
                                <th style="text-align:right;">การจัดการ (ACTIONS)</th>
                            </tr>
                        </thead>
                        <tbody id="keyTableBody">
                            </tbody>
                    </table>
                </div>
            </div>
        </div>

        <script>
            function toggleCustomDays() {
                const type = document.getElementById('keyType').value;
                const daysGroup = document.getElementById('customDaysGroup');
                if(type === 'permanent') {
                    daysGroup.classList.add('hidden');
                } else {
                    daysGroup.classList.remove('hidden');
                }
            }

            function generateRandomKey() {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                let segment1 = '', segment2 = '', segment3 = '';
                for (let i = 0; i < 4; i++) segment1 += chars.charAt(Math.floor(Math.random() * chars.length));
                for (let i = 0; i < 4; i++) segment2 += chars.charAt(Math.floor(Math.random() * chars.length));
                for (let i = 0; i < 4; i++) segment3 += chars.charAt(Math.floor(Math.random() * chars.length));
                document.getElementById('keyInput').value = \`RVZ-\${segment1}-\${segment2}-\${segment3}\`;
            }

            async function loadKeys() {
                try {
                    const res = await fetch('/api/keys');
                    const data = await res.json();
                    if(data.success) {
                        renderTable(data.keys);
                    }
                } catch(err) { console.error('Error fetching data'); }
            }

            function renderTable(keys) {
                const tbody = document.getElementById('keyTableBody');
                document.getElementById('totalStatus').innerHTML = \`🟢 Active Database: \${keys.length} Keys\`;
                tbody.innerHTML = '';

                if(keys.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:40px;">ไม่พบข้อมูลคีย์ในระบบ</td></tr>';
                    return;
                }

                keys.forEach(k => {
                    let statusBadge = '';
                    if(k.isActive === false) {
                        // 🟢 แสดงสาเหตุการระงับบน badge และทำเป็น Tooltip เมื่อเอาเมาส์ไปชี้ได้ด้วย
                        const reasonText = k.suspendReason ? `: \${k.suspendReason}` : '';
                        statusBadge = \`<span class="badge badge-suspended" title="สาเหตุ: \${k.suspendReason || 'ไม่ได้ระบุ'}">⏸️ Suspended\${reasonText}</span>\`;
                    } else if(k.isExpired) {
                        statusBadge = '<span class="badge badge-expired">🔴 Expired</span>';
                    } else if(k.expiresAt === 'Permanent') {
                        statusBadge = '<span class="badge badge-perm">♾️ Lifetime</span>';
                    } else {
                        statusBadge = '<span class="badge badge-active">🟢 Active</span>';
                    }

                    const toggleText = k.isActive ? 'ระงับคีย์' : 'ปลดระงับ';
                    const toggleColor = k.isActive ? 'btn-suspend' : 'badge-active';

                    tbody.innerHTML += \`
                        <tr class="key-row">
                            <td><span class="key-code">\${k.key}</span></td>
                            <td><span style="color:\${k.isExpired ? 'var(--danger)' : 'var(--text-muted)'}">\${k.expiresAt}</span></td>
                            <td>\${statusBadge}</td>
                            <td>
                                <div class="actions">
                                    <button class="action-btn \${toggleColor}" onclick="toggleStatus('\${k.key}', \${k.isActive})">\${toggleText}</button>
                                    <button class="action-btn btn-delete" onclick="deleteKey('\${k.key}')">ลบทิ้ง</button>
                                </div>
                            </td>
                        </tr>
                    \`;
                });
            }

            async function addKey() {
                const keyInput = document.getElementById('keyInput');
                const keyType = document.getElementById('keyType').value;
                const customDays = document.getElementById('customDays').value;
                
                const newKey = keyInput.value.trim();
                if(!newKey) return alert("กรุณาระบุคีย์");

                const payload = { newKey, keyType, customDays };

                const res = await fetch('/api/keys/add', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
                
                if(res.ok) {
                    keyInput.value = '';
                    loadKeys();
                } else {
                    const data = await res.json();
                    alert(data.message);
                }
            }

            // 🟢 ฟังก์ชันปรับปรุงใหม่: เช็คว่าถ้ากำลังจะระงับคีย์ ให้เด้ง Prompt ถามเหตุผล
            async function toggleStatus(keyToToggle, currentActive) {
                let reason = "";
                
                if (currentActive === true) {
                    reason = prompt("กรุณาระบุสาเหตุการระงับสิทธิ์คีย์นี้ (เช่น: หมดอายุความร่วมมือ, บัคสคริปต์):");
                    if (reason === null) return; // กดยกเลิก Prompt ไม่ต้องทำงานต่อ
                }

                const res = await fetch('/api/keys/toggle-status', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ keyToToggle, reason })
                });
                if(res.ok) loadKeys();
            }

            async function deleteKey(keyToDelete) {
                if(!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบคีย์นี้ออกจากระบบถาวร?')) return;
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

// Export ตัวแอปพลิเคชันสำหรับใช้งานบน Vercel
module.exports = app;
