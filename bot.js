require("dotenv").config();
const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, WebhookClient } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const timeoutDuration = 1 * 60 * 1000; // 1 นาที
const allowedLinkChannels = ['1295722077407674429', '1353692814684454974', '1295491082834022462']; // ห้องที่อนุญาตให้ส่งลิงก์
const forbiddenWords = ["พ่อ", "มึง", "ตาย", "แม่", "พ่อง", "มุง" , "ควย" , "หี" , "กระหรี่" , "เหี้ย" , "หลี่" ];
const messageCache = new Map();
const isLink = (msg) => /(https?:\/\/[^\s]+)/g.test(msg);

// URL ของ Webhook
const webhookClient = new WebhookClient({
  url: 'https://discord.com/api/webhooks/1355212615235932406/fHKnoetVz00Vgxa1XZhsiKIliTlbKIeLFV1CdRjAE5bQCUOw5fIo1HYCOx8FHIO8r8AJ'
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ฟังก์ชันส่งข้อความไปยัง Webhook
async function sendToWebhook(username, reason) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('🚨 ผู้ใช้ถูก Timeout')
      .setColor('RED')
      .setDescription(`**${username}** ถูกหมดเวลา\n📌 **เหตุผล:** ${reason}`)
      .setTimestamp();

    await webhookClient.send({
      content: 'เหตุการณ์ Timeout ของผู้ใช้',
      embeds: [embed], // แนบ Embed ที่สร้างขึ้น
    });

    console.log('✅ ข้อความถูกส่งผ่าน Webhook');
  } catch (error) {
    console.error('❌ ไม่สามารถส่งข้อความผ่าน Webhook ได้:', error);
  }
}

// ฟังก์ชัน Timeout ผู้ใช้ + แจ้งเตือนห้อง Log
async function timeoutUser(member, reason, logChannel) {
  const username = member.user.tag; // ชื่อผู้ใช้ (เช่น 'User#1234')

  try {
    if (!member.moderatable) return;
    await member.timeout(timeoutDuration, reason); // Timeout 1 นาที

    // ส่งข้อความผ่าน Webhook
    await sendToWebhook(username, reason);

    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle("🚨 สมาชิกถูก Timeout")
        .setColor("RED")
        .setDescription(`**${username}** ถูก Timeout เป็นเวลา **1 นาที**\n📌 **เหตุผล:** ${reason}`)
        .setTimestamp();

      logChannel.send({ embeds: [embed] });
    }
  } catch (error) {
    console.error(`❌ ไม่สามารถ Timeout ${member.user.tag}:`, error);
  }
}

// ตรวจจับข้อความ
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const logChannel = message.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
  const userId = message.author.id;
  const content = message.content.toLowerCase();
  const isLinkMessage = isLink(content);
  const containsForbiddenWord = forbiddenWords.some(word => content.includes(word));

  // ❌ กันส่งลิงก์ในห้องที่ไม่อนุญาต (ยกเว้นแอดมิน)
  if (isLinkMessage && !allowedLinkChannels.includes(message.channel.id) && 
      !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages) && 
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    await message.delete();
    await timeoutUser(message.member, "ส่งลิงก์ต้องห้ามในห้องที่ไม่อนุญาต", logChannel);
    return message.channel.send(`${message.author} 🚫 ห้ามส่งลิงก์ในห้องนี้!`).then(msg => setTimeout(() => msg.delete(), 3000));
  }

  // ❌ กันคำต้องห้าม
  if (containsForbiddenWord) {
    await message.delete();
    await timeoutUser(message.member, "ใช้คำพูดต้องห้าม", logChannel);
    return message.channel.send(`${message.author} 🚫 ห้ามใช้คำพูดไม่เหมาะสม!`).then(msg => setTimeout(() => msg.delete(), 3000));
  }

  // ❌ กันสแปม (ข้อความซ้ำ 2 ครั้งติด)
  if (!messageCache.has(userId)) {
    setTimeout(() => messageCache.delete(userId), 30 * 60 * 1000); // ลบข้อความแคชหลัง 30 นาที
    messageCache.set(userId, content);
  } else {
    const lastMessage = messageCache.get(userId);
    if (lastMessage === content) {
      await message.delete();
      await timeoutUser(message.member, "สแปมข้อความซ้ำ", logChannel);
      return message.channel.send(`${message.author} ถูก Timeout เนื่องจากสแปม`).then(msg => setTimeout(() => msg.delete(), 3000));
    }
    messageCache.set(userId, content);
  }
});

// รันบอท
client.login(process.env.TOKEN);
