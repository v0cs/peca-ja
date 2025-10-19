const bcrypt = require("bcryptjs");
const { Cliente, Usuario } = require("../models");

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

/**
 * Controller de Cliente
 * Gerencia operações específicas de clientes
 */
class ClienteController {
  /**
   * Buscar perfil do cliente logado
   * GET /api/clientes/profile
   *
   * @param {Object} req - Request object (deve conter req.user do middleware)
   * @param {Object} res - Response object
   */
  static async getProfile(req, res) {
    try {
      // req.user é adicionado pelo middleware de autenticação
      const { userId, tipo } = req.user;

      // Verificar se o usuário é do tipo cliente
      if (tipo !== "cliente") {
        return res.status(403).json({
          success: false,
          message: "Acesso negado",
          errors: {
            tipo_usuario: "Esta operação é exclusiva para clientes",
          },
        });
      }

      // Buscar dados completos do cliente incluindo dados do usuário
      const cliente = await Cliente.findOne({
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

      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: "Cliente não encontrado",
          errors: {
            cliente: "Perfil de cliente não encontrado para este usuário",
          },
        });
      }

      // Verificar se a conta está ativa
      if (!cliente.usuario.ativo) {
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
        cliente: {
          id: cliente.id,
          nome_completo: cliente.nome_completo,
          telefone: cliente.telefone,
          celular: cliente.celular,
          cidade: cliente.cidade,
          uf: cliente.uf,
          created_at: cliente.data_criacao,
          updated_at: cliente.data_atualizacao,
        },
        usuario: {
          id: cliente.usuario.id,
          email: cliente.usuario.email,
          tipo_usuario: cliente.usuario.tipo_usuario,
          ativo: cliente.usuario.ativo,
          termos_aceitos: cliente.usuario.termos_aceitos,
          data_aceite_terms: cliente.usuario.data_aceite_terms,
          consentimento_marketing: cliente.usuario.consentimento_marketing,
          created_at: cliente.usuario.data_criacao,
          updated_at: cliente.usuario.data_atualizacao,
        },
      };

      return res.status(200).json({
        success: true,
        message: "Perfil do cliente recuperado com sucesso",
        data: responseData,
      });
    } catch (error) {
      console.error("Erro ao buscar perfil do cliente:", error);

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
   * Atualizar perfil do cliente
   * PUT /api/clientes/profile
   *
   * @param {Object} req - Request object (deve conter req.user do middleware)
   * @param {Object} res - Response object
   */
  static async updateProfile(req, res) {
    const transaction = await Cliente.sequelize.transaction();

    try {
      // req.user é adicionado pelo middleware de autenticação
      const { userId, tipo } = req.user;

      // Verificar se o usuário é do tipo cliente
      if (tipo !== "cliente") {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: "Acesso negado",
          errors: {
            tipo_usuario: "Esta operação é exclusiva para clientes",
          },
        });
      }

      // Campos permitidos para atualização
      const camposPermitidos = [
        "nome_completo",
        "telefone",
        "celular",
        "cidade",
        "uf",
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

      // Validar nome_completo se fornecido
      if (dadosAtualizacao.nome_completo) {
        if (dadosAtualizacao.nome_completo.length < 2) {
          errors.nome_completo =
            "Nome completo deve ter pelo menos 2 caracteres";
        }
      }

      // Validar telefone se fornecido
      if (dadosAtualizacao.telefone) {
        const telefoneRegex = /^\([0-9]{2}\)[0-9]{4,5}-?[0-9]{4}$/;
        if (!telefoneRegex.test(dadosAtualizacao.telefone)) {
          errors.telefone =
            "Formato de telefone inválido. Use o formato: (11)99999-9999";
        }
      }

      // Validar celular se fornecido
      if (dadosAtualizacao.celular) {
        const celularRegex = /^\([0-9]{2}\)[0-9]{4,5}-?[0-9]{4}$/;
        if (!celularRegex.test(dadosAtualizacao.celular)) {
          errors.celular =
            "Formato de celular inválido. Use o formato: (11)999999999";
        }
      }

      // Validar UF se fornecida
      if (dadosAtualizacao.uf) {
        if (
          !dadosAtualizacao.uf ||
          dadosAtualizacao.uf.length !== 2 ||
          !ufsValidas.includes(dadosAtualizacao.uf.toUpperCase().trim())
        ) {
          errors.uf = "UF inválida";
        } else {
          // Normalizar UF para maiúsculas
          dadosAtualizacao.uf = dadosAtualizacao.uf.toUpperCase().trim();
        }
      }

      // Validar cidade se fornecida
      if (dadosAtualizacao.cidade) {
        if (dadosAtualizacao.cidade.length < 2) {
          errors.cidade = "Nome da cidade deve ter pelo menos 2 caracteres";
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

      // Buscar cliente existente
      const cliente = await Cliente.findOne({
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

      if (!cliente) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Cliente não encontrado",
          errors: {
            cliente: "Perfil de cliente não encontrado para este usuário",
          },
        });
      }

      // Verificar se a conta está ativa
      if (!cliente.usuario.ativo) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: "Conta inativa",
          errors: {
            conta: "Sua conta está inativa. Entre em contato com o suporte.",
          },
        });
      }

      // Atualizar campos do cliente
      await cliente.update(dadosAtualizacao, { transaction });

      // Commit da transação
      await transaction.commit();

      // Buscar dados atualizados para retornar
      const clienteAtualizado = await Cliente.findOne({
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
        cliente: {
          id: clienteAtualizado.id,
          nome_completo: clienteAtualizado.nome_completo,
          telefone: clienteAtualizado.telefone,
          celular: clienteAtualizado.celular,
          cidade: clienteAtualizado.cidade,
          uf: clienteAtualizado.uf,
          created_at: clienteAtualizado.data_criacao,
          updated_at: clienteAtualizado.data_atualizacao,
        },
        usuario: {
          id: clienteAtualizado.usuario.id,
          email: clienteAtualizado.usuario.email,
          tipo_usuario: clienteAtualizado.usuario.tipo_usuario,
          ativo: clienteAtualizado.usuario.ativo,
          termos_aceitos: clienteAtualizado.usuario.termos_aceitos,
          data_aceite_terms: clienteAtualizado.usuario.data_aceite_terms,
          consentimento_marketing:
            clienteAtualizado.usuario.consentimento_marketing,
          created_at: clienteAtualizado.usuario.data_criacao,
          updated_at: clienteAtualizado.usuario.data_atualizacao,
        },
      };

      return res.status(200).json({
        success: true,
        message: "Perfil do cliente atualizado com sucesso",
        data: responseData,
      });
    } catch (error) {
      // Rollback da transação em caso de erro
      await transaction.rollback();

      console.error("Erro ao atualizar perfil do cliente:", error);

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
}

module.exports = ClienteController;




