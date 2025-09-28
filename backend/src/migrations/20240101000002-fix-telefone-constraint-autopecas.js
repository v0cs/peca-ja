"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remover a constraint atual do telefone
    await queryInterface.removeConstraint(
      "autopecas",
      "autopecas_telefone_check"
    );

    // Adicionar nova constraint compatível com nosso formato
    await queryInterface.addConstraint("autopecas", {
      fields: ["telefone"],
      type: "check",
      name: "autopecas_telefone_check",
      where: {
        telefone: {
          [Sequelize.Op.regexp]: "^([0-9]{2})[0-9]{4,5}-?[0-9]{4}$",
        },
      },
    });
  },

  async down(queryInterface, Sequelize) {
    // Remover a nova constraint
    await queryInterface.removeConstraint(
      "autopecas",
      "autopecas_telefone_check"
    );

    // Restaurar a constraint original (se necessário)
    await queryInterface.addConstraint("autopecas", {
      fields: ["telefone"],
      type: "check",
      name: "autopecas_telefone_check",
      where: {
        telefone: {
          [Sequelize.Op.regexp]: "^([0-9]{2})[0-9]{8,9}$",
        },
      },
    });
  },
};

