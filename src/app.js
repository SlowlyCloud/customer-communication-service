const express = require('express')
require('express-async-errors')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const log = require('./logging')
const config = require('./config')
const { getDirs } = require('./common')
const app = express()

// config
const apisFolderName = 'apis'
const port = config.server.port
const basePath = config.server.basePath
const kepPem = Buffer.from(config.server.auth.privateKey, 'base64')

app.use((req, res, next) => {
  log.debug({
    direction: 'inbound',
    req: req
  })
  res.on("finish", () => log.debug({
    direction: 'outbound',
    res: res
  }))
  next()
})

app.get("/token", (req, res) => {
  res.send(
    jwt.sign(
      { key: 'value' },
      kepPem,
      {
        algorithm: config.server.auth.algorithm,
        expiresIn: 30
      }
    )
  )
})

app.use(bodyParser.json())

// load & register all routers by their relative path
var path = require('path').join(__dirname, apisFolderName)
log.info('start loading router from path: %s ...', path)
getDirs(path, '2', 1).filter(v => /.*\/v[0-9]{1}$/.test(v)).forEach(moduleDir => {
  let apiPath = basePath + moduleDir.replace(path, '')
  log.info('module: %s loading...', moduleDir)
  app.use(apiPath, require(moduleDir))
  log.info('registered path of router: %s', apiPath)
})
getDirs(path, '1', 1).forEach(file => {
  let apiPath = basePath + file.replace(path, '').replace('.js', '')
  log.info('file: %s loading...', file)
  app.use(apiPath, require(file))
  log.info('registered path of router: %s', apiPath)
})

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).send(err.message)
  log.error({
    err: err,
    req: req,
    res, res
  })
  next()
})

app.listen(port, () => {
  log.info(`Customer Communication Service Started on Port ${port} with Base Path ${basePath}`)
})
