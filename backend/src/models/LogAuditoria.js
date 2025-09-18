"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class LogAuditoria extends Model {
    static associate(models) {
      // LogAuditoria N:1 Usuario
      LogAuditoria.belongsTo(models.Usuario, {
        foreignKey: "usuario_id",
        as: "usuario",
      });
    }
  }

  LogAuditoria.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      usuario_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "usuarios",
          key: "id",
        },
      },
      acao: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      tabela_afetada: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      registro_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      dados_anteriores: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      dados_novos: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      ip_origem: {
        type: DataTypes.INET,
        allowNull: true,
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "LogAuditoria",
      tableName: "logs_auditoria",
      timestamps: true,
      createdAt: "data_acao",
      updatedAt: false,
      indexes: [
        {
          fields: ["usuario_id"],
        },
        {
          fields: ["data_acao"],
        },
      ],
    }
  );

  return LogAuditoria;
};


