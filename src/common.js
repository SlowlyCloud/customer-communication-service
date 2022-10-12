const { resolve } = require('path');
const { readdirSync } = require('fs');

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

