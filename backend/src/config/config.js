const envConfig = require("./env");

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const baseDatabaseConfig = {
  username: envConfig.DB_USER,
  password: envConfig.DB_PASSWORD,
  host: envConfig.DB_HOST,
  port: toNumber(envConfig.DB_PORT, 5432),
  dialect: "postgres",
  logging: false,
};

module.exports = {
  development: {
    ...baseDatabaseConfig,
    database: envConfig.DB_NAME || "pecaja",
  },
  test: {
    ...baseDatabaseConfig,
    database: process.env.DB_TEST_NAME || "pecaja_test",
  },
  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    logging: false,
  },
};
