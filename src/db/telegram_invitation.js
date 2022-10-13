const { ObjectId } = require('mongodb')
const { db } = require('./mongo')
const { Meta } = require('../common')

const table = 'telegram_invitaiton'

const findByCode = async (code) => {
  return await db.collection(table).find({ 'invitationCode': code }).toArray()
}

const deleteManyByIds = async (ids) => {
  let oids = ids.map(v => ObjectId(v))
  return await db
    .collection(table)
    .deleteMany({
      _id: {
        $in: oids
      }
    })
}

const isExpired = date => new Date().getTime() > new Date(date).getTime()

const cleanExpiredCode = async (code) => {
  let res = await findByCode(code)
  let info = await deleteManyByIds(
    res
      .filter(v => isExpired(v.expiredAt))
      .map(v => v._id)
  )
  return info.deletedCount > 0
}


// lifeDuration: number of second
module.exports.save = async (code, link, lifeDuration) => {
  await cleanExpiredCode(code)
  return await db.collection(table).insertOne({
    invitationCode: code,
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
      'invitationCode': code
    }, {
      $set: {
        'state': 'confirmed',
        'chatId': chatId,
        'meta.updatedAt': new Date()
      },
      $inc: { 'meta.version': 1}
    })
}

module.exports.findOneByCode = async (code) => {
  let cleaned = await cleanExpiredCode(code)
  if (cleaned) throw new Error(`The telegram invitation code ${code} is invalid or expired`)

  return await db
    .collection(table)
    .findOne({ 'invitationCode': code })
}