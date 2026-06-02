const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// 🛡️ เปิดใช้งาน Stealth Plugin เพื่อหลบการตรวจจับบอท (หลบ WebDriver Detection)
puppeteer.use(StealthPlugin());

const app = express();
app.use(express.json());

// ข้อมูลจำลองฐานข้อมูลบัญชีบอท (ในระบบจริงต้องดึงจาก Database)
// คุกกี้ (Cookie) ต้องได้มาจากการสแกนเก็บ Session ตอนที่บอทล็อกอินไว้แล้ว
const BOT_ACCOUNTS = [
    {
        botId: "bot_01",
        username: "ไก่ชนสายซิ่ง",
        cookies: [{ name: "sessionid", value: "YOUR_BOT_SESSION_ID_1", domain: ".tiktok.com" }]
    },
    {
        botId: "bot_02",
        username: "สมชายหัวใจสลัด",
        cookies: [{ name: "sessionid", value: "YOUR_BOT_SESSION_ID_2", domain: ".tiktok.com" }]
    }
];

/**
 * 📡 API Endpoint สำหรับสั่งบอทไปรุมกดติดตาม
 * BODY: { "targetUsername": "target_user_id" }
 */
app.post('/api/follow', async (req, res) => {
    const { targetUsername } = req.body;

    if (!targetUsername) {
        return res.status(400).json({ success: false, message: "กรุณาระบุ targetUsername" });
    }

    console.log(`[🚀 SYSTEM] เริ่มสั่งการบอทจำนวน ${BOT_ACCOUNTS.length} ตัว ไปที่เป้าหมาย: @${targetUsername}`);
    
    // สั่งให้บอททำงานแบบขนาน (Parallel) เพื่อความรวดเร็ว
    const tasks = BOT_ACCOUNTS.map(bot => runFollowTask(bot, targetUsername));
    const results = await Promise.all(tasks);

    const successCount = results.filter(r => r.success).length;

    res.json({
        success: true,
        summary: `สั่งการบอทสำเร็จ ${successCount}/${BOT_ACCOUNTS.length} ตัว`,
        details: results
    });
});

/**
 * 🤖 Engine ควบคุมบอทรายตัวให้ทำงานเบื้องหลัง
 */
async function runFollowTask(bot, targetUsername) {
    // โหมดสายโหด: ห้ามใช้ลูกตาทำงาน (headless: true) และจำลองความละเอียดหน้าจอมือถือ
    const browser = await puppeteer.launch({
        headless: true, 
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            // '--proxy-server=http://IP:PORT' // 🌐 ในชีวิตจริง "ต้อง" ใส่ Proxy แยกรายไอดีบอทตรงนี้!
        ]
    });

    try {
        const page = await browser.newPage();
        
        // 1. จำลอง User-Agent ให้เป็นมือถือ Android รุ่นยอดนิยมเพื่อความเนียน
        await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36');
        await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

        // 2. ยัดคุกกี้ Session ของบอทตัวนั้นๆ เข้าไปเพื่อข้ามหน้าล็อกอิน
        await page.setCookie(...bot.cookies);

        // 3. สั่งบอทเดินทางไปที่หน้าโปรไฟล์เป้าหมาย
        console.log(`[🤖 ${bot.botId}] กำลังเดินทางไปหน้าโปรไฟล์ @${targetUsername}`);
        await page.goto(`https://www.tiktok.com/@${targetUsername}`, { waitUntil: 'networkidle2', timeout: 30000 });

        // 4. ⏳ หน่วงเวลาสุ่ม (Humanize Delay) 2-4 วินาที ทำตัวเหมือนมนุษย์กำลังเลื่อนอ่านโปรไฟล์
        const randomDelay = Math.floor(Math.random() * 2000) + 2000;
        await new Promise(resolve => setTimeout(resolve, randomDelay));

        // 5. ค้นหาปุ่มกดติดตาม (Follow Button) โดยใช้ Selector ยุทธวิธี
        // หมายเหตุ: Selector ของ TikTok จะเปลี่ยนบ่อยมาก ต้องคอยอัปเดต
        const followSelector = 'button[data-e2e="follow-button"]';
        const isButtonExist = await page.$(followSelector);

        if (!isButtonExist) {
            throw new Error("ไม่พบปุ่มกดติดตาม (อาจจะกดไปแล้ว หรือหน้าเว็บเปลี่ยนคลาส)");
        }

        // 6. บอททำการลั่นไกคลิกขวับไปที่ปุ่มติดตาม
        await page.click(followSelector);
        console.log(`[✅ ${bot.botId}] ลั่นไกกดติดตามเรียบร้อย!`);

        // หน่วงเวลาอีกนิดก่อนปิดหน้าต่างเพื่อเซฟสถานะข้อมูลส่งไปเซิร์ฟเวอร์
        await new Promise(resolve => setTimeout(resolve, 1500));

        await browser.close();
        return { botId: bot.botId, success: true, message: "Followed successfully" };

    } catch (error) {
        console.error(`[🚨 ERROR - ${bot.botId}]:`, error.message);
        await browser.close();
        return { botId: bot.botId, success: false, error: error.message };
    }
}

// เปิด Server พิกัดพอร์ต 5000
app.listen(5000, () => {
    console.log("=========================================");
    console.log("📡 TACTICAL TIKTOK AUTO-FOLLOW API ONLINE");
    console.log("RUNNING ON: http://localhost:5000");
    console.log("=========================================");
});
