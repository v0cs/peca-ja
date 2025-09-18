"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Vendedor extends Model {
    static associate(models) {
      // Vendedor N:1 Usuario
      Vendedor.belongsTo(models.Usuario, {
        foreignKey: "usuario_id",
        as: "usuario",
      });

      // Vendedor N:1 Autopeca
      Vendedor.belongsTo(models.Autopeca, {
        foreignKey: "autopeca_id",
        as: "autopeca",
      });

      // Vendedor N:M Solicitacoes (através de SolicitacoesAtendimento)
      Vendedor.belongsToMany(models.Solicitacao, {
        through: models.SolicitacoesAtendimento,
        foreignKey: "vendedor_id",
        otherKey: "solicitacao_id",
        as: "solicitacoesAtendidas",
      });
    }
  }

  Vendedor.init(
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
      autopeca_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "autopecas",
          key: "id",
        },
      },
      nome_completo: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      ativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "Vendedor",
      tableName: "vendedores",
      timestamps: true,
      createdAt: "data_criacao",
      updatedAt: "data_atualizacao",
      indexes: [
        {
          fields: ["usuario_id"],
        },
        {
          fields: ["autopeca_id"],
        },
      ],
    }
  );

  return Vendedor;
};


