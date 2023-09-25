const log = require('../../logging')
const bodyParser = require('body-parser')
const db = require('../../db')
const emailSender = require('../../approaches/email')
const tgBot = require('../../approaches/telegram')
module.exports = require('express').Router()

    .post("/email", bodyParser.raw({ type: 'HTML' }), async (req, res) => {
        let from = req.query.from
        let to = req.query.to
        let subject = req.query.subject
        let content = req.body
        // Extract tags from request url params
        let tags = req.query.tags
        
        let info = await emailSender.trySendWithFallback(from, to, subject, content)
        // Load event to audit DB
        await db.notifyingLog.logEmailNotifying(null, from, to, subject, content, tags)
        log.info('Email message sent, id: %s', info.messageId)
        res.send(info)
    })

    .get('/email', async (req, res) => {
        let userEmailAddress = req.query.email
        let timePeriod = req.query.start && req.query.end ?
            { start: new Date(req.query.start), end: new Date(req.query.end) } : null

        let records = await db.notifyingLog.listNotifyingByEmail(userEmailAddress, timePeriod)

        res.send({
            count: records ? records.length : 0,
            records: records,
            timePeriod: timePeriod
        })
    })

    .post("/tg", bodyParser.raw({ type: 'HTML' }), async (req, res) => {
        let chatId = req.query.chatId
        let content = req.body

        let info = await tgBot.sentMsg(chatId, content, 'HTML')
        await db.notifyingLog.logTgBotNotifying(null, chatId, content)

        log.info('tg message sent, id: %s', info.message_id)

        res.send(info)
    })

    .get('/tg', async (req, res) => {
        let chatId = req.query.chatId
        let timePeriod = req.query.start && req.query.end ?
            { start: new Date(req.query.start), end: new Date(req.query.end) } : null

        let records = await db.notifyingLog.listNotifyingByTgChatId(chatId, timePeriod)

        res.send({
            count: records ? records.length : 0,
            records: records,
            timePeriod: timePeriod
        })
    })