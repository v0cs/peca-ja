const { Notificacao, Autopeca, Usuario, Vendedor } = require("../models");

/**
 * Serviço de Notificações
 * Gerencia criação e envio de notificações in-app
 */
class NotificationService {
  /**
   * Criar notificação no banco de dados
   * @param {string} usuarioId - ID do usuário que receberá a notificação
   * @param {string} tipo - Tipo da notificação
   * @param {string} titulo - Título da notificação
   * @param {string} mensagem - Mensagem da notificação
   * @param {object} dadosExtra - Dados extras em JSON (opcional)
   * @returns {Promise<Notificacao|null>}
   */
  static async criarNotificacao(
    usuarioId,
    tipo,
    titulo,
    mensagem,
    dadosExtra = {}
  ) {
    try {
      const notificacao = await Notificacao.create({
        usuario_id: usuarioId,
        tipo_notificacao: tipo,
        titulo: titulo,
        mensagem: mensagem,
        metadados: dadosExtra,
        lida: false,
        enviada_email: false,
      });

      console.log(
        `✅ Notificação criada: ${tipo} para usuário ${usuarioId.substring(
          0,
          8
        )}...`
      );
      return notificacao;
    } catch (error) {
      console.error("❌ Erro ao criar notificação:", error);
      return null;
    }
  }

  /**
   * Notificar autopeças sobre nova solicitação na cidade delas
   * @param {object} solicitacao - Objeto da solicitação criada
   * @param {Array} autopecas - Lista de autopeças da cidade
   */
  static async notificarAutopecasNovaSolicitacao(solicitacao, autopecas) {
    try {
      console.log(
        `🔔 Notificando ${autopecas.length} autopeças sobre nova solicitação`
      );

      const notificacoesCriadas = [];

      for (const autopeca of autopecas) {
        const notificacao = await this.criarNotificacao(
          autopeca.usuario_id,
          "nova_solicitacao",
          "🚨 Nova Solicitação na Sua Cidade",
          `Nova solicitação de ${solicitacao.descricao_peca} para ${solicitacao.marca} ${solicitacao.modelo} em ${solicitacao.cidade_atendimento}`,
          {
            solicitacao_id: solicitacao.id,
            marca: solicitacao.marca,
            modelo: solicitacao.modelo,
            ano: solicitacao.ano_fabricacao,
            cidade: solicitacao.cidade_atendimento,
            uf: solicitacao.uf_atendimento,
          }
        );

        if (notificacao) {
          notificacoesCriadas.push(notificacao);
        }
      }

      console.log(
        `✅ ${notificacoesCriadas.length} notificações criadas para autopeças`
      );
      return notificacoesCriadas;
    } catch (error) {
      console.error("❌ Erro ao notificar autopeças:", error);
      return [];
    }
  }

  /**
   * Notificar cliente que sua solicitação foi atendida
   * @param {object} solicitacao - Objeto da solicitação
   * @param {object} cliente - Objeto do cliente
   * @param {object} autopeca - Objeto da autopeça
   * @param {object} vendedor - Objeto do vendedor (opcional)
   */
  static async notificarClienteSolicitacaoAtendida(
    solicitacao,
    cliente,
    autopeca,
    vendedor = null
  ) {
    try {
      const nomeAutopeca = autopeca.nome_fantasia || autopeca.razao_social;
      const nomeVendedor = vendedor ? vendedor.nome_completo : null;

      const mensagem = nomeVendedor
        ? `Sua solicitação de ${solicitacao.descricao_peca} foi atendida por ${nomeVendedor} da ${nomeAutopeca}. Entre em contato via WhatsApp.`
        : `Sua solicitação de ${solicitacao.descricao_peca} foi atendida por ${nomeAutopeca}. Entre em contato via WhatsApp.`;

      const notificacao = await this.criarNotificacao(
        cliente.usuario_id,
        "solicitacao_atendida",
        "✅ Sua Solicitação Foi Atendida",
        mensagem,
        {
          solicitacao_id: solicitacao.id,
          autopeca_id: autopeca.id,
          vendedor_id: vendedor ? vendedor.id : null,
          descricao_peca: solicitacao.descricao_peca,
        }
      );

      console.log(
        `✅ Cliente notificado sobre atendimento da solicitação ${solicitacao.id}`
      );
      return notificacao;
    } catch (error) {
      console.error("❌ Erro ao notificar cliente:", error);
      return null;
    }
  }

  /**
   * Notificar admin da autopeça que vendedor atendeu solicitação
   * @param {object} solicitacao - Objeto da solicitação
   * @param {object} vendedor - Objeto do vendedor
   * @param {object} autopeca - Objeto da autopeça
   */
  static async notificarAutopecaVendedorAtendeu(
    solicitacao,
    vendedor,
    autopeca
  ) {
    try {
      // Buscar o usuário admin da autopeça
      const autopecaCompleta = await Autopeca.findByPk(autopeca.id, {
        include: [
          {
            model: Usuario,
            as: "usuario",
            attributes: ["id"],
          },
        ],
      });

      if (!autopecaCompleta || !autopecaCompleta.usuario) {
        console.log("⚠️ Admin da autopeça não encontrado");
        return null;
      }

      const notificacao = await this.criarNotificacao(
        autopecaCompleta.usuario_id,
        "vendedor_atendeu",
        "👤 Vendedor Atendeu Solicitação",
        `Seu vendedor ${vendedor.nome_completo} atendeu a solicitação de ${solicitacao.descricao_peca} para ${solicitacao.marca} ${solicitacao.modelo}`,
        {
          solicitacao_id: solicitacao.id,
          vendedor_id: vendedor.id,
          vendedor_nome: vendedor.nome_completo,
          descricao_peca: solicitacao.descricao_peca,
        }
      );

      console.log(
        `✅ Admin da autopeça notificado sobre atendimento do vendedor`
      );
      return notificacao;
    } catch (error) {
      console.error("❌ Erro ao notificar admin da autopeça:", error);
      return null;
    }
  }

  /**
   * Notificar outros vendedores da mesma autopeça que perderam a solicitação
   * @param {object} solicitacao - Objeto da solicitação
   * @param {string} autopecaId - ID da autopeça
   * @param {string} vendedorQueAtendeuId - ID do vendedor que atendeu
   */
  static async notificarOutrosVendedoresPerderam(
    solicitacao,
    autopecaId,
    vendedorQueAtendeuId
  ) {
    try {
      // Buscar todos os vendedores ativos da autopeça, exceto o que atendeu
      const outrosVendedores = await Vendedor.findAll({
        where: {
          autopeca_id: autopecaId,
          ativo: true,
        },
        include: [
          {
            model: Usuario,
            as: "usuario",
            attributes: ["id"],
            where: {
              ativo: true,
            },
          },
        ],
      });

      const vendedoresParaNotificar = outrosVendedores.filter(
        (v) => v.id !== vendedorQueAtendeuId
      );

      console.log(
        `🔔 Notificando ${vendedoresParaNotificar.length} vendedores que perderam a solicitação`
      );

      const notificacoesCriadas = [];

      for (const vendedor of vendedoresParaNotificar) {
        const notificacao = await this.criarNotificacao(
          vendedor.usuario_id,
          "perdeu_solicitacao",
          "⚠️ Solicitação Já Foi Atendida",
          `A solicitação de ${solicitacao.descricao_peca} para ${solicitacao.marca} ${solicitacao.modelo} foi atendida por outro vendedor da sua equipe`,
          {
            solicitacao_id: solicitacao.id,
            descricao_peca: solicitacao.descricao_peca,
            marca: solicitacao.marca,
            modelo: solicitacao.modelo,
          }
        );

        if (notificacao) {
          notificacoesCriadas.push(notificacao);
        }
      }

      console.log(
        `✅ ${notificacoesCriadas.length} vendedores notificados sobre perda da solicitação`
      );
      return notificacoesCriadas;
    } catch (error) {
      console.error("❌ Erro ao notificar outros vendedores:", error);
      return [];
    }
  }

  /**
   * Notificar autopeças que atenderam sobre cancelamento da solicitação
   * @param {object} solicitacao - Objeto da solicitação
   * @param {Array} atendimentos - Lista de atendimentos da solicitação
   */
  static async notificarAutopecasSolicitacaoCancelada(
    solicitacao,
    atendimentos
  ) {
    try {
      console.log(
        `🔔 Notificando autopeças sobre cancelamento da solicitação ${solicitacao.id}`
      );

      const notificacoesCriadas = [];

      for (const atendimento of atendimentos) {
        // Buscar autopeça com usuário
        const autopeca = await Autopeca.findByPk(atendimento.autopeca_id, {
          include: [
            {
              model: Usuario,
              as: "usuario",
              attributes: ["id"],
            },
          ],
        });

        if (autopeca && autopeca.usuario) {
          const notificacao = await this.criarNotificacao(
            autopeca.usuario_id,
            "solicitacao_cancelada",
            "❌ Solicitação Cancelada",
            `A solicitação de ${solicitacao.descricao_peca} para ${solicitacao.marca} ${solicitacao.modelo} foi cancelada pelo cliente`,
            {
              solicitacao_id: solicitacao.id,
              descricao_peca: solicitacao.descricao_peca,
              marca: solicitacao.marca,
              modelo: solicitacao.modelo,
            }
          );

          if (notificacao) {
            notificacoesCriadas.push(notificacao);
          }
        }

        // Notificar também o vendedor se houver
        if (atendimento.vendedor_id) {
          const vendedor = await Vendedor.findByPk(atendimento.vendedor_id, {
            include: [
              {
                model: Usuario,
                as: "usuario",
                attributes: ["id"],
              },
            ],
          });

          if (vendedor && vendedor.usuario) {
            const notificacao = await this.criarNotificacao(
              vendedor.usuario_id,
              "solicitacao_cancelada",
              "❌ Solicitação Cancelada",
              `A solicitação de ${solicitacao.descricao_peca} para ${solicitacao.marca} ${solicitacao.modelo} foi cancelada pelo cliente`,
              {
                solicitacao_id: solicitacao.id,
                descricao_peca: solicitacao.descricao_peca,
                marca: solicitacao.marca,
                modelo: solicitacao.modelo,
              }
            );

            if (notificacao) {
              notificacoesCriadas.push(notificacao);
            }
          }
        }
      }

      console.log(
        `✅ ${notificacoesCriadas.length} notificações criadas sobre cancelamento`
      );
      return notificacoesCriadas;
    } catch (error) {
      console.error(
        "❌ Erro ao notificar autopeças sobre cancelamento:",
        error
      );
      return [];
    }
  }

  /**
   * Notificar cliente sobre cancelamento de sua solicitação
   * @param {object} solicitacao - Objeto da solicitação
   * @param {object} cliente - Objeto do cliente
   */
  static async notificarClienteSolicitacaoCancelada(solicitacao, cliente) {
    try {
      const notificacao = await this.criarNotificacao(
        cliente.usuario_id,
        "solicitacao_cancelada",
        "✅ Solicitação Cancelada com Sucesso",
        `Sua solicitação de ${solicitacao.descricao_peca} para ${solicitacao.marca} ${solicitacao.modelo} foi cancelada conforme solicitado`,
        {
          solicitacao_id: solicitacao.id,
          descricao_peca: solicitacao.descricao_peca,
          marca: solicitacao.marca,
          modelo: solicitacao.modelo,
        }
      );

      console.log(
        `✅ Cliente notificado sobre cancelamento da solicitação ${solicitacao.id}`
      );
      return notificacao;
    } catch (error) {
      console.error("❌ Erro ao notificar cliente sobre cancelamento:", error);
      return null;
    }
  }

  /**
   * Notificar sobre conflito de atendimento (dois vendedores da mesma autopeça)
   * @param {object} solicitacao - Objeto da solicitação
   * @param {object} autopeca - Objeto da autopeça
   */
  static async notificarConflitoAtendimento(solicitacao, autopeca) {
    try {
      // Buscar o usuário admin da autopeça
      const autopecaCompleta = await Autopeca.findByPk(autopeca.id, {
        include: [
          {
            model: Usuario,
            as: "usuario",
            attributes: ["id"],
          },
        ],
      });

      if (!autopecaCompleta || !autopecaCompleta.usuario) {
        console.log(
          "⚠️ Admin da autopeça não encontrado para notificação de conflito"
        );
        return null;
      }

      const notificacao = await this.criarNotificacao(
        autopecaCompleta.usuario_id,
        "conflito_atendimento",
        "⚠️ Conflito de Atendimento Detectado",
        `Dois vendedores da sua autopeça tentaram atender simultaneamente a solicitação de ${solicitacao.descricao_peca}. Verifique com sua equipe.`,
        {
          solicitacao_id: solicitacao.id,
          autopeca_id: autopeca.id,
          descricao_peca: solicitacao.descricao_peca,
        }
      );

      console.log(`✅ Admin notificado sobre conflito de atendimento`);
      return notificacao;
    } catch (error) {
      console.error("❌ Erro ao notificar conflito de atendimento:", error);
      return null;
    }
  }
}

module.exports = NotificationService;








