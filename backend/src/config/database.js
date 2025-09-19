const { Sequelize } = require("sequelize");

// Configuração usando variáveis de ambiente
const sequelize = new Sequelize(
  process.env.DB_NAME || "pecaja",
  process.env.DB_USER || "postgres",
  process.env.DB_PASSWORD || "banco123",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    dialectOptions: {
      ssl:
        process.env.NODE_ENV === "production"
          ? { require: true, rejectUnauthorized: false }
          : false,
    },
  }
);

module.exports = { sequelize };
