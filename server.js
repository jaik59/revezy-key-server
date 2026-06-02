const express = require('express');
const axios = require('axios');
const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', (req, res) => {
    res.send('🚀 FiveM Dark Tactical Proxy API Online!');
});

app.get('/api/fivem', async (req, res) => {
    let serverIp = req.query.ip;
    if (!serverIp) {
        return res.status(400).json({ error: 'กรุณาระบุ IP หรือ CFX Join Code' });
    }

    serverIp = serverIp.replace('https://', '').replace('http://', '');

    try {
        let rawPlayers = [];
        let infoData = null;

        if (serverIp.includes('cfx.re/join/') || !serverIp.includes(':')) {
            const endpointCode = serverIp.split('/').pop(); 
            const response = await axios.get(`https://servers-frontend.cfx.re/api/servers/single/${endpointCode}`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                timeout: 5000
            });
            rawPlayers = response.data.Data.players || [];
            infoData = { 
                vars: { sv_maxclients: response.data.Data.maxclients },
                icon: response.data.Data.icon || null
            };
        } else {
            const playersResponse = await axios.get(`http://${serverIp}/players.json`, { timeout: 4000 });
            const infoResponse = await axios.get(`http://${serverIp}/info.json`, { timeout: 4000 }).catch(() => null);
            rawPlayers = playersResponse.data || [];
            infoData = infoResponse ? infoResponse.data : null;
        }

        // ประมวลผลคัดแยกผู้เล่น + เช็กเงื่อนไขแอดมินล่วงหน้าจากหลังบ้าน
        const processedPlayers = rawPlayers.map(player => {
            let steamHex = "ไม่มี";
            let discordId = "ไม่มี";
            let license = "ไม่มี";
            let name = player.name || 'Unknown';

            if (player.identifiers && Array.isArray(player.identifiers)) {
                player.identifiers.forEach(id => {
                    if (id.startsWith('steam:')) steamHex = id.replace('steam:', '');
                    if (id.startsWith('discord:')) discordId = id.replace('discord:', '');
                    if (id.startsWith('license:')) license = id.replace('license:', '');
                });
            }

            // คำนิยามคีย์เวิร์ดกลุ่มแอดมิน/ทีมงาน (เพิ่มลดคำตรงนี้ได้)
            const adminKeywords = ['admin', 'staff', 'mod', 'helper', 'owner', 'developer', 'st |', 'แอดมิน', 'ทีมงาน'];
            const isAdmin = adminKeywords.some(keyword => name.toLowerCase().includes(keyword));

            return {
                id: player.id,
                name: name,
                ping: player.ping || 0,
                steamHex: steamHex,
                discordId: discordId,
                license: license,
                isAdmin: isAdmin // ยัดสถานะความโหดส่งไปหน้าบ้าน
            };
        });

        res.json({
            players: processedPlayers,
            info: infoData
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลเซิร์ฟเวอร์นี้ได้' });
    }
});

module.exports = app;
