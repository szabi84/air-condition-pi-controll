const ThingSpeakClient = require('thingspeakclient')
const _ = require('lodash')
const { readCurrentTemperature } = require('../helpers/temperature')
const { delay } = require('../helpers/util')

const client = new ThingSpeakClient()
client.attachChannel(1602965, { writeKey: 'U2RG7MRT9WOZ7TMI' }, (err, res) => {
  if (err) {
    process.send(err)
  } else {
    process.send('Thingspeak is ok')
  }
})

let temperatureSet = _.isNumber(process.argv[2]) ? process.argv[2] : process.env.DEFAULT_TEMPERATURE
console.log(`Actual temperature is set: ${temperatureSet}°C`)
let exit = false

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
      client.updateChannel(1602965, { field1: tempC }, function (err, resp) {
        if (err) {
          console.log(err)
        }
        if (!err && resp > 0) {
          process.send('Thinkspeak update successfully. Entry number was: ' + resp)
        }
      })
    } else {
      process.send('Failed to read temperature')
    }
    if (tempC > temperatureSet + 0.5) {
      // start shutdown period
    }
    if (tempC < temperatureSet - 0.5) {
      // start heating period
    }
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
