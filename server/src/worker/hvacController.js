const debug = require('debug')('hvac-controller')
const { fork } = require('child_process')
const path = require('path')
const { models } = require('../database/database')

const DEFAULT_TEMPERATURE = 21
let worker

const updateSettings = (settings) => {
  debug(`Settings updated: ${settings}`)
  if (settings.setRoomTemperature) {
    _sendMessageWorker({ type: 'SET_TEMPERATURE', value: settings.setRoomTemperature })
  }
  _sendMessageWorker({ type: 'SET_MONITORING', value: settings.setOnlyMonitoring })
}

const exitWorker = () => {
  _sendMessageWorker({ type: 'EXIT' })
}

const _sendMessageWorker = (message) => {
  if (worker) {
    worker.send(message)
  } else {
    debug('No worker found')
  }
}

const run = async () => {
  const hvac = await models.Hvac.findByPk(1)
  worker = fork(
    path.resolve(__dirname, 'hvacControllerWorker.js'),
    [hvac.dataValues.setRoomTemperature, hvac.dataValues.setOnlyMonitoring],
    {
      env: {
        DEFAULT_TEMPERATURE
      },
      execArgv: ['--preserve-symlinks'],
      stdio: 'pipe'
    }
  )

  worker.on('message', async (message) => {
    if (message.type === 'STATUS_UPDATE') {
      await models.Hvac.update(
        message.data,
        { where: { id: 1 } }
      )
    }
    debug('Worker message: ', message)
  })

  worker.stdout.on('data', (data) => {
    debug('Worker stdout: ', data.toString('utf8'))
  })

  worker.stderr.on('data', (data) => {
    debug('Worker stderr: ', data.toString('utf8'))
  })

  worker.on('exit', (code) => {
    debug('Worker exit with code: ', code)
  })
}

module.exports = {
  run,
  updateSettings,
  exitWorker
}
