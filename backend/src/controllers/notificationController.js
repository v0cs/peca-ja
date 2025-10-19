const { Notificacao } = require("../models");
const { Op } = require("sequelize");

/**
 * Controller de Notificações
 * Gerencia operações CRUD de notificações in-app
 */
class NotificationController {
  /**
   * Listar notificações do usuário com paginação
   * GET /api/notificacoes?page=1&limit=20&tipo=nova_solicitacao&lida=false
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async listarNotificacoes(req, res) {
    try {
      const { userId } = req.user;

      // Parâmetros de paginação
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      // Parâmetros de filtro
      const { tipo, lida } = req.query;

      // Construir filtros
      const where = {
        usuario_id: userId,
      };

      if (tipo) {
        where.tipo_notificacao = tipo;
      }

      if (lida !== undefined) {
        where.lida = lida === "true";
      }

      // Buscar notificações com paginação
      const { count, rows: notificacoes } = await Notificacao.findAndCountAll({
        where,
        order: [["data_criacao", "DESC"]],
        limit,
        offset,
      });

      // Calcular informações de paginação
      const totalPages = Math.ceil(count / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return res.status(200).json({
        success: true,
        message: "Notificações listadas com sucesso",
        data: {
          notificacoes,
          paginacao: {
            total: count,
            pagina_atual: page,
            total_paginas: totalPages,
            limite_por_pagina: limit,
            tem_proxima: hasNext,
            tem_anterior: hasPrev,
          },
          filtros_aplicados: {
            tipo: tipo || "todos",
            lida: lida !== undefined ? lida === "true" : "todas",
          },
        },
      });
    } catch (error) {
      console.error("Erro ao listar notificações:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message: "Erro ao processar solicitação",
        },
      });
    }
  }

  /**
   * Marcar notificação como lida
   * PUT /api/notificacoes/:id/ler
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async marcarComoLida(req, res) {
    try {
      const { userId } = req.user;
      let { id } = req.params;
      // Remover ":" se existir no início (validação defensiva)
      id = id.startsWith(":") ? id.slice(1) : id;

      // Buscar notificação e verificar se pertence ao usuário
      const notificacao = await Notificacao.findOne({
        where: {
          id,
          usuario_id: userId,
        },
      });

      if (!notificacao) {
        return res.status(404).json({
          success: false,
          message: "Notificação não encontrada",
          errors: {
            notificacao:
              "Notificação não existe ou não pertence a este usuário",
          },
        });
      }

      // Se já estiver lida, retornar sucesso sem fazer nada
      if (notificacao.lida) {
        return res.status(200).json({
          success: true,
          message: "Notificação já estava marcada como lida",
          data: {
            notificacao,
          },
        });
      }

      // Marcar como lida
      await notificacao.update({ lida: true });

      return res.status(200).json({
        success: true,
        message: "Notificação marcada como lida",
        data: {
          notificacao,
        },
      });
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message: "Erro ao processar solicitação",
        },
      });
    }
  }

  /**
   * Marcar todas as notificações como lidas
   * PUT /api/notificacoes/ler-todas
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async marcarTodasComoLidas(req, res) {
    try {
      const { userId } = req.user;

      // Atualizar todas as notificações não lidas do usuário
      const [quantidadeAtualizada] = await Notificacao.update(
        { lida: true },
        {
          where: {
            usuario_id: userId,
            lida: false,
          },
        }
      );

      return res.status(200).json({
        success: true,
        message: `${quantidadeAtualizada} notificação(ões) marcada(s) como lida(s)`,
        data: {
          quantidade_atualizada: quantidadeAtualizada,
        },
      });
    } catch (error) {
      console.error("Erro ao marcar todas as notificações como lidas:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message: "Erro ao processar solicitação",
        },
      });
    }
  }

  /**
   * Contar notificações não lidas
   * GET /api/notificacoes/nao-lidas/contagem
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async contarNaoLidas(req, res) {
    try {
      const { userId } = req.user;

      // Contar notificações não lidas
      const count = await Notificacao.count({
        where: {
          usuario_id: userId,
          lida: false,
        },
      });

      // Contar também por tipo para mais contexto
      const countPorTipo = await Notificacao.findAll({
        attributes: [
          "tipo_notificacao",
          [
            Notificacao.sequelize.fn("COUNT", Notificacao.sequelize.col("id")),
            "total",
          ],
        ],
        where: {
          usuario_id: userId,
          lida: false,
        },
        group: ["tipo_notificacao"],
        raw: true,
      });

      // Formatar contagem por tipo
      const contagemPorTipo = {};
      countPorTipo.forEach((item) => {
        contagemPorTipo[item.tipo_notificacao] = parseInt(item.total);
      });

      return res.status(200).json({
        success: true,
        message: "Contagem de notificações não lidas",
        data: {
          total_nao_lidas: count,
          por_tipo: contagemPorTipo,
        },
      });
    } catch (error) {
      console.error("Erro ao contar notificações não lidas:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message: "Erro ao processar solicitação",
        },
      });
    }
  }

  /**
   * Deletar notificação
   * DELETE /api/notificacoes/:id
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async deletarNotificacao(req, res) {
    try {
      const { userId } = req.user;
      let { id } = req.params;
      // Remover ":" se existir no início (validação defensiva)
      id = id.startsWith(":") ? id.slice(1) : id;

      // Buscar notificação e verificar se pertence ao usuário
      const notificacao = await Notificacao.findOne({
        where: {
          id,
          usuario_id: userId,
        },
      });

      if (!notificacao) {
        return res.status(404).json({
          success: false,
          message: "Notificação não encontrada",
          errors: {
            notificacao:
              "Notificação não existe ou não pertence a este usuário",
          },
        });
      }

      // Deletar notificação (hard delete)
      await notificacao.destroy();

      return res.status(200).json({
        success: true,
        message: "Notificação deletada com sucesso",
        data: {
          notificacao_id: id,
        },
      });
    } catch (error) {
      console.error("Erro ao deletar notificação:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message: "Erro ao processar solicitação",
        },
      });
    }
  }

  /**
   * Deletar todas as notificações lidas
   * DELETE /api/notificacoes/lidas
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async deletarTodasLidas(req, res) {
    try {
      const { userId } = req.user;

      // Deletar todas as notificações lidas do usuário
      const quantidadeDeletada = await Notificacao.destroy({
        where: {
          usuario_id: userId,
          lida: true,
        },
      });

      return res.status(200).json({
        success: true,
        message: `${quantidadeDeletada} notificação(ões) deletada(s)`,
        data: {
          quantidade_deletada: quantidadeDeletada,
        },
      });
    } catch (error) {
      console.error("Erro ao deletar notificações lidas:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message: "Erro ao processar solicitação",
        },
      });
    }
  }

  /**
   * Buscar notificação por ID
   * GET /api/notificacoes/:id
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async buscarPorId(req, res) {
    try {
      const { userId } = req.user;
      let { id } = req.params;
      // Remover ":" se existir no início (validação defensiva)
      id = id.startsWith(":") ? id.slice(1) : id;

      // Buscar notificação e verificar se pertence ao usuário
      const notificacao = await Notificacao.findOne({
        where: {
          id,
          usuario_id: userId,
        },
      });

      if (!notificacao) {
        return res.status(404).json({
          success: false,
          message: "Notificação não encontrada",
          errors: {
            notificacao:
              "Notificação não existe ou não pertence a este usuário",
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: "Notificação encontrada",
        data: {
          notificacao,
        },
      });
    } catch (error) {
      console.error("Erro ao buscar notificação:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message: "Erro ao processar solicitação",
        },
      });
    }
  }
}

module.exports = NotificationController;
