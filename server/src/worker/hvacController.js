const { fork } = require('child_process')
const path = require('path')

const DEFAULT_TEMPERATURE = 21
let worker

const setTemperature = (temperature) => {
  _sendMessageWorker({ type: 'SET_TEMPERATURE', value: temperature })
}

const setMonitoring = (onlyMonitoring) => {
  _sendMessageWorker({ type: 'SET_MONITORING', value: onlyMonitoring })
}

const exitWorker = () => {
  _sendMessageWorker({ type: 'EXIT' })
}

const _sendMessageWorker = (message) => {
  if (worker) {
    worker.send(message)
  } else {
    console.log('No worker found')
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
    console.log('Worker message: ', message)
  })
}

module.exports = {
  run,
  setTemperature,
  setMonitoring,
  exitWorker
}
