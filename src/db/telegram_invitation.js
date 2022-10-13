const { db } = require('./mongo')
const { Meta } = require('../common')

const table = 'telegram_invitaiton'

const isExpired = date => new Date().getTime() > new Date(date).getTime()

const cleanExpiredCode = async (code) => {
  let old = await db.collection(table).findOne({ '_id': code })
  return old && isExpired(old.expiredAt) ?
    db.collection(table).deleteOne(old) : false
}


// lifeDuration: number of second
module.exports.save = async (code, link, lifeDuration) => {
  await cleanExpiredCode(code)
  return await db.collection(table).insertOne({
    _id: code,
    invitaitonLink: link,
    state: 'unconfirmed',
    chatId: '',
    expiredAt: new Date().getTime() + lifeDuration * 1000,
    meta: new Meta()
  })
}

module.exports.confirm = async (code, chatId) => {
  let cleaned = await cleanExpiredCode(code)
  if (cleaned) throw new Error(`The telegram invitation code ${code} is invalid or expired`)

  return await db
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
}

module.exports.findOneByCode = async (code) => {
  let cleaned = await cleanExpiredCode(code)
  if (cleaned) throw new Error(`The telegram invitation code ${code} is invalid or expired`)

  return await db
    .collection(table)
    .findOne({ '_id': code })
}