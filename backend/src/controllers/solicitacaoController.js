const { Solicitacao, Cliente, Usuario } = require("../models");

/**
 * Controller de Solicitações
 * Gerencia operações CRUD para solicitações de peças automotivas
 */
class SolicitacaoController {
  /**
   * Cria uma nova solicitação
   * POST /api/solicitacoes
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async create(req, res) {
    const transaction = await Solicitacao.sequelize.transaction();

    try {
      // 1. Verificar se o usuário é um cliente
      if (req.user.tipo !== "cliente") {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: "Apenas clientes podem criar solicitações",
          errors: {
            authorization: "Usuário deve ser do tipo 'cliente'",
          },
        });
      }

      // 2. Validar campos obrigatórios
      const {
        descricao_peca,
        cidade_atendimento,
        uf_atendimento,
        placa,
        marca,
        modelo,
        ano_fabricacao,
        ano_modelo,
        categoria,
        cor,
        chassi,
        renavam,
        origem_dados_veiculo,
        api_veicular_metadata,
      } = req.body;

      const camposObrigatorios = {
        descricao_peca,
        cidade_atendimento,
        uf_atendimento,
        placa,
        marca,
        modelo,
        ano_fabricacao,
        ano_modelo,
        categoria,
        cor,
      };

      // Verificar campos obrigatórios
      const camposFaltando = Object.entries(camposObrigatorios)
        .filter(
          ([key, value]) =>
            !value || (typeof value === "string" && value.trim() === "")
        )
        .map(([key]) => key);

      if (camposFaltando.length > 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Campos obrigatórios não fornecidos",
          errors: {
            campos_faltando: camposFaltando,
            message: `Os seguintes campos são obrigatórios: ${camposFaltando.join(
              ", "
            )}`,
          },
        });
      }

      // 3. Validar formato da placa (Mercosul ou antigo)
      const placaRegex = /^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$|^[A-Z]{3}-?[0-9]{4}$/;
      if (!placaRegex.test(placa.replace(/-/g, ""))) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Formato de placa inválido",
          errors: {
            placa:
              "Placa deve estar no formato Mercosul (ABC1D23) ou antigo (ABC-1234)",
          },
        });
      }

      // 4. Validar anos
      const anoAtual = new Date().getFullYear();
      if (ano_fabricacao < 1900 || ano_fabricacao > anoAtual + 1) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Ano de fabricação inválido",
          errors: {
            ano_fabricacao: `Ano deve estar entre 1900 e ${anoAtual + 1}`,
          },
        });
      }

      if (ano_modelo < 1900 || ano_modelo > anoAtual + 1) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Ano do modelo inválido",
          errors: {
            ano_modelo: `Ano deve estar entre 1900 e ${anoAtual + 1}`,
          },
        });
      }

      // 5. Validar categoria
      const categoriasValidas = [
        "carro",
        "moto",
        "caminhao",
        "van",
        "onibus",
        "outro",
      ];
      if (!categoriasValidas.includes(categoria)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Categoria inválida",
          errors: {
            categoria: `Categoria deve ser uma das seguintes: ${categoriasValidas.join(
              ", "
            )}`,
          },
        });
      }

      // 6. Validar UF
      if (uf_atendimento.length !== 2) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "UF deve ter 2 caracteres",
          errors: {
            uf_atendimento: "UF deve ter exatamente 2 caracteres",
          },
        });
      }

      // 7. Buscar cliente_id baseado no usuário autenticado
      const cliente = await Cliente.findOne({
        where: { usuario_id: req.user.userId },
        transaction,
      });

      if (!cliente) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Cliente não encontrado",
          errors: {
            cliente: "Usuário autenticado não possui perfil de cliente",
          },
        });
      }

      // 8. Criar solicitação
      const novaSolicitacao = await Solicitacao.create(
        {
          cliente_id: cliente.id,
          descricao_peca: descricao_peca.trim(),
          status_cliente: "ativa",
          cidade_atendimento: cidade_atendimento.trim(),
          uf_atendimento: uf_atendimento.toUpperCase().trim(),
          placa: placa.replace(/-/g, "").toUpperCase(),
          marca: marca.trim(),
          modelo: modelo.trim(),
          ano_fabricacao,
          ano_modelo,
          categoria,
          cor: cor.trim(),
          chassi: chassi ? chassi.trim() : "Não informado",
          renavam: renavam ? renavam.trim() : "Não informado",
          origem_dados_veiculo: origem_dados_veiculo || "manual",
          api_veicular_metadata: api_veicular_metadata || null,
        },
        { transaction }
      );

      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: "Solicitação criada com sucesso",
        data: {
          solicitacao: novaSolicitacao,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Erro ao criar solicitação:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          server: "Erro ao processar solicitação",
        },
      });
    }
  }

  /**
   * Lista solicitações do usuário logado
   * GET /api/solicitacoes
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async list(req, res) {
    try {
      // 1. Verificar se o usuário é um cliente
      if (req.user.tipo !== "cliente") {
        return res.status(403).json({
          success: false,
          message: "Apenas clientes podem visualizar suas solicitações",
          errors: {
            authorization: "Usuário deve ser do tipo 'cliente'",
          },
        });
      }

      // 2. Buscar cliente_id baseado no usuário autenticado
      const cliente = await Cliente.findOne({
        where: { usuario_id: req.user.userId },
      });

      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: "Cliente não encontrado",
          errors: {
            cliente: "Usuário autenticado não possui perfil de cliente",
          },
        });
      }

      // 3. Buscar solicitações do cliente
      const solicitacoes = await Solicitacao.findAll({
        where: { cliente_id: cliente.id },
        order: [["data_criacao", "DESC"]],
      });

      return res.status(200).json({
        success: true,
        message: "Solicitações listadas com sucesso",
        data: {
          solicitacoes,
          total: solicitacoes.length,
        },
      });
    } catch (error) {
      console.error("Erro ao listar solicitações:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          server: "Erro ao processar solicitação",
        },
      });
    }
  }

  /**
   * Busca uma solicitação específica
   * GET /api/solicitacoes/:id
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;

      // 1. Verificar se o usuário é um cliente
      if (req.user.tipo !== "cliente") {
        return res.status(403).json({
          success: false,
          message: "Apenas clientes podem visualizar solicitações",
          errors: {
            authorization: "Usuário deve ser do tipo 'cliente'",
          },
        });
      }

      // 2. Buscar cliente_id baseado no usuário autenticado
      const cliente = await Cliente.findOne({
        where: { usuario_id: req.user.userId },
      });

      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: "Cliente não encontrado",
          errors: {
            cliente: "Usuário autenticado não possui perfil de cliente",
          },
        });
      }

      // 3. Buscar solicitação específica
      const solicitacao = await Solicitacao.findOne({
        where: {
          id,
          cliente_id: cliente.id,
        },
      });

      if (!solicitacao) {
        return res.status(404).json({
          success: false,
          message: "Solicitação não encontrada",
          errors: {
            solicitacao: "Solicitação não existe ou não pertence ao usuário",
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: "Solicitação encontrada com sucesso",
        data: {
          solicitacao,
        },
      });
    } catch (error) {
      console.error("Erro ao buscar solicitação:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          server: "Erro ao processar solicitação",
        },
      });
    }
  }

  /**
   * Atualiza uma solicitação
   * PUT /api/solicitacoes/:id
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async update(req, res) {
    const transaction = await Solicitacao.sequelize.transaction();

    try {
      const { id } = req.params;

      // 1. Verificar se o usuário é um cliente
      if (req.user.tipo !== "cliente") {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: "Apenas clientes podem atualizar solicitações",
          errors: {
            authorization: "Usuário deve ser do tipo 'cliente'",
          },
        });
      }

      // 2. Buscar cliente_id baseado no usuário autenticado
      const cliente = await Cliente.findOne({
        where: { usuario_id: req.user.userId },
        transaction,
      });

      if (!cliente) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Cliente não encontrado",
          errors: {
            cliente: "Usuário autenticado não possui perfil de cliente",
          },
        });
      }

      // 3. Buscar solicitação específica
      const solicitacao = await Solicitacao.findOne({
        where: {
          id,
          cliente_id: cliente.id,
        },
        transaction,
      });

      if (!solicitacao) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Solicitação não encontrada",
          errors: {
            solicitacao: "Solicitação não existe ou não pertence ao usuário",
          },
        });
      }

      // 4. Verificar se a solicitação pode ser editada (apenas ativas)
      if (solicitacao.status_cliente !== "ativa") {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Solicitação não pode ser editada",
          errors: {
            status: "Apenas solicitações ativas podem ser editadas",
          },
        });
      }

      // 5. Validar campos se fornecidos
      const {
        descricao_peca,
        cidade_atendimento,
        uf_atendimento,
        placa,
        marca,
        modelo,
        ano_fabricacao,
        ano_modelo,
        categoria,
        cor,
        chassi,
        renavam,
      } = req.body;

      const dadosAtualizacao = {};

      // Validar e preparar campos para atualização
      if (descricao_peca !== undefined) {
        if (!descricao_peca || descricao_peca.trim() === "") {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "Descrição da peça é obrigatória",
            errors: {
              descricao_peca: "Descrição não pode estar vazia",
            },
          });
        }
        dadosAtualizacao.descricao_peca = descricao_peca.trim();
      }

      if (cidade_atendimento !== undefined) {
        if (!cidade_atendimento || cidade_atendimento.trim() === "") {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "Cidade de atendimento é obrigatória",
            errors: {
              cidade_atendimento: "Cidade não pode estar vazia",
            },
          });
        }
        dadosAtualizacao.cidade_atendimento = cidade_atendimento.trim();
      }

      if (uf_atendimento !== undefined) {
        if (!uf_atendimento || uf_atendimento.length !== 2) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "UF deve ter 2 caracteres",
            errors: {
              uf_atendimento: "UF deve ter exatamente 2 caracteres",
            },
          });
        }
        dadosAtualizacao.uf_atendimento = uf_atendimento.toUpperCase().trim();
      }

      if (placa !== undefined) {
        const placaRegex =
          /^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$|^[A-Z]{3}-?[0-9]{4}$/;
        if (!placaRegex.test(placa.replace(/-/g, ""))) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "Formato de placa inválido",
            errors: {
              placa:
                "Placa deve estar no formato Mercosul (ABC1D23) ou antigo (ABC-1234)",
            },
          });
        }
        dadosAtualizacao.placa = placa.replace(/-/g, "").toUpperCase();
      }

      if (marca !== undefined) {
        if (!marca || marca.trim() === "") {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "Marca é obrigatória",
            errors: {
              marca: "Marca não pode estar vazia",
            },
          });
        }
        dadosAtualizacao.marca = marca.trim();
      }

      if (modelo !== undefined) {
        if (!modelo || modelo.trim() === "") {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "Modelo é obrigatório",
            errors: {
              modelo: "Modelo não pode estar vazio",
            },
          });
        }
        dadosAtualizacao.modelo = modelo.trim();
      }

      if (ano_fabricacao !== undefined) {
        const anoAtual = new Date().getFullYear();
        if (ano_fabricacao < 1900 || ano_fabricacao > anoAtual + 1) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "Ano de fabricação inválido",
            errors: {
              ano_fabricacao: `Ano deve estar entre 1900 e ${anoAtual + 1}`,
            },
          });
        }
        dadosAtualizacao.ano_fabricacao = ano_fabricacao;
      }

      if (ano_modelo !== undefined) {
        const anoAtual = new Date().getFullYear();
        if (ano_modelo < 1900 || ano_modelo > anoAtual + 1) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "Ano do modelo inválido",
            errors: {
              ano_modelo: `Ano deve estar entre 1900 e ${anoAtual + 1}`,
            },
          });
        }
        dadosAtualizacao.ano_modelo = ano_modelo;
      }

      if (categoria !== undefined) {
        const categoriasValidas = [
          "carro",
          "moto",
          "caminhao",
          "van",
          "onibus",
          "outro",
        ];
        if (!categoriasValidas.includes(categoria)) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "Categoria inválida",
            errors: {
              categoria: `Categoria deve ser uma das seguintes: ${categoriasValidas.join(
                ", "
              )}`,
            },
          });
        }
        dadosAtualizacao.categoria = categoria;
      }

      if (cor !== undefined) {
        if (!cor || cor.trim() === "") {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "Cor é obrigatória",
            errors: {
              cor: "Cor não pode estar vazia",
            },
          });
        }
        dadosAtualizacao.cor = cor.trim();
      }

      if (chassi !== undefined) {
        dadosAtualizacao.chassi = chassi ? chassi.trim() : "Não informado";
      }

      if (renavam !== undefined) {
        dadosAtualizacao.renavam = renavam ? renavam.trim() : "Não informado";
      }

      // 6. Atualizar solicitação se houver dados
      if (Object.keys(dadosAtualizacao).length > 0) {
        await solicitacao.update(dadosAtualizacao, { transaction });
      }

      await transaction.commit();

      // 7. Buscar solicitação atualizada
      const solicitacaoAtualizada = await Solicitacao.findByPk(id);

      return res.status(200).json({
        success: true,
        message: "Solicitação atualizada com sucesso",
        data: {
          solicitacao: solicitacaoAtualizada,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Erro ao atualizar solicitação:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          server: "Erro ao processar solicitação",
        },
      });
    }
  }

  /**
   * Cancela uma solicitação (soft delete)
   * DELETE /api/solicitacoes/:id
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async cancel(req, res) {
    const transaction = await Solicitacao.sequelize.transaction();

    try {
      const { id } = req.params;

      // 1. Verificar se o usuário é um cliente
      if (req.user.tipo !== "cliente") {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: "Apenas clientes podem cancelar solicitações",
          errors: {
            authorization: "Usuário deve ser do tipo 'cliente'",
          },
        });
      }

      // 2. Buscar cliente_id baseado no usuário autenticado
      const cliente = await Cliente.findOne({
        where: { usuario_id: req.user.userId },
        transaction,
      });

      if (!cliente) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Cliente não encontrado",
          errors: {
            cliente: "Usuário autenticado não possui perfil de cliente",
          },
        });
      }

      // 3. Buscar solicitação específica
      const solicitacao = await Solicitacao.findOne({
        where: {
          id,
          cliente_id: cliente.id,
        },
        transaction,
      });

      if (!solicitacao) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Solicitação não encontrada",
          errors: {
            solicitacao: "Solicitação não existe ou não pertence ao usuário",
          },
        });
      }

      // 4. Verificar se a solicitação pode ser cancelada
      if (solicitacao.status_cliente === "cancelada") {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Solicitação já está cancelada",
          errors: {
            status: "Solicitação já foi cancelada anteriormente",
          },
        });
      }

      if (solicitacao.status_cliente === "concluida") {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Solicitação não pode ser cancelada",
          errors: {
            status: "Solicitações concluídas não podem ser canceladas",
          },
        });
      }

      // 5. Cancelar solicitação (soft delete)
      await solicitacao.update(
        {
          status_cliente: "cancelada",
          data_conclusao: new Date(),
        },
        { transaction }
      );

      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: "Solicitação cancelada com sucesso",
        data: {
          solicitacao: {
            id: solicitacao.id,
            status_cliente: "cancelada",
            data_conclusao: new Date(),
          },
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Erro ao cancelar solicitação:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          server: "Erro ao processar solicitação",
        },
      });
    }
  }
}

module.exports = SolicitacaoController;
