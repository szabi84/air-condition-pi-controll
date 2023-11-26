const ThingSpeakClient = require('thingspeakclient')
const _ = require('lodash')
const { readCurrentTemperature } = require('../helpers/temperature')
const { delay } = require('../helpers/util')
const AirCondition = require('../helpers/aircondition')
const moment = require('moment')

const ControllerModeType = {
  NORLMAL: 'normal',
  STANDBY: 'standby'
}

const MIN_STATE_TIME = 1000 * 60 * 15 // 20 minutes
const MAX_AC_TEMP = 30
const controllerSettings = {
  temperature: 20.5,
  controllerMode: ControllerModeType.STANDBY,
  actionDone: false,
  lastChange: 0
}

let airConditionClient
let thingSpeakClient
let exit = false
let power = 0
let hvacTemperature = 0

process.on('message', ({ type, value }) => {
  switch (type) {
    case 'SET_TEMPERATURE':
      controllerSettings.temperature = Number(value)
      controllerSettings.actionDone = false
      process.send(`The temperature is set to ${value}°C`)
      break
    case 'SET_CONTROLLER_MODE':
      controllerSettings.controllerMode = value
      controllerSettings.actionDone = false
      process.send(`The controller mode is set to ${value}`)
      break
    case 'EXIT':
      exit = true
      process.send('The worker will exit soon')
      break
    default:
      process.send(`Unknown message type: ${type}`)
  }
})

const hasInternetConnection = async () => {
  return new Promise((resolve) => {
    require('dns').resolve('www.google.com', function (err) {
      return resolve(!err)
    })
  })
}

const connectThingspeak = async () => {
  if (await hasInternetConnection()) {
    thingSpeakClient = new ThingSpeakClient()
    thingSpeakClient.attachChannel(1602965, { writeKey: 'U2RG7MRT9WOZ7TMI' }, (err) => {
      if (err) {
        process.send(`Thingspeak is offline: ${err}`)
      } else {
        process.send('Thingspeak is online')
      }
    })
  }
}

const updateThingSpeakChannel = async (tempC) => {
  if (thingSpeakClient) {
    const remaining = MIN_STATE_TIME - (Date.now() - controllerSettings.lastChange) > 0 ? Math.round((MIN_STATE_TIME - (Date.now() - controllerSettings.lastChange)) / 1000) : 0
    const thingSpeakObject = {
      field4: controllerSettings.controllerMode === ControllerModeType.STANDBY ? 1 : 0,
      field5: remaining
    }
    const status = await airConditionClient.getStatus()
    process.send(`Aircondition actual status: ${JSON.stringify(status)}`)
    if (tempC) {
      thingSpeakObject.field1 = tempC
    }
    if (status) {
      thingSpeakObject.field2 = status.properties.power === 'on' ? 1 : 0
      thingSpeakObject.field3 = status.properties.temperature
      hvacTemperature = status.properties.temperature
      power = status.properties.power === 'on' ? 1 : 0
    }

    return new Promise((resolve) => {
      thingSpeakClient.updateChannel(1602965, thingSpeakObject, function (err, resp) {
        if (err) {
          process.send(`Thingspeak update failed: : ${err}`)
          connectThingspeak()
          return resolve('Thingspeak reconnect')
        }
        if (!err && resp > 0) {
          process.send(`Thingspeak update successfully. Entry number was: : ${resp}`)
          return resolve('Thingspeak updated')
        }
        return resolve('Thingspeak update finished')
      })
    })
  } else {
    return connectThingspeak()
  }
}

const init = async () => {
  process.send('Worker initialization...')
  controllerSettings.temperature = _.isNumber(process.argv[2]) ? Number(process.argv[2]) : Number(process.env.DEFAULT_TEMPERATURE)
  process.send(`Temperature is initialized to ${controllerSettings.temperature}°C`)
  controllerSettings.controllerMode = process.argv[3] !== undefined && process.argv[3]
  process.send(`${process.argv[3]} Controller mode is initialized to '${controllerSettings.controllerMode}'`)
  airConditionClient = new AirCondition()
  const status = await airConditionClient.getStatus()
  if (status) {
    process.send(`Aircondition is online, initial status: ${JSON.stringify(status)}`)
    controllerSettings.lastChange = Date.now()
    if (status.properties.power === 'on') {
      power = 1
    } else {
      power = 0
    }
    hvacTemperature = status.properties.temperature
  } else {
    power = 0
  }

  await connectThingspeak()

  process.send(`Initial state:
    temperatureSet = ${controllerSettings.temperature}
    controllerMode = ${controllerSettings.controllerMode}
    exit = ${exit}
    power = ${power}
    lastChange = ${new Date(controllerSettings.lastChange).toISOString()}`)

  process.send({
    type: 'STATUS_UPDATE',
    data: {
      hvacPower: power === 1,
      hvacActualTemperature: hvacTemperature,
      timeRemaining: moment.duration(MIN_STATE_TIME - (Date.now() - controllerSettings.lastChange)).humanize()
    }
  })
  process.send('Worker initialization is finished')
}

const run = async () => {
  // eslint-disable-next-line no-unmodified-loop-condition
  while (!exit) {
    process.send('---- Iteration started ----')
    const tempC = await readCurrentTemperature()
    if (tempC) {
      process.send(`It's ${tempC}°C currently`)
    } else {
      process.send('Failed to read temperature')
    }

    if (controllerSettings.controllerMode === ControllerModeType.NORLMAL) {
      controllerSettings.actionDone = true
      if (Date.now() - controllerSettings.lastChange > MIN_STATE_TIME) {
        process.send('Min state time is over.')

        // For debug:
        // process.send(`Evaluation 1:
        // power === 1 => ${power === 1}
        // Number(${tempC}) > Number(${controllerSettings.temperature} + 0.2) => ${Number(tempC) > controllerSettings.temperature + 0.2}`)
        if (power === 1 && (Number(tempC) > controllerSettings.temperature + 0.2)) {
          // start shutdown period
          process.send('Air condition power OFF 1')
          await airConditionClient.updateAirConditionStatus(Math.round(controllerSettings.temperature - 1), 0)
          power = 0
          controllerSettings.lastChange = Date.now()
          process.send('Air condition power OFF')
        }

        // For debug:
        // process.send(`Evaluation 2:
        // power === 0 => ${power === 0}
        // Number(${tempC}) < Number(${controllerSettings.temperature} - 0.2) => ${Number(tempC) < controllerSettings.temperature - 0.2}`)
        if (power === 0 && (Number(tempC) < controllerSettings.temperature - 0.2)) {
          // start heating period
          process.send('Air condition power ON 1')
          await airConditionClient.updateAirConditionStatus(Math.min(Math.round(controllerSettings.temperature + 5.5), MAX_AC_TEMP), 1)
          power = 1
          controllerSettings.lastChange = Date.now()
          process.send(`Air condition power ON with ${Math.min(Math.round(controllerSettings.temperature + 5.5), MAX_AC_TEMP)} °C`)
        }
      } else {
        process.send(`${moment.duration(MIN_STATE_TIME - (Date.now() - controllerSettings.lastChange)).humanize()} left from min state time.`)
      }
    } else if (controllerSettings.controllerMode === ControllerModeType.STANDBY) {
      if (!controllerSettings.actionDone) {
        await airConditionClient.updateAirConditionStatus(Math.round(controllerSettings.temperature - 1), 0)
        controllerSettings.actionDone = true
      }
    }
    await updateThingSpeakChannel(tempC)
    process.send('Iteration finished')
    process.send({
      type: 'STATUS_UPDATE',
      data: {
        roomTemperature: tempC,
        hvacPower: power === 1,
        hvacActualTemperature: hvacTemperature,
        timeRemaining: (Date.now() - controllerSettings.lastChange) < MIN_STATE_TIME ? moment.duration(MIN_STATE_TIME - (Date.now() - controllerSettings.lastChange)).humanize() : '0 minutes'
      }
    })
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
