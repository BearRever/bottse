require("dotenv").config();
const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const timeoutDuration = 1 * 60 * 1000; // 1 นาที
const allowedLinkChannels = ['1295722077407674429', '1295919181186859081' , '1295925449792163921' , '1334480754519969896' ]; // ห้องที่อนุญาตให้ส่งลิงก์
const forbiddenWords = ["พ่อ", "มึง", "ตาย", "แม่", "พ่อง", "มุง" , "ควย" , "หี" , "กระหรี่" , "เหี้ย" , "หลี่"];
const messageCache = new Map();
const isLink = (msg) => /(https?:\/\/[^\s]+)/g.test(msg);

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ฟังก์ชัน Timeout ผู้ใช้ + แจ้งเตือนห้อง Log
async function timeoutUser(member, reason, logChannel) {
  const username = member.user.tag;

  try {
    if (!member.moderatable) return;
    await member.timeout(timeoutDuration, reason); // Timeout 1 นาที

    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle("🚨 สมาชิกถูก Timeout")
        .setColor(0xFF0000) // สีแดง
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

  // ❌ กันส่งลิงก์ในห้องที่ไม่อนุญาต
  if (isLinkMessage && !allowedLinkChannels.includes(message.channel.id) && 
      !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages) && 
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    await message.delete();
    await timeoutUser(message.member, `ข้อความที่ถูกลบ: "${message.content}"`, logChannel);
    return message.channel.send(`${message.author} 🚫 ห้ามส่งลิงก์ในห้องนี้!`).then(msg => setTimeout(() => msg.delete(), 3000));
  }

  // ❌ กันคำต้องห้าม
  if (containsForbiddenWord) {
    await message.delete();
    await timeoutUser(message.member, `ข้อความที่ถูกลบ: "${message.content}"`, logChannel);
    return message.channel.send(`${message.author} 🚫 ห้ามใช้คำพูดไม่เหมาะสม!`).then(msg => setTimeout(() => msg.delete(), 3000));
  }

  // ❌ กันสแปม (ข้อความซ้ำ 2 ครั้งติด ในห้องเดิม)
  if (!messageCache.has(userId)) {
    setTimeout(() => messageCache.delete(userId), 30 * 60 * 1000);
    messageCache.set(userId, { content, channelId: message.channel.id });
  } else {
    const lastMessageData = messageCache.get(userId);
    if (lastMessageData.content === content && lastMessageData.channelId === message.channel.id) {
      await message.delete();
      await timeoutUser(message.member, `ข้อความที่ถูกลบ: "${message.content}"`, logChannel);
      return message.channel.send(`${message.author} ถูก Timeout เนื่องจากสแปม`).then(msg => setTimeout(() => msg.delete(), 3000));
    }
    messageCache.set(userId, { content, channelId: message.channel.id });
  }
});

// รันบอท
client.login(process.env.TOKEN);

// ให้รันเว็บเซิร์ฟเวอร์ (สำหรับ Render.com)
const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;  // ถ้าไม่ได้รับ PORT จาก Render จะใช้พอร์ต 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});