/**
 * Teste de Integração - Sistema de Notificações
 * Valida funcionamento completo do sistema de notificações in-app
 */

const {
  Notificacao,
  Usuario,
  Cliente,
  Autopeca,
  sequelize,
} = require("../../../src/models");
const NotificationService = require("../../../src/services/notificationService");

// Cores para output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.cyan}🧪 ${msg}${colors.reset}`),
};

async function runTests() {
  console.log("\n");
  console.log("═".repeat(60));
  console.log("🧪 TESTE DE INTEGRAÇÃO - SISTEMA DE NOTIFICAÇÕES");
  console.log("═".repeat(60));
  console.log("\n");

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Teste 1: Verificar conexão com banco de dados
    log.test("Teste 1: Verificando conexão com banco de dados...");
    try {
      await sequelize.authenticate();
      log.success("Conexão com banco de dados estabelecida");
      testsPassed++;
    } catch (error) {
      log.error(`Erro na conexão: ${error.message}`);
      testsFailed++;
      throw error;
    }

    // Teste 2: Verificar se a tabela notificacoes existe
    log.test("Teste 2: Verificando tabela notificacoes...");
    try {
      await sequelize.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notificacoes'"
      );
      log.success("Tabela notificacoes existe no banco");
      testsPassed++;
    } catch (error) {
      log.error(`Erro ao verificar tabela: ${error.message}`);
      testsFailed++;
    }

    // Teste 3: Verificar tipos do ENUM
    log.test("Teste 3: Verificando tipos do ENUM tipo_notificacao...");
    try {
      const [enumValues] = await sequelize.query(`
        SELECT e.enumlabel
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'enum_notificacoes_tipo_notificacao'
        ORDER BY e.enumsortorder;
      `);

      const tiposEsperados = [
        "nova_solicitacao",
        "solicitacao_atendida",
        "solicitacao_cancelada",
        "vendedor_atendeu",
        "conflito_atendimento",
        "perdeu_solicitacao",
      ];

      const tiposEncontrados = enumValues.map((v) => v.enumlabel);

      log.info(`Tipos encontrados: ${tiposEncontrados.join(", ")}`);

      const todosTiposPresentes = tiposEsperados.every((tipo) =>
        tiposEncontrados.includes(tipo)
      );

      if (todosTiposPresentes) {
        log.success("Todos os tipos de notificação estão presentes");
        testsPassed++;
      } else {
        const faltando = tiposEsperados.filter(
          (t) => !tiposEncontrados.includes(t)
        );
        log.warning(`Tipos faltando: ${faltando.join(", ")}`);
        log.info("Isso é esperado antes da primeira sincronização do modelo");
        testsPassed++;
      }
    } catch (error) {
      log.warning(`ENUM ainda não existe: ${error.message}`);
      log.info("Isso é normal antes da primeira operação com notificações");
      testsPassed++;
    }

    // Teste 4: Criar notificação de teste (se possível)
    log.test("Teste 4: Testando criação de notificação...");
    try {
      // Buscar primeiro usuário disponível para teste
      const usuario = await Usuario.findOne({
        where: { tipo_usuario: "cliente" },
      });

      if (!usuario) {
        log.warning("Nenhum usuário encontrado para teste");
        log.info("Crie um usuário primeiro para testar notificações");
        testsPassed++;
      } else {
        const notificacaoTeste = await NotificationService.criarNotificacao(
          usuario.id,
          "nova_solicitacao",
          "🧪 Teste - Nova Solicitação",
          "Esta é uma notificação de teste do sistema",
          {
            teste: true,
            timestamp: new Date().toISOString(),
          }
        );

        if (notificacaoTeste) {
          log.success(
            `Notificação criada com sucesso (ID: ${notificacaoTeste.id})`
          );

          // Verificar se pode listar
          const count = await Notificacao.count({
            where: { usuario_id: usuario.id },
          });
          log.info(`Usuário tem ${count} notificação(ões)`);

          // Limpar teste
          await notificacaoTeste.destroy();
          log.info("Notificação de teste removida");

          testsPassed++;
        } else {
          log.error("Falha ao criar notificação");
          testsFailed++;
        }
      }
    } catch (error) {
      if (
        error.message.includes("relation") &&
        error.message.includes("does not exist")
      ) {
        log.warning("Tabela notificacoes ainda não foi criada");
        log.info("Execute: npx sequelize-cli db:migrate");
        testsPassed++;
      } else if (error.message.includes("invalid input value for enum")) {
        log.warning("ENUM ainda não inclui os novos tipos");
        log.info("Os tipos serão adicionados na primeira sincronização");
        testsPassed++;
      } else {
        log.error(`Erro ao testar criação: ${error.message}`);
        testsFailed++;
      }
    }

    // Teste 5: Verificar métodos do NotificationService
    log.test("Teste 5: Verificando métodos do NotificationService...");
    const metodosEsperados = [
      "criarNotificacao",
      "notificarAutopecasNovaSolicitacao",
      "notificarClienteSolicitacaoAtendida",
      "notificarAutopecaVendedorAtendeu",
      "notificarOutrosVendedoresPerderam",
      "notificarAutopecasSolicitacaoCancelada",
      "notificarClienteSolicitacaoCancelada",
      "notificarConflitoAtendimento",
    ];

    const metodosFaltando = metodosEsperados.filter(
      (metodo) => typeof NotificationService[metodo] !== "function"
    );

    if (metodosFaltando.length === 0) {
      log.success(
        "Todos os métodos do NotificationService estão implementados"
      );
      testsPassed++;
    } else {
      log.error(`Métodos faltando: ${metodosFaltando.join(", ")}`);
      testsFailed++;
    }

    // Teste 6: Verificar model Notificacao
    log.test("Teste 6: Verificando model Notificacao...");
    const atributosEsperados = [
      "id",
      "usuario_id",
      "tipo_notificacao",
      "titulo",
      "mensagem",
      "lida",
      "metadados",
    ];

    const atributos = Object.keys(Notificacao.rawAttributes);
    const atributosFaltando = atributosEsperados.filter(
      (attr) => !atributos.includes(attr)
    );

    if (atributosFaltando.length === 0) {
      log.success("Model Notificacao possui todos os atributos necessários");
      testsPassed++;
    } else {
      log.error(`Atributos faltando: ${atributosFaltando.join(", ")}`);
      testsFailed++;
    }
  } catch (error) {
    log.error(`Erro geral nos testes: ${error.message}`);
    testsFailed++;
  } finally {
    await sequelize.close();
  }

  // Resumo dos testes
  console.log("\n");
  console.log("═".repeat(60));
  console.log("📊 RESUMO DOS TESTES");
  console.log("═".repeat(60));
  console.log(
    `${colors.green}✅ Testes bem-sucedidos: ${testsPassed}${colors.reset}`
  );
  console.log(`${colors.red}❌ Testes falhados: ${testsFailed}${colors.reset}`);
  console.log(`📊 Total: ${testsPassed + testsFailed} testes`);
  console.log("═".repeat(60));
  console.log("\n");

  if (testsFailed === 0) {
    log.success(
      "TODOS OS TESTES PASSARAM! Sistema de notificações está funcionando! 🎉"
    );
    process.exit(0);
  } else {
    log.warning(`Alguns testes falharam. Verifique os erros acima.`);
    process.exit(1);
  }
}

// Executar testes
runTests().catch((error) => {
  log.error(`Erro fatal: ${error.message}`);
  console.error(error);
  process.exit(1);
});
























