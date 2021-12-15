const ThingSpeakClient = require('thingspeakclient')
const _ = require('lodash')
const { readCurrentTemperature } = require('../helpers/temperature')
const { delay } = require('../helpers/util')
const AirCondition = require('../helpers/aircondition')
const moment = require('moment')

const MIN_STATE_TIME = 1000 * 60 * 10 // 20 minutes

let temperatureSet = _.isNumber(process.argv[2]) ? process.argv[2] : process.env.DEFAULT_TEMPERATURE
console.log(`Actual temperature is set: ${temperatureSet}°C`)
let exit = false
let power = 0
let lastChange = 0

const airConditionClient = new AirCondition()
airConditionClient.getStatus()
  .then((status) => {
    process.send(`Aircondition actual status: ${JSON.stringify(status)}`)
    if (status) {
      lastChange = Date.now()
      if (status.properties.power === 'on') {
        power = 1
      } else {
        power = 0
      }
    } else {
      power = 0
    }
  })

const client = new ThingSpeakClient()
client.attachChannel(1602965, { writeKey: 'U2RG7MRT9WOZ7TMI' }, (err, res) => {
  if (err) {
    process.send(err)
  } else {
    process.send('Thingspeak is ok')
  }
})

process.send(`Worker started with args ${process.argv}`)
process.send(`Worker started with env ${JSON.stringify(process.env)}`)
process.send(`Temperature is set to ${temperatureSet}°C`)

process.on('message', ({ type, value }) => {
  switch (type) {
    case 'SET_TEMPERATURE':
      temperatureSet = value
      process.send(`The temperature is set to ${value}°C`)
      break
    case 'EXIT':
      exit = true
      process.send('The worker will exit soon')
      break
    default:
      console.log(`Unknown message type: ${type}`)
      process.send(`Unknown message type: ${type}`)
  }
})

const run = async () => {
  // eslint-disable-next-line no-unmodified-loop-condition
  while (!exit) {
    const tempC = await readCurrentTemperature()
    if (tempC) {
      console.log(`It's ${tempC}°C currently`)
      process.send(`It's ${tempC}°C currently`)
    } else {
      process.send('Failed to read temperature')
    }

    if (Date.now() - lastChange > MIN_STATE_TIME) {
      process.send('Min state time is over.')
      if (power && tempC > temperatureSet + 0.4) {
        // start shutdown period
        await airConditionClient.updateAirConditionStatus(Math.round(temperatureSet), 0)
        power = 0
        lastChange = Date.now()
        process.send('Air condition power OFF')
      }
      if (!power && tempC < temperatureSet - 0.4) {
        // start heating period
        await airConditionClient.updateAirConditionStatus(Math.round(temperatureSet + 1.4), 1)
        power = 1
        lastChange = Date.now()
        process.send(`Air condition power ON with ${Math.round(temperatureSet + 1.4)} °C`)
      }
    } else {
      process.send(`${moment.duration(Date.now() - lastChange).humanize()} left from min state time.`)
    }

    const thinkSpeakObject = {}
    const status = await airConditionClient.getStatus()
    process.send(`Aircondition actual status: ${JSON.stringify(status)}`)
    if (tempC) {
      thinkSpeakObject.field1 = tempC
    }
    if (status) {
      thinkSpeakObject.field2 = status.properties.power === 'on' ? 1 : 0
    }

    client.updateChannel(1602965, thinkSpeakObject, function (err, resp) {
      if (err) {
        console.log(err)
      }
      if (!err && resp > 0) {
        process.send('Thinkspeak update successfully. Entry number was: ' + resp)
      }
    })
    await delay(60000)
  }
}

process.on('uncaughtException', err => {
  console.log('Got an uncaughtException', err)
  process.exit(1)
})
process.on('unhandledRejection', err => {
  console.log('Got an  unhandledRejection', err)
  process.exit(1)
})

run()
  .then(() => {
    console.log('Process finished without problem')
    process.send('Process finished without problem')
  })
  .catch(err => {
    console.error('Process finished with error: ', err)
  })
