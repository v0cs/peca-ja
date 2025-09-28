const {
  Solicitacao,
  Cliente,
  Usuario,
  ImagemSolicitacao,
} = require("../models");
const { uploadMiddleware } = require("../middleware/uploadMiddleware");
const path = require("path");

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

      // 2. Log de tracking da origem dos dados
      console.log(
        "📋 Controller: Dados recebidos (processados pelo middleware):"
      );
      console.log("- Placa:", req.body.placa);
      console.log("- Marca:", req.body.marca);
      console.log("- Modelo:", req.body.modelo);
      console.log("- Origem dos dados:", req.body.origem_dados_veiculo);
      console.log("- Info da API:", req.apiVeicularInfo);

      // 3. Buscar dados do cliente para usar cidade/estado como padrão
      const cliente = await Cliente.findOne({
        where: { usuario_id: req.user.userId },
        include: [
          {
            model: Usuario,
            as: "usuario",
            attributes: ["id", "email", "tipo_usuario"],
          },
        ],
        transaction,
      });

      if (!cliente) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Cliente não encontrado",
          errors: {
            cliente: "Perfil de cliente não encontrado",
          },
        });
      }

      // 4. Validar campos obrigatórios (dados já processados pelo middleware)
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

      // Usar cidade/estado do perfil do cliente como padrão se não informado
      const cidadeFinal = cidade_atendimento || cliente.cidade;
      const ufFinal = uf_atendimento || cliente.uf;

      console.log("🏠 Controller: Localização da solicitação:");
      console.log("- Cidade informada:", cidade_atendimento);
      console.log("- UF informada:", uf_atendimento);
      console.log("- Cidade do perfil:", cliente.cidade);
      console.log("- UF do perfil:", cliente.uf);
      console.log("- Cidade final:", cidadeFinal);
      console.log("- UF final:", ufFinal);

      const camposObrigatorios = {
        descricao_peca,
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

      // 5. Validar UF final
      if (ufFinal.length !== 2) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "UF deve ter 2 caracteres",
          errors: {
            uf_atendimento: "UF deve ter exatamente 2 caracteres",
            uf_final: ufFinal,
          },
        });
      }

      // 8. Criar solicitação com dados mesclados do middleware
      console.log("💾 Controller: Criando solicitação com dados processados:");
      console.log("- Origem dos dados:", origem_dados_veiculo);
      console.log("- Dados da API disponíveis:", !!api_veicular_metadata);

      const novaSolicitacao = await Solicitacao.create(
        {
          cliente_id: cliente.id,
          descricao_peca: descricao_peca.trim(),
          status_cliente: "ativa",
          cidade_atendimento: cidadeFinal.trim(),
          uf_atendimento: ufFinal.toUpperCase().trim(),
          // Dados já processados pelo middleware (normalizados)
          placa: placa.replace(/-/g, "").toUpperCase(),
          marca: marca.trim(),
          modelo: modelo.trim(),
          ano_fabricacao,
          ano_modelo,
          categoria,
          cor: cor.trim(),
          chassi: chassi ? chassi.trim() : "Não informado",
          renavam: renavam ? renavam.trim() : "Não informado",
          // Metadados da API veicular (adicionados pelo middleware)
          origem_dados_veiculo: origem_dados_veiculo || "manual",
          api_veicular_metadata: api_veicular_metadata || null,
        },
        { transaction }
      );

      // 9. Processar imagens se existirem
      let imagensCriadas = [];
      if (req.uploadedFiles && req.uploadedFiles.length > 0) {
        for (let i = 0; i < req.uploadedFiles.length; i++) {
          const file = req.files[i];
          const imagem = await ImagemSolicitacao.create(
            {
              solicitacao_id: novaSolicitacao.id,
              nome_arquivo: file.originalname,
              nome_arquivo_fisico: file.filename,
              caminho_arquivo: file.path,
              tamanho_arquivo: file.size,
              tipo_mime: file.mimetype,
              extensao: path.extname(file.originalname).slice(1),
              ordem_exibicao: i + 1,
            },
            { transaction }
          );
          imagensCriadas.push(imagem);
        }
      }

      await transaction.commit();

      // 10. Log de sucesso com informações da origem dos dados
      console.log("✅ Controller: Solicitação criada com sucesso:");
      console.log("- ID:", novaSolicitacao.id);
      console.log("- Placa:", novaSolicitacao.placa);
      console.log("- Origem dos dados:", novaSolicitacao.origem_dados_veiculo);
      console.log("- Imagens:", imagensCriadas.length);

      // 11. Retornar resposta com informações da origem dos dados
      return res.status(201).json({
        success: true,
        message: `Solicitação criada com ${imagensCriadas.length} imagem(ns)`,
        data: {
          solicitacao: {
            id: novaSolicitacao.id,
            placa: novaSolicitacao.placa,
            marca: novaSolicitacao.marca,
            modelo: novaSolicitacao.modelo,
            ano_fabricacao: novaSolicitacao.ano_fabricacao,
            ano_modelo: novaSolicitacao.ano_modelo,
            categoria: novaSolicitacao.categoria,
            cor: novaSolicitacao.cor,
            origem_dados_veiculo: novaSolicitacao.origem_dados_veiculo,
            status_cliente: novaSolicitacao.status_cliente,
            cidade_atendimento: novaSolicitacao.cidade_atendimento,
            uf_atendimento: novaSolicitacao.uf_atendimento,
            created_at: novaSolicitacao.created_at,
          },
          imagens: imagensCriadas.map((img) => ({
            id: img.id,
            nome_arquivo: img.nome_arquivo,
            url: `/uploads/${img.nome_arquivo_fisico}`,
          })),
          api_veicular_info: {
            consultado: req.apiVeicularInfo?.consultado || false,
            origem: req.apiVeicularInfo?.origem || "manual",
            motivo: req.apiVeicularInfo?.motivo || "nao_consultado",
            timestamp:
              req.apiVeicularInfo?.timestamp || new Date().toISOString(),
          },
          localizacao_info: {
            cidade_informada: cidade_atendimento || null,
            uf_informada: uf_atendimento || null,
            cidade_perfil_cliente: cliente.cidade,
            uf_perfil_cliente: cliente.uf,
            cidade_final_usada: cidadeFinal,
            uf_final_usada: ufFinal,
            origem_localizacao: cidade_atendimento
              ? "informada_pelo_cliente"
              : "perfil_cliente",
          },
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Erro ao criar solicitação:", error);
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
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
          },
        ],
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

      // 4. Verificar se a solicitação pode be edited (apenas ativas)
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
    // ... código do método cancel ...
  }

  /**
   * Adiciona imagens a uma solicitação existente
   * POST /api/solicitacoes/:id/imagens
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async adicionarImagens(req, res) {
    const transaction = await Solicitacao.sequelize.transaction();

    try {
      const { id } = req.params;

      // 1. Verificar se o usuário é um cliente
      if (req.user.tipo !== "cliente") {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: "Apenas clientes podem adicionar imagens às solicitações",
        });
      }

      // 2. Buscar cliente
      const cliente = await Cliente.findOne({
        where: { usuario_id: req.user.userId },
        transaction,
      });

      if (!cliente) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Cliente não encontrado",
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
        });
      }

      // 4. Verificar se a solicitação pode receber imagens (apenas ativas)
      if (solicitacao.status_cliente !== "ativa") {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Não é possível adicionar imagens a esta solicitação",
          errors: {
            status: "Apenas solicitações ativas podem receber imagens",
          },
        });
      }

      // 5. Processar imagens se existirem
      let imagensAdicionadas = [];
      if (req.uploadedFiles && req.uploadedFiles.length > 0) {
        // Buscar quantidade atual de imagens para definir ordem
        const imagensExistentes = await ImagemSolicitacao.count({
          where: { solicitacao_id: id },
          transaction,
        });

        for (let i = 0; i < req.uploadedFiles.length; i++) {
          const file = req.uploadedFiles[i];
          const imagem = await ImagemSolicitacao.create(
            {
              solicitacao_id: id,
              nome_arquivo: file.originalname || file.originalName,
              nome_arquivo_fisico: file.filename || file.fileName,
              caminho_arquivo:
                file.path || `${uploadDir}/${file.filename || file.fileName}`,
              tamanho_arquivo: file.size,
              tipo_mime: file.mimetype,
              extensao: path
                .extname(file.originalname || file.originalName)
                .slice(1),
              ordem_exibicao: imagensExistentes + i + 1,
            },
            { transaction }
          );
          imagensAdicionadas.push(imagem);
        }
      } else {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Nenhuma imagem foi enviada",
        });
      }

      await transaction.commit();

      // 6. Retornar resposta
      return res.status(200).json({
        success: true,
        message: `${imagensAdicionadas.length} imagem(ns) adicionada(s) com sucesso`,
        data: {
          solicitacao_id: id,
          imagens: imagensAdicionadas.map((img) => ({
            id: img.id,
            nome_arquivo: img.nome_arquivo,
            url: `/uploads/${img.nome_arquivo_fisico}`,
          })),
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Erro ao adicionar imagens:", error);
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      });
    }
  }
}

module.exports = SolicitacaoController;
