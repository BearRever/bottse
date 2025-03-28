require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder().setName("untimeout").setDescription("ยกเลิก Timeout ให้สมาชิก")
    .addUserOption(option => option.setName("user").setDescription("เลือกผู้ใช้").setRequired(true)),
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("🔄 กำลังลงทะเบียนคำสั่ง...");
    await rest.put(Routes.applicationGuildCommands("YOUR_BOT_ID", process.env.GUILD_ID), { body: commands });
    console.log("✅ คำสั่งถูกลงทะเบียนเรียบร้อย!");
  } catch (error) {
    console.error(error);
  }
})();
