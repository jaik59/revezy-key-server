const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ฐานข้อมูลจำลอง (ในอนาคตควรต่อกับ MySQL/Redis ของ Server เกม)
let serverState = {
    players: [
        { id: 1, name: "Admin_Beam", isAdmin: true, ping: 12, isCheating: false },
        { id: 42, name: "Potential_Hacker", isAdmin: false, ping: 150, isCheating: true }
    ],
    lastScan: Date.now()
};

// 1. API: ดึงรายชื่อผู้เล่นทั้งหมด (สำหรับ Dashboard)
app.get('/api/monitor/players', (req, res) => {
    res.json({ success: true, data: serverState.players });
});

// 2. API: ตรวจสอบสถานะการฉีดโปร (รับข้อมูลจาก Script ในเกม)
app.post('/api/monitor/report', (req, res) => {
    const { playerId, isCheating, reason } = req.body;
    const player = serverState.players.find(p => p.id === playerId);
    
    if (player) {
        player.isCheating = isCheating;
        player.cheatReason = reason;
        return res.json({ success: true, message: "Report updated" });
    }
    res.status(404).json({ success: false, message: "Player not found" });
});

// 3. API: สั่ง Kick/Ban ผู้เล่น
app.post('/api/monitor/action', (req, res) => {
    const { playerId, action } = req.body;
    // ตรงนี้คุณต้องเขียน Code เชื่อมกับ RCON หรือ Remote Command ของเซิร์ฟเวอร์
    console.log(`Action: ${action} on Player ID: ${playerId}`);
    res.json({ success: true, message: `Command ${action} sent to server` });
});

app.listen(3000, () => console.log('Monitor API running on port 3000'));
