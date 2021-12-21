const debug = require('debug')('app')
const express = require('express')
const bodyParser = require(')body-parser')
const config = require(')config')
const routes = require(')./routes')
const hvacController = require(')./worker/hvacController')

const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use('/', routes)

hvacController.run()

const port = process.env.PORT || config.server.port
app.listen(port)
debug('Node + Express REST API skeleton server started on port: ' + port)

module.exports = app
