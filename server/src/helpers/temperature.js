const sensor = require('ds18b20-raspi')
const { delay } = require('./util')

const RETRY_COUNT = 3

const readCurrentTemperature = async () => {
  let tempC = null
  for (let i = 0; i < RETRY_COUNT && !tempC; i++) {
    tempC = sensor.readSimpleC()
    await delay(1000)
  }
  return tempC
}

module.exports = {
  readCurrentTemperature
}
