const {
  Autopeca,
  Usuario,
  Solicitacao,
  Cliente,
  SolicitacoesAtendimento,
} = require("../models");

/**
 * Controller de Autopeças
 * Gerencia operações específicas de autopeças
 */
class AutopecaController {
  /**
   * Buscar perfil da autopeça logada
   * GET /api/autopecas/profile
   *
   * @param {Object} req - Request object (deve conter req.user do middleware)
   * @param {Object} res - Response object
   */
  static async getProfile(req, res) {
    try {
      // req.user é adicionado pelo middleware de autenticação
      const { userId, tipo } = req.user;

      // Verificar se o usuário é do tipo autopeca
      if (tipo !== "autopeca") {
        return res.status(403).json({
          success: false,
          message: "Acesso negado",
          errors: {
            tipo_usuario: "Esta operação é exclusiva para autopeças",
          },
        });
      }

      // Buscar dados completos da autopeça incluindo dados do usuário
      const autopeca = await Autopeca.findOne({
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
              "termos_aceitos",
              "data_aceite_terms",
              "consentimento_marketing",
              "data_criacao",
              "data_atualizacao",
            ],
          },
        ],
      });

      if (!autopeca) {
        return res.status(404).json({
          success: false,
          message: "Autopeça não encontrada",
          errors: {
            autopeca: "Perfil de autopeça não encontrado para este usuário",
          },
        });
      }

      // Verificar se a conta está ativa
      if (!autopeca.usuario.ativo) {
        return res.status(403).json({
          success: false,
          message: "Conta inativa",
          errors: {
            conta: "Sua conta está inativa. Entre em contato com o suporte.",
          },
        });
      }

      // Preparar dados de resposta
      const responseData = {
        autopeca: {
          id: autopeca.id,
          razao_social: autopeca.razao_social,
          nome_fantasia: autopeca.nome_fantasia,
          cnpj: autopeca.cnpj,
          telefone: autopeca.telefone,
          endereco_rua: autopeca.endereco_rua,
          endereco_numero: autopeca.endereco_numero,
          endereco_bairro: autopeca.endereco_bairro,
          endereco_cidade: autopeca.endereco_cidade,
          endereco_uf: autopeca.endereco_uf,
          endereco_cep: autopeca.endereco_cep,
          created_at: autopeca.data_criacao,
          updated_at: autopeca.data_atualizacao,
        },
        usuario: {
          id: autopeca.usuario.id,
          email: autopeca.usuario.email,
          tipo_usuario: autopeca.usuario.tipo_usuario,
          ativo: autopeca.usuario.ativo,
          termos_aceitos: autopeca.usuario.termos_aceitos,
          data_aceite_terms: autopeca.usuario.data_aceite_terms,
          consentimento_marketing: autopeca.usuario.consentimento_marketing,
          created_at: autopeca.usuario.data_criacao,
          updated_at: autopeca.usuario.data_atualizacao,
        },
      };

      return res.status(200).json({
        success: true,
        message: "Perfil da autopeça recuperado com sucesso",
        data: responseData,
      });
    } catch (error) {
      console.error("Erro ao buscar perfil da autopeça:", error);

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
   * Atualizar perfil da autopeça
   * PUT /api/autopecas/profile
   *
   * @param {Object} req - Request object (deve conter req.user do middleware)
   * @param {Object} res - Response object
   */
  static async updateProfile(req, res) {
    const transaction = await Autopeca.sequelize.transaction();

    try {
      // req.user é adicionado pelo middleware de autenticação
      const { userId, tipo } = req.user;

      // Verificar se o usuário é do tipo autopeca
      if (tipo !== "autopeca") {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: "Acesso negado",
          errors: {
            tipo_usuario: "Esta operação é exclusiva para autopeças",
          },
        });
      }

      // Campos permitidos para atualização
      const camposPermitidos = [
        "nome_fantasia",
        "telefone",
        "endereco_rua",
        "endereco_numero",
        "endereco_bairro",
        "endereco_cidade",
        "endereco_uf",
        "endereco_cep",
      ];

      // Filtrar apenas campos permitidos
      const dadosAtualizacao = {};
      Object.keys(req.body).forEach((campo) => {
        if (camposPermitidos.includes(campo) && req.body[campo] !== undefined) {
          dadosAtualizacao[campo] = req.body[campo];
        }
      });

      // Verificar se há dados para atualizar
      if (Object.keys(dadosAtualizacao).length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Nenhum campo válido para atualização",
          errors: {
            campos: `Campos permitidos para atualização: ${camposPermitidos.join(
              ", "
            )}`,
          },
        });
      }

      // Validações específicas dos campos
      const errors = {};

      // Validar telefone se fornecido
      if (dadosAtualizacao.telefone) {
        const telefoneRegex = /^\([0-9]{2}\)[0-9]{4,5}-?[0-9]{4}$/;
        if (!telefoneRegex.test(dadosAtualizacao.telefone)) {
          errors.telefone =
            "Formato de telefone inválido. Use o formato: (11)99999-9999";
        }
      }

      // Validar UF se fornecida
      if (dadosAtualizacao.endereco_uf) {
        const ufsValidas = [
          "AC",
          "AL",
          "AP",
          "AM",
          "BA",
          "CE",
          "DF",
          "ES",
          "GO",
          "MA",
          "MT",
          "MS",
          "MG",
          "PA",
          "PB",
          "PR",
          "PE",
          "PI",
          "RJ",
          "RN",
          "RS",
          "RO",
          "RR",
          "SC",
          "SP",
          "SE",
          "TO",
        ];
        if (
          !dadosAtualizacao.endereco_uf ||
          dadosAtualizacao.endereco_uf.length !== 2 ||
          !ufsValidas.includes(
            dadosAtualizacao.endereco_uf.toUpperCase().trim()
          )
        ) {
          errors.endereco_uf = "UF inválida";
        }
      }

      // Validar CEP se fornecido
      if (dadosAtualizacao.endereco_cep) {
        const cepRegex = /^[0-9]{8}$/;
        if (!cepRegex.test(dadosAtualizacao.endereco_cep)) {
          errors.endereco_cep =
            "CEP deve conter exatamente 8 dígitos numéricos";
        }
      }

      // Se há erros de validação, retornar 400
      if (Object.keys(errors).length > 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Dados inválidos",
          errors,
        });
      }

      // Buscar autopeça existente
      const autopeca = await Autopeca.findOne({
        where: { usuario_id: userId },
        include: [
          {
            model: Usuario,
            as: "usuario",
            attributes: ["ativo"],
          },
        ],
        transaction,
      });

      if (!autopeca) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Autopeça não encontrada",
          errors: {
            autopeca: "Perfil de autopeça não encontrado para este usuário",
          },
        });
      }

      // Verificar se a conta está ativa
      if (!autopeca.usuario.ativo) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: "Conta inativa",
          errors: {
            conta: "Sua conta está inativa. Entre em contato com o suporte.",
          },
        });
      }

      // Atualizar campos da autopeça
      await autopeca.update(dadosAtualizacao, { transaction });

      // Commit da transação
      await transaction.commit();

      // Buscar dados atualizados para retornar
      const autopecaAtualizada = await Autopeca.findOne({
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
              "termos_aceitos",
              "data_aceite_terms",
              "consentimento_marketing",
              "data_criacao",
              "data_atualizacao",
            ],
          },
        ],
      });

      // Preparar dados de resposta
      const responseData = {
        autopeca: {
          id: autopecaAtualizada.id,
          razao_social: autopecaAtualizada.razao_social,
          nome_fantasia: autopecaAtualizada.nome_fantasia,
          cnpj: autopecaAtualizada.cnpj,
          telefone: autopecaAtualizada.telefone,
          endereco_rua: autopecaAtualizada.endereco_rua,
          endereco_numero: autopecaAtualizada.endereco_numero,
          endereco_bairro: autopecaAtualizada.endereco_bairro,
          endereco_cidade: autopecaAtualizada.endereco_cidade,
          endereco_uf: autopecaAtualizada.endereco_uf,
          endereco_cep: autopecaAtualizada.endereco_cep,
          created_at: autopecaAtualizada.data_criacao,
          updated_at: autopecaAtualizada.data_atualizacao,
        },
        usuario: {
          id: autopecaAtualizada.usuario.id,
          email: autopecaAtualizada.usuario.email,
          tipo_usuario: autopecaAtualizada.usuario.tipo_usuario,
          ativo: autopecaAtualizada.usuario.ativo,
          termos_aceitos: autopecaAtualizada.usuario.termos_aceitos,
          data_aceite_terms: autopecaAtualizada.usuario.data_aceite_terms,
          consentimento_marketing:
            autopecaAtualizada.usuario.consentimento_marketing,
          created_at: autopecaAtualizada.usuario.created_at,
          updated_at: autopecaAtualizada.usuario.updated_at,
        },
      };

      return res.status(200).json({
        success: true,
        message: "Perfil da autopeça atualizado com sucesso",
        data: responseData,
      });
    } catch (error) {
      // Rollback da transação em caso de erro
      await transaction.rollback();

      console.error("Erro ao atualizar perfil da autopeça:", error);

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

  /**
   * Listar solicitações disponíveis na mesma cidade
   * GET /api/autopecas/solicitacoes-disponiveis
   *
   * @param {Object} req - Request object (deve conter req.user do middleware)
   * @param {Object} res - Response object
   */
  static async getSolicitacoesDisponiveis(req, res) {
    try {
      // req.user é adicionado pelo middleware de autenticação
      const { userId, tipo } = req.user;

      // Verificar se o usuário é do tipo autopeca
      if (tipo !== "autopeca") {
        return res.status(403).json({
          success: false,
          message: "Acesso negado",
          errors: {
            tipo_usuario: "Esta operação é exclusiva para autopeças",
          },
        });
      }

      // 1. Buscar autopeça logada para saber a cidade
      const autopeca = await Autopeca.findOne({
        where: { usuario_id: userId },
        attributes: ["id", "endereco_cidade", "endereco_uf"],
      });

      if (!autopeca) {
        return res.status(404).json({
          success: false,
          message: "Autopeça não encontrada",
          errors: {
            autopeca: "Perfil de autopeça não encontrado para este usuário",
          },
        });
      }

      // 2. Buscar solicitações ativas da mesma cidade
      const solicitacoes = await Solicitacao.findAll({
        where: {
          status_cliente: "ativa",
          cidade_atendimento: autopeca.endereco_cidade,
          uf_atendimento: autopeca.endereco_uf,
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
              autopeca_id: autopeca.id,
            },
            required: false, // LEFT JOIN para incluir mesmo se não houver atendimento
          },
        ],
        order: [["data_criacao", "DESC"]],
      });

      // 3. Filtrar apenas solicitações não atendidas por esta autopeça
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
            cidade: autopeca.endereco_cidade,
            uf: autopeca.endereco_uf,
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
   * Marcar solicitação como atendida pela autopeça
   * POST /api/autopecas/solicitacoes/:solicitacaoId/atender
   *
   * @param {Object} req - Request object (deve conter req.user do middleware)
   * @param {Object} res - Response object
   */
  static async marcarComoAtendida(req, res) {
    const transaction = await Autopeca.sequelize.transaction();

    try {
      // req.user é adicionado pelo middleware de autenticação
      const { userId, tipo } = req.user;
      let { solicitacaoId } = req.params;
      // Remover ":" se existir no início (validação defensiva)
      solicitacaoId = solicitacaoId.startsWith(":")
        ? solicitacaoId.slice(1)
        : solicitacaoId;

      // Verificar se o usuário é do tipo autopeca
      if (tipo !== "autopeca") {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: "Acesso negado",
          errors: {
            tipo_usuario: "Esta operação é exclusiva para autopeças",
          },
        });
      }

      // 1. Buscar autopeça logada
      const autopeca = await Autopeca.findOne({
        where: { usuario_id: userId },
        attributes: ["id", "razao_social", "nome_fantasia"],
        transaction,
      });

      if (!autopeca) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Autopeça não encontrada",
          errors: {
            autopeca: "Perfil de autopeça não encontrado para este usuário",
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

      // 3. Verificar se autopeça já atendeu esta solicitação
      const atendimentoExistente = await SolicitacoesAtendimento.findOne({
        where: {
          solicitacao_id: solicitacaoId,
          autopeca_id: autopeca.id,
        },
        transaction,
      });

      if (atendimentoExistente) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: "Solicitação já atendida",
          errors: {
            atendimento: "Esta autopeça já atendeu esta solicitação",
          },
        });
      }

      // 4. Verificar se outro vendedor da MESMA autopeça já atendeu
      const vendedorAtendimentoExistente =
        await SolicitacoesAtendimento.findOne({
          where: {
            solicitacao_id: solicitacaoId,
            autopeca_id: autopeca.id,
          },
          include: [
            {
              model: Autopeca,
              as: "autopeca",
              where: { id: autopeca.id },
              required: true,
            },
          ],
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
          autopeca_id: autopeca.id,
          vendedor_id: null, // Atendimento direto pela autopeça
          status_atendimento: "nao_lida",
        },
        { transaction }
      );

      // 5.1. Criar notificação IN-APP para o cliente
      const NotificationService = require("../services/notificationService");
      await NotificationService.notificarClienteSolicitacaoAtendida(
        solicitacao,
        solicitacao.cliente,
        autopeca,
        null // sem vendedor
      );

      // 6. Gerar link do WhatsApp com dados do cliente
      const nomeAutopeca = autopeca.nome_fantasia || autopeca.razao_social;
      const nomeCliente = solicitacao.cliente.nome_completo;
      const celularCliente = solicitacao.cliente.celular.replace(/\D/g, ""); // Remove formatação
      const descricaoPeca = solicitacao.descricao_peca;
      const veiculo = `${solicitacao.marca} ${solicitacao.modelo} ${solicitacao.ano_fabricacao}`;

      // Template da mensagem
      const mensagem = `Olá ${nomeCliente}! 👋

Vi sua solicitação de *${descricaoPeca}* para *${veiculo}* no PeçaJá.

Sou da *${nomeAutopeca}* e gostaria de ajudar você com essa peça.

Podemos conversar sobre preço e disponibilidade? 😊

Atenciosamente,
Equipe ${nomeAutopeca}`;

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
            autopeca_id: autopeca.id,
            status_atendimento: novoAtendimento.status_atendimento,
            data_marcacao: novoAtendimento.data_marcacao,
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

module.exports = AutopecaController;
