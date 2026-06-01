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
        <body style="background:#111; color:#fff; font-family:sans-serif; padding:40px;">
            <h2>REVEZY KEY MANAGER (ONLINE)</h2>
            <p>คีย์ทั้งหมดที่ใช้งานได้ในปัจจุบัน:</p>
            <ul>
                ${activeKeys.map(k => `<li><code>${k}</code></li>`).join('')}
            </ul>
            <hr style="border-color:#333;">
            <p>วิธีเพิ่มคีย์ผ่าน URL: <code>/add?key=คีย์ใหม่ที่ต้องการ</code></p>
            <p>วิธีลบคีย์ผ่าน URL: <code>/remove?key=คีย์ที่จะลบ</code></p>
        </body>
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
