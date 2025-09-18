"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class HistoricoSolicitacao extends Model {
    static associate(models) {
      // HistoricoSolicitacao N:1 Solicitacao
      HistoricoSolicitacao.belongsTo(models.Solicitacao, {
        foreignKey: "solicitacao_id",
        as: "solicitacao",
      });

      // HistoricoSolicitacao N:1 Usuario
      HistoricoSolicitacao.belongsTo(models.Usuario, {
        foreignKey: "usuario_id",
        as: "usuario",
      });
    }
  }

  HistoricoSolicitacao.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      solicitacao_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "solicitacoes",
          key: "id",
        },
      },
      usuario_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "usuarios",
          key: "id",
        },
      },
      status_anterior: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      status_novo: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      motivo: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "HistoricoSolicitacao",
      tableName: "historico_solicitacoes",
      timestamps: true,
      createdAt: "data_alteracao",
      updatedAt: false,
    }
  );

  return HistoricoSolicitacao;
};


