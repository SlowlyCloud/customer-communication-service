const config = require('../config')
const emailer = require('nodemailer')

// Config
const emailAuth = {
  user: config.emailServer.user,
  pass: config.emailServer.pass
}

const transporter = emailer.createTransport({
  host: 'smtpout.secureserver.net',
  secure: true,
  auth: {
    user: emailAuth.user,
    pass: emailAuth.pass
  }
})

module.exports.send = async (from, to, subject, content) => {
  return await transporter.sendMail({
    from: from,
    to: to,
    subject: subject,
    html: content
  })
}