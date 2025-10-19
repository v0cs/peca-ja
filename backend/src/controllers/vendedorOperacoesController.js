const {
  Vendedor,
  Usuario,
  Autopeca,
  Solicitacao,
  Cliente,
  SolicitacoesAtendimento,
} = require("../models");

/**
 * Controller de Operações de Vendedores
 * Gerencia operações específicas dos vendedores das autopeças
 */
class VendedorOperacoesController {
  /**
   * Dashboard do vendedor
   * GET /api/vendedor/dashboard
   *
   * @param {Object} req - Request object (deve conter req.user do middleware)
   * @param {Object} res - Response object
   */
  static async getDashboard(req, res) {
    try {
      // req.user é adicionado pelo middleware de autenticação
      const { userId, tipo } = req.user;

      // Verificar se o usuário é do tipo vendedor
      if (tipo !== "vendedor") {
        return res.status(403).json({
          success: false,
          message: "Acesso negado",
          errors: {
            tipo_usuario: "Esta operação é exclusiva para vendedores",
          },
        });
      }

      // Buscar dados completos do vendedor
      const vendedor = await Vendedor.findOne({
        where: { usuario_id: userId },
        include: [
          {
            model: Usuario,
            as: "usuario",
            attributes: [
              "id",
              "email",
              "tipo_usuario",
              "ativo",
              "data_criacao",
              "data_atualizacao",
            ],
          },
          {
            model: Autopeca,
            as: "autopeca",
            attributes: [
              "id",
              "razao_social",
              "nome_fantasia",
              "endereco_cidade",
              "endereco_uf",
            ],
          },
        ],
      });

      if (!vendedor) {
        return res.status(404).json({
          success: false,
          message: "Vendedor não encontrado",
          errors: {
            vendedor: "Perfil de vendedor não encontrado para este usuário",
          },
        });
      }

      // Verificar se a conta está ativa
      if (!vendedor.ativo || !vendedor.usuario.ativo) {
        return res.status(403).json({
          success: false,
          message: "Conta inativa",
          errors: {
            conta: "Sua conta está inativa. Entre em contato com o suporte.",
          },
        });
      }

      // Buscar estatísticas do vendedor
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // Solicitações atendidas hoje
      const atendimentosHoje = await SolicitacoesAtendimento.count({
        where: {
          vendedor_id: vendedor.id,
          data_marcacao: {
            [require("sequelize").Op.gte]: hoje,
          },
        },
      });

      // Total de solicitações atendidas pelo vendedor
      const totalAtendimentos = await SolicitacoesAtendimento.count({
        where: {
          vendedor_id: vendedor.id,
        },
      });

      // Solicitações disponíveis na cidade da autopeça
      const solicitacoesDisponiveis = await Solicitacao.count({
        where: {
          status_cliente: "ativa",
          cidade_atendimento: vendedor.autopeca.endereco_cidade,
          uf_atendimento: vendedor.autopeca.endereco_uf,
        },
        include: [
          {
            model: SolicitacoesAtendimento,
            as: "atendimentos",
            where: {
              [require("sequelize").Op.or]: [
                { autopeca_id: vendedor.autopeca_id },
                { vendedor_id: vendedor.id },
              ],
            },
            required: false,
          },
        ],
        having: require("sequelize").literal("COUNT(atendimentos.id) = 0"),
      });

      // Preparar dados de resposta
      const responseData = {
        vendedor: {
          id: vendedor.id,
          nome_completo: vendedor.nome_completo,
          ativo: vendedor.ativo,
          created_at: vendedor.data_criacao,
          updated_at: vendedor.data_atualizacao,
        },
        usuario: {
          id: vendedor.usuario.id,
          email: vendedor.usuario.email,
          tipo_usuario: vendedor.usuario.tipo_usuario,
          ativo: vendedor.usuario.ativo,
          created_at: vendedor.usuario.data_criacao,
          updated_at: vendedor.usuario.data_atualizacao,
        },
        autopeca: {
          id: vendedor.autopeca.id,
          razao_social: vendedor.autopeca.razao_social,
          nome_fantasia: vendedor.autopeca.nome_fantasia,
          cidade: vendedor.autopeca.endereco_cidade,
          uf: vendedor.autopeca.endereco_uf,
        },
        estatisticas: {
          atendimentos_hoje: atendimentosHoje,
          total_atendimentos: totalAtendimentos,
          solicitacoes_disponiveis: solicitacoesDisponiveis,
        },
      };

      return res.status(200).json({
        success: true,
        message: "Dashboard do vendedor recuperado com sucesso",
        data: responseData,
      });
    } catch (error) {
      console.error("Erro ao buscar dashboard do vendedor:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        },
      });
    }
  }

  /**
   * Listar solicitações disponíveis para o vendedor
   * GET /api/vendedor/solicitacoes-disponiveis
   *
   * @param {Object} req - Request object (deve conter req.user do middleware)
   * @param {Object} res - Response object
   */
  static async getSolicitacoesDisponiveis(req, res) {
    try {
      // req.user é adicionado pelo middleware de autenticação
      const { userId, tipo } = req.user;

      // Verificar se o usuário é do tipo vendedor
      if (tipo !== "vendedor") {
        return res.status(403).json({
          success: false,
          message: "Acesso negado",
          errors: {
            tipo_usuario: "Esta operação é exclusiva para vendedores",
          },
        });
      }

      // 1. Buscar vendedor e sua autopeça para saber a cidade
      const vendedor = await Vendedor.findOne({
        where: { usuario_id: userId },
        include: [
          {
            model: Autopeca,
            as: "autopeca",
            attributes: ["id", "endereco_cidade", "endereco_uf"],
          },
        ],
      });

      if (!vendedor) {
        return res.status(404).json({
          success: false,
          message: "Vendedor não encontrado",
          errors: {
            vendedor: "Perfil de vendedor não encontrado para este usuário",
          },
        });
      }

      // 2. Buscar solicitações ativas da mesma cidade
      const solicitacoes = await Solicitacao.findAll({
        where: {
          status_cliente: "ativa",
          cidade_atendimento: vendedor.autopeca.endereco_cidade,
          uf_atendimento: vendedor.autopeca.endereco_uf,
        },
        include: [
          {
            model: Cliente,
            as: "cliente",
            attributes: ["id", "nome_completo", "celular", "cidade", "uf"],
            include: [
              {
                model: Usuario,
                as: "usuario",
                attributes: ["email"],
              },
            ],
          },
          {
            model: SolicitacoesAtendimento,
            as: "atendimentos",
            where: {
              [require("sequelize").Op.or]: [
                { autopeca_id: vendedor.autopeca_id },
                { vendedor_id: vendedor.id },
              ],
            },
            required: false, // LEFT JOIN para incluir mesmo se não houver atendimento
          },
        ],
        order: [["data_criacao", "DESC"]],
      });

      // 3. Filtrar solicitações NÃO atendidas por ESTA autopeça
      const solicitacoesDisponiveis = solicitacoes.filter(
        (solicitacao) => solicitacao.atendimentos.length === 0
      );

      // 4. Preparar dados de resposta com informações básicas
      const responseData = solicitacoesDisponiveis.map((solicitacao) => ({
        id: solicitacao.id,
        descricao_peca: solicitacao.descricao_peca,
        placa: solicitacao.placa,
        marca: solicitacao.marca,
        modelo: solicitacao.modelo,
        ano_fabricacao: solicitacao.ano_fabricacao,
        ano_modelo: solicitacao.ano_modelo,
        categoria: solicitacao.categoria,
        cor: solicitacao.cor,
        cidade_atendimento: solicitacao.cidade_atendimento,
        uf_atendimento: solicitacao.uf_atendimento,
        origem_dados_veiculo: solicitacao.origem_dados_veiculo,
        data_criacao: solicitacao.data_criacao,
        cliente: {
          id: solicitacao.cliente.id,
          nome_completo: solicitacao.cliente.nome_completo,
          celular: solicitacao.cliente.celular,
          cidade: solicitacao.cliente.cidade,
          uf: solicitacao.cliente.uf,
        },
      }));

      return res.status(200).json({
        success: true,
        message: "Solicitações disponíveis recuperadas com sucesso",
        data: {
          solicitacoes: responseData,
          total: responseData.length,
          filtros: {
            cidade: vendedor.autopeca.endereco_cidade,
            uf: vendedor.autopeca.endereco_uf,
            status: "ativa",
          },
        },
      });
    } catch (error) {
      console.error("Erro ao buscar solicitações disponíveis:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        },
      });
    }
  }

  /**
   * Marcar solicitação como atendida pelo vendedor
   * POST /api/vendedor/solicitacoes/:solicitacaoId/atender
   *
   * @param {Object} req - Request object (deve conter req.user do middleware)
   * @param {Object} res - Response object
   */
  static async marcarComoAtendida(req, res) {
    const transaction = await Vendedor.sequelize.transaction();

    try {
      // req.user é adicionado pelo middleware de autenticação
      const { userId, tipo } = req.user;
      let { solicitacaoId } = req.params;
      // Remover ":" se existir no início (validação defensiva)
      solicitacaoId = solicitacaoId.startsWith(":")
        ? solicitacaoId.slice(1)
        : solicitacaoId;

      // Verificar se o usuário é do tipo vendedor
      if (tipo !== "vendedor") {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: "Acesso negado",
          errors: {
            tipo_usuario: "Esta operação é exclusiva para vendedores",
          },
        });
      }

      // 1. Buscar vendedor e sua autopeça
      const vendedor = await Vendedor.findOne({
        where: { usuario_id: userId },
        include: [
          {
            model: Autopeca,
            as: "autopeca",
            attributes: ["id", "razao_social", "nome_fantasia"],
          },
        ],
        transaction,
      });

      if (!vendedor) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Vendedor não encontrado",
          errors: {
            vendedor: "Perfil de vendedor não encontrado para este usuário",
          },
        });
      }

      // 2. Buscar solicitação e verificar se existe e está ativa
      const solicitacao = await Solicitacao.findOne({
        where: {
          id: solicitacaoId,
          status_cliente: "ativa",
        },
        include: [
          {
            model: Cliente,
            as: "cliente",
            attributes: ["id", "nome_completo", "celular"],
          },
        ],
        transaction,
      });

      if (!solicitacao) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Solicitação não encontrada ou inativa",
          errors: {
            solicitacao: "Solicitação não existe ou não está mais ativa",
          },
        });
      }

      // 3. Verificar se vendedor já atendeu esta solicitação
      const atendimentoExistente = await SolicitacoesAtendimento.findOne({
        where: {
          solicitacao_id: solicitacaoId,
          vendedor_id: vendedor.id,
        },
        transaction,
      });

      if (atendimentoExistente) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: "Solicitação já atendida",
          errors: {
            atendimento: "Este vendedor já atendeu esta solicitação",
          },
        });
      }

      // 4. Verificar se OUTRO vendedor da MESMA autopeça já atendeu
      const vendedorAtendimentoExistente =
        await SolicitacoesAtendimento.findOne({
          where: {
            solicitacao_id: solicitacaoId,
            autopeca_id: vendedor.autopeca_id,
          },
          transaction,
        });

      if (vendedorAtendimentoExistente) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: "Conflito de atendimento",
          errors: {
            conflito:
              "Outro vendedor desta autopeça já atendeu esta solicitação",
          },
        });
      }

      // 5. Criar registro em SolicitacoesAtendimento
      const novoAtendimento = await SolicitacoesAtendimento.create(
        {
          solicitacao_id: solicitacaoId,
          autopeca_id: vendedor.autopeca_id,
          vendedor_id: vendedor.id, // Incluir vendedor_id no registro
          status_atendimento: "nao_lida",
        },
        { transaction }
      );

      // 5.1. Criar notificações IN-APP
      const NotificationService = require("../services/notificationService");

      // Notificar cliente
      await NotificationService.notificarClienteSolicitacaoAtendida(
        solicitacao,
        solicitacao.cliente,
        vendedor.autopeca,
        vendedor
      );

      // Notificar admin da autopeça
      await NotificationService.notificarAutopecaVendedorAtendeu(
        solicitacao,
        vendedor,
        vendedor.autopeca
      );

      // Notificar outros vendedores da mesma autopeça
      await NotificationService.notificarOutrosVendedoresPerderam(
        solicitacao,
        vendedor.autopeca_id,
        vendedor.id
      );

      // 6. Gerar link do WhatsApp com dados do cliente
      const nomeAutopeca =
        vendedor.autopeca.nome_fantasia || vendedor.autopeca.razao_social;
      const nomeVendedor = vendedor.nome_completo;
      const nomeCliente = solicitacao.cliente.nome_completo;
      const celularCliente = solicitacao.cliente.celular.replace(/\D/g, ""); // Remove formatação
      const descricaoPeca = solicitacao.descricao_peca;
      const veiculo = `${solicitacao.marca} ${solicitacao.modelo} ${solicitacao.ano_fabricacao}`;

      // Template da mensagem
      const mensagem = `Olá ${nomeCliente}! 👋

Vi sua solicitação de *${descricaoPeca}* para *${veiculo}* no PeçaJá.

Sou o *${nomeVendedor}* da *${nomeAutopeca}* e gostaria de ajudar você com essa peça.

Podemos conversar sobre preço e disponibilidade? 😊

Atenciosamente,
${nomeVendedor}
${nomeAutopeca}`;

      // Codificar mensagem para URL
      const mensagemCodificada = encodeURIComponent(mensagem);

      // Gerar link do WhatsApp
      const linkWhatsApp = `https://wa.me/55${celularCliente}?text=${mensagemCodificada}`;

      // 7. Commit da transação
      await transaction.commit();

      // 8. Retornar sucesso com link do WhatsApp
      return res.status(200).json({
        success: true,
        message: "Solicitação marcada como atendida com sucesso",
        data: {
          atendimento: {
            id: novoAtendimento.id,
            solicitacao_id: solicitacaoId,
            autopeca_id: vendedor.autopeca_id,
            vendedor_id: vendedor.id,
            status_atendimento: novoAtendimento.status_atendimento,
            data_marcacao: novoAtendimento.data_marcacao,
          },
          vendedor: {
            id: vendedor.id,
            nome_completo: vendedor.nome_completo,
          },
          cliente: {
            id: solicitacao.cliente.id,
            nome_completo: solicitacao.cliente.nome_completo,
            celular: solicitacao.cliente.celular,
          },
          veiculo: {
            marca: solicitacao.marca,
            modelo: solicitacao.modelo,
            ano_fabricacao: solicitacao.ano_fabricacao,
            placa: solicitacao.placa,
          },
          link_whatsapp: linkWhatsApp,
          mensagem_template: mensagem,
        },
      });
    } catch (error) {
      // Rollback da transação em caso de erro
      await transaction.rollback();

      console.error("Erro ao marcar solicitação como atendida:", error);

      // Verificar tipo de erro do Sequelize
      if (error.name === "SequelizeValidationError") {
        const validationErrors = {};
        error.errors.forEach((err) => {
          validationErrors[err.path] = err.message;
        });

        return res.status(400).json({
          success: false,
          message: "Erro de validação nos dados",
          errors: validationErrors,
        });
      }

      if (error.name === "SequelizeForeignKeyConstraintError") {
        return res.status(400).json({
          success: false,
          message: "Erro de relacionamento entre dados",
          errors: {
            message: "Dados relacionados inválidos",
          },
        });
      }

      // Erro interno do servidor (500)
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        },
      });
    }
  }
}

module.exports = VendedorOperacoesController;
