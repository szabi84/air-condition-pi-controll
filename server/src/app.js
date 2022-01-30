const path = require('path')
require('debug').enable('*')
const debug = require('debug')('app')
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const database = require('./database/database')
const config = require('config')
const routes = require('./routes')
const hvacController = require('./worker/hvacController')

const app = express()

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, '../../client/build')))

app.use('/', routes)
app.get('*', (req, res) => {
  res.sendFile(
    path.join(__dirname, '../../client/build/index.html')
  )
})

database.initialize().then(async () => {
  await hvacController.run()

  const port = process.env.PORT || config.server.port
  app.listen(port)
  debug('Node + Express REST API skeleton server started on port: ' + port)
})

module.exports = app
