const bcrypt = require("bcryptjs");
const { Vendedor, Usuario, Autopeca } = require("../models");

/**
 * Controller de Vendedores
 * Gerencia operações de vendedores das autopeças
 */
class VendedorController {
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
      const { nome, email, telefone } = req.body;

      const camposObrigatorios = { nome, email, telefone };

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
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = "Formato de email inválido";
      }

      // Validar telefone (formato brasileiro)
      const telefoneRegex = /^\([0-9]{2}\)[0-9]{4,5}-?[0-9]{4}$/;
      if (!telefoneRegex.test(telefone)) {
        errors.telefone =
          "Formato de telefone inválido. Use o formato: (11)99999-9999";
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
        transaction,
      });

      if (emailExistente) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: "Email já cadastrado",
          errors: {
            email: "Este email já está sendo usado por outro usuário",
          },
        });
      }

      // 5. Gerar senha temporária (sempre gerada automaticamente)
      const senhaTemporaria = Math.random().toString(36).slice(-8); // 8 caracteres aleatórios
      const saltRounds = 12;
      const senhaHash = await bcrypt.hash(senhaTemporaria, saltRounds);

      // 6. Criar registro na tabela Usuarios
      const novoUsuario = await Usuario.create(
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

      // 7. Criar registro na tabela Vendedores
      const novoVendedor = await Vendedor.create(
        {
          usuario_id: novoUsuario.id,
          autopeca_id: autopeca.id,
          nome_completo: nome.trim(),
          ativo: true,
        },
        { transaction }
      );

      // 8. Commit da transação
      await transaction.commit();

      // 9. Enviar email com credenciais (assíncrono - não bloqueia response)
      try {
        const { emailService } = require("../services");
        await emailService.sendVendorCredentials(
          novoUsuario.email,
          novoVendedor.nome_completo,
          senhaTemporaria,
          autopeca.razao_social
        );

        console.log(
          "✅ Email com credenciais enviado para:",
          novoUsuario.email
        );
      } catch (emailError) {
        console.log("❌ Erro ao enviar email com credenciais:", emailError);
      }

      // 10. Retornar sucesso (201)
      return res.status(201).json({
        success: true,
        message: "Vendedor cadastrado com sucesso",
        data: {
          vendedor: {
            id: novoVendedor.id,
            nome_completo: novoVendedor.nome_completo,
            ativo: novoVendedor.ativo,
            created_at: novoVendedor.data_criacao,
          },
          usuario: {
            id: novoUsuario.id,
            email: novoUsuario.email,
            tipo_usuario: novoUsuario.tipo_usuario,
            ativo: novoUsuario.ativo,
          },
          autopeca: {
            id: autopeca.id,
            razao_social: autopeca.razao_social,
            nome_fantasia: autopeca.nome_fantasia,
          },
          credenciais: {
            email: email,
            senha_temporaria: senhaTemporaria,
            // Nota: Em produção, a senha não deveria ser retornada na resposta
            mensagem: "Credenciais enviadas por email",
          },
        },
      });
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

      // Verificar se vendedor já está ativo
      if (vendedor.ativo && vendedor.usuario.ativo) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Vendedor já está ativo",
          errors: {
            status: "Este vendedor já está ativo",
          },
        });
      }

      // Reativar vendedor e usuário
      await vendedor.update({ ativo: true }, { transaction });
      await vendedor.usuario.update({ ativo: true }, { transaction });

      // Commit da transação
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
      // Rollback da transação em caso de erro
      await transaction.rollback();

      console.error("Erro ao reativar vendedor:", error);

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

module.exports = VendedorController;
