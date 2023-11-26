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
    controllerMode: Sequelize.ENUM('normal', 'standby'),
    setRoomTemperature: Sequelize.FLOAT
  })
  await database.sync()
  const hvac = await Hvac.findByPk(1)
  if (!hvac) {
    await Hvac.create({
      id: 1,
      roomTemperature: 21.2,
      hvacPower: true,
      hvacActualTemperature: 23,
      timeRemaining: '',
      controllerMode: 'standby',
      setRoomTemperature: 20.5
    })
  }
  models.Hvac = Hvac
}

module.exports = {
  initialize,
  models
}
