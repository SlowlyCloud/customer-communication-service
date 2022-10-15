const db = require('../../db')
const tgBot = require('../../approaches/telegram')
const { authCode } = require('../../common')
const router = require('express').Router()

router.get('/invitation-link', async (req, res) => {
  let indate = req.query.indate
  let code = authCode(6)
  let link = tgBot.generateInvitingLink(code)

  await db.tgInvitation.save(code, link, indate)

  res.send({
    invitationLink: link,
    invitaitonCode: code,
    indate: indate,
    serverTime: new Date(),
  })
})

router.get('/invitation/:code', async (req, res) => {
  let code = req.params.code
  res.send(await db.tgInvitation.findOneByCode(code))
})

router.post(`/webhook/${tgBot.getBotUserName()}`, (req, res) => {
  tgBot.handleReqFromWebhook(req.body)
  res.sendStatus(200)
})

tgBot.onChatStart((msg) => {
  console.log(msg)
  let regex = /^\/start ([0-9a-zA-Z]{6}$)/
  let code = regex.exec(msg.text)[1]
  console.log('code: ' + code)
  db.tgInvitation.confirm(code, msg.chat.id)
})


module.exports = router