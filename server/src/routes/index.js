import express from 'express'
const hvacController = require('../worker/hvacController')
const { models } = require('../database/database')

const routes = express.Router()

routes.get('/', (req, res) => {
  res.status(200).json({ message: 'Ok' })
})

routes.get('/settings/:id', async (req, res) => {
  const result = await models.Hvac.findByPk(req.params.id)
  if (result) {
    res.status(200).json(result.dataValues)
  } else {
    res.status(400).send('Settings not found')
  }
})

routes.put('/settings/:id', async (req, res) => {
  try {
    const data = {
      controllerMode: req.body.controllerMode
    }
    if (req.body.setRoomTemperature) {
      data.setRoomTemperature = Number(req.body.setRoomTemperature)
    }

    const result = await models.Hvac.update(
      data,
      { where: { id: req.params.id } }
    )
    hvacController.updateSettings(data)
    res.status(200).json(result)
  } catch (e) {
    res.status(400).send('Failed to update')
  }
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
