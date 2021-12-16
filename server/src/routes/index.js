import express from 'express'
const hvacController = require('../worker/hvacController')

const routes = express.Router()

routes.get('/', (req, res) => {
  res.status(200).json({ message: 'Ok' })
})

routes.post('/settemp', (req, res) => {
  const temperature = req.body.temperature
  if (!temperature) {
    res.status(400).json({ message: 'temperature is required and number' })
  }
  hvacController.setTemperature(temperature)
  res.status(200).json({ message: 'Ok' })
})

routes.post('/setmonitoring', (req, res) => {
  const monitoring = req.body.onlyMonitoring
  if (monitoring === undefined) {
    res.status(400).json({ message: 'temperature is required and number' })
  }
  hvacController.setMonitoring(monitoring)
  res.status(200).json({ message: 'Ok' })
})

routes.post('/exitworker', (req, res) => {
  hvacController.exitWorker()
  res.status(200).json({ message: 'Ok' })
})

routes.post('/startworker', (req, res) => {
  hvacController.run(23)
  res.status(200).json({ message: 'Ok' })
})

routes.use(function (req, res) {
  return res.status(404).send({
    success: false,
    message: 'Resource not found.'
  })
})

module.exports = routes
