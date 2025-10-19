"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Verificar se o ENUM existe e adicionar novos valores
    const enumExistsQuery = `
      SELECT EXISTS (
        SELECT 1 
        FROM pg_type 
        WHERE typname = 'enum_notificacoes_tipo_notificacao'
      );
    `;

    const [[{ exists }]] = await queryInterface.sequelize.query(
      enumExistsQuery
    );

    if (!exists) {
      console.log(
        "⚠️ ENUM não existe ainda. Isso é normal se a tabela notificacoes não foi criada."
      );
      console.log(
        "Os novos tipos serão incluídos quando o modelo for sincronizado."
      );
      return;
    }

    // Adicionar novos tipos de notificação ao ENUM
    const novosValores = [
      "solicitacao_atendida",
      "solicitacao_cancelada",
      "vendedor_atendeu",
      "conflito_atendimento",
      "perdeu_solicitacao",
    ];

    for (const valor of novosValores) {
      try {
        await queryInterface.sequelize.query(`
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_enum 
              WHERE enumlabel = '${valor}' 
              AND enumtypid = (
                SELECT oid FROM pg_type WHERE typname = 'enum_notificacoes_tipo_notificacao'
              )
            ) THEN
              ALTER TYPE "enum_notificacoes_tipo_notificacao" ADD VALUE '${valor}';
            END IF;
          END $$;
        `);
        console.log(`✅ Valor '${valor}' adicionado ao ENUM`);
      } catch (error) {
        console.log(`⚠️ Erro ao adicionar '${valor}':`, error.message);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Não é possível remover valores de um ENUM no PostgreSQL
    // A única maneira seria recriar o ENUM completamente
    console.log(
      "⚠️ ATENÇÃO: Não é possível reverter valores de ENUM no PostgreSQL"
    );
    console.log("Se necessário, crie uma nova migration para recriar o ENUM");
  },
};
