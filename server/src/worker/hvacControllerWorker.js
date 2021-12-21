const ThingSpeakClient = require('thingspeakclient')
const _ = require('lodash')
const { readCurrentTemperature } = require('../helpers/temperature')
const { delay } = require('../helpers/util')
const AirCondition = require('../helpers/aircondition')
const moment = require('moment')

const MIN_STATE_TIME = 1000 * 60 * 15 // 20 minutes
let temperatureSet = _.isNumber(process.argv[2]) ? Number(process.argv[2]) : Number(process.env.DEFAULT_TEMPERATURE)
let onlyMonitoring = true
let airConditionClient
let thingSpeakClient
let exit = false
let power = 0
let lastChange = 0

process.on('message', ({ type, value }) => {
  switch (type) {
    case 'SET_TEMPERATURE':
      temperatureSet = Number(value)
      process.send(`The temperature is set to ${value}°C`)
      break
    case 'SET_MONITORING':
      onlyMonitoring = value
      process.send(`The onlyMonitoring is set to ${value}`)
      break
    case 'EXIT':
      exit = true
      process.send('The worker will exit soon')
      break
    default:
      process.send(`Unknown message type: ${type}`)
  }
})

const init = async () => {
  process.send('Worker initialization...')
  process.send(`Temperature is set to ${temperatureSet}°C`)
  airConditionClient = new AirCondition()
  const status = await airConditionClient.getStatus()
  if (status) {
    process.send(`Aircondition is online, initial status: ${JSON.stringify(status)}`)
    lastChange = Date.now()
    if (status.properties.power === 'on') {
      power = 1
    } else {
      power = 0
    }
  } else {
    power = 0
  }

  thingSpeakClient = new ThingSpeakClient()
  thingSpeakClient.attachChannel(1602965, { writeKey: 'U2RG7MRT9WOZ7TMI' }, (err, res) => {
    if (err) {
      process.send(`Thingspeak is offline: ${err}`)
    } else {
      process.send('Thingspeak is online')
    }
  })

  process.send(`Initial state:
    temperatureSet = ${temperatureSet}
    onlyMonitoring = ${onlyMonitoring}
    exit = ${exit}
    power = ${power}
    lastChange = ${new Date(lastChange).toISOString()}`)
  process.send('Worker initialization is finished')
}

const run = async () => {
  // eslint-disable-next-line no-unmodified-loop-condition
  while (!exit) {
    process.send('---- Iteration started ----')
    process.send(`Actual state:
    temperatureSet = ${temperatureSet}
    onlyMonitoring = ${onlyMonitoring}
    exit = ${exit}
    power = ${power}
    lastChange = ${new Date(lastChange).toISOString()}`)
    const tempC = await readCurrentTemperature()
    if (tempC) {
      process.send(`It's ${tempC}°C currently`)
    } else {
      process.send('Failed to read temperature')
    }

    if (!onlyMonitoring) {
      if (Date.now() - lastChange > MIN_STATE_TIME) {
        process.send('Min state time is over.')

        process.send(`Evaluation 1:
        power === 1 => ${power === 1}
        Number(${tempC}) > Number(${temperatureSet} + 0.4) => ${Number(tempC) > temperatureSet + 0.4}`)
        if (power === 1 && (Number(tempC) > temperatureSet + 0.4)) {
          // start shutdown period
          process.send('Air condition power OFF 1')
          await airConditionClient.updateAirConditionStatus(Math.round(temperatureSet), 0)
          power = 0
          lastChange = Date.now()
          process.send('Air condition power OFF')
        }

        process.send(`Evaluation 2:
        power === 0 => ${power === 0}
        Number(${tempC}) < Number(${temperatureSet} - 0.4) => ${Number(tempC) < temperatureSet - 0.4}`)
        if (power === 0 && (Number(tempC) < temperatureSet - 0.4)) {
          // start heating period
          process.send('Air condition power ON 1')
          await airConditionClient.updateAirConditionStatus(Math.round(temperatureSet + 1.4), 1)
          power = 1
          lastChange = Date.now()
          process.send(`Air condition power ON with ${Math.round(temperatureSet + 1.4)} °C`)
        }
      } else {
        process.send(`${moment.duration(MIN_STATE_TIME - (Date.now() - lastChange)).humanize()} left from min state time.`)
      }
    }

    const remaining = MIN_STATE_TIME - (Date.now() - lastChange) > 0 ? Math.round((MIN_STATE_TIME - (Date.now() - lastChange)) / 1000) : 0
    const thinkSpeakObject = {
      field4: onlyMonitoring ? 1 : 0,
      field5: remaining
    }
    const status = await airConditionClient.getStatus()
    process.send(`Aircondition actual status: ${JSON.stringify(status)}`)
    if (tempC) {
      thinkSpeakObject.field1 = tempC
    }
    if (status) {
      thinkSpeakObject.field2 = status.properties.power === 'on' ? 1 : 0
      thinkSpeakObject.field3 = status.properties.temperature
      power = status.properties.power === 'on' ? 1 : 0
    }

    thingSpeakClient.updateChannel(1602965, thinkSpeakObject, function (err, resp) {
      if (err) {
        process.send(`Thinkspeak update failed: : ${err}`)
      }
      if (!err && resp > 0) {
        process.send(`Thinkspeak update successfully. Entry number was: : ${resp}`)
      }
    })
    process.send('Iteration finished')
    await delay(60000)
  }
}

process.on('uncaughtException', err => {
  process.send(`Got an uncaughtException: ${err}`)
  process.exit(1)
})
process.on('unhandledRejection', err => {
  process.send(`Got an  unhandledRejection: ${err}`)
  process.exit(1)
})

init()
  .then(() => {
    run()
  })
  .then(() => {
    process.send('Process finished without problem')
  })
  .catch(err => {
    process.send(`Process finished with error: ${err}`)
  })
