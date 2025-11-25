const {
  Autopeca,
  Usuario,
  Solicitacao,
  Cliente,
  SolicitacoesAtendimento,
  ImagemSolicitacao,
  Vendedor,
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
        "razao_social",
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

      // Validar razão social se fornecida
      if (dadosAtualizacao.razao_social) {
        if (dadosAtualizacao.razao_social.trim().length < 2) {
          errors.razao_social =
            "Razão social deve ter pelo menos 2 caracteres";
        } else {
          dadosAtualizacao.razao_social = dadosAtualizacao.razao_social.trim();
        }
      }

      // Validar telefone se fornecido
      if (dadosAtualizacao.telefone) {
        const telefoneRegex = /^\([0-9]{2}\)[0-9]{4,5}-?[0-9]{4}$/;
        if (!telefoneRegex.test(dadosAtualizacao.telefone)) {
          errors.telefone =
            "Formato de telefone inválido. Use o formato: (11)99999-9999";
        } else {
          const telefoneDigits = dadosAtualizacao.telefone.replace(/\D/g, "");
          dadosAtualizacao.telefone = `(${telefoneDigits.slice(
            0,
            2
          )})${telefoneDigits.slice(2)}`;
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
        } else {
          dadosAtualizacao.endereco_uf =
            dadosAtualizacao.endereco_uf.toUpperCase().trim();
        }
      }

      // Validar CEP se fornecido
      if (dadosAtualizacao.endereco_cep) {
        const cepRegex = /^[0-9]{8}$/;
        if (!cepRegex.test(dadosAtualizacao.endereco_cep)) {
          errors.endereco_cep =
            "CEP deve conter exatamente 8 dígitos numéricos";
        } else {
          dadosAtualizacao.endereco_cep =
            dadosAtualizacao.endereco_cep.replace(/\D/g, "");
        }
      }

      // Normalizar campos de endereço se fornecidos
      ["nome_fantasia", "endereco_rua", "endereco_numero", "endereco_bairro", "endereco_cidade"].forEach(
        (campo) => {
          if (
            dadosAtualizacao[campo] !== undefined &&
            typeof dadosAtualizacao[campo] === "string"
          ) {
            dadosAtualizacao[campo] = dadosAtualizacao[campo].trim();
        }
      }
      );

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
          created_at: autopecaAtualizada.usuario.data_criacao,
          updated_at: autopecaAtualizada.usuario.data_atualizacao,
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
          // NÃO incluir dados do cliente - autopeças não devem ter acesso
          // Apenas dados da solicitação e do veículo
          {
            model: SolicitacoesAtendimento,
            as: "atendimentos",
            where: {
              autopeca_id: autopeca.id,
            },
            attributes: [
              "id",
              "status_atendimento",
              "vendedor_id",
            ],
            required: false, // LEFT JOIN para incluir mesmo se não houver atendimento
          },
          {
            model: ImagemSolicitacao,
            as: "imagens",
            attributes: [
              "id",
              "nome_arquivo",
              "nome_arquivo_fisico",
              "ordem_exibicao",
            ],
            required: false,
          },
        ],
        order: [["data_criacao", "DESC"]],
        distinct: true,
      });

      // 3. Filtrar apenas solicitações não atendidas e não marcadas como lidas por esta autopeça
      // Excluir solicitações que tenham status "lida" ou "atendida"
      const solicitacoesDisponiveis = solicitacoes.filter((solicitacao) => {
        if (solicitacao.atendimentos.length === 0) {
          return true; // Não tem registro de atendimento, está disponível
        }

        const possuiAtendimentoConcluido = solicitacao.atendimentos.some(
          (atendimento) => atendimento.status_atendimento === "atendida"
        );

        if (possuiAtendimentoConcluido) {
          return false;
        }

        const marcadaComoVistaPelaAutopeca = solicitacao.atendimentos.some(
          (atendimento) =>
            atendimento.status_atendimento === "lida" &&
            atendimento.vendedor_id === null
        );

        // Se apenas vendedores marcaram como vista, continua disponível
        return !marcadaComoVistaPelaAutopeca;
      });

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
        status_cliente: solicitacao.status_cliente,
        imagens: solicitacao.imagens
          ? solicitacao.imagens.map((img) => ({
              id: img.id,
              nome_arquivo: img.nome_arquivo,
              nome_arquivo_fisico: img.nome_arquivo_fisico,
              url: img.caminho_arquivo, // URL correta (S3 ou local)
              ordem_exibicao: img.ordem_exibicao,
            }))
          : [],
        // NÃO incluir dados do cliente - autopeças não devem ter acesso
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
   * Buscar solicitações atendidas pela autopeça
   * GET /api/autopecas/solicitacoes-atendidas
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getSolicitacoesAtendidas(req, res) {
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

      // 1. Buscar autopeça logada
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

      // 2. Buscar solicitações atendidas por esta autopeça
      // Apenas status "atendida", não incluir "lida" (vistas)
      const atendimentos = await SolicitacoesAtendimento.findAll({
        where: {
          autopeca_id: autopeca.id,
          status_atendimento: "atendida", // Apenas atendidas, não vistas
        },
        include: [
          {
            model: Solicitacao,
            as: "solicitacao",
            attributes: [
              "id",
              "descricao_peca",
              "placa",
              "marca",
              "modelo",
              "ano_fabricacao",
              "ano_modelo",
              "categoria",
              "cor",
              "cidade_atendimento",
              "uf_atendimento",
              "origem_dados_veiculo",
              "data_criacao",
              "status_cliente",
            ],
            include: [
              {
                model: ImagemSolicitacao,
                as: "imagens",
                attributes: [
                  "id",
                  "nome_arquivo",
                  "nome_arquivo_fisico",
                  "ordem_exibicao",
                ],
                required: false,
              },
            ],
          },
          {
            model: Vendedor,
            as: "vendedor",
            attributes: ["id", "nome_completo"],
            required: false,
          },
        ],
        order: [["data_marcacao", "DESC"]],
      });

      // 3. Preparar dados de resposta
      const responseData = atendimentos
        .filter((atendimento) => atendimento.solicitacao) // Filtrar solicitações que ainda existem
        .map((atendimento) => {
          const solicitacao = atendimento.solicitacao;
          return {
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
            status_cliente: solicitacao.status_cliente,
            data_atendimento: atendimento.data_marcacao,
            vendedor: atendimento.vendedor
              ? {
                  id: atendimento.vendedor.id,
                  nome_completo: atendimento.vendedor.nome_completo,
                }
              : null,
            imagens: solicitacao.imagens
              ? solicitacao.imagens.map((img) => ({
                  id: img.id,
                  nome_arquivo: img.nome_arquivo,
                  nome_arquivo_fisico: img.nome_arquivo_fisico,
                  url: img.caminho_arquivo, // URL correta (S3 ou local)
                  ordem_exibicao: img.ordem_exibicao,
                }))
              : [],
            // NÃO incluir dados do cliente - autopeças não devem ter acesso
          };
        });

      return res.status(200).json({
        success: true,
        message: "Solicitações atendidas recuperadas com sucesso",
        data: {
          solicitacoes: responseData,
          total: responseData.length,
        },
      });
    } catch (error) {
      console.error("Erro ao buscar solicitações atendidas:", error);

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
   * Buscar solicitações marcadas como vistas pela autopeça
   * GET /api/autopecas/solicitacoes-vistas
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getSolicitacoesVistas(req, res) {
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

      // 1. Buscar autopeça logada
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

      // 2. Buscar solicitações marcadas como "lida" por esta autopeça
      // Apenas status "lida", não incluir "atendida"
      const atendimentos = await SolicitacoesAtendimento.findAll({
        where: {
          autopeca_id: autopeca.id,
          status_atendimento: "lida", // Apenas vistas, não atendidas
          vendedor_id: null,
        },
        include: [
          {
            model: Solicitacao,
            as: "solicitacao",
            attributes: [
              "id",
              "descricao_peca",
              "placa",
              "marca",
              "modelo",
              "ano_fabricacao",
              "ano_modelo",
              "categoria",
              "cor",
              "cidade_atendimento",
              "uf_atendimento",
              "origem_dados_veiculo",
              "data_criacao",
              "status_cliente",
            ],
            include: [
              {
                model: ImagemSolicitacao,
                as: "imagens",
                attributes: [
                  "id",
                  "nome_arquivo",
                  "nome_arquivo_fisico",
                  "ordem_exibicao",
                ],
                required: false,
              },
            ],
          },
        ],
        order: [["data_marcacao", "DESC"]],
      });

      // 3. Preparar dados de resposta
      const responseData = atendimentos
        .filter((atendimento) => atendimento.solicitacao) // Filtrar solicitações que ainda existem
        .map((atendimento) => {
          const solicitacao = atendimento.solicitacao;
          return {
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
            status_cliente: solicitacao.status_cliente,
            data_marcacao: atendimento.data_marcacao,
            imagens: solicitacao.imagens
              ? solicitacao.imagens.map((img) => ({
                  id: img.id,
                  nome_arquivo: img.nome_arquivo,
                  nome_arquivo_fisico: img.nome_arquivo_fisico,
                  url: img.caminho_arquivo, // URL correta (S3 ou local)
                  ordem_exibicao: img.ordem_exibicao,
                }))
              : [],
            // NÃO incluir dados do cliente - autopeças não devem ter acesso
          };
        });

      return res.status(200).json({
        success: true,
        message: "Solicitações vistas recuperadas com sucesso",
        data: {
          solicitacoes: responseData,
          total: responseData.length,
        },
      });
    } catch (error) {
      console.error("Erro ao buscar solicitações vistas:", error);

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

      // 3. Verificar se autopeça já tem registro para esta solicitação
      let atendimentoExistente = await SolicitacoesAtendimento.findOne({
        where: {
          solicitacao_id: solicitacaoId,
          autopeca_id: autopeca.id,
        },
        transaction,
      });

      let novoAtendimento;

      if (atendimentoExistente) {
        // Se já existe registro
        if (atendimentoExistente.status_atendimento === "atendida") {
          // Já atendida
          await transaction.rollback();
          return res.status(409).json({
            success: false,
            message: "Solicitação já atendida",
            errors: {
              atendimento: "Esta autopeça já atendeu esta solicitação",
            },
          });
        } else if (atendimentoExistente.status_atendimento === "lida") {
          // Estava marcada como vista, atualizar para atendida
          atendimentoExistente.status_atendimento = "atendida";
          await atendimentoExistente.save({ transaction });
          novoAtendimento = atendimentoExistente;
        }
      } else {
        // Não existe registro, criar novo
        novoAtendimento = await SolicitacoesAtendimento.create(
          {
            solicitacao_id: solicitacaoId,
            autopeca_id: autopeca.id,
            vendedor_id: null, // Atendimento direto pela autopeça
            status_atendimento: "atendida", // Marcar diretamente como atendida
          },
          { transaction }
        );
      }

      // 4. Criar notificação IN-APP para o cliente
      const NotificationService = require("../services/notificationService");
      await NotificationService.notificarClienteSolicitacaoAtendida(
        solicitacao,
        solicitacao.cliente,
        autopeca,
        null // sem vendedor
      );

      // 5. Gerar link do WhatsApp com dados do cliente
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

      // 6. Commit da transação
      await transaction.commit();

      // 7. Retornar sucesso com link do WhatsApp
      // NÃO retornar dados do cliente - apenas o link do WhatsApp
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

  /**
   * Desmarcar solicitação como vista (retornar ao dashboard)
   * DELETE /api/autopecas/solicitacoes/:solicitacaoId/marcar-como-lida
   *
   * @param {Object} req - Request object (deve conter req.user do middleware)
   * @param {Object} res - Response object
   */
  static async desmarcarComoVista(req, res) {
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
        attributes: ["id"],
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

      // 2. Buscar registro de atendimento com status "lida"
      const atendimento = await SolicitacoesAtendimento.findOne({
        where: {
          solicitacao_id: solicitacaoId,
          autopeca_id: autopeca.id,
          status_atendimento: "lida",
        },
        transaction,
      });

      if (!atendimento) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Atendimento não encontrado",
          errors: {
            atendimento: "Esta solicitação não foi marcada como vista por esta autopeça",
          },
        });
      }

      // 3. Verificar se a solicitação ainda existe
      const solicitacao = await Solicitacao.findOne({
        where: { id: solicitacaoId },
        transaction,
      });

      if (!solicitacao) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Solicitação não encontrada",
          errors: {
            solicitacao: "Solicitação não existe",
          },
        });
      }

      // 4. Deletar registro de atendimento (retorna ao dashboard)
      await atendimento.destroy({ transaction });

      // 5. Commit da transação
      await transaction.commit();

      // 6. Retornar sucesso
      return res.status(200).json({
        success: true,
        message: "Solicitação retornada ao dashboard com sucesso",
        data: {
          solicitacao_id: solicitacaoId,
        },
      });
    } catch (error) {
      // Rollback da transação em caso de erro
      await transaction.rollback();

      console.error("Erro ao desmarcar solicitação como vista:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message: "Ocorreu um erro ao retornar a solicitação ao dashboard",
        },
      });
    }
  }

  /**
   * Desmarcar solicitação como atendida pela autopeça
   * DELETE /api/autopecas/solicitacoes/:solicitacaoId/atender
   *
   * @param {Object} req - Request object (deve conter req.user do middleware)
   * @param {Object} res - Response object
   */
  static async desmarcarComoAtendida(req, res) {
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
        attributes: ["id"],
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

      // 2. Buscar registro de atendimento
      const atendimento = await SolicitacoesAtendimento.findOne({
        where: {
          solicitacao_id: solicitacaoId,
          autopeca_id: autopeca.id,
        },
        transaction,
      });

      if (!atendimento) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Atendimento não encontrado",
          errors: {
            atendimento: "Esta solicitação não foi atendida por esta autopeça",
          },
        });
      }

      // 3. Verificar se a solicitação ainda existe
      const solicitacao = await Solicitacao.findOne({
        where: { id: solicitacaoId },
        transaction,
      });

      if (!solicitacao) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Solicitação não encontrada",
          errors: {
            solicitacao: "Solicitação não existe",
          },
        });
      }

      // 4. Deletar registro de atendimento
      await atendimento.destroy({ transaction });

      // 5. Commit da transação
      await transaction.commit();

      // 6. Retornar sucesso
      return res.status(200).json({
        success: true,
        message: "Solicitação desmarcada como atendida com sucesso",
        data: {
          solicitacao_id: solicitacaoId,
        },
      });
    } catch (error) {
      // Rollback da transação em caso de erro
      await transaction.rollback();

      console.error("Erro ao desmarcar solicitação como atendida:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message: "Ocorreu um erro ao desmarcar a solicitação como atendida",
        },
      });
    }
  }

  /**
   * Marcar solicitação como vista/lida (sem atender)
   * POST /api/autopecas/solicitacoes/:solicitacaoId/marcar-como-lida
   *
   * @param {Object} req - Request object (deve conter req.user do middleware)
   * @param {Object} res - Response object
   */
  static async marcarComoLida(req, res) {
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
        attributes: ["id", "endereco_cidade", "endereco_uf"],
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
          cidade_atendimento: autopeca.endereco_cidade,
          uf_atendimento: autopeca.endereco_uf,
        },
        transaction,
      });

      if (!solicitacao) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Solicitação não encontrada ou inativa",
          errors: {
            solicitacao: "Solicitação não existe ou não está mais ativa na sua cidade",
          },
        });
      }

      // 3. Verificar se já existe um registro de atendimento
      const atendimentoAtendido = await SolicitacoesAtendimento.findOne({
        where: {
          solicitacao_id: solicitacaoId,
          autopeca_id: autopeca.id,
          status_atendimento: "atendida",
        },
        transaction,
      });

      if (atendimentoAtendido) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Solicitação já foi marcada como atendida",
          errors: {
            status: "Não é possível marcar como vista uma solicitação já atendida",
          },
        });
      }

      let atendimento = await SolicitacoesAtendimento.findOne({
        where: {
          solicitacao_id: solicitacaoId,
          autopeca_id: autopeca.id,
          vendedor_id: null,
        },
        transaction,
      });

      if (!atendimento) {
        atendimento = await SolicitacoesAtendimento.create(
          {
            solicitacao_id: solicitacaoId,
            autopeca_id: autopeca.id,
            vendedor_id: null,
            status_atendimento: "lida",
          },
          { transaction }
        );
      } else {
        atendimento.status_atendimento = "lida";
        await atendimento.save({ transaction });
      }

      // 4. Commit da transação
      await transaction.commit();

      // 5. Retornar sucesso
      return res.status(200).json({
        success: true,
        message: "Solicitação marcada como vista com sucesso",
        data: {
          atendimento: {
            id: atendimento.id,
            solicitacao_id: solicitacaoId,
            autopeca_id: autopeca.id,
            status_atendimento: atendimento.status_atendimento,
          },
        },
      });
    } catch (error) {
      // Rollback da transação em caso de erro
      await transaction.rollback();

      console.error("Erro ao marcar solicitação como vista:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message: "Ocorreu um erro ao marcar a solicitação como vista",
        },
      });
    }
  }
}

module.exports = AutopecaController;
