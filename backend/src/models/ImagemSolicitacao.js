"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ImagemSolicitacao extends Model {
    static associate(models) {
      // ImagemSolicitacao N:1 Solicitacao
      ImagemSolicitacao.belongsTo(models.Solicitacao, {
        foreignKey: "solicitacao_id",
        as: "solicitacao",
      });
    }
  }

  ImagemSolicitacao.init(
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
      nome_arquivo: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      nome_arquivo_fisico: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      caminho_arquivo: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      tamanho_arquivo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          max: 5242880, // 5MB
        },
      },
      tipo_mime: {
        type: DataTypes.ENUM("image/jpeg", "image/png", "image/webp"),
        allowNull: false,
      },
      extensao: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      ordem_exibicao: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      modelName: "ImagemSolicitacao",
      tableName: "imagens_solicitacao",
      timestamps: true,
      createdAt: "data_upload",
      updatedAt: false,
    }
  );

  return ImagemSolicitacao;
};


