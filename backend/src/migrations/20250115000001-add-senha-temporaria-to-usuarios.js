"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("usuarios", "senha_temporaria", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: "Indica se o usuário está usando uma senha temporária e deve trocá-la no primeiro acesso",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("usuarios", "senha_temporaria");
  },
};














