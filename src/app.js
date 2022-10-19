const express = require('express')
require('express-async-errors')
const log = require('./logging')
const config = require('./config')
const { getFiles } = require('./common')
const app = express()

// config
const apisFolderName = 'apis'
const port = config.server.port
const basePath = config.server.basePath

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

// load & register all routers by their relative path
var path = require('path').join(__dirname, apisFolderName)
getFiles(path).forEach(file => {
  let apiPath = file.replace(path, '').replace('.js', '')
  log.info(`loading file:${file} & registering path of route ${apiPath}`)
  app.use(basePath + apiPath, require(file))
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
