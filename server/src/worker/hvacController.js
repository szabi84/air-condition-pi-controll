const { fork } = require('child_process')
const path = require('path')
const { debug } = require('nodemon/lib/utils')

const DEFAULT_TEMPERATURE = 21
let worker

const updateSettings = (settings) => {
  debug(`Settings updated: ${settings}`)
  if (settings.temperature) {
    _sendMessageWorker({ type: 'SET_TEMPERATURE', value: settings.temperature })
  }
  if (settings.onlyMonitoring !== undefined) {
    _sendMessageWorker({ type: 'SET_MONITORING', value: settings.onlyMonitoring })
  }
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

const run = (setTemperature) => {
  worker = fork(
    path.resolve(__dirname, 'hvacControllerWorker.js'),
    [setTemperature],
    {
      env: {
        DEFAULT_TEMPERATURE
      },
      execArgv: ['--preserve-symlinks'],
      stdio: 'pipe'
    }
  )

  worker.on('message', (message) => {
    debug('Worker message: ', message)
  })
}

module.exports = {
  run,
  updateSettings,
  exitWorker
}
