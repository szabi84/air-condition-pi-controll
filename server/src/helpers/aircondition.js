import Gree from 'gree-hvac-client'
import { delay } from './util'

const RETRY_COUNT = 5
const client = new Gree.Client({
  host: '192.168.0.111',
  debug: false
})
let connected = false

client.on('connect', (client) => {
  console.log('connected to', client.getDeviceId())
  connected = true
})

client.on('disconnect', () => {
  console.log('disconnected')
  connected = false
})

client.on('update', (updatedProperties, properties) => {
  console.log('=================== UPDATED STATUS ===================')
  console.log(new Date().toISOString())
  console.log(updatedProperties, properties)
})

client.on('connect', () => {
  client.setProperty(Gree.PROPERTY.power, Gree.VALUE.power.on)
  client.setProperty(Gree.PROPERTY.quiet, Gree.VALUE.quiet.mode1)
  client.setProperty(Gree.PROPERTY.temperature, 22)
})

client.on('success', (updatedProperties) => {
  console.log('properties updated:', updatedProperties)
})

const updateAirConditionStatus = async (temperature, power) => {
  let isConnected = connected
  for (let i = 0; i < RETRY_COUNT && !isConnected; i++) {
    await delay(1000)
    isConnected = connected
  }
  if (!isConnected) {
    throw new Error('Air Condition is not connected!')
  }
  if (power) {
    client.setProperty(Gree.PROPERTY.power, Gree.VALUE.power.on)
  } else {
    client.setProperty(Gree.PROPERTY.power, Gree.VALUE.power.off)
  }
  client.setProperty(Gree.PROPERTY.quiet, Gree.VALUE.quiet.mode1)
  client.setProperty(Gree.PROPERTY.temperature, temperature)
}

module.exports = {
  updateAirConditionStatus
}
