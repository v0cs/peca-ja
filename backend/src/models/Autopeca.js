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
        comment: "Razão social da autopeça (nome oficial da empresa)",
      },
      nome_fantasia: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: "Nome fantasia da autopeça (nome comercial, opcional)",
      },
      cnpj: {
        type: DataTypes.STRING(14),
        allowNull: false,
        unique: true,
        validate: {
          len: [14, 14],
          is: /^[0-9]{14}$/,
        },
        comment: "CNPJ da autopeça (14 dígitos numéricos, sem formatação)",
      },
      telefone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          is: /^\([0-9]{2}\)[0-9]{4,5}-?[0-9]{4}$/,
        },
        comment: "Telefone da autopeça no formato brasileiro: (11)99999-9999",
      },
      endereco_rua: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: "Nome da rua/avenida do endereço da autopeça",
      },
      endereco_numero: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: "Número do endereço da autopeça",
      },
      endereco_bairro: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: "Bairro onde está localizada a autopeça",
      },
      endereco_cidade: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: "Cidade onde está localizada a autopeça",
      },
      endereco_uf: {
        type: DataTypes.STRING(2),
        allowNull: false,
        validate: {
          len: [2, 2],
        },
        comment: "Estado (UF) onde está localizada a autopeça (2 caracteres)",
      },
      endereco_cep: {
        type: DataTypes.STRING(8),
        allowNull: false,
        validate: {
          len: [8, 8],
          is: /^[0-9]{8}$/,
        },
        comment: "CEP da autopeça (8 dígitos numéricos, sem formatação)",
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
