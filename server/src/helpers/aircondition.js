const debug = require('debug')('air-condition')
const Gree = require('gree-hvac-client')
const { delay } = require('./util')

const RETRY_COUNT = 5

class AirCondition {
  constructor () {
    this.client = new Gree.Client({
      host: '192.168.0.111',
      debug: false
    })
    this.lastProperties = {}
    this.connected = false

    this.client.on('connect', (client) => {
      debug('connected to', client.getDeviceId())
      this.connected = true
    })

    this.client.on('disconnect', () => {
      debug('disconnected')
      this.connected = false
    })

    this.client.on('update', (updatedProperties, properties) => {
      debug('=================== UPDATED STATUS ===================')
      debug(new Date().toISOString())
      debug(properties)
      this.lastProperties = {
        timestamp: Date.now(),
        properties: properties
      }
    })

    this.client.on('success', (updatedProperties) => {
      debug('properties updated:', updatedProperties)
    })
  }

  async connect () {
    await delay(3000)
    if (!this.connected) {
      this.client.connect()
    }
    await delay(1000)
    let isConnected = this.connected
    for (let i = 0; i < RETRY_COUNT && !isConnected; i++) {
      this.client.connect()
      await delay(1000)
      isConnected = this.connected
    }
  }

  async updateAirConditionStatus (temperature, power) {
    await this.connect()
    if (!this.connected) {
      return false
    }
    const properties = {}
    if (power) {
      properties[Gree.PROPERTY.power] = Gree.VALUE.power.on
    } else {
      properties[Gree.PROPERTY.power] = Gree.VALUE.power.off
    }
    properties[Gree.PROPERTY.quiet] = Gree.VALUE.quiet.mode2
    properties[Gree.PROPERTY.temperature] = temperature
    this.client.setProperties(properties)
    return true
  }

  async getStatus () {
    await this.connect()
    if (!this.connected) {
      return undefined
    }

    return this.lastProperties
  }
}

module.exports = AirCondition
