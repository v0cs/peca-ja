"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Usuario extends Model {
    static associate(models) {
      // Usuario 1:1 Cliente
      Usuario.hasOne(models.Cliente, {
        foreignKey: "usuario_id",
        as: "cliente",
      });

      // Usuario 1:1 Autopeca
      Usuario.hasOne(models.Autopeca, {
        foreignKey: "usuario_id",
        as: "autopeca",
      });

      // Usuario 1:N Vendedor
      Usuario.hasMany(models.Vendedor, {
        foreignKey: "usuario_id",
        as: "vendedores",
      });

      // Usuario 1:N Notificacoes
      Usuario.hasMany(models.Notificacao, {
        foreignKey: "usuario_id",
        as: "notificacoes",
      });

      // Usuario 1:N TokensResetSenha
      Usuario.hasMany(models.TokenResetSenha, {
        foreignKey: "usuario_id",
        as: "tokensResetSenha",
      });

      // Usuario 1:N LogsAuditoria
      Usuario.hasMany(models.LogAuditoria, {
        foreignKey: "usuario_id",
        as: "logsAuditoria",
      });
    }
  }

  Usuario.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      senha_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      tipo_usuario: {
        type: DataTypes.ENUM("cliente", "autopeca", "vendedor"),
        allowNull: false,
      },
      google_id: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: true,
      },
      ativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      termos_aceitos: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      data_aceite_terms: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      consentimento_marketing: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Usuario",
      tableName: "usuarios",
      timestamps: true,
      createdAt: "data_criacao",
      updatedAt: "data_atualizacao",
      indexes: [
        {
          fields: ["email"],
        },
        {
          fields: ["google_id"],
        },
        {
          fields: ["tipo_usuario"],
        },
      ],
    }
  );

  return Usuario;
};


