"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("solicitacoes", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      cliente_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "clientes",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      descricao_peca: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status_cliente: {
        type: Sequelize.ENUM("ativa", "concluida", "cancelada"),
        defaultValue: "ativa",
        allowNull: false,
      },
      cidade_atendimento: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      uf_atendimento: {
        type: Sequelize.STRING(2),
        allowNull: false,
      },
      placa: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      marca: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      modelo: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      ano_fabricacao: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      ano_modelo: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      categoria: {
        type: Sequelize.ENUM(
          "carro",
          "moto",
          "caminhao",
          "van",
          "onibus",
          "outro"
        ),
        allowNull: false,
      },
      cor: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      chassi: {
        type: Sequelize.STRING(50),
        defaultValue: "Não informado",
        allowNull: true,
      },
      renavam: {
        type: Sequelize.STRING(20),
        defaultValue: "Não informado",
        allowNull: true,
      },
      origem_dados_veiculo: {
        type: Sequelize.ENUM("api", "manual", "api_com_fallback"),
        defaultValue: "manual",
        allowNull: false,
      },
      api_veicular_metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      data_conclusao: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      data_criacao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      data_atualizacao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Adicionar índices
    await queryInterface.addIndex("solicitacoes", ["cliente_id"]);
    await queryInterface.addIndex("solicitacoes", [
      "cidade_atendimento",
      "uf_atendimento",
    ]);
    await queryInterface.addIndex("solicitacoes", ["status_cliente"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("solicitacoes");
  },
};
