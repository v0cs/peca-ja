/**
 * Factory para criar mocks de models do Sequelize
 * Este helper resolve o problema de mocks perdendo suas implementações após jest.clearAllMocks()
 */

/**
 * Cria um mock completo de um model do Sequelize com todos os métodos necessários
 * @param {Object} additionalMethods - Métodos adicionais específicos do model
 * @returns {Object} Mock do model
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

/**
 * Cria mocks para todos os models necessários nos testes
 * @returns {Object} Objeto com todos os models mockados
 */
function createAllModelMocks() {
  return {
    Usuario: createModelMock(),
    Cliente: createModelMock(),
    Vendedor: createModelMock(),
    Autopeca: createModelMock(),
    Solicitacao: createModelMock(),
    ImagemSolicitacao: createModelMock(),
    SolicitacoesAtendimento: createModelMock(),
    Notificacao: createModelMock(),
    Veiculo: createModelMock(),
  };
}

/**
 * Cria uma transaction mock do Sequelize
 * @returns {Object} Transaction mock
 */
function createTransactionMock() {
  return {
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
  };
}

/**
 * Configura uma transaction mock para um model
 * @param {Object} model - Model mockado
 * @param {Object} transaction - Transaction mock (opcional, cria um novo se não fornecido)
 * @returns {Object} Transaction mock configurada
 */
function setupTransactionMock(model, transaction = null) {
  const mockTransaction = transaction || createTransactionMock();
  
  if (model.sequelize) {
    model.sequelize.transaction = jest.fn((callback) => {
      if (callback) {
        return Promise.resolve(callback(mockTransaction));
      }
      return Promise.resolve(mockTransaction);
    });
  }
  
  return mockTransaction;
}

/**
 * Reseta todos os mocks de um objeto de models
 * @param {Object} models - Objeto com os models mockados
 */
function resetAllModelMocks(models) {
  Object.values(models).forEach(model => {
    Object.keys(model).forEach(key => {
      if (typeof model[key] === 'function' && model[key].mockClear) {
        model[key].mockClear();
      }
      if (key === 'sequelize' && model[key]?.transaction?.mockClear) {
        model[key].transaction.mockClear();
      }
    });
  });
}

module.exports = {
  createModelMock,
  createAllModelMocks,
  createTransactionMock,
  setupTransactionMock,
  resetAllModelMocks,
};

