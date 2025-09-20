const { Sequelize } = require("sequelize");
const config = require("./env");

const sequelize = new Sequelize(
  config.DB_NAME,
  config.DB_USER,
  config.DB_PASSWORD,
  {
    host: config.DB_HOST,
    port: config.DB_PORT,
    dialect: "postgres",
    logging: config.NODE_ENV === "development" ? console.log : false,
  }
);

module.exports = { sequelize };
