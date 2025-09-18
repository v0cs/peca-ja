"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TokenResetSenha extends Model {
    static associate(models) {
      // TokenResetSenha N:1 Usuario
      TokenResetSenha.belongsTo(models.Usuario, {
        foreignKey: "usuario_id",
        as: "usuario",
      });
    }
  }

  TokenResetSenha.init(
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
      usado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      data_expiracao: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "TokenResetSenha",
      tableName: "tokens_reset_senha",
      timestamps: true,
      createdAt: "data_criacao",
      updatedAt: false,
      indexes: [
        {
          fields: ["usuario_id"],
        },
        {
          fields: ["data_expiracao"],
        },
      ],
    }
  );

  return TokenResetSenha;
};


