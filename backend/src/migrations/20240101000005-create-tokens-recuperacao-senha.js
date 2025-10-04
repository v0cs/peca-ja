"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tokens_recuperacao_senha", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      usuario_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "usuarios",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      token: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      data_expiracao: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      utilizado: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      data_utilizacao: {
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
    await queryInterface.addIndex("tokens_recuperacao_senha", ["token"], {
      unique: true,
      name: "tokens_recuperacao_senha_token_unique",
    });
    await queryInterface.addIndex("tokens_recuperacao_senha", [
      "usuario_id",
      "utilizado",
    ]);
    await queryInterface.addIndex("tokens_recuperacao_senha", [
      "data_expiracao",
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("tokens_recuperacao_senha");
  },
};
