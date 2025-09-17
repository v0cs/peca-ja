"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Solicitacao extends Model {
    static associate(models) {
      // Solicitacao N:1 Cliente
      Solicitacao.belongsTo(models.Cliente, {
        foreignKey: "cliente_id",
        as: "cliente",
      });

      // Solicitacao 1:N ImagensSolicitacao
      Solicitacao.hasMany(models.ImagemSolicitacao, {
        foreignKey: "solicitacao_id",
        as: "imagens",
      });

      // Solicitacao N:M Autopecas (através de SolicitacoesAtendimento)
      Solicitacao.belongsToMany(models.Autopeca, {
        through: models.SolicitacoesAtendimento,
        foreignKey: "solicitacao_id",
        otherKey: "autopeca_id",
        as: "autopecasAtendendo",
      });

      // Solicitacao N:M Vendedores (através de SolicitacoesAtendimento)
      Solicitacao.belongsToMany(models.Vendedor, {
        through: models.SolicitacoesAtendimento,
        foreignKey: "solicitacao_id",
        otherKey: "vendedor_id",
        as: "vendedoresAtendendo",
      });

      // Solicitacao 1:N SolicitacoesAtendimento
      Solicitacao.hasMany(models.SolicitacoesAtendimento, {
        foreignKey: "solicitacao_id",
        as: "atendimentos",
      });

      // Solicitacao 1:N HistoricoSolicitacoes
      Solicitacao.hasMany(models.HistoricoSolicitacao, {
        foreignKey: "solicitacao_id",
        as: "historico",
      });
    }
  }

  Solicitacao.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      cliente_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "clientes",
          key: "id",
        },
      },
      descricao_peca: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status_cliente: {
        type: DataTypes.ENUM("ativa", "concluida", "cancelada"),
        defaultValue: "ativa",
      },
      cidade_atendimento: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      uf_atendimento: {
        type: DataTypes.STRING(2),
        allowNull: false,
      },
      placa: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: {
          is: /^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$|^[A-Z]{3}-?[0-9]{4}$/,
        },
      },
      marca: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      modelo: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      ano_fabricacao: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1900,
          max: new Date().getFullYear() + 1,
        },
      },
      ano_modelo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1900,
          max: new Date().getFullYear() + 1,
        },
      },
      categoria: {
        type: DataTypes.ENUM(
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
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      chassi: {
        type: DataTypes.STRING(50),
        defaultValue: "Não informado",
      },
      renavam: {
        type: DataTypes.STRING(20),
        defaultValue: "Não informado",
      },
      origem_dados_veiculo: {
        type: DataTypes.ENUM("api", "manual", "api_com_fallback"),
        defaultValue: "manual",
      },
      api_veicular_metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      data_conclusao: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Solicitacao",
      tableName: "solicitacoes",
      timestamps: true,
      createdAt: "data_criacao",
      updatedAt: "data_atualizacao",
      indexes: [
        {
          fields: ["cliente_id"],
        },
        {
          fields: ["cidade_atendimento", "uf_atendimento"],
        },
        {
          fields: ["status_cliente"],
        },
      ],
    }
  );

  return Solicitacao;
};
