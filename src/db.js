const { MongoClient } = require('mongodb')
const deasync = require('deasync')
const { Meta } = require('./common')
const config = require('./config')

const client = new MongoClient(config.database.mongo.uri)
let db = null
let loaded = false

const init = async () => {
    try {
        // Connect the client to the server (optional starting in v4.7)
        await client.connect();
        // Establish and verify connection
        await client.db("admin").command({ ping: 1 });
        db = await client.db(config.database.mongo.name)
        console.log("Connected successfully to server");
    } catch (e) {
        await mongodbClose()
        throw new Error('mongo starting failed: %s', e)
    } finally {
        loaded = true
    }
}
init()
while (!loaded) { deasync.sleep(50) }

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

const mongodbClose = async () => {
    await client.close();
}

module.exports.close = mongodbClose