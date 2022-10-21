const { resolve } = require('path');
const { readdirSync } = require('fs');
const deasync = require('deasync')

module.exports.Meta = class Meta {
    constructor() {
        this.createdAt = new Date()
        this.updatedAt = null
        this.deletedAt = null
        this.version = 0
    }
}

const getFiles = (dir) => {
    const dirents = readdirSync(dir, { withFileTypes: true })
    const files = dirents.map((dirent) => {
        const res = resolve(dir, dirent.name)
        return dirent.isDirectory() ? getFiles(res) : res
    })
    return Array.prototype.concat(...files)
}
module.exports.getFiles = getFiles

module.exports.authCode = (length = 8) => {
    return Math.random().toString(36).substring(2, length + 2);
}

module.exports.toSyncFn = (asyncFn) => {
    let done = false
    let res = undefined
    asyncFn()
        .then((v) => {
            res = v
            done = true
        })
        .catch((e) => {
            done = true
            throw e
        })
    deasync.loopWhile(() => !done)
    return res
}

module.exports.sleep = (ms) => deasync.sleep(ms)

