const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { Vendedor, Usuario, Autopeca, Cliente } = require("../models");
const { isValidEmail } = require("../utils/email");

const generateSecurePassword = (size = 8) =>
  crypto.randomBytes(size).toString("base64url").slice(0, size);

// Constantes para tipos de usuário
const USER_TYPES = {
  CLIENTE: "cliente",
  AUTOPECA: "autopeca",
  VENDEDOR: "vendedor",
};

/**
 * Controller de Vendedores
 * Gerencia operações de vendedores das autopeças
 */
class VendedorController {
  /**
   * Verificar se há perfis ativos conflitantes para um usuário
   * @private
   * @param {string} usuarioId - ID do usuário a verificar
   * @returns {Promise<{temClienteAtivo: boolean, temAutopecaAtiva: boolean}>}
   */
  static async verificarPerfisAtivosConflitantes(usuarioId) {
    try {
      const usuario = await Usuario.findByPk(usuarioId, {
        attributes: ["id", "ativo", "tipo_usuario"],
      });

      if (!usuario) {
        return { temClienteAtivo: false, temAutopecaAtiva: false };
      }

      // Se o usuário está INATIVO, não há conflito (pode reativar)
      if (!usuario.ativo) {
        return { temClienteAtivo: false, temAutopecaAtiva: false };
      }

      // Se o usuário está ATIVO, verificar o tipo_usuario
      // Conflito apenas se for cliente ou autopeca ativo
      const tipoUsuario = usuario.tipo_usuario;
      const temClienteAtivo = tipoUsuario === USER_TYPES.CLIENTE;
      const temAutopecaAtiva = tipoUsuario === USER_TYPES.AUTOPECA;

      return { temClienteAtivo, temAutopecaAtiva };
    } catch (error) {
      console.error("❌ Erro ao verificar perfis conflitantes:", error);
      // Em caso de erro, assumir que não há conflito para não bloquear reativação
      return { temClienteAtivo: false, temAutopecaAtiva: false };
    }
  }

  /**
   * Validar acesso e buscar autopeça
   * @private
   */
  static async validarAcessoAutopeca(userId, tipo, transaction) {
    if (tipo !== USER_TYPES.AUTOPECA) {
      await transaction.rollback();
      return {
        error: {
          status: 403,
          message: "Acesso negado",
          errors: {
            tipo_usuario: "Esta operação é exclusiva para autopeças",
          },
        },
      };
    }

    const autopeca = await Autopeca.findOne({
      where: { usuario_id: userId },
      attributes: ["id"],
      transaction,
    });

    if (!autopeca) {
      await transaction.rollback();
      return {
        error: {
          status: 404,
          message: "Autopeça não encontrada",
          errors: {
            autopeca: "Perfil de autopeça não encontrado para este usuário",
          },
        },
      };
    }

    return { autopeca };
  }
  /**
   * Cadastrar novo vendedor para a autopeça
   * POST /api/vendedores
   *
   * @param {Object} req - Request object (deve conter req.user do middleware)
   * @param {Object} res - Response object
   */
  static async criarVendedor(req, res) {
    const transaction = await Usuario.sequelize.transaction();

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

      // 1. Validar campos obrigatórios
      const { nome, email } = req.body;

      const camposObrigatorios = { nome, email };

      // Verificar se todos os campos obrigatórios foram fornecidos
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

      // 2. Validações específicas dos campos
      const errors = {};

      // Validar email
      if (!isValidEmail(email)) {
        errors.email = "Formato de email inválido";
      }

      // Validar nome
      if (nome.length < 2) {
        errors.nome = "Nome deve ter pelo menos 2 caracteres";
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

      // 3. Buscar autopeça logada
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

      // 4. Verificar se email já existe
      const emailExistente = await Usuario.findOne({
        where: { email: email.toLowerCase().trim() },
        include: [
          {
            model: Vendedor,
            as: "vendedores",
            required: false,
          },
        ],
        transaction,
      });

      let novoUsuario;
      let senhaTemporariaParaEmail; // Variável para armazenar senha temporária a ser enviada no email

      if (emailExistente) {
        // Se o email existe e a conta está ativa, verificar se já é vendedor
        if (emailExistente.ativo) {
          // Verificar se já é vendedor ativo
          const vendedorAtivo = emailExistente.vendedores?.find((v) => v.ativo);
          
          if (vendedorAtivo) {
            await transaction.rollback();
            return res.status(409).json({
              success: false,
              message: "Email já cadastrado como vendedor",
              errors: {
                email: "Este email já está sendo usado por um vendedor ativo",
              },
            });
          }

          // Se é usuário ativo mas não é vendedor, não permitir cadastrar como vendedor
          await transaction.rollback();
          return res.status(409).json({
            success: false,
            message: "Email já cadastrado",
            errors: {
              email: "Este email já está sendo usado por outro usuário. O usuário precisa excluir sua conta primeiro.",
            },
          });
        }

        // Se o email existe mas a conta está inativa, verificar conflitos antes de reativar
        // IMPORTANTE: Verificar se o usuário tem perfil ativo de outro tipo (cliente ou autopeca)
        let clienteAtivo = null;
        let autopecaAtiva = null;
        
        try {
          // Buscar perfis SEM transação (apenas leitura) para não afetar a transação principal
          clienteAtivo = await Cliente.findOne({
            where: {
              usuario_id: emailExistente.id,
            },
            include: [
              {
                model: Usuario,
                as: "usuario",
                attributes: ["id", "ativo"],
                required: false,
              },
            ],
          });
          
          autopecaAtiva = await Autopeca.findOne({
            where: {
              usuario_id: emailExistente.id,
            },
            include: [
              {
                model: Usuario,
                as: "usuario",
                attributes: ["id", "ativo"],
                required: false,
              },
            ],
          });
        } catch (validationError) {
          // Se houver erro na busca, logar mas continuar
          console.error("❌ Erro ao buscar perfis para validação em criarVendedor:", validationError);
        }
        
        // Verificar se encontrou cliente ou autopeca ATIVA
        const temClienteAtivo = clienteAtivo !== null && 
                                clienteAtivo.usuario && 
                                clienteAtivo.usuario.ativo === true;
        const temAutopecaAtiva = autopecaAtiva !== null && 
                                autopecaAtiva.usuario && 
                                autopecaAtiva.usuario.ativo === true;
        
        // Se encontrou cliente ou autopeca ATIVA, bloquear criação/reativação
        if (temClienteAtivo || temAutopecaAtiva) {
          await transaction.rollback();
          return res.status(409).json({
            success: false,
            message: "Não é possível cadastrar o vendedor",
            errors: {
              conflito: "Este email já está cadastrado como cliente/autopeça. Para cadastrar o vendedor, é necessário primeiro excluir a conta ativa.",
            },
          });
        }
        
        // Se não há conflito, reativar e converter para vendedor
        // Gerar senha temporária
        senhaTemporariaParaEmail = generateSecurePassword();
        const saltRounds = 12;
        const senhaHash = await bcrypt.hash(senhaTemporariaParaEmail, saltRounds);

        // Reativar usuário e converter para vendedor
        await emailExistente.update(
          {
            ativo: true,
            tipo_usuario: "vendedor",
            senha_hash: senhaHash,
            termos_aceitos: true,
            data_aceite_terms: new Date(),
            senha_temporaria: true,
            consentimento_marketing: false,
          },
          { transaction }
        );

        novoUsuario = emailExistente;
      } else {
        // Se o email não existe, criar novo usuário
        // Gerar senha temporária (sempre gerada automaticamente)
        const senhaTemporariaNova = generateSecurePassword(); // 8 caracteres aleatórios
        const saltRounds = 12;
        const senhaHash = await bcrypt.hash(senhaTemporariaNova, saltRounds);

        // Criar registro na tabela Usuarios
        novoUsuario = await Usuario.create(
          {
            email: email.toLowerCase().trim(),
            senha_hash: senhaHash,
            tipo_usuario: "vendedor",
            termos_aceitos: true,
            data_aceite_terms: new Date(),
            ativo: true,
            consentimento_marketing: false,
            senha_temporaria: true, // Marcar que precisa trocar senha no primeiro acesso
          },
          { transaction }
        );
        // Armazenar senha temporária para envio no email
        senhaTemporariaParaEmail = senhaTemporariaNova;
      }

      // Verificar se já existe vendedor inativo para esse usuário e autopeça
      const vendedorExistente = await Vendedor.findOne({
        where: {
          usuario_id: novoUsuario.id,
          autopeca_id: autopeca.id,
        },
        transaction,
      });

      let novoVendedor;

      if (vendedorExistente) {
        // Se já existe vendedor (mesmo que inativo), reativar e atualizar
        await vendedorExistente.update(
          {
            nome_completo: nome.trim(),
            ativo: true,
          },
          { transaction }
        );
        novoVendedor = vendedorExistente;
      } else {
        // Criar novo registro na tabela Vendedores
        novoVendedor = await Vendedor.create(
          {
            usuario_id: novoUsuario.id,
            autopeca_id: autopeca.id,
            nome_completo: nome.trim(),
            ativo: true,
          },
          { transaction }
        );
      }

      // 5. Commit da transação
      await transaction.commit();

      // 6. Enviar email com credenciais (assíncrono - não bloqueia response)
      // Fazer envio de email fora do try/catch principal para não afetar a resposta
      setImmediate(async () => {
        try {
          const { emailService } = require("../services");
          await emailService.sendVendorCredentials(
            novoUsuario.email,
            novoVendedor.nome_completo,
            senhaTemporariaParaEmail,
            autopeca.razao_social
          );

          console.log(
            "✅ Email com credenciais enviado para:",
            novoUsuario.email
          );
        } catch (emailError) {
          console.log("❌ Erro ao enviar email com credenciais:", emailError);
        }
      });

      // 7. Retornar sucesso (201)
      // Garantir que a resposta sempre seja válida, mesmo se houver erro no email
      const responseData = {
        success: true,
        message: "Vendedor cadastrado com sucesso",
        data: {
          vendedor: {
            id: novoVendedor.id,
            nome_completo: novoVendedor.nome_completo,
            ativo: novoVendedor.ativo,
            created_at: novoVendedor.data_criacao?.toISOString() || new Date().toISOString(),
          },
          usuario: {
            id: novoUsuario.id,
            email: novoUsuario.email,
            tipo_usuario: novoUsuario.tipo_usuario,
            ativo: novoUsuario.ativo,
          },
          autopeca: {
            id: autopeca.id,
            razao_social: autopeca.razao_social || null,
            nome_fantasia: autopeca.nome_fantasia || null,
          },
          credenciais: {
            email: email,
            senha_temporaria: senhaTemporariaParaEmail || null,
            // Nota: Em produção, a senha não deveria ser retornada na resposta
            mensagem: "Credenciais serão enviadas por email",
          },
        },
      };

      return res.status(201).json(responseData);
    } catch (error) {
      // Rollback da transação em caso de erro
      await transaction.rollback();

      console.error("Erro ao cadastrar vendedor:", error);

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

      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({
          success: false,
          message: "Conflito de dados",
          errors: {
            email: "Este email já está sendo usado por outro usuário",
          },
        });
      }

      if (error.name === "SequelizeForeignKeyConstraintError") {
        return res.status(400).json({
          success: false,
          message: "Erro de relacionamento entre dados",
          errors: {
            message: "Erro interno: dados relacionados inválidos",
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
   * Listar vendedores da autopeça
   * GET /api/vendedores
   *
   * @param {Object} req - Request object (deve conter req.user do middleware)
   * @param {Object} res - Response object
   */
  static async listarVendedores(req, res) {
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

      // Buscar autopeça logada
      const autopeca = await Autopeca.findOne({
        where: { usuario_id: userId },
        attributes: ["id"],
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

      // Listar vendedores da autopeça
      const vendedores = await Vendedor.findAll({
        where: { autopeca_id: autopeca.id },
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
        ],
        order: [["data_criacao", "DESC"]],
      });

      // Preparar dados de resposta
      const responseData = vendedores.map((vendedor) => ({
        id: vendedor.id,
        nome_completo: vendedor.nome_completo,
        ativo: vendedor.ativo,
        created_at: vendedor.data_criacao,
        updated_at: vendedor.data_atualizacao,
        usuario: {
          id: vendedor.usuario.id,
          email: vendedor.usuario.email,
          tipo_usuario: vendedor.usuario.tipo_usuario,
          ativo: vendedor.usuario.ativo,
          created_at: vendedor.usuario.data_criacao,
          updated_at: vendedor.usuario.data_atualizacao,
        },
      }));

      return res.status(200).json({
        success: true,
        message: "Vendedores listados com sucesso",
        data: {
          vendedores: responseData,
          total: responseData.length,
        },
      });
    } catch (error) {
      console.error("Erro ao listar vendedores:", error);

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
   * Atualizar vendedor
   * PUT /api/vendedores/:vendedorId
   *
   * @param {Object} req - Request object (deve conter req.user do middleware)
   * @param {Object} res - Response object
   */
  static async atualizarVendedor(req, res) {
    const transaction = await Usuario.sequelize.transaction();

    try {
      // req.user é adicionado pelo middleware de autenticação
      const { userId, tipo } = req.user;
      let { vendedorId } = req.params;
      // Remover ":" se existir no início (validação defensiva)
      vendedorId = vendedorId.startsWith(":")
        ? vendedorId.slice(1)
        : vendedorId;

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

      // Buscar autopeça logada
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

      // Buscar vendedor e verificar se pertence à autopeça
      const vendedor = await Vendedor.findOne({
        where: {
          id: vendedorId,
          autopeca_id: autopeca.id,
        },
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
        ],
        transaction,
      });

      if (!vendedor) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Vendedor não encontrado",
          errors: {
            vendedor: "Vendedor não encontrado ou não pertence a esta autopeça",
          },
        });
      }

      // Campos permitidos para atualização
      const camposPermitidos = ["nome_completo"];

      // Filtrar apenas campos permitidos e que realmente mudaram
      const dadosAtualizacao = {};
      Object.keys(req.body).forEach((campo) => {
        if (camposPermitidos.includes(campo) && req.body[campo] !== undefined && req.body[campo] !== null) {
          const valorNovo = typeof req.body[campo] === "string" ? req.body[campo].trim() : req.body[campo];
          const valorAtual = campo === "nome_completo" ? (vendedor.nome_completo || "").trim() : null;
          
          // Só adicionar se o valor for diferente do atual e não estiver vazio
          if (valorNovo && valorNovo !== valorAtual && valorNovo !== "") {
            dadosAtualizacao[campo] = valorNovo;
          }
        }
      });

      // Verificar se há dados para atualizar
      if (Object.keys(dadosAtualizacao).length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Não há alterações a serem salvas. Os dados fornecidos são idênticos aos atuais.",
          errors: {
            campos: "Nenhum campo válido foi modificado.",
          },
        });
      }

      // Validações específicas dos campos
      const errors = {};

      // Validar nome completo se fornecido
      if (dadosAtualizacao.nome_completo) {
        if (dadosAtualizacao.nome_completo.length < 2) {
          errors.nome_completo = "Nome deve ter pelo menos 2 caracteres";
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

      // Atualizar vendedor
      await vendedor.update(dadosAtualizacao, { transaction });

      // Commit da transação
      await transaction.commit();

      // Buscar dados atualizados
      const vendedorAtualizado = await Vendedor.findOne({
        where: { id: vendedorId },
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
        ],
      });

      // Preparar dados de resposta
      const responseData = {
        id: vendedorAtualizado.id,
        nome_completo: vendedorAtualizado.nome_completo,
        ativo: vendedorAtualizado.ativo,
        created_at: vendedorAtualizado.data_criacao,
        updated_at: vendedorAtualizado.data_atualizacao,
        usuario: {
          id: vendedorAtualizado.usuario.id,
          email: vendedorAtualizado.usuario.email,
          tipo_usuario: vendedorAtualizado.usuario.tipo_usuario,
          ativo: vendedorAtualizado.usuario.ativo,
          created_at: vendedorAtualizado.usuario.data_criacao,
          updated_at: vendedorAtualizado.usuario.data_atualizacao,
        },
      };

      return res.status(200).json({
        success: true,
        message: "Vendedor atualizado com sucesso",
        data: responseData,
      });
    } catch (error) {
      // Rollback da transação em caso de erro
      await transaction.rollback();

      console.error("Erro ao atualizar vendedor:", error);

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
   * Inativar vendedor
   * DELETE /api/vendedores/:vendedorId
   *
   * @param {Object} req - Request object (deve conter req.user do middleware)
   * @param {Object} res - Response object
   */
  static async inativarVendedor(req, res) {
    const transaction = await Usuario.sequelize.transaction();

    try {
      // req.user é adicionado pelo middleware de autenticação
      const { userId, tipo } = req.user;
      let { vendedorId } = req.params;
      // Remover ":" se existir no início (validação defensiva)
      vendedorId = vendedorId.startsWith(":")
        ? vendedorId.slice(1)
        : vendedorId;

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

      // Buscar autopeça logada
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

      // Buscar vendedor e verificar se pertence à autopeça
      const vendedor = await Vendedor.findOne({
        where: {
          id: vendedorId,
          autopeca_id: autopeca.id,
        },
        include: [
          {
            model: Usuario,
            as: "usuario",
            attributes: ["id", "email", "ativo"],
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
            vendedor: "Vendedor não encontrado ou não pertence a esta autopeça",
          },
        });
      }

      // Verificar se vendedor já está inativo
      if (!vendedor.ativo || !vendedor.usuario.ativo) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Vendedor já está inativo",
          errors: {
            status: "Este vendedor já está inativo",
          },
        });
      }

      // Inativar vendedor e usuário (não deletar)
      await vendedor.update({ ativo: false }, { transaction });
      await vendedor.usuario.update({ ativo: false }, { transaction });

      // Commit da transação
      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: "Vendedor inativado com sucesso",
        data: {
          vendedor: {
            id: vendedor.id,
            nome_completo: vendedor.nome_completo,
            ativo: false,
            inativado_em: new Date(),
          },
          usuario: {
            id: vendedor.usuario.id,
            email: vendedor.usuario.email,
            ativo: false,
          },
        },
      });
    } catch (error) {
      // Rollback da transação em caso de erro
      await transaction.rollback();

      console.error("Erro ao inativar vendedor:", error);

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
   * Reativar vendedor
   * PATCH /api/vendedores/:vendedorId/reativar
   *
   * @param {Object} req - Request object (deve conter req.user do middleware)
   * @param {Object} res - Response object
   */
  static async reativarVendedor(req, res) {
    const transaction = await Usuario.sequelize.transaction();

    try {
      const { userId, tipo } = req.user;
      let { vendedorId } = req.params;
      vendedorId = vendedorId.startsWith(":") ? vendedorId.slice(1) : vendedorId;

      // Validar acesso e buscar autopeça
      const acessoResult = await VendedorController.validarAcessoAutopeca(
        userId,
        tipo,
        transaction
      );
      if (acessoResult.error) {
        return res.status(acessoResult.error.status).json({
          success: false,
          message: acessoResult.error.message,
          errors: acessoResult.error.errors,
        });
      }
      const { autopeca } = acessoResult;

      // Buscar vendedor
      const vendedor = await Vendedor.findOne({
        where: { id: vendedorId, autopeca_id: autopeca.id },
        include: [
          {
            model: Usuario,
            as: "usuario",
            attributes: ["id", "email", "ativo", "tipo_usuario"],
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
            vendedor: "Vendedor não encontrado ou não pertence a esta autopeça",
          },
        });
      }

      // Verificar se já está ativo
      if (vendedor.ativo && vendedor.usuario.ativo) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Vendedor já está ativo",
          errors: { status: "Este vendedor já está ativo" },
        });
      }

      // Verificar perfis ativos conflitantes
      // REGRA DE NEGÓCIO ORIGINAL: Verificar se há Cliente ou Autopeca ATIVO
      // IMPORTANTE: Se o vendedor está inativo, o usuario também está inativo (conforme inativarVendedor)
      // Se o usuário está inativo, não há conflito (pode reativar o vendedor)
      const usuarioId = vendedor.usuario.id;
      
      // Buscar status atualizado do usuário diretamente do banco
      const usuarioAtual = await Usuario.findByPk(usuarioId, {
        attributes: ["id", "ativo", "tipo_usuario"],
      });

      // Log para debug (apenas em desenvolvimento)
      if (process.env.NODE_ENV === "development") {
        console.log("🔍 Verificação de conflitos:", {
          usuarioId,
          usuarioAtivo: usuarioAtual?.ativo,
          tipoUsuario: usuarioAtual?.tipo_usuario,
          vendedorAtivo: vendedor.ativo,
        });
      }

      // REGRA DE NEGÓCIO: Verificar conflitos apenas se o usuário está ATIVO
      // Se o usuário está inativo, não há conflito (pode reativar o vendedor)
      if (usuarioAtual && usuarioAtual.ativo === true) {
        // Usuário está ativo - verificar se tem perfil Cliente ou Autopeca
        // Buscar perfis e verificar explicitamente se o Usuario está ativo
        const [cliente, autopeca] = await Promise.all([
          Cliente.findOne({
            where: { usuario_id: usuarioId },
            include: [
              {
                model: Usuario,
                as: "usuario",
                attributes: ["id", "ativo"],
                required: true,
              },
            ],
          }),
          Autopeca.findOne({
            where: { usuario_id: usuarioId },
            include: [
              {
                model: Usuario,
                as: "usuario",
                attributes: ["id", "ativo"],
                required: true,
              },
            ],
          }),
        ]);

        // Verificar explicitamente se o Usuario associado está ativo
        const temClienteAtivo =
          cliente !== null &&
          cliente.usuario !== null &&
          cliente.usuario.ativo === true;
        const temAutopecaAtiva =
          autopeca !== null &&
          autopeca.usuario !== null &&
          autopeca.usuario.ativo === true;

        if (process.env.NODE_ENV === "development") {
          console.log("🔍 Resultado da busca de perfis:", {
            clienteEncontrado: cliente !== null,
            clienteAtivo: temClienteAtivo,
            autopecaEncontrada: autopeca !== null,
            autopecaAtiva: temAutopecaAtiva,
          });
        }

        // Se encontrou Cliente ou Autopeca com Usuario ATIVO, há conflito
        if (temClienteAtivo || temAutopecaAtiva) {
          await transaction.rollback();
          return res.status(409).json({
            success: false,
            message: "Não é possível reativar o vendedor",
            errors: {
              conflito:
                "Este email já está cadastrado como cliente/autopeça ativo. Para reativar o vendedor, é necessário primeiro excluir a conta ativa.",
            },
          });
        }
      }
      // Se usuarioAtual não existe ou está inativo, não há conflito (pode reativar)

      // Reativar vendedor e usuário
      const tipoUsuarioOriginal = vendedor.usuario.tipo_usuario;
      await Promise.all([
        Vendedor.update({ ativo: true }, { where: { id: vendedor.id }, transaction }),
        Usuario.update(
          { ativo: true, tipo_usuario: USER_TYPES.VENDEDOR },
          { where: { id: vendedor.usuario.id }, transaction }
        ),
      ]);

      if (tipoUsuarioOriginal !== USER_TYPES.VENDEDOR) {
        console.log(
          `✅ Vendedor ${vendedor.id} reativado: tipo_usuario alterado de "${tipoUsuarioOriginal}" para "${USER_TYPES.VENDEDOR}"`
        );
      }

      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: "Vendedor reativado com sucesso",
        data: {
          vendedor: {
            id: vendedor.id,
            nome_completo: vendedor.nome_completo,
            ativo: true,
            reativado_em: new Date(),
          },
          usuario: {
            id: vendedor.usuario.id,
            email: vendedor.usuario.email,
            ativo: true,
          },
        },
      });
    } catch (error) {
      if (!res.headersSent) {
        try {
          await transaction.rollback();
        } catch (rollbackError) {
          console.error("Erro ao fazer rollback:", rollbackError);
        }
      }

      if (res.headersSent) {
        return;
      }

      console.error("❌ Erro ao reativar vendedor:", error);
      console.error("Stack:", error.stack);

      // Retornar erro genérico 500 - não tentar inferir tipo de erro pela mensagem
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
          detalhes:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        },
      });
    }
  }
}

module.exports = VendedorController;
