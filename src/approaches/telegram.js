const TelegramBot = require('node-telegram-bot-api')
const config = require('../config')
const { tg } = require('../db')

// Config
const tgAuth = {
  name: config.telegramServer.bot.username,
  token: config.telegramServer.bot.token
}

const bot = new TelegramBot(tgAuth.token, { polling: true })

module.exports.getBotUserName = () => tgAuth.name

// Mode:  'Markdown' | 'MarkdownV2' | 'HTML'
module.exports.sentMsg = async (chatId, content, mode) => {
  return await bot.sendMessage(chatId, content, {
    parse_mode: mode || "Markdown"
  })
}

module.exports.generateInvitingLink = (bindingId) => {
  return `https://t.me/${tgAuth.name}` + (bindingId ? `?start=${bindingId}` : '')
}

module.exports.onChatStart = (cb) => {
  bot.onText(/\/start/, (msg) => cb(msg))
}