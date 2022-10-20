const log = require('../logging')
const config = require('../config')
const emailer = require('nodemailer')

// Config
const emailAuth = {
  host: config.emailServer.host,
  user: config.emailServer.user,
  pass: config.emailServer.pass
}

const transporter = emailer.createTransport({
  host: emailAuth.host,
  secure: true,
  auth: {
    user: emailAuth.user,
    pass: emailAuth.pass
  }
})

log.trace('email transport created', emailAuth)

module.exports.send = async (from, to, subject, content) => {
  let req = {
    from: from,
    to: to,
    subject: subject,
    html: content
  }
  
  log.trace('email sending', req)
  let res = await transporter.sendMail(req)
  log.trace('email sent', res)
  return res
}