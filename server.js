const express = require('express');
const axios = require('axios');
const app = express();

// ใส่ค่าของคุณลงไปที่นี่ได้เลย
const BIN_ID = 'ใส่_BIN_ID_ของคุณตรงนี้'; 
const X_MASTER_KEY = 'ใส่_MASTER_KEY_ของคุณตรงนี้';

app.use(express.json());

// ฟังก์ชันดึงข้อมูลจาก JSONBin
async function getKeys() {
    try {
        const res = await axios.get(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: { 'X-Master-Key': X_MASTER_KEY }
        });
        return res.data.record.keys || [];
    } catch (error) {
        return [];
    }
}

// ฟังก์ชันบันทึกข้อมูลไป JSONBin
async function saveKeys(keys) {
    await axios.put(`https://api.jsonbin.io/v3/b/${BIN_ID}`, { keys }, {
        headers: { 'X-Master-Key': X_MASTER_KEY, 'Content-Type': 'application/json' }
    });
}

// หน้า UI จัดการคีย์ (Dark Mode / Glassmorphism)
app.get('/', async (req, res) => {
    const keys = await getKeys();
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-zinc-950 text-white p-5 font-mono">
        <div class="max-w-md mx-auto bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-2xl">
            <h1 class="text-xl font-bold mb-6 text-cyan-400 uppercase tracking-widest text-center">REVEZY ADMIN</h1>
            <div class="space-y-2 mb-6 h-64 overflow-y-auto">
                ${keys.map(k => `
                    <div class="p-3 bg-black rounded-lg border border-zinc-800 flex justify-between items-center text-sm">
                        <span>${k}</span>
                        <button onclick="removeKey('${k}')" class="text-red-500 hover:text-red-400">ลบ</button>
                    </div>
                `).join('')}
            </div>
            <div class="flex gap-2">
                <input id="k" placeholder="ใส่คีย์ใหม่..." class="w-full bg-black p-3 rounded-lg border border-zinc-700 outline-none focus:border-cyan-500">
                <button onclick="addKey()" class="px-4 bg-cyan-600 rounded-lg hover:bg-cyan-500 font-bold">ADD</button>
            </div>
        </div>
        <script>
            async function addKey(){
                const key = document.getElementById('k').value;
                if(!key) return;
                await fetch('/api/add?key=' + key);
                location.reload();
            }
            async function removeKey(key){
                await fetch('/api/remove?key=' + key);
                location.reload();
            }
        </script>
    </body>
    </html>`);
});

// API ตรวจสอบคีย์
app.get('/api/verify', async (req, res) => {
    const keys = await getKeys();
    const isExists = keys.includes(req.query.key);
    res.json({ success: isExists, message: isExists ? "Authorized" : "Invalid Key" });
});

// API เพิ่มคีย์
app.get('/api/add', async (req, res) => {
    const keys = await getKeys();
    const newKey = req.query.key;
    if (newKey && !keys.includes(newKey)) {
        keys.push(newKey);
        await saveKeys(keys);
    }
    res.send('Success');
});

// API ลบคีย์
app.get('/api/remove', async (req, res) => {
    let keys = await getKeys();
    keys = keys.filter(k => k !== req.query.key);
    await saveKeys(keys);
    res.send('Success');
});

module.exports = app;
