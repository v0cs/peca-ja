const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const config = require("../config/env");
const {
  Usuario,
  Cliente,
  Autopeca,
  TokenRecuperacaoSenha,
  Vendedor,
} = require("../models");
const { isValidEmail } = require("../utils/email");

/**
 * Função auxiliar para validar CNPJ real
 * @param {string} cnpj - CNPJ a ser validado
 * @returns {boolean} - true se válido, false se inválido
 */
const validarCNPJ = (cnpj) => {
  cnpj = cnpj.replace(/[^\d]+/g, "");
  if (cnpj.length !== 14) return false;

  // Elimina CNPJs conhecidos como inválidos (todos os dígitos iguais)
  if (/^(\d)\1+$/.test(cnpj)) return false;

  // Validação do primeiro dígito verificador
  let soma = 0;
  let peso = 5;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cnpj.charAt(i)) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  let digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  // Validação do segundo dígito verificador
  soma = 0;
  peso = 6;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(cnpj.charAt(i)) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  let digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  return (
    parseInt(cnpj.charAt(12)) === digito1 &&
    parseInt(cnpj.charAt(13)) === digito2
  );
};

/**
 * Lista de UFs válidas do Brasil
 */
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

const formatarCelularBanco = (valor) => {
  if (!valor) return null;
  const apenasDigitos = valor.replace(/\D/g, "");
  if (apenasDigitos.length !== 11) {
    return null;
  }
  return `(${apenasDigitos.slice(0, 2)})${apenasDigitos.slice(2)}`;
};

const formatarTelefoneBanco = (valor) => {
  if (!valor) return null;
  const apenasDigitos = valor.replace(/\D/g, "");
  if (apenasDigitos.length < 10 || apenasDigitos.length > 11) {
    return null;
  }
  return `(${apenasDigitos.slice(0, 2)})${apenasDigitos.slice(2)}`;
};

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
      const { nome_completo, email, senha, celular, cidade, uf, google_id } = req.body;

      // Verificar se é registro via OAuth
      const isOAuth = !!google_id;

      const camposObrigatorios = {
        nome_completo,
        email,
        celular,
        cidade,
        uf,
      };

      // Senha só é obrigatória se NÃO for OAuth
      if (!isOAuth) {
        camposObrigatorios.senha = senha;
      }

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

      // Validar senha (mínimo 6 caracteres) - só se não for OAuth
      if (!isOAuth) {
        if (!senha || senha.length < 6) {
        errors.senha = "A senha deve ter pelo menos 6 caracteres";
        }
      }

      // Validar celular (formato brasileiro)
      const celularLimpo = celular ? celular.replace(/\D/g, "") : "";
      if (celularLimpo.length !== 11) {
        errors.celular =
          "Celular deve conter 11 dígitos (DDD + número). Ex: (11)98765-4321";
      } else if (!/^\([0-9]{2}\)[0-9]{4,5}-?[0-9]{4}$/.test(celular)) {
        errors.celular =
          "Formato de celular inválido. Use o formato: (11)999999999";
      }
      const celularFormatado = formatarCelularBanco(celular);
      if (!celularFormatado) {
        errors.celular =
          "Celular deve conter 11 dígitos válidos. Ex: (11)98765-4321";
      }

      // Validar UF (2 caracteres e válida)
      if (
        !uf ||
        uf.length !== 2 ||
        !ufsValidas.includes(uf.toUpperCase().trim())
      ) {
        errors.uf = "UF inválida";
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
        include: [
          {
            model: Cliente,
            as: "cliente",
            required: false,
          },
          {
            model: Autopeca,
            as: "autopeca",
            required: false,
          },
        ],
        transaction,
      });

      if (emailExistente) {
        // Verificar se é um vendedor ativo vinculado a uma autopeça
        if (emailExistente.tipo_usuario === "vendedor") {
          const vendedorAtivo = await Vendedor.findOne({
            where: {
              usuario_id: emailExistente.id,
              ativo: true,
            },
            transaction,
          });

          if (vendedorAtivo) {
            await transaction.rollback();
            return res.status(409).json({
              success: false,
              message: "Email já cadastrado como vendedor",
              errors: {
                email: "Este email já está sendo usado por um vendedor vinculado a uma autopeça. Não é possível cadastrar como cliente enquanto estiver vinculado.",
              },
            });
          }
        }

        // Se o email existe e a conta está ativa, bloquear registro
        if (emailExistente.ativo) {
          await transaction.rollback();
          return res.status(409).json({
            success: false,
            message: "Email já cadastrado",
            errors: {
              email: "Este email já está sendo usado por outro usuário",
            },
          });
        }

        // Se o email existe mas a conta está inativa, reativar e atualizar dados
        // Isso preserva histórico (solicitações, notificações, etc.) e permite reuso seguro
        const updateData = {
            ativo: true,
            termos_aceitos: true,
            data_aceite_terms: new Date(),
            tipo_usuario: "cliente",
            senha_temporaria: false,
        };

        // Se for OAuth, atualizar google_id, senão atualizar senha
        if (isOAuth && google_id) {
          updateData.google_id = google_id;
          // Para OAuth, podemos deixar senha_hash como está ou gerar um hash aleatório
          // Vamos manter a senha_hash existente se houver, senão gerar uma aleatória
          if (!emailExistente.senha_hash) {
            const saltRounds = 12;
            updateData.senha_hash = await bcrypt.hash(
              crypto.randomBytes(32).toString("hex"),
              saltRounds
            );
          }
        } else {
          const saltRounds = 12;
          updateData.senha_hash = await bcrypt.hash(senha, saltRounds);
        }

        // Reativar usuário e atualizar dados
        await emailExistente.update(updateData, { transaction });

        // Se havia autopeça associada, mantemos como registro histórico,
        // mas garantimos que não esteja ativa após a conversão.
        if (emailExistente.autopeca) {
          await emailExistente.autopeca.update(
            {
              data_exclusao_pedida:
                emailExistente.autopeca.data_exclusao_pedida || new Date(),
            },
            { transaction }
          );
        }

        // Atualizar dados do cliente
        if (emailExistente.cliente) {
          await emailExistente.cliente.update(
            {
              nome_completo: nome_completo.trim(),
            telefone: formatarTelefoneBanco(celular) || celularFormatado,
            celular: celularFormatado,
              cidade: cidade.trim(),
              uf: uf.toUpperCase().trim(),
              data_exclusao_pedida: null, // Limpar data de exclusão se existir
            },
            { transaction }
          );
        } else {
          // Se não tem cliente, criar (caso raro, mas pode acontecer)
          await Cliente.create(
            {
              usuario_id: emailExistente.id,
              nome_completo: nome_completo.trim(),
            telefone: formatarTelefoneBanco(celular) || celularFormatado,
            celular: celularFormatado,
              cidade: cidade.trim(),
              uf: uf.toUpperCase().trim(),
            },
            { transaction }
          );
        }

        // Commit da transação
        await transaction.commit();

        // Buscar dados atualizados
        const usuarioReativado = await Usuario.findByPk(emailExistente.id, {
          include: [
            {
              model: Cliente,
              as: "cliente",
              required: false,
            },
          ],
        });

        // Enviar email de boas-vindas
        try {
          const { emailService } = require("../services");
          emailService
            .sendWelcomeEmail(
              usuarioReativado,
              usuarioReativado.cliente,
              "cliente"
            )
            .catch((err) =>
              console.log("Erro ao enviar email de boas-vindas:", err)
            );
        } catch (emailError) {
          console.log("Erro no envio de email:", emailError);
        }

        // Retornar sucesso com dados do usuário reativado
        return res.status(200).json({
          success: true,
          message: "Conta reativada com sucesso",
          data: {
            usuario: {
              id: usuarioReativado.id,
              email: usuarioReativado.email,
              tipo_usuario: usuarioReativado.tipo_usuario,
              ativo: usuarioReativado.ativo,
              termos_aceitos: usuarioReativado.termos_aceitos,
              data_aceite_terms: usuarioReativado.data_aceite_terms,
            },
            cliente: usuarioReativado.cliente
              ? {
                  id: usuarioReativado.cliente.id,
                  nome_completo: usuarioReativado.cliente.nome_completo,
                  celular: usuarioReativado.cliente.celular,
                  cidade: usuarioReativado.cliente.cidade,
                  uf: usuarioReativado.cliente.uf,
                }
              : null,
          },
        });
      }

      // 4. Preparar dados do usuário
      const usuarioData = {
          email: email.toLowerCase().trim(),
          tipo_usuario: "cliente",
          termos_aceitos: true,
          data_aceite_terms: new Date(),
          ativo: true,
          consentimento_marketing: false,
      };

      // Se for OAuth, adicionar google_id e gerar senha_hash aleatória
      // Se não for OAuth, fazer hash da senha normalmente
      if (isOAuth && google_id) {
        usuarioData.google_id = google_id;
        // Gerar senha_hash aleatória (não será usada, mas o campo é obrigatório)
        const saltRounds = 12;
        usuarioData.senha_hash = await bcrypt.hash(
          crypto.randomBytes(32).toString("hex"),
          saltRounds
        );
      } else {
        const saltRounds = 12;
        usuarioData.senha_hash = await bcrypt.hash(senha, saltRounds);
      }

      // 5. Criar registro na tabela Usuarios
      const novoUsuario = await Usuario.create(usuarioData, { transaction });

      // 6. Criar registro na tabela Clientes
      const novoCliente = await Cliente.create(
        {
          usuario_id: novoUsuario.id,
          nome_completo: nome_completo.trim(),
          telefone: formatarTelefoneBanco(celular) || celularFormatado, // Persistir no padrão esperado
          celular: celularFormatado,
          cidade: cidade.trim(),
          uf: uf.toUpperCase().trim(),
        },
        { transaction }
      );

      // 7. Commit da transação
      await transaction.commit();

      // 8. Enviar email de boas-vindas (assíncrono - não bloqueia response)
      try {
        const { emailService } = require("../services");
        emailService
          .sendWelcomeEmail(novoUsuario, novoCliente, "cliente")
          .catch((err) =>
            console.log("Erro ao enviar email de boas-vindas:", err)
          );
      } catch (emailError) {
        console.log("Erro no envio de email:", emailError);
      }

      // 9. Gerar token JWT se for OAuth (para login automático)
      let token = null;
      if (isOAuth && google_id) {
        const jwtSecret = config.JWT_SECRET || process.env.JWT_SECRET;
        if (jwtSecret) {
          token = jwt.sign(
            {
              userId: novoUsuario.id,
              tipo: novoUsuario.tipo_usuario,
            },
            jwtSecret,
            { expiresIn: "7d" }
          );
        }
      }

      // 10. Retornar sucesso (201)
      const responseData = {
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
      };

      // Adicionar token e dados completos do usuário se for OAuth
      if (token) {
        responseData.token = token;
        responseData.user = {
          ...responseData.data.usuario,
          cliente: responseData.data.cliente,
          perfil: responseData.data.cliente,
        };
      }

      return res.status(201).json(responseData);
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
   * Registra uma nova autopeça no sistema
   * POST /api/auth/register-autopeca
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async registerAutopeca(req, res) {
    if (process.env.NODE_ENV === "development") {
      console.log("=== INICIANDO REGISTRO DE AUTOPEÇA ===");
      console.log("Body recebido:", req.body);
    }

    // Verificar se os modelos estão disponíveis
    if (!Autopeca) {
      console.error("ERRO: Modelo Autopeca não está disponível");
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message: "Modelo Autopeca não está disponível",
        },
      });
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        "Modelos verificados - Autopeca:",
        !!Autopeca,
        "Usuario:",
        !!Usuario
      );
    }

    const transaction = await Usuario.sequelize.transaction();
    if (process.env.NODE_ENV === "development") {
      console.log("Transação iniciada");
    }

    try {
      // 1. Validar campos obrigatórios
      const {
        email,
        senha,
        razao_social,
        nome_fantasia,
        cnpj,
        telefone,
        endereco_rua,
        endereco_numero,
        endereco_bairro,
        endereco_cidade,
        endereco_uf,
        endereco_cep,
        google_id,
      } = req.body;

      // Verificar se é registro via OAuth
      const isOAuth = !!google_id;

      if (process.env.NODE_ENV === "development") {
        console.log("Campos extraídos:", {
          email,
          razao_social,
          cnpj,
          telefone,
          endereco_cidade,
          endereco_uf,
          isOAuth,
        });
      }

      const camposObrigatorios = {
        email,
        razao_social,
        cnpj,
        telefone,
        endereco_rua,
        endereco_numero,
        endereco_bairro,
        endereco_cidade,
        endereco_uf,
        endereco_cep,
      };

      // Senha só é obrigatória se NÃO for OAuth
      if (!isOAuth) {
        camposObrigatorios.senha = senha;
      }

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

      // Validar senha (mínimo 6 caracteres) - só se não for OAuth
      if (!isOAuth) {
        if (!senha || senha.length < 6) {
        errors.senha = "A senha deve ter pelo menos 6 caracteres";
        }
      }

      // Validar CNPJ (formato e algoritmo)
      if (!validarCNPJ(cnpj)) {
        errors.cnpj = "CNPJ inválido";
      }

      // Validar telefone (formato brasileiro)
      const telefoneFormatado = formatarTelefoneBanco(telefone);
      if (!telefoneFormatado) {
        errors.telefone =
          "Telefone deve conter DDD + número. Use o formato: (11)3333-4444 ou (11)98888-7777";
      }

      // Validar UF (2 caracteres e válida)
      if (
        !endereco_uf ||
        endereco_uf.length !== 2 ||
        !ufsValidas.includes(endereco_uf.toUpperCase().trim())
      ) {
        errors.endereco_uf = "UF inválida";
      }

      // Validar CEP (8 dígitos numéricos)
      const cepRegex = /^[0-9]{8}$/;
      if (!cepRegex.test(endereco_cep)) {
        errors.endereco_cep = "CEP deve conter exatamente 8 dígitos numéricos";
      }

      // Validar razão social
      if (razao_social.length < 2) {
        errors.razao_social = "Razão social deve ter pelo menos 2 caracteres";
      }

      // Validar cidade
      if (endereco_cidade.length < 2) {
        errors.endereco_cidade =
          "Nome da cidade deve ter pelo menos 2 caracteres";
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
      if (process.env.NODE_ENV === "development") {
        console.log("Verificando email existente:", email.toLowerCase().trim());
      }
      const emailExistente = await Usuario.findOne({
        where: { email: email.toLowerCase().trim() },
        include: [
          {
            model: Autopeca,
            as: "autopeca",
            required: false,
          },
          {
            model: Cliente,
            as: "cliente",
            required: false,
          },
        ],
        transaction,
      });

      if (emailExistente) {
        // Verificar se é um vendedor ativo vinculado a uma autopeça
        if (emailExistente.tipo_usuario === "vendedor") {
          const vendedorAtivo = await Vendedor.findOne({
            where: {
              usuario_id: emailExistente.id,
              ativo: true,
            },
            transaction,
          });

          if (vendedorAtivo) {
            if (process.env.NODE_ENV === "development") {
              console.log(
                "Email já existe como vendedor ativo:",
                emailExistente.email
              );
            }
            await transaction.rollback();
            return res.status(409).json({
              success: false,
              message: "Email já cadastrado como vendedor",
              errors: {
                email: "Este email já está sendo usado por um vendedor vinculado a uma autopeça. Não é possível cadastrar como autopeça enquanto estiver vinculado.",
              },
            });
          }
        }

        // Se o email existe e a conta está ativa, bloquear registro
        if (emailExistente.ativo) {
          if (process.env.NODE_ENV === "development") {
            console.log("Email já existe e está ativo:", emailExistente.email);
          }
          await transaction.rollback();
          return res.status(409).json({
            success: false,
            message: "Email já cadastrado",
            errors: {
              email: "Este email já está sendo usado por outro usuário",
            },
          });
        }

        // Se o email existe mas a conta está inativa, reativar e atualizar dados
        // Isso preserva histórico (solicitações atendidas, vendedores, etc.) e permite reuso seguro
        if (process.env.NODE_ENV === "development") {
          console.log(
            "Email existe mas está inativo, reativando:",
            emailExistente.email
          );
        }

        // Preparar dados de atualização
        const updateData = {
          ativo: true,
          termos_aceitos: true,
          data_aceite_terms: new Date(),
          tipo_usuario: "autopeca", // Atualizar tipo para autopeca
          senha_temporaria: false,
        };

        // Se for OAuth, atualizar google_id, senão atualizar senha
        if (isOAuth && google_id) {
          updateData.google_id = google_id;
          // Para OAuth, podemos deixar senha_hash como está ou gerar um hash aleatório
          if (!emailExistente.senha_hash) {
        const saltRounds = 12;
            updateData.senha_hash = await bcrypt.hash(
              crypto.randomBytes(32).toString("hex"),
              saltRounds
            );
          }
        } else {
          const saltRounds = 12;
          updateData.senha_hash = await bcrypt.hash(senha, saltRounds);
        }

        // Se havia cliente associado, marcar para exclusão
        // pois estamos convertendo para autopeça
        if (emailExistente.cliente) {
          await emailExistente.cliente.update(
            {
              data_exclusao_pedida:
                emailExistente.cliente.data_exclusao_pedida || new Date(),
            },
            { transaction }
          );
        }

        // Reativar usuário e atualizar dados
        await emailExistente.update(updateData, { transaction });

        // Atualizar dados da autopeça
        if (emailExistente.autopeca) {
          await emailExistente.autopeca.update(
            {
              razao_social: razao_social.trim(),
              nome_fantasia: nome_fantasia ? nome_fantasia.trim() : null,
              cnpj: cnpj.trim(),
              telefone: telefoneFormatado,
              endereco_rua: endereco_rua.trim(),
              endereco_numero: endereco_numero.trim(),
              endereco_bairro: endereco_bairro.trim(),
              endereco_cidade: endereco_cidade.trim(),
              endereco_uf: endereco_uf.toUpperCase().trim(),
              endereco_cep: endereco_cep.trim(),
              data_exclusao_pedida: null, // Limpar data de exclusão se existir
            },
            { transaction }
          );
        } else {
          // Se não tem autopeça, criar (caso raro, mas pode acontecer)
          await Autopeca.create(
            {
              usuario_id: emailExistente.id,
              razao_social: razao_social.trim(),
              nome_fantasia: nome_fantasia ? nome_fantasia.trim() : null,
              cnpj: cnpj.trim(),
              telefone: telefoneFormatado,
              endereco_rua: endereco_rua.trim(),
              endereco_numero: endereco_numero.trim(),
              endereco_bairro: endereco_bairro.trim(),
              endereco_cidade: endereco_cidade.trim(),
              endereco_uf: endereco_uf.toUpperCase().trim(),
              endereco_cep: endereco_cep.trim(),
            },
            { transaction }
          );
        }

        // Commit da transação
        await transaction.commit();

        // Buscar dados atualizados
        const usuarioReativado = await Usuario.findByPk(emailExistente.id, {
          include: [
            {
              model: Autopeca,
              as: "autopeca",
              required: false,
            },
          ],
        });

        // Enviar email de boas-vindas
        try {
          const { emailService } = require("../services");
          emailService
            .sendWelcomeEmail(
              usuarioReativado,
              usuarioReativado.autopeca,
              "autopeca"
            )
            .catch((err) =>
              console.log("Erro ao enviar email de boas-vindas:", err)
            );
        } catch (emailError) {
          console.log("Erro no envio de email:", emailError);
        }

        if (process.env.NODE_ENV === "development") {
          console.log("Conta reativada com sucesso");
        }

        // Retornar sucesso com dados da autopeça reativada
        return res.status(200).json({
          success: true,
          message: "Conta reativada com sucesso",
          data: {
            usuario: {
              id: usuarioReativado.id,
              email: usuarioReativado.email,
              tipo_usuario: usuarioReativado.tipo_usuario,
              ativo: usuarioReativado.ativo,
              termos_aceitos: usuarioReativado.termos_aceitos,
              data_aceite_terms: usuarioReativado.data_aceite_terms,
            },
            autopeca: usuarioReativado.autopeca
              ? {
                  id: usuarioReativado.autopeca.id,
                  razao_social: usuarioReativado.autopeca.razao_social,
                  nome_fantasia: usuarioReativado.autopeca.nome_fantasia,
                  cnpj: usuarioReativado.autopeca.cnpj,
                  telefone: usuarioReativado.autopeca.telefone,
                  endereco_rua: usuarioReativado.autopeca.endereco_rua,
                  endereco_numero: usuarioReativado.autopeca.endereco_numero,
                  endereco_bairro: usuarioReativado.autopeca.endereco_bairro,
                  endereco_cidade: usuarioReativado.autopeca.endereco_cidade,
                  endereco_uf: usuarioReativado.autopeca.endereco_uf,
                  endereco_cep: usuarioReativado.autopeca.endereco_cep,
                }
              : null,
          },
        });
      }
      if (process.env.NODE_ENV === "development") {
        console.log("Email disponível");
      }

      // 4. Verificar se CNPJ já existe
      if (process.env.NODE_ENV === "development") {
        console.log("Verificando CNPJ existente:", cnpj.trim());
      }
      const cnpjExistente = await Autopeca.findOne({
        where: { cnpj: cnpj.trim() },
        transaction,
      });

      if (cnpjExistente) {
        if (process.env.NODE_ENV === "development") {
          console.log("CNPJ já existe:", cnpjExistente.cnpj);
        }
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: "CNPJ já cadastrado",
          errors: {
            cnpj: "Este CNPJ já está sendo usado por outra autopeça",
          },
        });
      }
      if (process.env.NODE_ENV === "development") {
        console.log("CNPJ disponível");
      }

      // 5. Preparar dados do usuário
      if (process.env.NODE_ENV === "development") {
        console.log("Preparando dados do usuário...");
      }
      const dadosUsuario = {
        email: email.toLowerCase().trim(),
        tipo_usuario: "autopeca",
        termos_aceitos: true,
        data_aceite_terms: new Date(),
        ativo: true,
        consentimento_marketing: false,
      };

      // Se for OAuth, adicionar google_id e gerar senha_hash aleatória
      // Se não for OAuth, fazer hash da senha normalmente
      if (isOAuth && google_id) {
        dadosUsuario.google_id = google_id;
        // Gerar senha_hash aleatória (não será usada, mas o campo é obrigatório)
      const saltRounds = 12;
        dadosUsuario.senha_hash = await bcrypt.hash(
          crypto.randomBytes(32).toString("hex"),
          saltRounds
        );
      } else {
        const saltRounds = 12;
        dadosUsuario.senha_hash = await bcrypt.hash(senha, saltRounds);
      }

      if (process.env.NODE_ENV === "development") {
        console.log("Hash da senha concluído");
      }

      // 6. Criar registro na tabela Usuarios
      if (process.env.NODE_ENV === "development") {
        console.log("Criando usuário...");
      }
      if (process.env.NODE_ENV === "development") {
        console.log("Dados do usuário:", {
          ...dadosUsuario,
          senha_hash: "[HIDDEN]",
        });
      }

      const novoUsuario = await Usuario.create(dadosUsuario, { transaction });
      if (process.env.NODE_ENV === "development") {
        console.log("Usuário criado com ID:", novoUsuario.id);
      }

      // 7. Criar registro na tabela Autopecas
      if (process.env.NODE_ENV === "development") {
        console.log("Criando autopeça...");
      }
      const dadosAutopeca = {
        usuario_id: novoUsuario.id,
        razao_social: razao_social.trim(),
        nome_fantasia: nome_fantasia ? nome_fantasia.trim() : null,
        cnpj: cnpj.trim(),
        telefone: telefoneFormatado,
        endereco_rua: endereco_rua.trim(),
        endereco_numero: endereco_numero.trim(),
        endereco_bairro: endereco_bairro.trim(),
        endereco_cidade: endereco_cidade.trim(),
        endereco_uf: endereco_uf.toUpperCase().trim(),
        endereco_cep: endereco_cep.trim(),
      };
      if (process.env.NODE_ENV === "development") {
        console.log("Dados da autopeça:", dadosAutopeca);
      }

      const novaAutopeca = await Autopeca.create(dadosAutopeca, {
        transaction,
      });
      if (process.env.NODE_ENV === "development") {
        console.log("Autopeça criada com ID:", novaAutopeca.id);
      }

      // 8. Commit da transação
      if (process.env.NODE_ENV === "development") {
        console.log("Fazendo commit da transação...");
      }
      await transaction.commit();
      if (process.env.NODE_ENV === "development") {
        console.log("Transação commitada com sucesso");
      }

      // 9. Enviar email de boas-vindas (assíncrono - não bloqueia response)
      try {
        const { emailService } = require("../services");
        emailService
          .sendWelcomeEmail(novoUsuario, novaAutopeca, "autopeca")
          .catch((err) =>
            console.log("Erro ao enviar email de boas-vindas:", err)
          );
      } catch (emailError) {
        console.log("Erro no envio de email:", emailError);
      }

      // 10. Gerar token JWT se for OAuth (para login automático)
      let token = null;
      if (isOAuth && google_id) {
        const jwtSecret = config.JWT_SECRET || process.env.JWT_SECRET;
        if (jwtSecret) {
          token = jwt.sign(
            {
              userId: novoUsuario.id,
              tipo: novoUsuario.tipo_usuario,
            },
            jwtSecret,
            { expiresIn: "7d" }
          );
        }
      }

      // 11. Retornar sucesso (201)
      const responseData = {
        success: true,
        message: "Autopeça registrada com sucesso",
        data: {
          usuario: {
            id: novoUsuario.id,
            email: novoUsuario.email,
            tipo_usuario: novoUsuario.tipo_usuario,
            ativo: novoUsuario.ativo,
            termos_aceitos: novoUsuario.termos_aceitos,
            data_aceite_terms: novoUsuario.data_aceite_terms,
          },
          autopeca: {
            id: novaAutopeca.id,
            razao_social: novaAutopeca.razao_social,
            nome_fantasia: novaAutopeca.nome_fantasia,
            cnpj: novaAutopeca.cnpj,
            telefone: novaAutopeca.telefone,
            endereco_rua: novaAutopeca.endereco_rua,
            endereco_numero: novaAutopeca.endereco_numero,
            endereco_bairro: novaAutopeca.endereco_bairro,
            endereco_cidade: novaAutopeca.endereco_cidade,
            endereco_uf: novaAutopeca.endereco_uf,
            endereco_cep: novaAutopeca.endereco_cep,
          },
        },
      };

      // Adicionar token e dados completos do usuário se for OAuth
      if (token) {
        responseData.token = token;
        responseData.user = {
          ...responseData.data.usuario,
          autopeca: responseData.data.autopeca,
          perfil: responseData.data.autopeca,
        };
      }

      return res.status(201).json(responseData);
    } catch (error) {
      // Rollback da transação em caso de erro
      if (process.env.NODE_ENV === "development") {
        console.log("Erro detectado, fazendo rollback da transação...");
      }
      await transaction.rollback();
      if (process.env.NODE_ENV === "development") {
        console.log("Rollback concluído");
      }

      console.error("=== ERRO DETALHADO NO REGISTER AUTOPEÇA ===");
      console.error("Nome do erro:", error.name);
      console.error("Mensagem:", error.message);
      console.error("Stack trace:", error.stack);
      console.error("Erro completo:", error);

      // Verificar tipo de erro do Sequelize
      if (error.name === "SequelizeValidationError") {
        console.error("Erro de validação Sequelize detectado");
        const validationErrors = {};
        error.errors.forEach((err) => {
          console.error(`Campo ${err.path}: ${err.message}`);
          validationErrors[err.path] = err.message;
        });

        return res.status(400).json({
          success: false,
          message: "Erro de validação nos dados",
          errors: validationErrors,
        });
      }

      if (error.name === "SequelizeUniqueConstraintError") {
        console.error("Erro de constraint única detectado");
        // Verificar qual campo causou o erro de unicidade
        const field = error.errors[0]?.path;
        console.error("Campo com conflito:", field);

        if (field === "email") {
          return res.status(409).json({
            success: false,
            message: "Conflito de dados",
            errors: {
              email: "Este email já está sendo usado por outro usuário",
            },
          });
        } else if (field === "cnpj") {
          return res.status(409).json({
            success: false,
            message: "Conflito de dados",
            errors: {
              cnpj: "Este CNPJ já está sendo usado por outra autopeça",
            },
          });
        }
      }

      if (error.name === "SequelizeForeignKeyConstraintError") {
        console.error("Erro de foreign key detectado");
        return res.status(400).json({
          success: false,
          message: "Erro de relacionamento entre dados",
          errors: {
            message: "Erro interno: dados relacionados inválidos",
          },
        });
      }

      if (error.name === "SequelizeDatabaseError") {
        console.error("Erro de banco de dados detectado");
        return res.status(500).json({
          success: false,
          message: "Erro de banco de dados",
          errors: {
            message:
              process.env.NODE_ENV === "development"
                ? error.message
                : "Erro interno do banco de dados",
          },
        });
      }

      // Erro interno do servidor (500)
      console.error("Erro não tratado, retornando erro 500");
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message:
            process.env.NODE_ENV === "development"
              ? error.message
              : "Ocorreu um erro inesperado. Tente novamente mais tarde.",
          ...(process.env.NODE_ENV === "development" && {
            stack: error.stack,
            name: error.name,
          }),
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

      // 2. Buscar usuário pelo email (incluindo relacionamentos com Cliente e Autopeca)
      const usuario = await Usuario.findOne({
        where: { email: email.toLowerCase().trim() },
        include: [
          {
            model: Cliente,
            as: "cliente",
            required: false, // LEFT JOIN para incluir mesmo se não for cliente
          },
          {
            model: Autopeca,
            as: "autopeca",
            required: false, // LEFT JOIN para incluir mesmo se não for autopeça
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
      const config = require("../config/env");
      const jwtSecret = config.JWT_SECRET;

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

      // Adicionar dados específicos baseados no tipo de usuário
      if (usuario.tipo_usuario === "cliente" && usuario.cliente) {
        responseData.cliente = {
          id: usuario.cliente.id,
          nome_completo: usuario.cliente.nome_completo,
          celular: usuario.cliente.celular,
          cidade: usuario.cliente.cidade,
          uf: usuario.cliente.uf,
        };
      }

      // Adicionar dados específicos da autopeça se for do tipo autopeca
      if (usuario.tipo_usuario === "autopeca" && usuario.autopeca) {
        responseData.autopeca = {
          id: usuario.autopeca.id,
          razao_social: usuario.autopeca.razao_social,
          nome_fantasia: usuario.autopeca.nome_fantasia,
          cnpj: usuario.autopeca.cnpj,
          telefone: usuario.autopeca.telefone,
          endereco_cidade: usuario.autopeca.endereco_cidade,
          endereco_uf: usuario.autopeca.endereco_uf,
        };
      }

      // Adicionar dados específicos do vendedor se for do tipo vendedor
      if (usuario.tipo_usuario === "vendedor") {
        const vendedorAtivo = await Vendedor.findOne({
          where: {
            usuario_id: usuario.id,
            ativo: true,
          },
          include: [
            {
              model: Autopeca,
              as: "autopeca",
              required: true,
              include: [
                {
                  model: Usuario,
                  as: "usuario",
                  required: true,
                },
              ],
            },
          ],
        });

        if (vendedorAtivo) {
          // Verificar se a autopeça vinculada está ativa
          if (!vendedorAtivo.autopeca || !vendedorAtivo.autopeca.usuario || !vendedorAtivo.autopeca.usuario.ativo) {
            return res.status(403).json({
              success: false,
              message: "Conta inativa",
              errors: {
                conta: "A autopeça vinculada à sua conta foi desativada. Entre em contato com o suporte.",
              },
            });
          }

          responseData.vendedor = {
            id: vendedorAtivo.id,
            nome_completo: vendedorAtivo.nome_completo,
            ativo: vendedorAtivo.ativo,
            autopeca_id: vendedorAtivo.autopeca_id,
          };
        } else {
          // Vendedor não encontrado ou inativo
          return res.status(403).json({
            success: false,
            message: "Conta inativa",
            errors: {
              conta: "Sua conta de vendedor está inativa. Entre em contato com o administrador da autopeça.",
            },
          });
        }
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
    try {
      // Como o sistema usa JWT stateless, o logout é feito no cliente
      // removendo o token. Aqui apenas registramos o evento para auditoria.
      const { userId, tipo } = req.user;

      console.log(`✅ Logout realizado: Usuário ${userId} (${tipo})`);

      // Opcional: Registrar em log de auditoria
      // await LogAuditoria.create({
      //   usuario_id: userId,
      //   acao: 'logout',
      //   timestamp: new Date()
      // });

      return res.status(200).json({
        success: true,
        message: "Logout realizado com sucesso",
        data: {
          usuario_id: userId,
          tipo: tipo,
          logout_timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);

      return res.status(500).json({
        success: false,
        message: "Erro ao fazer logout",
        errors: {
          message: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        },
      });
    }
  }

  /**
   * Callback do Google OAuth 2.0
   * GET /api/auth/google/callback
   * 
   * Opção 1: OAuth apenas para login (usuários que já têm conta)
   * Se email não existe → retorna flag para frontend escolher tipo de cadastro
   * Se email existe → faz login normalmente
   *
   * @param {Object} req - Request object (com user do Passport)
   * @param {Object} res - Response object
   */
  static async googleCallback(req, res) {
    try {
      console.log("🔵 Google OAuth Callback recebido");
      console.log("📦 Dados do usuário (req.user):", req.user);
      
      // Dados do usuário retornados pela estratégia do Passport
      const { googleId, email, name, picture } = req.user || {};

      if (!email) {
        console.error("❌ Email não encontrado no perfil do Google");
        return res.status(400).json({
          success: false,
          message: "Email não encontrado no perfil do Google",
          errors: {
            email: "Não foi possível obter o email do Google. Tente novamente.",
          },
        });
      }

      console.log("✅ Email encontrado:", email);
      console.log("✅ Google ID:", googleId);

      // Buscar usuário por email ou google_id
      const { Op } = require("sequelize");
      const usuario = await Usuario.findOne({
        where: {
          [Op.or]: [
            { email: email.toLowerCase().trim() },
            { google_id: googleId },
          ],
        },
        include: [
          {
            model: Cliente,
            as: "cliente",
            required: false,
          },
          {
            model: Autopeca,
            as: "autopeca",
            required: false,
          },
        ],
      });

      // Se usuário não existe → retornar flag para frontend escolher tipo
      if (!usuario) {
        console.log("🆕 Usuário não encontrado - redirecionando para cadastro OAuth");
        
        // Redirecionar para frontend com dados do Google e flag de novo usuário
        const frontendURL = config.frontendURL || process.env.FRONTEND_URL || "http://localhost:5173";
        const redirectURL = `${frontendURL}/cadastrar?email=${encodeURIComponent(
          email
        )}&name=${encodeURIComponent(name || "")}&googleId=${encodeURIComponent(
          googleId
        )}&picture=${encodeURIComponent(picture || "")}&novoUsuario=true`;
        
        console.log("🔄 Redirecionando para:", redirectURL);
        console.log("📧 Email:", email);
        console.log("👤 Nome:", name);
        console.log("🔑 Google ID:", googleId);
        
        return res.redirect(redirectURL);
      }

      console.log("✅ Usuário encontrado - ID:", usuario.id);
      console.log("📊 Status do usuário - Ativo:", usuario.ativo);

      // Se usuário existe mas está inativo (conta excluída)
      // Permitir recadastro com novo tipo de usuário
      if (!usuario.ativo) {
        console.log("⚠️ Usuário inativo (conta excluída) - redirecionando para recadastro");
        
        const frontendURL = config.frontendURL || process.env.FRONTEND_URL || "http://localhost:5173";
        const redirectURL = `${frontendURL}/cadastrar?email=${encodeURIComponent(
          email
        )}&name=${encodeURIComponent(name || "")}&googleId=${encodeURIComponent(
          googleId
        )}&picture=${encodeURIComponent(picture || "")}&novoUsuario=true&contaExcluida=true`;
        
        console.log("🔄 Redirecionando para recadastro:", redirectURL);
        return res.redirect(redirectURL);
      }

      // Atualizar google_id se não tiver
      if (!usuario.google_id) {
        await usuario.update({ google_id: googleId });
      }

      // Gerar JWT (reutilizando lógica do login normal)
      const jwtSecret = config.JWT_SECRET || process.env.JWT_SECRET;
      if (!jwtSecret) {
        return res.status(500).json({
          success: false,
          message: "Configuração de segurança não encontrada",
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
        { expiresIn: config.JWT_EXPIRES_IN || "24h" }
      );

      // Preparar resposta (reutilizando lógica do login)
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

      // Adicionar dados específicos baseados no tipo de usuário
      if (usuario.tipo_usuario === "cliente" && usuario.cliente) {
        responseData.cliente = {
          id: usuario.cliente.id,
          nome_completo: usuario.cliente.nome_completo,
          celular: usuario.cliente.celular,
          cidade: usuario.cliente.cidade,
          uf: usuario.cliente.uf,
        };
      }

      if (usuario.tipo_usuario === "autopeca" && usuario.autopeca) {
        responseData.autopeca = {
          id: usuario.autopeca.id,
          razao_social: usuario.autopeca.razao_social,
          nome_fantasia: usuario.autopeca.nome_fantasia,
          cnpj: usuario.autopeca.cnpj,
          telefone: usuario.autopeca.telefone,
          endereco_cidade: usuario.autopeca.endereco_cidade,
          endereco_uf: usuario.autopeca.endereco_uf,
        };
      }

      // Para vendedores, buscar dados adicionais
      if (usuario.tipo_usuario === "vendedor") {
        const vendedorAtivo = await Vendedor.findOne({
          where: {
            usuario_id: usuario.id,
            ativo: true,
          },
          include: [
            {
              model: Autopeca,
              as: "autopeca",
              required: true,
              include: [
                {
                  model: Usuario,
                  as: "usuario",
                  required: true,
                },
              ],
            },
          ],
        });

        if (vendedorAtivo) {
          if (
            !vendedorAtivo.autopeca ||
            !vendedorAtivo.autopeca.usuario ||
            !vendedorAtivo.autopeca.usuario.ativo
          ) {
            const frontendURL = config.frontendURL || process.env.FRONTEND_URL || "http://localhost:5173";
            return res.redirect(
              `${frontendURL}/auth/oauth-callback?success=false&error=${encodeURIComponent(
                "A autopeça vinculada à sua conta foi desativada. Entre em contato com o suporte."
              )}`
            );
          }

          responseData.vendedor = {
            id: vendedorAtivo.id,
            nome_completo: vendedorAtivo.nome_completo,
            ativo: vendedorAtivo.ativo,
            autopeca_id: vendedorAtivo.autopeca_id,
          };
        } else {
          const frontendURL = config.frontendURL || process.env.FRONTEND_URL || "http://localhost:5173";
          return res.redirect(
            `${frontendURL}/auth/oauth-callback?success=false&error=${encodeURIComponent(
              "Sua conta de vendedor está inativa. Entre em contato com o administrador da autopeça."
            )}`
          );
        }
      }

      // Redirecionar para frontend com token (usando fragment para segurança)
      const frontendURL = config.frontendURL || process.env.FRONTEND_URL || "http://localhost:5173";
      return res.redirect(
        `${frontendURL}/auth/oauth-callback?token=${encodeURIComponent(
          token
        )}&success=true`
      );
    } catch (error) {
      console.error("Erro no callback do Google OAuth:", error);

      // Redirecionar para frontend com erro
      const frontendURL = config.frontendURL || process.env.FRONTEND_URL || "http://localhost:5173";
      return res.redirect(
        `${frontendURL}/auth/oauth-callback?success=false&error=${encodeURIComponent(
          "Erro ao processar login com Google. Tente novamente."
        )}`
      );
    }
  }

  /**
   * Recuperação de senha
   * POST /api/auth/forgot-password
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async forgotPassword(req, res) {
    try {
      // 1. Validar email
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email é obrigatório",
          errors: {
            email: "Email é obrigatório",
          },
        });
      }

      // Validar formato do email
      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: "Formato de email inválido",
          errors: {
            email: "Formato de email inválido",
          },
        });
      }

      // 2. Buscar usuário por email
      const usuario = await Usuario.findOne({
        where: { email: email.toLowerCase().trim() },
      });

      // 3. Se usuário não existe, retornar sucesso (não revelar se email existe)
      if (!usuario) {
        return res.status(200).json({
          success: true,
          message:
            "Se o email estiver cadastrado, você receberá instruções para redefinir sua senha",
        });
      }

      // 4. Gerar token único
      const resetToken = crypto.randomBytes(32).toString("hex");

      // 5. Criar TokenRecuperacaoSenha (expira em 1h)
      const dataExpiracao = new Date();
      dataExpiracao.setHours(dataExpiracao.getHours() + 1); // 1 hora

      await TokenRecuperacaoSenha.create({
        usuario_id: usuario.id,
        token: resetToken,
        data_expiracao: dataExpiracao,
        utilizado: false,
      });

      // 6. Enviar email com link (assíncrono - não bloqueia response)
      try {
        const { emailService } = require("../services");
        emailService
          .sendPasswordResetEmail(usuario, resetToken)
          .catch((err) =>
            console.log("Erro ao enviar email de recuperação:", err)
          );
      } catch (emailError) {
        console.log("Erro no envio de email:", emailError);
      }

      // 7. Retornar sucesso (não revelar se email existe)
      return res.status(200).json({
        success: true,
        message:
          "Se o email estiver cadastrado, você receberá instruções para redefinir sua senha",
      });
    } catch (error) {
      console.error("Erro na recuperação de senha:", error);

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
   * Reset de senha
   * POST /api/auth/reset-password
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async resetPassword(req, res) {
    const transaction = await Usuario.sequelize.transaction();

    try {
      // 1. Validar token e nova senha
      const { token, nova_senha } = req.body;

      if (!token || !nova_senha) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Token e nova senha são obrigatórios",
          errors: {
            token: !token ? "Token é obrigatório" : undefined,
            nova_senha: !nova_senha ? "Nova senha é obrigatória" : undefined,
          },
        });
      }

      // Validar nova senha (mínimo 6 caracteres)
      if (nova_senha.length < 6) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "A nova senha deve ter pelo menos 6 caracteres",
          errors: {
            nova_senha: "A senha deve ter pelo menos 6 caracteres",
          },
        });
      }

      // 2. Buscar token não expirado e não utilizado
      const tokenRecuperacao = await TokenRecuperacaoSenha.findOne({
        where: {
          token: token,
          utilizado: false,
        },
        include: [
          {
            model: Usuario,
            as: "usuario",
          },
        ],
        transaction,
      });

      if (!tokenRecuperacao) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Token inválido ou expirado",
          errors: {
            token: "Token inválido ou já utilizado",
          },
        });
      }

      // 3. Verificar se token não expirou
      if (new Date() > tokenRecuperacao.data_expiracao) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Token expirado",
          errors: {
            token: "Token expirado. Solicite um novo link de recuperação",
          },
        });
      }

      // 4. Buscar usuário relacionado
      const usuario = tokenRecuperacao.usuario;
      if (!usuario) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
          errors: {
            usuario: "Usuário associado ao token não encontrado",
          },
        });
      }

      // 5. Hash nova senha
      const saltRounds = 12;
      const novaSenhaHash = await bcrypt.hash(nova_senha, saltRounds);

      // 6. Atualizar senha do usuário
      await usuario.update(
        {
          senha_hash: novaSenhaHash,
        },
        { transaction }
      );

      // 7. Marcar token como utilizado
      await tokenRecuperacao.update(
        {
          utilizado: true,
          data_utilizacao: new Date(),
        },
        { transaction }
      );

      // 8. Commit da transação
      await transaction.commit();

      // 9. Enviar email de confirmação de redefinição de senha (assíncrono - não bloqueia response)
      try {
        const { emailService } = require("../services");
        // Usar sendSecurityNotification com tipo "senha" para notificação de redefinição
        emailService
          .sendSecurityNotification(usuario, { tipo: "senha" })
          .catch((err) =>
            console.log("Erro ao enviar email de confirmação de redefinição:", err)
          );
      } catch (emailError) {
        console.log("Erro no envio de email de confirmação de redefinição:", emailError);
      }

      // 10. Retornar sucesso
      return res.status(200).json({
        success: true,
        message: "Senha redefinida com sucesso",
        data: {
          usuario: {
            id: usuario.id,
            email: usuario.email,
            tipo_usuario: usuario.tipo_usuario,
          },
        },
      });
    } catch (error) {
      // Rollback da transação em caso de erro
      await transaction.rollback();

      console.error("Erro no reset de senha:", error);

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
   * Retorna informações do usuário logado
   * GET /api/auth/me
   * Requer autenticação JWT
   *
   * @param {Object} req - Request object (deve conter req.user do middleware)
   * @param {Object} res - Response object
   */
  static async me(req, res) {
    try {
      // req.user é adicionado pelo middleware de autenticação
      const { userId, tipo } = req.user;

      // Buscar dados completos do usuário
      const usuario = await Usuario.findOne({
        where: { id: userId },
        include: [
          {
            model: Cliente,
            as: "cliente",
            required: false, // LEFT JOIN para incluir mesmo se não for cliente
          },
          {
            model: Autopeca,
            as: "autopeca",
            required: false, // LEFT JOIN para incluir mesmo se não for autopeça
          },
        ],
      });

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
          errors: {
            user: "Usuário não existe no sistema",
          },
        });
      }

      // Verificar se a conta está ativa
      if (!usuario.ativo) {
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
        usuario: {
          id: usuario.id,
          email: usuario.email,
          tipo_usuario: usuario.tipo_usuario,
          ativo: usuario.ativo,
          termos_aceitos: usuario.termos_aceitos,
          data_aceite_terms: usuario.data_aceite_terms,
          consentimento_marketing: usuario.consentimento_marketing,
          google_id: usuario.google_id || null, // Incluir google_id para verificar se é OAuth
          created_at: usuario.created_at,
          updated_at: usuario.updated_at,
        },
      };

      // Adicionar dados específicos do cliente se existir
      if (usuario.cliente) {
        responseData.cliente = {
          id: usuario.cliente.id,
          nome_completo: usuario.cliente.nome_completo,
          telefone: usuario.cliente.telefone,
          celular: usuario.cliente.celular,
          cidade: usuario.cliente.cidade,
          uf: usuario.cliente.uf,
          created_at: usuario.cliente.created_at,
          updated_at: usuario.cliente.updated_at,
        };
      }

      // Adicionar dados específicos da autopeca se existir
      if (usuario.autopeca) {
        responseData.autopeca = {
          id: usuario.autopeca.id,
          razao_social: usuario.autopeca.razao_social,
          nome_fantasia: usuario.autopeca.nome_fantasia,
          cnpj: usuario.autopeca.cnpj,
          telefone: usuario.autopeca.telefone,
          endereco_rua: usuario.autopeca.endereco_rua,
          endereco_numero: usuario.autopeca.endereco_numero,
          endereco_bairro: usuario.autopeca.endereco_bairro,
          endereco_cidade: usuario.autopeca.endereco_cidade,
          endereco_uf: usuario.autopeca.endereco_uf,
          endereco_cep: usuario.autopeca.endereco_cep,
          created_at: usuario.autopeca.data_criacao,
          updated_at: usuario.autopeca.data_atualizacao,
        };
      }

      return res.status(200).json({
        success: true,
        message: "Informações do usuário recuperadas com sucesso",
        data: responseData,
      });
    } catch (error) {
      console.error("Erro ao buscar informações do usuário:", error);

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

module.exports = AuthController;
