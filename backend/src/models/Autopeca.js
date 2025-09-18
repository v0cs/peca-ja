"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Autopeca extends Model {
    static associate(models) {
      // Autopeca N:1 Usuario
      Autopeca.belongsTo(models.Usuario, {
        foreignKey: "usuario_id",
        as: "usuario",
      });

      // Autopeca 1:N Vendedores
      Autopeca.hasMany(models.Vendedor, {
        foreignKey: "autopeca_id",
        as: "vendedores",
      });

      // Autopeca N:M Solicitacoes (através de SolicitacoesAtendimento)
      Autopeca.belongsToMany(models.Solicitacao, {
        through: models.SolicitacoesAtendimento,
        foreignKey: "autopeca_id",
        otherKey: "solicitacao_id",
        as: "solicitacoesAtendidas",
      });
    }
  }

  Autopeca.init(
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
      razao_social: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      cnpj: {
        type: DataTypes.STRING(18),
        allowNull: false,
        unique: true,
      },
      telefone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          is: /^\([0-9]{2}\)[0-9]{8,9}$/,
        },
      },
      endereco_rua: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      endereco_numero: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      endereco_bairro: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      endereco_cidade: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      endereco_uf: {
        type: DataTypes.STRING(2),
        allowNull: false,
      },
      endereco_cep: {
        type: DataTypes.STRING(10),
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
      modelName: "Autopeca",
      tableName: "autopecas",
      timestamps: true,
      createdAt: "data_criacao",
      updatedAt: "data_atualizacao",
      indexes: [
        {
          fields: ["usuario_id"],
        },
        {
          fields: ["endereco_cidade", "endereco_uf"],
        },
      ],
    }
  );

  return Autopeca;
};


