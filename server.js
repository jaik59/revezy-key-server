const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// อาร์เรย์เก็บคีย์ที่สามารถใช้งานได้ (น้อง Beam สามารถเพิ่ม/ลบ/แก้ไขคีย์ตรงนี้ได้อิสระเลย!)
let activeKeys = [
    "REVEZY-FREE-9999",
    "REVEZY-VIP-BEAM",
    "REVEZY-ADMIN-TEST",
    "NOT-BOOSTER-OP"
];

app.use(express.json());

// 1. เส้นทางหน้าหลัก (แสดงสถานะเว็บสร้างคีย์แบบง่ายๆ)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                :root { --bg: #0f172a; --card: #1e293b; --accent: #38bdf8; --danger: #ef4444; --success: #22c55e; }
                body { background: var(--bg); color: #f1f5f9; font-family: 'Segoe UI', sans-serif; display: flex; justify-content: center; padding: 20px; }
                .container { background: var(--card); padding: 25px; border-radius: 24px; box-shadow: 0 15px 30px rgba(0,0,0,0.5); width: 100%; max-width: 450px; }
                h2 { text-align: center; color: var(--accent); margin-bottom: 25px; }
                .key-list { display: flex; flex-direction: column; gap: 10px; }
                .item { background: #334155; padding: 12px 20px; border-radius: 50px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #475569; }
                code { color: #fbbf24; font-weight: bold; }
                .btn { cursor: pointer; border: none; padding: 8px 16px; border-radius: 50px; font-weight: bold; transition: 0.2s; }
                .del { background: var(--danger); color: white; }
                .del:hover { opacity: 0.8; }
                .add-box { display: flex; gap: 10px; margin-top: 25px; }
                input { flex: 1; padding: 12px 20px; border-radius: 50px; border: none; background: #f1f5f9; outline: none; }
                .add-btn { background: var(--success); color: white; padding: 10px 20px; border-radius: 50px; border: none; cursor: pointer; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>REVEZY KEY MANAGER</h2>
                <div class="key-list" id="keyList">
                    ${activeKeys.map(k => `
                        <div class="item" id="key-${k}">
                            <code>${k}</code>
                            <button class="btn del" onclick="removeKey('${k}')">ลบ</button>
                        </div>
                    `).join('')}
                </div>
                <div class="add-box">
                    <input type="text" id="kInput" placeholder="พิมพ์คีย์ใหม่ที่นี่...">
                    <button class="add-btn" onclick="addKey()">เพิ่ม</button>
                </div>
            </div>

            <script>
                async function removeKey(k) {
                    await fetch('/remove?key=' + k);
                    document.getElementById('key-'+k).remove();
                }
                async function addKey() {
                    let k = document.getElementById('kInput').value;
                    if(!k) return;
                    await fetch('/add?key=' + k);
                    location.reload();
                }
            </script>
        </body>
        </html>
    `);
});

// 2. API สำหรับตรวจสอบคีย์ (ที่ตัวโปรแกรม Electron ดึงไปใช้)
app.get('/verify', (req, res) => {
    const userKey = req.query.key;
    
    if (activeKeys.includes(userKey)) {
        res.json({ success: true, message: "คีย์ผ่านการตรวจสอบสำเร็จ!" });
    } else {
        res.json({ success: false, message: "ไม่พบข้อมูลคีย์นี้ หรือคีย์อาจจะหมดอายุแล้ว" });
    }
});

// 3. ระบบสร้างคีย์เพิ่มเติมแบบกำหนดเองได้ตามใจชอบผ่านเบราว์เซอร์
app.get('/add', (req, res) => {
    const newKey = req.query.key;
    if(newKey && !activeKeys.includes(newKey)) {
        activeKeys.push(newKey);
        res.send(`เพิ่มคีย์ [ ${newKey} ] เรียบร้อยแล้ว! <a href="/">กลับหน้าหลัก</a>`);
    } else {
        res.send("คีย์ซ้ำ หรือ ไม่ได้ระบุคีย์");
    }
});

// 4. ระบบลบคีย์เมื่อหมดอายุใช้งาน
app.get('/remove', (req, res) => {
    const targetKey = req.query.key;
    if(activeKeys.includes(targetKey)) {
        activeKeys = activeKeys.filter(k => k !== targetKey);
        res.send(`ลบคีย์ [ ${targetKey} ] ออกจากระบบแล้ว! <a href="/">กลับหน้าหลัก</a>`);
    } else {
        res.send("ไม่พบคีย์ที่ต้องการลบ");
    }
});

app.listen(PORT, () => {
    console.log(`Server key system running on port ${PORT}`);
});
