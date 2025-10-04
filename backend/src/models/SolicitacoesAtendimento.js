"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SolicitacoesAtendimento extends Model {
    static associate(models) {
      // SolicitacoesAtendimento N:1 Solicitacao
      SolicitacoesAtendimento.belongsTo(models.Solicitacao, {
        foreignKey: "solicitacao_id",
        as: "solicitacao",
      });

      // SolicitacoesAtendimento N:1 Autopeca
      SolicitacoesAtendimento.belongsTo(models.Autopeca, {
        foreignKey: "autopeca_id",
        as: "autopeca",
      });

      // SolicitacoesAtendimento N:1 Vendedor
      SolicitacoesAtendimento.belongsTo(models.Vendedor, {
        foreignKey: "vendedor_id",
        as: "vendedor",
      });
    }
  }

  SolicitacoesAtendimento.init(
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
      autopeca_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "autopecas",
          key: "id",
        },
      },
      vendedor_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "vendedores",
          key: "id",
        },
      },
      status_atendimento: {
        type: DataTypes.ENUM("nao_lida", "lida", "atendida", "desmarcada"),
        defaultValue: "nao_lida",
      },
      data_marcacao: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "SolicitacoesAtendimento",
      tableName: "solicitacoes_atendimento",
      timestamps: true,
      createdAt: "data_marcacao",
      updatedAt: "data_atualizacao",
      indexes: [
        {
          fields: ["status_atendimento"],
        },
        {
          fields: ["solicitacao_id"],
        },
      ],
      validate: {
        validarAtendimento() {
          // autopeca_id é OBRIGATÓRIO sempre
          if (!this.autopeca_id) {
            throw new Error("autopeca_id é obrigatório");
          }

          // vendedor_id é OPCIONAL, mas se existir deve pertencer à autopeça
          // (essa verificação será feita no controller)
        },
      },
    }
  );

  return SolicitacoesAtendimento;
};
