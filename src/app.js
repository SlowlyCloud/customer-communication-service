const express = require('express')
require('express-async-errors')
const config = require('./config')
const { getFiles } = require('./common')
const app = express()

// config
const apisFolderName = 'apis'
const port = config.server.port

app.get('/ping', (req, res) => {
  res.send('pong!')
})

// load & register all routers by their relative path
var path = require('path').join(__dirname, apisFolderName)
getFiles(path).forEach(file => {
  let apiPath = file.replace(path, '').replace('.js', '')
  console.log(`loading file:${file} & registering path of route ${apiPath}`);
  app.use(apiPath, require(file))
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})