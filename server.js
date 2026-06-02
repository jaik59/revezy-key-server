const express = require('express');
const axios = require('axios');
const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', (req, res) => {
    res.send('🚀 FiveM Tactical OS API Online!');
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

        // ตรวจสอบว่าเป็น Cfx Code หรือ IP:Port
        if (serverIp.includes('cfx.re/join/') || !serverIp.includes(':')) {
            const endpointCode = serverIp.split('/').pop(); 
            const response = await axios.get(`https://servers-frontend.cfx.re/api/servers/single/${endpointCode}`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                timeout: 6000
            });
            rawPlayers = response.data.Data.players || [];
            infoData = { 
                vars: response.data.Data.vars || {},
                maxClients: response.data.Data.maxclients,
                resourcesCount: response.data.Data.resources ? response.data.Data.resources.length : 0,
                icon: response.data.Data.icon || null,
                banner: response.data.Data.vars?.banner_connecting || null
            };
        } else {
            const playersResponse = await axios.get(`http://${serverIp}/players.json`, { timeout: 5000 });
            const infoResponse = await axios.get(`http://${serverIp}/info.json`, { timeout: 5000 }).catch(() => null);
            const dynamicResponse = await axios.get(`http://${serverIp}/dynamic.json`, { timeout: 5000 }).catch(() => null);
            
            rawPlayers = playersResponse.data || [];
            infoData = {
                vars: infoResponse ? infoResponse.data.vars : {},
                maxClients: dynamicResponse ? dynamicResponse.data.maxclients : (infoResponse ? infoResponse.data.maxclients : '??'),
                resourcesCount: infoResponse && infoResponse.data.resources ? infoResponse.data.resources.length : 0,
                icon: infoResponse ? infoResponse.data.icon : null,
                banner: infoResponse && infoResponse.data.vars ? infoResponse.data.vars.banner_connecting : null
            };
        }

        // คัดแยก ประมวลผล และวิเคราะห์พฤติกรรมข้อมูลผู้เล่น (Core Core Data)
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

            // ระบบสแกนหา Admin คีย์เวิร์ด
            const adminKeywords = ['admin', 'staff', 'mod', 'helper', 'owner', 'developer', 'st |', 'แอดมิน', 'ทีมงาน', 'ผู้ดูแล'];
            const isAdmin = adminKeywords.some(kw => name.toLowerCase().includes(kw));

            // ระบบสแกนหา Streamer คีย์เวิร์ด
            const streamerKeywords = ['live', 'stream', 'streamer', 'yt', 'tt', 'ch', 'ยูทูป', 'สตรีม'];
            const isStreamer = streamerKeywords.some(kw => name.toLowerCase().includes(kw));

            return {
                id: player.id,
                name: name,
                ping: parseInt(player.ping) || 0,
                steamHex: steamHex,
                discordId: discordId,
                license: license,
                isAdmin: isAdmin,
                isStreamer: isStreamer
            };
        });

        res.json({
            players: processedPlayers,
            info: infoData
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'ล้มเหลว: ไม่สามารถติดต่อฐานข้อมูลปลายทางได้ หรือระบุที่อยู่ผิดพลาด' });
    }
});

module.exports = app;
