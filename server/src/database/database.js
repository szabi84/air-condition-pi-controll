const Sequelize = require('sequelize')

const models = {}

const initialize = async () => {
  const database = new Sequelize({
    dialect: 'sqlite',
    storage: './test.sqlite'
  })

  const Hvac = database.define('hvac', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    roomTemperature: Sequelize.FLOAT,
    hvacPower: Sequelize.BOOLEAN,
    hvacActualTemperature: Sequelize.FLOAT,
    timeRemaining: Sequelize.STRING,
    setOnlyMonitoring: Sequelize.BOOLEAN,
    setRoomTemperature: Sequelize.FLOAT
  })
  models.Hvac = Hvac

  await database.sync()
  const hvac = await Hvac.findByPk(1)
  if (!hvac) {
    await Hvac.create({
      id: 1,
      roomTemperature: 21.2,
      hvacPower: true,
      hvacActualTemperature: 23,
      timeRemaining: '',
      setOnlyMonitoring: false,
      setRoomTemperature: 29.0
    })
  }
}

module.exports = {
  initialize,
  models
}
