const yaml = require('js-yaml')
const fs = require('fs')

const defaultEnv = 'dev'
const env = process.env.Environment || defaultEnv
const conf = yaml.load(fs.readFileSync(`configuration/${env}.yaml`))

module.exports= {...conf}


