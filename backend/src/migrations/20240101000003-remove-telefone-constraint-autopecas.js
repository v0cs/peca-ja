"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remover completamente a constraint do telefone
    await queryInterface.removeConstraint(
      "autopecas",
      "autopecas_telefone_check"
    );
  },

  async down(queryInterface, Sequelize) {
    // Restaurar a constraint original
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

