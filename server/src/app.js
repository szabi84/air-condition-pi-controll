import express from 'express'
import bodyParser from 'body-parser'
import config from 'config'
import routes from './routes'
import hvacController from './worker/hvacController'

const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use('/', routes)

hvacController.run()

const port = process.env.PORT || config.server.port
app.listen(port)
console.log('Node + Express REST API skeleton server started on port: ' + port)

module.exports = app
