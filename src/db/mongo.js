const { MongoClient } = require('mongodb')
const deasync = require('deasync')
const config = require('../config')

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

const mongodbClose = async () => {
    await client.close();
}

module.exports = {
    db: db,
    client: client,
    closeMongo: mongodbClose
}
