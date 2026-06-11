const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express();

app.use(cors());
app.use(express.json());

// เชื่อมต่อ Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ฟังก์ชันเช็ควันหมดอายุ
function isKeyExpired(expiresAt) {
    if (expiresAt === "Permanent") return false;
    const nowInTH = new Date().toISOString().split('T')[0];
    return nowInTH > expiresAt;
}

// -------------------------------------------------------------
// [API Endpoints] เชื่อมต่อ Supabase
// -------------------------------------------------------------

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(generateProDashboardHTML());
});

app.get('/api/keys', async (req, res) => {
    const { data, error } = await supabase.from('license_keys').select('*');
    if (error) return res.status(500).json({ success: false, message: error.message });
    
    const updatedKeys = data.map(k => ({
        key: k.key_code,
        expiresAt: k.expires_at,
        isActive: k.is_active,
        suspendReason: k.suspend_reason,
        isExpired: isKeyExpired(k.expires_at)
    }));
    res.status(200).json({ success: true, keys: updatedKeys });
});

app.post('/api/keys/add', async (req, res) => {
    const { newKey, keyType, customDays } = req.body;
    if (!newKey) return res.status(400).json({ success: false, message: "กรุณาระบุคีย์" });

    let expiresAt = "Permanent";
    if (keyType === "custom") {
        const d = new Date(Date.now() + (parseInt(customDays) * 24 * 60 * 60 * 1000));
        expiresAt = d.toISOString().split('T')[0];
    }
    
    const { error } = await supabase.from('license_keys').insert([{ 
        key_code: newKey.trim(), 
        expires_at: expiresAt, 
        is_active: true, 
        suspend_reason: "" 
    }]);
    
    if (error) return res.status(400).json({ success: false, message: "มีคีย์นี้อยู่แล้ว" });
    res.status(200).json({ success: true, message: "เพิ่มคีย์สำเร็จ" });
});

app.post('/api/keys/delete', async (req, res) => {
    const { keyToDelete } = req.body;
    await supabase.from('license_keys').delete().eq('key_code', keyToDelete.trim());
    res.status(200).json({ success: true });
});

app.post('/api/keys/toggle-status', async (req, res) => {
    const { keyToToggle, reason } = req.body;
    const { data: k } = await supabase.from('license_keys').select('is_active').eq('key_code', keyToToggle.trim()).single();
    
    const newStatus = !k.is_active;
    await supabase.from('license_keys').update({ 
        is_active: newStatus, 
        suspend_reason: newStatus ? "" : (reason || "ไม่ได้ระบุสาเหตุ") 
    }).eq('key_code', keyToToggle.trim());
    
    res.status(200).json({ success: true });
});

app.post('/api/verify', async (req, res) => {
    const { key } = req.body;
    const { data: k } = await supabase.from('license_keys').select('*').eq('key_code', key.trim()).single();
    
    if (!k) return res.status(403).json({ success: false, message: "คีย์ไม่ถูกต้อง" });
    if (!k.is_active) return res.status(403).json({ success: false, message: "คีย์ถูกระงับ" });
    if (isKeyExpired(k.expires_at)) return res.status(403).json({ success: false, message: "คีย์หมดอายุ" });
    
    res.status(200).json({ success: true, message: "ยืนยันสำเร็จ" });
});

// -------------------------------------------------------------
// [หน้า HTML Dashboard]
// -------------------------------------------------------------
function generateProDashboardHTML() {
    return `<!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Revezy Core — Key Management</title>
        <style>
            :root { --bg-main: #06080d; --card-bg: rgba(18, 20, 28, 0.7); --border-color: rgba(255, 255, 255, 0.08); --primary: #9d4edd; --primary-hover: #7b2cbf; --text-main: #f8fafc; --text-muted: #94a3b8; --success: #10b981; --danger: #ef4444; --warning: #f59e0b; }
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
            body { background-color: var(--bg-main); color: var(--text-main); padding: 40px 20px; display: flex; justify-content: center; min-height: 100vh; }
            .wrapper { width: 100%; max-width: 900px; }
            .main-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; padding: 30px; margin-bottom: 24px; backdrop-filter: blur(12px); }
            input, select { background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; color: white; width: 100%; margin-bottom: 10px; }
            .btn { background: var(--primary); color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; width: 100%; }
            .btn:hover { background: var(--primary-hover); }
            .key-code { font-family: monospace; color: #a78bfa; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 12px; border-bottom: 1px solid var(--border-color); text-align: left; }
            .hidden { display: none; }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="main-card">
                <h2>Revezy Core Dashboard</h2>
                <input type="text" id="keyInput" placeholder="รหัสคีย์">
                <select id="keyType" onchange="toggleCustomDays()">
                    <option value="custom">กำหนดวัน</option>
                    <option value="permanent">ถาวร</option>
                </select>
                <div id="customDaysGroup"><input type="number" id="customDays" value="30"></div>
                <button class="btn" onclick="addKey()">สร้างคีย์</button>
            </div>
            <div class="main-card">
                <table>
                    <thead><tr><th>คีย์</th><th>หมดอายุ</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
                    <tbody id="keyTableBody"></tbody>
                </table>
            </div>
        </div>
        <script>
            function toggleCustomDays() {
                const type = document.getElementById('keyType').value;
                document.getElementById('customDaysGroup').classList.toggle('hidden', type === 'permanent');
            }
            async function loadKeys() {
                const res = await fetch('/api/keys');
                const data = await res.json();
                const tbody = document.getElementById('keyTableBody');
                tbody.innerHTML = data.keys.map(k => \`
                    <tr>
                        <td class="key-code">\${k.key}</td>
                        <td>\${k.expiresAt}</td>
                        <td>\${k.isActive ? '✅ Active' : '❌ Suspended'}</td>
                        <td><button onclick="deleteKey('\${k.key}')">ลบ</button></td>
                    </tr>
                \`).join('');
            }
            async function addKey() {
                const payload = { newKey: document.getElementById('keyInput').value, keyType: document.getElementById('keyType').value, customDays: document.getElementById('customDays').value };
                const res = await fetch('/api/keys/add', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
                if(res.ok) loadKeys();
            }
            async function deleteKey(keyToDelete) {
                await fetch('/api/keys/delete', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ keyToDelete }) });
                loadKeys();
            }
            loadKeys();
        </script>
    </body>
    </html>`;
}

module.exports = app;
