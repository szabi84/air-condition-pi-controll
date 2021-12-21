const debug = require('debug')('hvac-controller')
const { fork } = require('child_process')
const path = require('path')

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
