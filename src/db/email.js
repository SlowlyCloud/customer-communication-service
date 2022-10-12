const { db } = require('./mongo')
const { Meta } = require('../common')

module.exports.recordEmailSent = async (userId, from, to, subject, content) => {
    await db.collection('email_sent_audit_log').insertOne({
        userId: userId,
        type: 'email',
        raw: {
            from: from,
            to: to,
            subject: subject,
            content: content
        },
        meta: new Meta()
    })
}

module.exports.listEmailSentByEmail = async (email, timePeriod) => {
    let filter = { 'raw.to': email }
    if (timePeriod) {
        filter['meta.createdAt'] = {
            $gte: new Date(timePeriod.start.toISOString()),
            $lt: new Date(timePeriod.end.toISOString())
        }
    }

    return await db.collection('email_sent_audit_log').find(filter).toArray()
}

module.exports.countEmailSentByEmail = async (email, timePeriod) => {
    let filter = { 'raw.to': email }
    if (timePeriod) {
        filter['meta.createdAt'] = {
            $gte: new Date(timePeriod.start.toISOString()),
            $lt: new Date(timePeriod.end.toISOString())
        }
    }

    return await db.collection('email_sent_audit_log').countDocuments(filter)
}