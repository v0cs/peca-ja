// Mock do Sequelize
const mockSequelize = {
  constructor: jest.fn(),
};

jest.mock("sequelize", () => ({
  Sequelize: jest.fn(() => mockSequelize),
}));

// Mock do config/env
jest.mock("../../../src/config/env", () => ({
  DB_NAME: "test_db",
  DB_USER: "test_user",
  DB_PASSWORD: "test_password",
  DB_HOST: "localhost",
  DB_PORT: 5432,
  NODE_ENV: "test",
}));

const { Sequelize } = require("sequelize");
const config = require("../../../src/config/env");
const database = require("../../../src/config/database");

describe("database.js", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve exportar sequelize", () => {
    expect(database.sequelize).toBeDefined();
  });

  it("deve criar instância do Sequelize com configurações corretas", () => {
    // Re-importar para capturar a chamada do construtor
    jest.resetModules();
    const { Sequelize: SequelizeMock } = require("sequelize");
    const configMock = require("../../../src/config/env");
    
    require("../../../src/config/database");
    
    expect(SequelizeMock).toHaveBeenCalledWith(
      configMock.DB_NAME,
      configMock.DB_USER,
      configMock.DB_PASSWORD,
      {
        host: configMock.DB_HOST,
        port: configMock.DB_PORT,
        dialect: "postgres",
        logging: false, // NODE_ENV é "test", então logging deve ser false
      }
    );
  });

  it("deve configurar logging como console.log em desenvolvimento", () => {
    jest.resetModules();
    jest.doMock("../../../src/config/env", () => ({
      DB_NAME: "test_db",
      DB_USER: "test_user",
      DB_PASSWORD: "test_password",
      DB_HOST: "localhost",
      DB_PORT: 5432,
      NODE_ENV: "development",
    }));
    
    const { Sequelize: SequelizeMock } = require("sequelize");
    
    require("../../../src/config/database");
    
    expect(SequelizeMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        logging: console.log,
      })
    );
  });

  it("deve configurar logging como false em produção", () => {
    jest.resetModules();
    jest.doMock("../../../src/config/env", () => ({
      DB_NAME: "test_db",
      DB_USER: "test_user",
      DB_PASSWORD: "test_password",
      DB_HOST: "localhost",
      DB_PORT: 5432,
      NODE_ENV: "production",
    }));
    
    const { Sequelize: SequelizeMock } = require("sequelize");
    
    require("../../../src/config/database");
    
    expect(SequelizeMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        logging: false,
      })
    );
  });
});



