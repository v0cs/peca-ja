"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TokenRecuperacaoSenha extends Model {
    static associate(models) {
      // Token N:1 Usuario
      TokenRecuperacaoSenha.belongsTo(models.Usuario, {
        foreignKey: "usuario_id",
        as: "usuario",
      });
    }
  }

  TokenRecuperacaoSenha.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      usuario_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "usuarios",
          key: "id",
        },
      },
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      data_expiracao: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      utilizado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      data_utilizacao: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "TokenRecuperacaoSenha",
      tableName: "tokens_recuperacao_senha",
      timestamps: true,
      createdAt: "data_criacao",
      updatedAt: "data_atualizacao",
      indexes: [
        {
          unique: true,
          fields: ["token"],
        },
        {
          fields: ["usuario_id", "utilizado"],
        },
        {
          fields: ["data_expiracao"],
        },
      ],
    }
  );

  return TokenRecuperacaoSenha;
};
