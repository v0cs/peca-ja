const bcrypt = require("bcryptjs");
const { Usuario, Cliente, Autopeca, Vendedor } = require("../models");

/**
 * Controller de Usuario
 * Gerencia operações gerais de usuários (email, senha, exclusão)
 */
class UsuarioController {
  /**
   * Atualizar dados gerais do usuário (email, senha)
   * PUT /api/usuarios/profile
   *
   * @param {Object} req - Request object (deve conter req.user do middleware)
   * @param {Object} res - Response object
   */
  static async updateProfile(req, res) {
    const transaction = await Usuario.sequelize.transaction();

    try {
      // req.user é adicionado pelo middleware de autenticação
      const { userId } = req.user;
      const { email, senha_atual, nova_senha } = req.body;

      // Verificar se há dados para atualizar
      if (!email && !nova_senha) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Nenhum campo válido para atualização",
          errors: {
            campos:
              "Forneça 'email' para atualizar email ou 'senha_atual' e 'nova_senha' para atualizar senha",
          },
        });
      }

      // Buscar usuário existente
      const usuario = await Usuario.findOne({
        where: { id: userId },
        transaction,
      });

      if (!usuario) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
          errors: {
            usuario: "Usuário não encontrado no sistema",
          },
        });
      }

      // Verificar se a conta está ativa
      if (!usuario.ativo) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: "Conta inativa",
          errors: {
            conta: "Sua conta está inativa. Entre em contato com o suporte.",
          },
        });
      }

      const errors = {};
      const dadosAtualizacao = {};
      const emailAnterior = usuario.email;

      // === ATUALIZAÇÃO DE EMAIL ===
      if (email) {
        // Validar formato do email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.email = "Formato de email inválido";
        } else {
          // Verificar se o email já está em uso por outro usuário
          const emailExistente = await Usuario.findOne({
            where: { email: email.toLowerCase().trim() },
            transaction,
          });

          if (emailExistente && emailExistente.id !== userId) {
            errors.email = "Este email já está sendo usado por outro usuário";
          } else if (email.toLowerCase().trim() !== usuario.email) {
            dadosAtualizacao.email = email.toLowerCase().trim();
          }
        }
      }

      // === ATUALIZAÇÃO DE SENHA ===
      if (nova_senha) {
        // Verificar se senha_atual foi fornecida
        if (!senha_atual) {
          errors.senha_atual = "Senha atual é obrigatória para alterar a senha";
        } else {
          // Verificar se a senha atual está correta
          const senhaAtualCorreta = await bcrypt.compare(
            senha_atual,
            usuario.senha_hash
          );

          if (!senhaAtualCorreta) {
            errors.senha_atual = "Senha atual incorreta";
          } else {
            // Validar nova senha (mínimo 6 caracteres)
            if (nova_senha.length < 6) {
              errors.nova_senha =
                "A nova senha deve ter pelo menos 6 caracteres";
            } else {
              // Gerar hash da nova senha
              const saltRounds = 12;
              const novaSenhaHash = await bcrypt.hash(nova_senha, saltRounds);
              dadosAtualizacao.senha_hash = novaSenhaHash;
            }
          }
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

      // Verificar se há dados para atualizar após validações
      if (Object.keys(dadosAtualizacao).length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Nenhuma alteração detectada",
          errors: {
            campos: "Os dados fornecidos são iguais aos dados atuais",
          },
        });
      }

      // Atualizar usuário
      await usuario.update(dadosAtualizacao, { transaction });

      // Commit da transação
      await transaction.commit();
      await usuario.reload();

      // Enviar email de confirmação de alteração (assíncrono - não bloqueia response)
      if (dadosAtualizacao.email || dadosAtualizacao.senha_hash) {
        try {
          const { emailService } = require("../services");
          if (dadosAtualizacao.email) {
            emailService
              .sendSecurityNotification(usuario, {
                tipo: "email",
                metadados: {
                  antigoEmail: emailAnterior,
                  novoEmail: usuario.email,
                },
              })
              .catch((err) =>
                console.log("Erro ao enviar notificação de email:", err)
              );
          }

          if (dadosAtualizacao.senha_hash) {
            emailService
              .sendSecurityNotification(usuario, { tipo: "senha" })
              .catch((err) =>
                console.log("Erro ao enviar notificação de senha:", err)
              );
          }
        } catch (emailError) {
          console.log("Erro no envio de email de confirmação:", emailError);
        }
      }

      // Preparar mensagem de resposta
      let mensagemSucesso = "Perfil atualizado com sucesso";
      if (dadosAtualizacao.email && dadosAtualizacao.senha_hash) {
        mensagemSucesso = "Email e senha atualizados com sucesso";
      } else if (dadosAtualizacao.email) {
        mensagemSucesso = "Email atualizado com sucesso";
      } else if (dadosAtualizacao.senha_hash) {
        mensagemSucesso = "Senha atualizada com sucesso";
      }

      return res.status(200).json({
        success: true,
        message: mensagemSucesso,
        data: {
          usuario: {
            id: usuario.id,
            email: usuario.email,
            tipo_usuario: usuario.tipo_usuario,
            ativo: usuario.ativo,
          },
        },
      });
    } catch (error) {
      // Rollback da transação em caso de erro
      await transaction.rollback();

      console.error("Erro ao atualizar perfil do usuário:", error);

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
   * Excluir conta do usuário (soft delete)
   * DELETE /api/usuarios/profile
   *
   * @param {Object} req - Request object (deve conter req.user do middleware)
   * @param {Object} res - Response object
   */
  static async deleteAccount(req, res) {
    const transaction = await Usuario.sequelize.transaction();

    try {
      // req.user é adicionado pelo middleware de autenticação
      const { userId, tipo } = req.user;
      const { confirmacao, senha } = req.body;

      // Verificar se o tipo é vendedor (não pode excluir conta)
      if (tipo === "vendedor") {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: "Operação não permitida",
          errors: {
            conta: "Vendedores não podem excluir a própria conta. Solicite ao administrador da autopeça.",
          },
        });
      }

      // Validar confirmação
      if (confirmacao !== "CONFIRMAR") {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Confirmação inválida",
          errors: {
            confirmacao:
              'Para excluir sua conta, você deve digitar "CONFIRMAR" no campo de confirmação',
          },
        });
      }

      // Buscar usuário existente primeiro para verificar se é OAuth
      const usuario = await Usuario.findOne({
        where: { id: userId },
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

      if (!usuario) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
          errors: {
            usuario: "Usuário não encontrado no sistema",
          },
        });
      }

      // Verificar se é conta OAuth (tem google_id)
      const isOAuthAccount = !!usuario.google_id;

      // Validar senha - só é obrigatória se NÃO for conta OAuth
      if (!isOAuthAccount && !senha) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Senha obrigatória",
          errors: {
            senha: "Senha é obrigatória para excluir a conta",
          },
        });
      }

      // Verificar senha - só verificar se NÃO for conta OAuth ou se senha foi fornecida
      if (!isOAuthAccount && senha) {
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaCorreta) {
          await transaction.rollback();
          // Retornar 400 (Bad Request) ao invés de 401 (Unauthorized) para evitar logout automático
          // Este é um erro de validação de entrada, não um problema de autenticação
          return res.status(400).json({
            success: false,
            message: "Senha incorreta",
            errors: {
              senha: "Senha incorreta. Por favor, verifique sua senha e tente novamente.",
            },
          });
        }
      }

      // Verificar se a conta já foi marcada para exclusão
      if (!usuario.ativo) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Conta já desativada",
          errors: {
            conta: "Sua conta já está desativada",
          },
        });
      }

      // Marcar conta como inativa (soft delete)
      await usuario.update(
        {
          ativo: false,
        },
        { transaction }
      );

      // Marcar perfil específico com data de exclusão pedida
      const dataExclusao = new Date();

      if (tipo === "cliente" && usuario.cliente) {
        await usuario.cliente.update(
          {
            data_exclusao_pedida: dataExclusao,
          },
          { transaction }
        );

        // Cancelar todas as solicitações ativas do cliente
        const { Solicitacao } = require("../models");
        const solicitacoesAtivas = await Solicitacao.findAll({
          where: {
            cliente_id: usuario.cliente.id,
            status_cliente: "ativa",
          },
          transaction,
        });

        // Atualizar status de todas as solicitações ativas para "cancelada"
        if (solicitacoesAtivas.length > 0) {
          await Solicitacao.update(
            {
              status_cliente: "cancelada",
              data_conclusao: dataExclusao,
            },
            {
              where: {
                cliente_id: usuario.cliente.id,
                status_cliente: "ativa",
              },
              transaction,
            }
          );
        }
      } else if (tipo === "autopeca" && usuario.autopeca) {
        await usuario.autopeca.update(
          {
            data_exclusao_pedida: dataExclusao,
          },
          { transaction }
        );

        // Desativar todos os vendedores vinculados à autopeça e seus usuários
        const vendedoresVinculados = await Vendedor.findAll({
          where: {
            autopeca_id: usuario.autopeca.id,
            ativo: true,
          },
          include: [
            {
              model: Usuario,
              as: "usuario",
              required: true,
            },
          ],
          transaction,
        });

        // Desativar vendedores e seus usuários
        if (vendedoresVinculados.length > 0) {
          for (const vendedor of vendedoresVinculados) {
            // Desativar o vendedor
            await vendedor.update(
              {
                ativo: false,
              },
              { transaction }
            );

            // Desativar o usuário do vendedor
            if (vendedor.usuario) {
              await vendedor.usuario.update(
                {
                  ativo: false,
                },
                { transaction }
              );
            }
          }
        }
      }

      // Commit da transação
      await transaction.commit();

      // Preparar dados do perfil para o email
      let perfilData = {};
      if (tipo === "cliente" && usuario.cliente) {
        perfilData = { nome_completo: usuario.cliente.nome_completo };
      } else if (tipo === "autopeca" && usuario.autopeca) {
        perfilData = {
          razao_social: usuario.autopeca.razao_social,
          nome_fantasia: usuario.autopeca.nome_fantasia,
        };
      }

      // Enviar email de confirmação de exclusão (assíncrono - não bloqueia response)
      try {
        const { emailService } = require("../services");
        emailService
          .sendAccountDeletionEmail(usuario, perfilData, tipo)
          .catch((err) =>
            console.log("Erro ao enviar email de confirmação de exclusão:", err)
          );
      } catch (emailError) {
        console.log("Erro no envio de email de confirmação de exclusão:", emailError);
      }

      return res.status(200).json({
        success: true,
        message: "Conta excluída com sucesso",
        data: {
          usuario: {
            id: usuario.id,
            email: usuario.email,
            tipo_usuario: usuario.tipo_usuario,
            ativo: usuario.ativo,
            data_exclusao: dataExclusao,
          },
        },
      });
    } catch (error) {
      // Rollback da transação em caso de erro
      await transaction.rollback();

      console.error("Erro ao excluir conta do usuário:", error);

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

module.exports = UsuarioController;












