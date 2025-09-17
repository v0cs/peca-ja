"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Cliente extends Model {
    static associate(models) {
      // Cliente N:1 Usuario
      Cliente.belongsTo(models.Usuario, {
        foreignKey: "usuario_id",
        as: "usuario",
      });

      // Cliente 1:N Solicitacoes
      Cliente.hasMany(models.Solicitacao, {
        foreignKey: "cliente_id",
        as: "solicitacoes",
      });
    }
  }

  Cliente.init(
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
      nome_completo: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      telefone: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      celular: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          is: /^\([0-9]{2}\)[0-9]{8,9}$/,
        },
      },
      cidade: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      uf: {
        type: DataTypes.STRING(2),
        allowNull: false,
      },
      data_exclusao_pedida: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      data_anonimizacao: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Cliente",
      tableName: "clientes",
      timestamps: true,
      createdAt: "data_criacao",
      updatedAt: "data_atualizacao",
      indexes: [
        {
          fields: ["usuario_id"],
        },
        {
          fields: ["cidade", "uf"],
        },
      ],
    }
  );

  return Cliente;
};
