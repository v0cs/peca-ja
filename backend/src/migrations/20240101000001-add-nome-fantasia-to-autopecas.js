"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("autopecas", "nome_fantasia", {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: "Nome fantasia da autopeça (nome comercial, opcional)",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("autopecas", "nome_fantasia");
  },
};

