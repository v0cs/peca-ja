const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Usuario, Cliente } = require("../models");

/**
 * Controller de Autenticação
 * Gerencia operações de registro e login de usuários
 */
class AuthController {
  /**
   * Registra um novo cliente no sistema
   * POST /api/auth/register
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async register(req, res) {
    const transaction = await Usuario.sequelize.transaction();

    try {
      // 1. Validar campos obrigatórios
      const { nome_completo, email, senha, celular, cidade, uf } = req.body;

      const camposObrigatorios = {
        nome_completo,
        email,
        senha,
        celular,
        cidade,
        uf,
      };

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

      // Validar senha (mínimo 6 caracteres)
      if (senha.length < 6) {
        errors.senha = "A senha deve ter pelo menos 6 caracteres";
      }

      // Validar celular (formato brasileiro)
      const celularRegex = /^\([0-9]{2}\)[0-9]{4,5}-?[0-9]{4}$/;
      if (!celularRegex.test(celular)) {
        errors.celular =
          "Formato de celular inválido. Use o formato: (11)999999999";
      }

      // Validar UF (2 caracteres)
      if (!uf || uf.length !== 2) {
        errors.uf = "UF deve ter exatamente 2 caracteres";
      }

      // Validar cidade
      if (cidade.length < 2) {
        errors.cidade = "Nome da cidade deve ter pelo menos 2 caracteres";
      }

      // Validar nome completo
      if (nome_completo.length < 2) {
        errors.nome_completo = "Nome completo deve ter pelo menos 2 caracteres";
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

      // 3. Verificar se email já existe
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

      // 4. Fazer hash da senha com bcryptjs (cost 12)
      const saltRounds = 12;
      const senhaHash = await bcrypt.hash(senha, saltRounds);

      // 5. Criar registro na tabela Usuarios
      const novoUsuario = await Usuario.create(
        {
          email: email.toLowerCase().trim(),
          senha_hash: senhaHash,
          tipo_usuario: "cliente",
          termos_aceitos: true,
          data_aceite_terms: new Date(),
          ativo: true,
          consentimento_marketing: false,
        },
        { transaction }
      );

      // 6. Criar registro na tabela Clientes
      const novoCliente = await Cliente.create(
        {
          usuario_id: novoUsuario.id,
          nome_completo: nome_completo.trim(),
          telefone: celular, // Assumindo que celular será usado como telefone principal
          celular: celular.trim(),
          cidade: cidade.trim(),
          uf: uf.toUpperCase().trim(),
        },
        { transaction }
      );

      // 7. Commit da transação
      await transaction.commit();

      // 8. Retornar sucesso (201)
      return res.status(201).json({
        success: true,
        message: "Cliente registrado com sucesso",
        data: {
          usuario: {
            id: novoUsuario.id,
            email: novoUsuario.email,
            tipo_usuario: novoUsuario.tipo_usuario,
            ativo: novoUsuario.ativo,
            termos_aceitos: novoUsuario.termos_aceitos,
            data_aceite_terms: novoUsuario.data_aceite_terms,
          },
          cliente: {
            id: novoCliente.id,
            nome_completo: novoCliente.nome_completo,
            celular: novoCliente.celular,
            cidade: novoCliente.cidade,
            uf: novoCliente.uf,
          },
        },
      });
    } catch (error) {
      // Rollback da transação em caso de erro
      await transaction.rollback();

      console.error("Erro no registro de cliente:", error);

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
   * Login de usuário
   * POST /api/auth/login
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async login(req, res) {
    try {
      // 1. Validar campos obrigatórios
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({
          success: false,
          message: "Email e senha são obrigatórios",
          errors: {
            email: !email ? "Email é obrigatório" : undefined,
            senha: !senha ? "Senha é obrigatória" : undefined,
          },
        });
      }

      // 2. Buscar usuário pelo email (incluindo relacionamento com Cliente)
      const usuario = await Usuario.findOne({
        where: { email: email.toLowerCase().trim() },
        include: [
          {
            model: Cliente,
            as: "cliente",
            required: false, // LEFT JOIN para incluir mesmo se não for cliente
          },
        ],
      });

      // 3. Verificar se usuário existe
      if (!usuario) {
        return res.status(401).json({
          success: false,
          message: "Credenciais inválidas",
          errors: {
            email: "Email ou senha incorretos",
          },
        });
      }

      // 4. Verificar se a conta está ativa
      if (!usuario.ativo) {
        return res.status(403).json({
          success: false,
          message: "Conta inativa",
          errors: {
            conta: "Sua conta está inativa. Entre em contato com o suporte.",
          },
        });
      }

      // 5. Comparar a senha com bcryptjs.compare()
      const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

      if (!senhaValida) {
        return res.status(401).json({
          success: false,
          message: "Credenciais inválidas",
          errors: {
            email: "Email ou senha incorretos",
          },
        });
      }

      // 6. Gerar JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error("JWT_SECRET não configurado");
        return res.status(500).json({
          success: false,
          message: "Erro de configuração do servidor",
          errors: {
            message: "Configuração de segurança não encontrada",
          },
        });
      }

      const token = jwt.sign(
        {
          userId: usuario.id,
          tipo: usuario.tipo_usuario,
        },
        jwtSecret,
        { expiresIn: "24h" }
      );

      // 7. Retornar token e informações básicas do usuário/cliente
      const responseData = {
        token,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          tipo_usuario: usuario.tipo_usuario,
          ativo: usuario.ativo,
          termos_aceitos: usuario.termos_aceitos,
          data_aceite_terms: usuario.data_aceite_terms,
        },
      };

      // Adicionar dados específicos do cliente se existir
      if (usuario.cliente) {
        responseData.cliente = {
          id: usuario.cliente.id,
          nome_completo: usuario.cliente.nome_completo,
          celular: usuario.cliente.celular,
          cidade: usuario.cliente.cidade,
          uf: usuario.cliente.uf,
        };
      }

      return res.status(200).json({
        success: true,
        message: "Login realizado com sucesso",
        data: responseData,
      });
    } catch (error) {
      console.error("Erro no login:", error);

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
   * Logout de usuário
   * POST /api/auth/logout
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async logout(req, res) {
    // TODO: Implementar logout
    return res.status(501).json({
      success: false,
      message: "Funcionalidade de logout ainda não implementada",
    });
  }

  /**
   * Recuperação de senha
   * POST /api/auth/forgot-password
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async forgotPassword(req, res) {
    // TODO: Implementar recuperação de senha
    return res.status(501).json({
      success: false,
      message: "Funcionalidade de recuperação de senha ainda não implementada",
    });
  }

  /**
   * Reset de senha
   * POST /api/auth/reset-password
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async resetPassword(req, res) {
    // TODO: Implementar reset de senha
    return res.status(501).json({
      success: false,
      message: "Funcionalidade de reset de senha ainda não implementada",
    });
  }
}

module.exports = AuthController;
