const express = require('express')
const emailer = require('nodemailer')
const bodyParser = require('body-parser')
const url = require('url')
const config = require('./config')
const db = require('./db')
const app = express()

// config
const port = config.server.port
const emailAuth = {
  user: config.emailAuth.user,
  pass: config.emailAuth.pass
}

app.get('/ping', (req, res) => {
  res.send('pong!')
})

app.post("/notification/email", bodyParser.raw({ type: 'html' }), async (req, res) => {
  let to = req.query.to
  let subject = req.query.subject
  let content = req.body

  let transporter = emailer.createTransport({
    host: 'smtpout.secureserver.net',
    secure: true,
    auth: {
      user: emailAuth.user,
      pass: emailAuth.pass
    }
  })

  let info = transporter.sendMail({
    from: emailAuth.user,
    to: to,
    subject: subject,
    html: content
  })
  await db.recordEmailSent(null, emailAuth.user, to, subject, content)

  console.log('Email message sent: %s', info.messageId)

  res.send(info)
})

app.get('/statistic/user/:email/count', async (req, res) => {
  let userEmailAddress = req.params.email
  let timePeriod = req.query.start && req.query.end ?
    { start: new Date(req.query.start), end: new Date(req.query.end) } : null

  let count = await db.countEmailSentByEmail(userEmailAddress, timePeriod)

  res.send({
    count: count,
    timePeriod: timePeriod
  })
})

app.get('/notification/email', async (req, res) => {
  let userEmailAddress = req.query.email
  let timePeriod = req.query.start && req.query.end ?
    { start: new Date(req.query.start), end: new Date(req.query.end) } : null

  let records = await db.listEmailSentByEmail(userEmailAddress, timePeriod)

  res.send({
    records: records,
    timePeriod: timePeriod
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})