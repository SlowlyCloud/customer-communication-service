const express = require('express')
require('express-async-errors')
const config = require('./config')
const { getFiles } = require('./common')
const app = express()

// config
const apisFolderName = 'apis'
const port = config.server.port
const basePath = config.server.basePath

// load & register all routers by their relative path
var path = require('path').join(__dirname, apisFolderName)
getFiles(path).forEach(file => {
  let apiPath = file.replace(path, '').replace('.js', '')
  console.log(`loading file:${file} & registering path of route ${apiPath}`);
  app.use(basePath + apiPath, require(file))
})

app.listen(port, () => {
  console.log(`Customer Communication Service Started on Port ${port} with Base Path ${basePath}`)
})