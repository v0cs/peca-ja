"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Tentar remover constraint antiga se existir
      await queryInterface.removeConstraint(
        "solicitacoes_atendimento",
        "chk_autopeca_ou_vendedor"
      );
    } catch (error) {
      // Constraint pode não existir, continuar
      console.log(
        "Constraint chk_autopeca_ou_vendedor não encontrada ou já removida"
      );
    }

    // Adicionar nova constraint que permite:
    // - Apenas autopeca_id (NOT NULL)
    // - OU autopeca_id + vendedor_id (ambos NOT NULL)
    await queryInterface.addConstraint("solicitacoes_atendimento", {
      fields: ["autopeca_id", "vendedor_id"],
      type: "check",
      name: "chk_autopeca_required_vendedor_optional",
      where: {
        // autopeca_id é sempre obrigatório
        // vendedor_id pode ser NULL (quando autopeça atende) ou NOT NULL (quando vendedor atende)
        autopeca_id: {
          [Sequelize.Op.ne]: null,
        },
      },
    });
  },

  async down(queryInterface, Sequelize) {
    try {
      // Remover nova constraint
      await queryInterface.removeConstraint(
        "solicitacoes_atendimento",
        "chk_autopeca_required_vendedor_optional"
      );
    } catch (error) {
      console.log(
        "Constraint chk_autopeca_required_vendedor_optional não encontrada"
      );
    }

    // Restaurar constraint antiga (se necessário)
    // await queryInterface.addConstraint('solicitacoes_atendimento', {
    //   fields: ['autopeca_id', 'vendedor_id'],
    //   type: 'check',
    //   name: 'chk_autopeca_ou_vendedor',
    //   where: {
    //     [Sequelize.Op.or]: [
    //       { autopeca_id: { [Sequelize.Op.ne]: null }, vendedor_id: { [Sequelize.Op.is]: null } },
    //       { autopeca_id: { [Sequelize.Op.is]: null }, vendedor_id: { [Sequelize.Op.ne]: null } }
    //     ]
    //   }
    // });
  },
};
