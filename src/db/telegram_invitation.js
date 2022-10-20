const log = require('../logging')
const { db } = require('./mongo')
const { Meta } = require('../common')

const table = 'telegram_invitaiton'

const isExpired = date => new Date().getTime() > new Date(date).getTime()

const cleanExpiredCode = async (code) => {
  let old = await db.collection(table).findOne({ '_id': code })
  let cleaned = old && isExpired(old.expiredAt) ?
    db.collection(table).deleteOne(old) : false
  log.trace('telegram_invitaiton cleaning expired code, code: %s old: %s cleaned: %s', code, old, cleaned)
  return cleaned
}


// lifeDuration: number of second
module.exports.save = async (code, link, lifeDuration) => {
  await cleanExpiredCode(code)
  let res = await db.collection(table).insertOne({
    _id: code,
    invitaitonLink: link,
    state: 'unconfirmed',
    chatId: '',
    expiredAt: new Date().getTime() + lifeDuration * 1000,
    meta: new Meta()
  })
  log.trace('telegram_invitaiton saved tg invitaion, code: %s link: %s lifeDuration: %s res: %s', code, link, lifeDuration, res)
  return res
}

module.exports.confirm = async (code, chatId) => {
  let cleaned = await cleanExpiredCode(code)
  if (cleaned) throw new Error(`The telegram invitation code ${code} is invalid or expired`)

  let res = await db
    .collection(table)
    .updateOne({
      '_id': code
    }, {
      $set: {
        'state': 'confirmed',
        'chatId': chatId,
        'meta.updatedAt': new Date()
      },
      $inc: { 'meta.version': 1 }
    })
  log.trace('telegram_invitaiton confirmed, code: %s chatId: %s res: %s', code, chatId, res)
  return res
}

module.exports.findOneByCode = async (code) => {
  let cleaned = await cleanExpiredCode(code)
  if (cleaned) throw new Error(`The telegram invitation code ${code} is invalid or expired`)

  let res = await db
    .collection(table)
    .findOne({ '_id': code })
  log.trace('telegram_invitaiton finded one by code, code: %s res: %s', code, res)
  return res
}