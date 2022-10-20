const logger = require('../logging')
const { db } = require('./mongo')
const { Meta } = require('../common')


// Commons
const log = async (userId, type, raw) => {
    let res = await db.collection('notification_audit_log').insertOne({
        userId: userId,
        type: type,
        raw: raw,
        meta: new Meta()
    })
    logger.trace('notificaition_audit_log insert one, userId: %s type: %s raw: %s res: %s', userId, type, raw, res)
    return res
}
module.exports.logNotifying = log

const list = async (filter, timePeriod) => {
    if (timePeriod) {
        filter['meta.createdAt'] = {
            $gte: new Date(timePeriod.start.toISOString()),
            $lt: new Date(timePeriod.end.toISOString())
        }
    }

    let res = await db.collection('notification_audit_log').find(filter).toArray()
    logger.trace('notificaition_audit_log list, filter: %s timePeriod: %s res: %s', filter, timePeriod, res)
    return res
}
module.exports.listNotifying = list

const count = async (filter, timePeriod) => {
    if (timePeriod) {
        filter['meta.createdAt'] = {
            $gte: new Date(timePeriod.start.toISOString()),
            $lt: new Date(timePeriod.end.toISOString())
        }
    }

    let res = await db.collection('notification_audit_log').countDocuments(filter)
    logger.trace('notificaition_audit_log list, filter: %s timePeriod: %s res: %s', filter, timePeriod, res)
    return res
}
module.exports.countNotifying = count


// For Email
module.exports.logEmailNotifying = async (userId, from, to, subject, content) => {
    return await log(userId, 'email', {
        from: from,
        to: to,
        subject: subject,
        content: content
    })
}

module.exports.listNotifyingByEmail = async (email, timePeriod) => {
    return await list({ 'raw.to': email }, timePeriod)
}

module.exports.countNotifyingByEmail = async (email, timePeriod) => {
    return await count({ 'raw.to': email }, timePeriod)
}


// For Telegram Bot
module.exports.logTgBotNotifying = async (userId, chatId, content) => {
    return await log(userId, 'tg-bot', {
        chatId: chatId,
        content: content
    })
}

module.exports.listNotifyingByTgChatId = async (chatId, timePeriod) => {
    return await list({ 'raw.chatId': chatId }, timePeriod)
}

module.exports.countNotifyingByTgChatId = async (chatId, timePeriod) => {
    return await count({ 'raw.chatId': chatId }, timePeriod)
}
