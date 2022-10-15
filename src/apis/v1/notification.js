
const bodyParser = require('body-parser')
const db = require('../../db')
const emailSender = require('../../approaches/email')
const tgBot = require('../../approaches/telegram')
const router = require('express').Router()

router.post("/email", bodyParser.raw({ type: 'html' }), async (req, res) => {
    let from = req.query.from
    let to = req.query.to
    let subject = req.query.subject
    let content = req.body

    let info = await emailSender.send(from, to, subject, content)
    await db.notifyingLog.logEmailNotifying(null, from, to, subject, content)

    console.log('Email message sent: %s', info.messageId)

    res.send(info)
})

router.get('/email', async (req, res) => {
    let userEmailAddress = req.query.email
    let timePeriod = req.query.start && req.query.end ?
        { start: new Date(req.query.start), end: new Date(req.query.end) } : null

    let records = await db.notifyingLog.listNotifyingByEmail(userEmailAddress, timePeriod)

    res.send({
        records: records,
        timePeriod: timePeriod
    })
})

router.post("/tg", bodyParser.raw({ type: 'html' }), async (req, res) => {
    let chatId = req.query.chatId
    let content = req.body

    let info = await tgBot.sentMsg(chatId, content, 'HTML')
    await db.notifyingLog.logTgBotNotifying(null, chatId, content)

    console.log('tg message sent: %s', info)

    res.send(info)
})

router.get('/tg', async (req, res) => {
    let chatId = req.query.chatId
    let timePeriod = req.query.start && req.query.end ?
        { start: new Date(req.query.start), end: new Date(req.query.end) } : null

    let records = await db.notifyingLog.listNotifyingByTgChatId(chatId, timePeriod)

    res.send({
        records: records,
        timePeriod: timePeriod
    })
})

module.exports = router