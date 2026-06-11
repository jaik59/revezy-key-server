const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// --- ส่วนของหน้า UI ---
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <title>เติมเงินอั่งเปา</title>
    </head>
    <body class="bg-gray-900 flex items-center justify-center h-screen">
        <div class="bg-gray-800 p-8 rounded-2xl shadow-2xl w-96 text-white border border-gray-700">
            <h2 class="text-2xl font-bold mb-4 text-center text-red-400">เติมเงิน TrueMoney</h2>
            <input type="text" id="link" placeholder="วางลิงก์ซองอั่งเปาที่นี่" class="w-full p-3 bg-gray-700 rounded-lg mb-4 outline-none border border-gray-600 focus:border-red-500">
            <button onclick="submit()" id="btn" class="w-full bg-red-600 p-3 rounded-lg font-bold hover:bg-red-700 transition">ยืนยันการเติม</button>
            <p id="msg" class="mt-4 text-center text-sm"></p>
        </div>
        <script>
            async function submit() {
                const link = document.getElementById('link').value;
                const msg = document.getElementById('msg');
                msg.innerText = "กำลังดำเนินการ...";
                const res = await fetch('/api/redeem', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ link })
                });
                const data = await res.json();
                msg.innerText = data.message;
            }
        </script>
    </body>
    </html>
    `);
});

// --- ส่วนของ API Backend ---
app.post('/api/redeem', (req, res) => {
    const { link } = req.body;
    
    // ตรงนี้คือจุดที่คุณต้องนำ Library (เช่น truemoney-wallet-api) มาใส่
    console.log(`ได้รับลิงก์: ${link}`);

    if (!link || !link.includes('gift.truemoney.com')) {
        return res.status(400).json({ success: false, message: "ลิงก์ไม่ถูกต้อง!" });
    }

    // [จำลองการทำงาน]
    res.json({ success: true, message: "✅ เติมเงินสำเร็จ! ยอดเข้าสู่ระบบเรียบร้อย" });
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));
