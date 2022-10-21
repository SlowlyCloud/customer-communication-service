const express = require('express')
require('express-async-errors')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const log = require('./logging')
const config = require('./config')
const { getFiles } = require('./common')
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

// authorization
app.get('/verify', async (req, res, next) => {
  const token = (req.get('Authorization') || '').replace('Bearer ', '')
  if (!token) return res.status(403).send("Access Denied")
  const decoded = await new Promise((res, rej) => {
    jwt.verify(token, kepPem, {
      algorithms: config.server.auth.algorithm,
      audience: config.server.auth.audience,
      issuer: config.server.auth.issuer
    }, (err, decoded) => {
      decoded ? res(decoded) : (() => {
        err.statusCode = 403
        rej(err)
      })()
    })
  })
  req.jwt = decoded
  log.trace('inbound request verified, token: %s, payload: %s', token, decoded)
  res.send(decoded)
  next()
})

app.use(bodyParser.json())

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
