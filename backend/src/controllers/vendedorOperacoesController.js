const { Op } = require("sequelize");
const {
  Vendedor,
  Usuario,
  Autopeca,
  Solicitacao,
  Cliente,
  SolicitacoesAtendimento,
  ImagemSolicitacao,
} = require("../models");

/**
 * Controller de Operações de Vendedores
 * Gerencia operações específicas dos vendedores das autopeças
 */
class VendedorOperacoesController {
  /**
   * Buscar perfil do vendedor logado
   * GET /api/vendedor/profile
   */
  static async getProfile(req, res) {
    try {
      const { userId, tipo } = req.user;

      if (tipo !== "vendedor") {
        return res.status(403).json({
          success: false,
          message: "Acesso negado",
          errors: {
            tipo_usuario: "Esta operação é exclusiva para vendedores",
          },
        });
      }

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

      if (!vendedor.ativo || !vendedor.usuario.ativo) {
        return res.status(403).json({
          success: false,
          message: "Conta inativa",
          errors: {
            conta: "Sua conta está inativa. Entre em contato com o suporte.",
          },
        });
      }

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
        autopeca: vendedor.autopeca
          ? {
              id: vendedor.autopeca.id,
              razao_social: vendedor.autopeca.razao_social,
              nome_fantasia: vendedor.autopeca.nome_fantasia,
              cidade: vendedor.autopeca.endereco_cidade,
              uf: vendedor.autopeca.endereco_uf,
            }
          : null,
      };

      return res.status(200).json({
        success: true,
        message: "Perfil do vendedor recuperado com sucesso",
        data: responseData,
      });
    } catch (error) {
      console.error("Erro ao buscar perfil do vendedor:", error);

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
   * Atualizar dados básicos do vendedor (nome)
   * PUT /api/vendedor/profile
   */
  static async updateProfile(req, res) {
    const transaction = await Vendedor.sequelize.transaction();

    try {
      const { userId, tipo } = req.user;
      const { nome_completo } = req.body;

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

      if (!nome_completo || typeof nome_completo !== "string") {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Campo obrigatório não informado",
          errors: {
            nome_completo: "Nome completo é obrigatório",
          },
        });
      }

      const nomeNormalizado = nome_completo.trim();
      if (nomeNormalizado.length < 2) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Dados inválidos",
          errors: {
            nome_completo: "Nome completo deve ter pelo menos 2 caracteres",
          },
        });
      }

      const vendedor = await Vendedor.findOne({
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

      if (!vendedor.ativo || !vendedor.usuario.ativo) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: "Conta inativa",
          errors: {
            conta: "Sua conta está inativa. Entre em contato com o suporte.",
          },
        });
      }

      await vendedor.update(
        { nome_completo: nomeNormalizado },
        { transaction }
      );

      await transaction.commit();

      const vendedorAtualizado = await Vendedor.findOne({
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

      return res.status(200).json({
        success: true,
        message: "Perfil do vendedor atualizado com sucesso",
        data: {
          vendedor: {
            id: vendedorAtualizado.id,
            nome_completo: vendedorAtualizado.nome_completo,
            ativo: vendedorAtualizado.ativo,
            created_at: vendedorAtualizado.data_criacao,
            updated_at: vendedorAtualizado.data_atualizacao,
          },
          usuario: {
            id: vendedorAtualizado.usuario.id,
            email: vendedorAtualizado.usuario.email,
            tipo_usuario: vendedorAtualizado.usuario.tipo_usuario,
            ativo: vendedorAtualizado.usuario.ativo,
            created_at: vendedorAtualizado.usuario.data_criacao,
            updated_at: vendedorAtualizado.usuario.data_atualizacao,
          },
          autopeca: vendedorAtualizado.autopeca
            ? {
                id: vendedorAtualizado.autopeca.id,
                razao_social: vendedorAtualizado.autopeca.razao_social,
                nome_fantasia: vendedorAtualizado.autopeca.nome_fantasia,
                cidade: vendedorAtualizado.autopeca.endereco_cidade,
                uf: vendedorAtualizado.autopeca.endereco_uf,
              }
            : null,
        },
      });
    } catch (error) {
      await transaction.rollback();

      console.error("Erro ao atualizar perfil do vendedor:", error);

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

      // Buscar IDs de solicitações já atendidas pela autopeça do vendedor
      const solicitacoesAtendidasIds = await SolicitacoesAtendimento.findAll({
        where: {
          autopeca_id: vendedor.autopeca_id,
          status_atendimento: "atendida",
        },
        attributes: ["solicitacao_id"],
      }).then((rows) => rows.map((row) => row.solicitacao_id));

      // Buscar IDs de solicitações marcadas como vistas pelo vendedor
      const solicitacoesVistasIds = await SolicitacoesAtendimento.findAll({
        where: {
          vendedor_id: vendedor.id,
          status_atendimento: "lida",
        },
        attributes: ["solicitacao_id"],
      }).then((rows) => rows.map((row) => row.solicitacao_id));

      const idsParaExcluir = Array.from(
        new Set([...solicitacoesAtendidasIds, ...solicitacoesVistasIds])
      );

      // Normalizar cidade e UF para comparação case-insensitive
      const cidadeNormalizada = vendedor.autopeca.endereco_cidade.trim();
      const ufNormalizada = vendedor.autopeca.endereco_uf.trim().toUpperCase();

      const whereSolicitacoes = {
        status_cliente: "ativa",
        cidade_atendimento: {
          [Op.iLike]: cidadeNormalizada, // Case-insensitive
        },
        uf_atendimento: {
          [Op.iLike]: ufNormalizada, // Case-insensitive
        },
      };

      if (idsParaExcluir.length > 0) {
        whereSolicitacoes.id = {
          [Op.notIn]: idsParaExcluir,
        };
      }

      // Buscar solicitações disponíveis (não vistas por este vendedor e não atendidas)
      const solicitacoesDisponiveisRaw = await Solicitacao.findAll({
        where: whereSolicitacoes,
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
        order: [["data_criacao", "DESC"]],
        distinct: true,
      });

      const solicitacoesDisponiveis = Array.from(
        new Map(
          solicitacoesDisponiveisRaw.map((solicitacao) => [
            solicitacao.id,
            solicitacao,
          ])
        ).values()
      );

      // Buscar estatísticas do vendedor
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const atendimentosHoje = await SolicitacoesAtendimento.count({
        where: {
          vendedor_id: vendedor.id,
          status_atendimento: "atendida",
          data_marcacao: {
            [Op.gte]: hoje,
          },
        },
      });

      const totalAtendimentos = await SolicitacoesAtendimento.count({
        where: {
          vendedor_id: vendedor.id,
          status_atendimento: "atendida",
        },
      });

      const totalVistas = new Set(solicitacoesVistasIds).size;

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
          solicitacoes_disponiveis: solicitacoesDisponiveis.length,
          solicitacoes_vistas: totalVistas,
        },
        solicitacoes: solicitacoesDisponiveis.map((solicitacao) => ({
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
        })),
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

      // 2. Buscar IDs das solicitações já atendidas pela autopeça do vendedor
      const solicitacoesAtendidasIds = await SolicitacoesAtendimento.findAll({
        where: {
          autopeca_id: vendedor.autopeca_id,
          status_atendimento: "atendida",
        },
        attributes: ["solicitacao_id"],
      }).then((rows) => rows.map((row) => row.solicitacao_id));

      // 3. Buscar IDs marcados como vistos pelo vendedor
      const solicitacoesVistasIds = await SolicitacoesAtendimento.findAll({
        where: {
          vendedor_id: vendedor.id,
          status_atendimento: "lida",
        },
        attributes: ["solicitacao_id"],
      }).then((rows) => rows.map((row) => row.solicitacao_id));

      const idsParaExcluir = Array.from(
        new Set([...solicitacoesAtendidasIds, ...solicitacoesVistasIds])
      );

      const whereSolicitacoes = {
        status_cliente: "ativa",
        cidade_atendimento: vendedor.autopeca.endereco_cidade,
        uf_atendimento: vendedor.autopeca.endereco_uf,
      };

      if (idsParaExcluir.length > 0) {
        whereSolicitacoes.id = {
          [Op.notIn]: idsParaExcluir,
        };
      }

      // 4. Buscar solicitações disponíveis
      const solicitacoesDisponiveisRaw = await Solicitacao.findAll({
        where: whereSolicitacoes,
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
        order: [["data_criacao", "DESC"]],
        distinct: true,
      });

      const solicitacoesDisponiveis = Array.from(
        new Map(
          solicitacoesDisponiveisRaw.map((solicitacao) => [
            solicitacao.id,
            solicitacao,
          ])
        ).values()
      );

      // 5. Preparar dados de resposta com informações básicas
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
        status: "disponivel",
        imagens: solicitacao.imagens
          ? solicitacao.imagens.map((img) => ({
              id: img.id,
              nome_arquivo: img.nome_arquivo,
              nome_arquivo_fisico: img.nome_arquivo_fisico,
              url: `/uploads/${img.nome_arquivo_fisico}`,
              ordem_exibicao: img.ordem_exibicao,
            }))
          : [],
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
   * Listar solicitações marcadas como vistas pelo vendedor
   * GET /api/vendedor/solicitacoes-vistas
   */
  static async getSolicitacoesVistas(req, res) {
    try {
      const { userId, tipo } = req.user;

      if (tipo !== "vendedor") {
        return res.status(403).json({
          success: false,
          message: "Acesso negado",
          errors: {
            tipo_usuario: "Esta operação é exclusiva para vendedores",
          },
        });
      }

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

      const solicitacoesVistasRaw = await SolicitacoesAtendimento.findAll({
        where: {
          vendedor_id: vendedor.id,
          status_atendimento: "lida",
        },
        include: [
          {
            model: Solicitacao,
            as: "solicitacao",
            where: {
              status_cliente: "ativa",
              cidade_atendimento: vendedor.autopeca.endereco_cidade,
              uf_atendimento: vendedor.autopeca.endereco_uf,
            },
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
        distinct: true,
      });

      const solicitacoesVistas = Array.from(
        new Map(
          solicitacoesVistasRaw.map((registro) => [registro.id, registro])
        ).values()
      );

      const responseData = solicitacoesVistas
        .filter((registro) => registro.solicitacao)
        .map((registro) => {
          const solicitacao = registro.solicitacao;
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
            data_marcacao: registro.data_marcacao,
            status: "vista",
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
      console.error("Erro ao buscar solicitações vistas (vendedor):", error);

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
   * Listar solicitações atendidas pelo vendedor
   * GET /api/vendedor/solicitacoes-atendidas
   */
  static async getSolicitacoesAtendidas(req, res) {
    try {
      const { userId, tipo } = req.user;

      if (tipo !== "vendedor") {
        return res.status(403).json({
          success: false,
          message: "Acesso negado",
          errors: {
            tipo_usuario: "Esta operação é exclusiva para vendedores",
          },
        });
      }

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

      const atendimentosRaw = await SolicitacoesAtendimento.findAll({
        where: {
          vendedor_id: vendedor.id,
          status_atendimento: "atendida",
        },
        include: [
          {
            model: Solicitacao,
            as: "solicitacao",
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
        distinct: true,
      });

      const atendimentos = Array.from(
        new Map(
          atendimentosRaw.map((registro) => [registro.id, registro])
        ).values()
      );

      const responseData = atendimentos
        .filter((registro) => registro.solicitacao)
        .map((registro) => {
          const solicitacao = registro.solicitacao;
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
            data_atendimento: registro.data_marcacao,
            status: "atendida",
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
      console.error("Erro ao buscar solicitações atendidas (vendedor):", error);

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
   * Marcar solicitação como vista pelo vendedor
   * POST /api/vendedor/solicitacoes/:solicitacaoId/marcar-vista
   */
  static async marcarComoVista(req, res) {
    const transaction = await Vendedor.sequelize.transaction();

    try {
      const { userId, tipo } = req.user;
      let { solicitacaoId } = req.params;
      solicitacaoId = solicitacaoId.startsWith(":")
        ? solicitacaoId.slice(1)
        : solicitacaoId;

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

      const vendedor = await Vendedor.findOne({
        where: { usuario_id: userId },
        include: [
          {
            model: Autopeca,
            as: "autopeca",
            attributes: ["id", "endereco_cidade", "endereco_uf"],
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

      const solicitacao = await Solicitacao.findOne({
        where: {
          id: solicitacaoId,
          status_cliente: "ativa",
          cidade_atendimento: vendedor.autopeca.endereco_cidade,
          uf_atendimento: vendedor.autopeca.endereco_uf,
        },
        transaction,
      });

      if (!solicitacao) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Solicitação não encontrada ou inativa",
          errors: {
            solicitacao: "Solicitação não está disponível na sua região",
          },
        });
      }

      const atendimentoExistente = await SolicitacoesAtendimento.findOne({
        where: {
          solicitacao_id: solicitacaoId,
          vendedor_id: vendedor.id,
        },
        transaction,
      });

      if (atendimentoExistente) {
        if (atendimentoExistente.status_atendimento === "atendida") {
          await transaction.rollback();
          return res.status(409).json({
            success: false,
            message: "Solicitação já foi atendida por você",
            errors: {
              status:
                "Não é possível marcar como vista uma solicitação já atendida",
            },
          });
        }

        if (atendimentoExistente.status_atendimento === "lida") {
          await transaction.rollback();
          return res.status(200).json({
            success: true,
            message: "Solicitação já estava marcada como vista",
            data: {
              atendimento: {
                id: atendimentoExistente.id,
                solicitacao_id: atendimentoExistente.solicitacao_id,
                status_atendimento: "vista",
                data_marcacao: atendimentoExistente.data_marcacao,
              },
            },
          });
        }
      }

      const atendimento = await SolicitacoesAtendimento.create(
        {
          solicitacao_id: solicitacaoId,
          autopeca_id: vendedor.autopeca_id,
          vendedor_id: vendedor.id,
          status_atendimento: "lida",
        },
        { transaction }
      );

      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: "Solicitação marcada como vista com sucesso",
        data: {
          atendimento: {
            id: atendimento.id,
            solicitacao_id: atendimento.solicitacao_id,
            status_atendimento: "vista",
            data_marcacao: atendimento.data_marcacao,
          },
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Erro ao marcar solicitação como vista (vendedor):", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message: "Ocorreu um erro ao marcar a solicitação como vista",
        },
      });
    }
  }

  /**
   * Desmarcar solicitação como vista (retornar ao dashboard principal)
   * DELETE /api/vendedor/solicitacoes/:solicitacaoId/marcar-vista
   */
  static async desmarcarComoVista(req, res) {
    const transaction = await Vendedor.sequelize.transaction();

    try {
      const { userId, tipo } = req.user;
      let { solicitacaoId } = req.params;
      solicitacaoId = solicitacaoId.startsWith(":")
        ? solicitacaoId.slice(1)
        : solicitacaoId;

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

      const vendedor = await Vendedor.findOne({
        where: { usuario_id: userId },
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

      const atendimento = await SolicitacoesAtendimento.findOne({
        where: {
          solicitacao_id: solicitacaoId,
          vendedor_id: vendedor.id,
          status_atendimento: "lida",
        },
        transaction,
      });

      if (!atendimento) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Solicitação não está marcada como vista",
          errors: {
            solicitacao:
              "Não foi encontrada marcação de visualização para esta solicitação",
          },
        });
      }

      await atendimento.destroy({ transaction });
      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: "Solicitação retornada ao dashboard com sucesso",
        data: {
          solicitacao_id: solicitacaoId,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error(
        "Erro ao desmarcar solicitação como vista (vendedor):",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message:
            "Ocorreu um erro ao retornar a solicitação ao dashboard principal",
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

      // 3. Verificar se vendedor já registrou interação com esta solicitação
      const atendimentoExistente = await SolicitacoesAtendimento.findOne({
        where: {
          solicitacao_id: solicitacaoId,
          vendedor_id: vendedor.id,
        },
        transaction,
      });

      if (
        atendimentoExistente &&
        atendimentoExistente.status_atendimento === "atendida"
      ) {
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
            status_atendimento: "atendida",
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

      let novoAtendimento;

      if (atendimentoExistente) {
        atendimentoExistente.status_atendimento = "atendida";
        await atendimentoExistente.save({ transaction });
        novoAtendimento = atendimentoExistente;
      } else {
        // 5. Criar registro em SolicitacoesAtendimento
        novoAtendimento = await SolicitacoesAtendimento.create(
          {
            solicitacao_id: solicitacaoId,
            autopeca_id: vendedor.autopeca_id,
            vendedor_id: vendedor.id, // Incluir vendedor_id no registro
            status_atendimento: "atendida", // Marcar diretamente como atendida
          },
          { transaction }
        );
      }

      // Apagar registros de visualização de outros vendedores da mesma autopeça
      await SolicitacoesAtendimento.destroy({
        where: {
          solicitacao_id: solicitacaoId,
          autopeca_id: vendedor.autopeca_id,
          status_atendimento: "lida",
          vendedor_id: {
            [Op.ne]: vendedor.id,
          },
        },
        transaction,
      });

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
          // NÃO retornar dados do cliente - apenas o link do WhatsApp
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
   * Desmarcar solicitação como atendida pelo vendedor
   * DELETE /api/vendedor/solicitacoes/:solicitacaoId/atender
   */
  static async desmarcarComoAtendida(req, res) {
    const transaction = await Vendedor.sequelize.transaction();

    try {
      const { userId, tipo } = req.user;
      let { solicitacaoId } = req.params;
      solicitacaoId = solicitacaoId.startsWith(":")
        ? solicitacaoId.slice(1)
        : solicitacaoId;

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

      const vendedor = await Vendedor.findOne({
        where: { usuario_id: userId },
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

      const atendimento = await SolicitacoesAtendimento.findOne({
        where: {
          solicitacao_id: solicitacaoId,
          autopeca_id: vendedor.autopeca_id,
          vendedor_id: vendedor.id,
          status_atendimento: "atendida",
        },
        transaction,
      });

      if (!atendimento) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Atendimento não encontrado",
          errors: {
            atendimento:
              "Não foi encontrado registro de atendimento para esta solicitação",
          },
        });
      }

      await atendimento.destroy({ transaction });
      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: "Solicitação reaberta com sucesso",
        data: {
          solicitacao_id: solicitacaoId,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error(
        "Erro ao desmarcar solicitação como atendida (vendedor):",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message:
            "Ocorreu um erro ao reabrir a solicitação. Tente novamente mais tarde.",
        },
      });
    }
  }
}

module.exports = VendedorOperacoesController;
