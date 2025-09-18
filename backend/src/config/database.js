const { Sequelize } = require("sequelize");

// Tente esta connection string alternativa
const sequelize = new Sequelize(
  "postgres://postgres:banco123@localhost:5432/pecaja",
  {
    logging: console.log,
    dialectOptions: {
      ssl: false,
    },
  }
);

module.exports = { sequelize };
