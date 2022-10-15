/**
 * * * * * * * * * NOTICE! * * * * * * * * * *
 * THE TG BOT SHOULD NOLY BE SINGLE INTANCE 
 * TO POLLING DATA, TO AVOID THIS 
 * RESTRICTION, SET A WEBHOOK IN CONFIG INSTEAD 
 * * * * * * * * * * * * * * * * * * * * * * *
 */

const TelegramBot = require('node-telegram-bot-api')
const config = require('../config')

// Config
const tgAuth = {
  name: config.telegramServer.bot.username,
  token: config.telegramServer.bot.token,
  webhook: config.telegramServer.bot.webhook
}

const bot = new TelegramBot(tgAuth.token, { polling: tgAuth.webhook ? false : true })

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

module.exports.handleReqFromWebhook = body => bot.processUpdate(body)
