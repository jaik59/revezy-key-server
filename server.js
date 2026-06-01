const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// --- ตั้งค่า ID ต่างๆ ---
const CATEGORY_ID = '1510122713249874090'; 
const ADMIN_ROLE_ID = '1509887559063572571'; 
const LOG_CHANNEL_ID = '1510125398153887874'; // ห้องแจ้งเตือนแอดมิน

client.on('ready', () => console.log(`[SYSTEM] ʜᴠᴇᴢʀ ꜱᴛᴏʀᴇ บอทออนไลน์แล้ว!`));

// 1. ส่ง Embed เมนูบริการ BOOST FPS
client.on('messageCreate', async (message) => {
    if (message.content === '!menu') {
        const embed = new EmbedBuilder()
            .setTitle('⚡ ʜᴠᴇᴢʀ ꜱᴛᴏʀᴇ - BOOST FPS SERVICE')
            .setDescription('ยินดีต้อนรับสู่ร้าน ʜᴠᴇᴢʀ ꜱᴛᴏʀᴇ\nกรุณาเลือกความสำคัญเพื่อเริ่มรับบริการปรับแต่ง FPS ของคุณ')
            .setColor(0x7289da)
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/684/684908.png') // ใส่รูปโลโก้ร้าน
            .setFooter({ text: 'ʜᴠᴇᴢʀ ꜱᴛᴏʀᴇ - คุณภาพที่คุณสัมผัสได้' });

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_priority')
                .setPlaceholder('เลือกระดับความเร่งด่วน')
                .addOptions([
                    { label: 'ธรรมดา (ปกติ)', value: 'normal', emoji: '✅' },
                    { label: 'กลาง (คิวพิเศษ)', value: 'medium', emoji: '⏩' },
                    { label: 'เร่งด่วน (ทันที)', value: 'urgent', emoji: '🚨' },
                ])
        );
        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// 2. ระบบสร้างตั๋วและแจ้งเตือนหลังบ้าน
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    const priority = interaction.values[0];
    const user = interaction.user;

    // สร้างห้องตั๋ว
    const channel = await interaction.guild.channels.create({
        name: `fps-${user.username}`,
        type: ChannelType.GuildText,
        parent: CATEGORY_ID,
        permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
            { id: ADMIN_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
        ]
    });

    // แจ้งเตือนแอดมิน (หลังบ้าน)
    const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
        const logEmbed = new EmbedBuilder()
            .setTitle('🔔 มีคำขอใช้บริการใหม่!')
            .setColor(0xFFFF00)
            .addFields(
                { name: 'ลูกค้า', value: `${user.tag}`, inline: true },
                { name: 'ระดับความสำคัญ', value: `${priority.toUpperCase()}`, inline: true },
                { name: 'ห้องที่เปิด', value: `${channel}`, inline: true }
            )
            .setTimestamp();
        logChannel.send({ content: `<@&${ADMIN_ROLE_ID}>`, embeds: [logEmbed] });
    }

    // ข้อความในตั๋ว
    const ticketEmbed = new EmbedBuilder()
        .setTitle('⚡ ʜᴠᴇᴢʀ ꜱᴛᴏʀᴇ | Ticket Support')
        .setDescription(`สวัสดีคุณ ${user} ทีมงานได้รับคำขอ **BOOST FPS (${priority.toUpperCase()})** ของคุณแล้ว กรุณารอสักครู่ แอดมินจะมาดำเนินการให้ครับ`)
        .setColor(0x7289da);

    const closeBtn = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('close_ticket').setLabel('ปิดการสนทนา').setStyle(ButtonStyle.Danger)
    );

    await channel.send({ content: `<@&${ADMIN_ROLE_ID}>`, embeds: [ticketEmbed], components: [closeBtn] });
    await interaction.reply({ content: `✅ สร้างตั๋วเรียบร้อยแล้วที่ ${channel}`, ephemeral: true });
});

// 3. ปิดตั๋ว
client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        await interaction.reply('กำลังปิดห้องใน 5 วินาที...');
        setTimeout(() => interaction.channel.delete(), 5000);
    }
});

client.login('MTUxMDEyNDA4MjEyMzc3MTkwNA.GMJ981.HtmtkVQwqGUWgFapeIW-yUdlQfsa587-AsV8Zs');
