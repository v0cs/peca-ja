/**
 * Helper para criar mocks de models do Sequelize dentro de jest.mock()
 * Este arquivo é usado para criar mocks que funcionam corretamente com o hoisting do Jest
 */

function createModelMock(additionalMethods = {}) {
  return {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    bulkCreate: jest.fn(),
    sequelize: {
      transaction: jest.fn(),
    },
    ...additionalMethods,
  };
}

module.exports = { createModelMock };

