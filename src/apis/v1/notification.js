
const bodyParser = require('body-parser')
const db = require('../../db')
const emailSender = require('../../approaches/email')
const router = require('express').Router()

router.post("/email", bodyParser.raw({ type: 'html' }), async (req, res) => {
    let from = req.query.from
    let to = req.query.to
    let subject = req.query.subject
    let content = req.body

    let info = await emailSender.send(from, to, subject, content)
    await db.email.recordEmailSent(null, from, to, subject, content)

    console.log('Email message sent: %s', info.messageId)

    res.send(info)
})

router.get('/email', async (req, res) => {
    let userEmailAddress = req.query.email
    let timePeriod = req.query.start && req.query.end ?
        { start: new Date(req.query.start), end: new Date(req.query.end) } : null

    let records = await db.email.listEmailSentByEmail(userEmailAddress, timePeriod)

    res.send({
        records: records,
        timePeriod: timePeriod
    })
})

module.exports = router