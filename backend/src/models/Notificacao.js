"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Notificacao extends Model {
    static associate(models) {
      // Notificacao N:1 Usuario
      Notificacao.belongsTo(models.Usuario, {
        foreignKey: "usuario_id",
        as: "usuario",
      });
    }
  }

  Notificacao.init(
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
      tipo_notificacao: {
        type: DataTypes.ENUM(
          "nova_solicitacao",
          "recuperacao_senha",
          "confirmacao_cadastro",
          "vendedor_cadastrado",
          "solicitacao_concluida",
          "novo_vendedor",
          "autopeca_cadastrada",
          "vendedor_inativado",
          "termos_atualizados",
          "marketing_comunicacao"
        ),
        allowNull: false,
      },
      titulo: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      mensagem: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      lida: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      enviada_email: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      data_envio_email: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      metadados: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Notificacao",
      tableName: "notificacoes",
      timestamps: true,
      createdAt: "data_criacao",
      updatedAt: false,
      indexes: [
        {
          fields: ["usuario_id"],
        },
        {
          fields: ["tipo_notificacao"],
        },
        {
          fields: ["lida"],
        },
      ],
    }
  );

  return Notificacao;
};


