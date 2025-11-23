const { Resend } = require("resend");
const config = require("../config/env");

class EmailService {
  constructor() {
    this.resend = new Resend(config.RESEND_API_KEY);
    this.config = config;
  }

  /**
   * Função auxiliar para delay (sleep)
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Enviar email genérico via Resend com retry automático para rate limits
   */
  async sendEmail(to, subject, html, text = null, retries = 3) {
    const maxRetries = retries;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        if (attempt > 0) {
          console.log(`🔄 [RETRY] Tentativa ${attempt + 1}/${maxRetries} para ${to}`);
        }

        const result = await this.resend.emails.send({
          from: this.config.emailFrom,
          to: to,
          subject: subject,
          html: html,
          text: text || this.htmlToText(html),
        });

        // Verificar se há erro na resposta (Resend retorna erro no objeto, não como exception)
        if (result && result.error) {
          const error = result.error;
          
          // Se for rate limit, fazer retry com backoff
          if (error.statusCode === 429 || error.name === "rate_limit_exceeded") {
            const retryAfter = parseInt(result.headers?.["retry-after"] || "1", 10) * 1000;
            const waitTime = Math.min(retryAfter, 2000); // Máximo 2 segundos

            if (attempt < maxRetries - 1) {
              console.log(
                `⏳ [RATE LIMIT] Rate limit atingido. Aguardando ${waitTime}ms antes de tentar novamente...`
              );
              await this.sleep(waitTime);
              attempt++;
              continue;
            } else {
              console.error("❌ [RATE LIMIT] Número máximo de tentativas atingido para rate limit");
              return { error: error.message, details: error, rateLimit: true };
            }
          }

          // Outros erros não são retriáveis
          console.error("❌ Erro na resposta do Resend:", error);
          return { error: error.message, details: error };
        }

        // Sucesso
        const emailId = result.data?.id || result.id || "ID não disponível";
        if (attempt > 0) {
          console.log(`✅ [RETRY SUCCESS] Email enviado após ${attempt + 1} tentativas. ID: ${emailId}`);
        } else {
          console.log(`✅ Email enviado via Resend. ID: ${emailId}`);
        }

        return result;
      } catch (error) {
        // Erro de rate limit capturado como exception
        if (error.statusCode === 429 || error.name === "rate_limit_exceeded") {
          const retryAfter = parseInt(error.response?.headers?.["retry-after"] || "1", 10) * 1000;
          const waitTime = Math.min(retryAfter, 2000);

          if (attempt < maxRetries - 1) {
            console.log(
              `⏳ [RATE LIMIT] Rate limit atingido (exception). Aguardando ${waitTime}ms antes de tentar novamente...`
            );
            await this.sleep(waitTime);
            attempt++;
            continue;
          } else {
            console.error("❌ [RATE LIMIT] Número máximo de tentativas atingido para rate limit");
            return { error: error.message, details: error, rateLimit: true };
          }
        }

        // Outros erros não são retriáveis
        console.error("❌ Erro ao enviar email via Resend:", error);
        console.error("📋 Detalhes do erro:", {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
        });

        return { error: error.message, details: error };
      }
    }

    return { error: "Número máximo de tentativas excedido", details: null };
  }

  /**
   * Email de boas-vindas para novos usuários
   */
  async sendWelcomeEmail(usuario, perfilData, tipoUsuario) {
    const nome =
      perfilData.nome_completo || perfilData.razao_social || usuario.email;

    const subject = `Bem-vindo ao PeçaJá, ${nome.split(" ")[0]}! 🚗`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #2563eb; margin: 0;">PeçaJá</h1>
          <p style="color: #6b7280; margin: 5px 0;">Marketplace de Peças Automotivas</p>
        </div>

        <h2 style="color: #2563eb;">Bem-vindo(a), ${nome}! 🎉</h2>
        <p>Sua conta como <strong style="color: #059669;">${tipoUsuario}</strong> foi criada com sucesso no PeçaJá!</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <h3 style="margin-top: 0; color: #1e40af;">Próximos passos:</h3>
          <ul style="color: #4b5563;">
            ${
              tipoUsuario === "cliente"
                ? "<li>🚗 <strong>Crie solicitações</strong> de peças para seu veículo</li><li>💰 <strong>Receba orçamentos</strong> de autopeças locais</li><li>💬 <strong>Negocie diretamente</strong> via WhatsApp</li>"
                : "<li>🔔 <strong>Visualize solicitações</strong> da sua cidade</li><li>💬 <strong>Atenda clientes</strong> via WhatsApp</li><li>👥 <strong>Gerencie vendedores</strong> da sua equipe</li>"
            }
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${this.config.frontendURL}" 
             style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Acessar Minha Conta
          </a>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 14px;">
          <p><strong>Precisa de ajuda?</strong><br>
          Entre em contato conosco: suporte@pecaja.com</p>
          
          <p style="margin-top: 20px;">
            Atenciosamente,<br>
            <strong>Equipe PeçaJá</strong>
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(usuario.email, subject, html);
  }

  /**
   * Notificação de segurança para alterações de perfil (email/senha)
   */
  async sendSecurityNotification(usuario, { tipo, metadados = {} }) {
    const primeiroNome = (usuario.nome || usuario.email || "")
      .split(" ")[0]
      .trim();
    const nomeApresentacao = primeiroNome || "Usuário";

    if (tipo === "senha") {
      const subject = "🔐 Sua senha foi alterada com sucesso - PeçaJá";
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #2563eb; margin: 0;">PeçaJá</h1>
            <p style="color: #6b7280; margin: 5px 0;">Marketplace de Peças Automotivas</p>
          </div>

          <h2 style="color: #2563eb;">Olá, ${nomeApresentacao}! 👋</h2>
          <p>Confirmamos que sua senha foi atualizada recentemente.</p>

          <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <p style="margin: 0; color: #1e40af;">
              Se você realizou esta alteração, nenhuma ação adicional é necessária.
            </p>
          </div>

          <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 0; color: #991b1b;">
              Caso não tenha sido você, recomendamos redefinir sua senha imediatamente e entrar em contato com nosso suporte.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.config.frontendURL}/login"
               style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Acessar minha conta
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            Se precisar de ajuda, entre em contato conosco: suporte@pecaja.com
          </p>
        </div>
      `;

      return this.sendEmail(usuario.email, subject, html);
    }

    if (tipo === "email") {
      const novoEmail = metadados.novoEmail || usuario.email;
      const antigoEmail = metadados.antigoEmail;

      const subject = "✉️ Email da sua conta foi atualizado - PeçaJá";
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #2563eb; margin: 0;">PeçaJá</h1>
            <p style="color: #6b7280; margin: 5px 0;">Marketplace de Peças Automotivas</p>
          </div>

          <h2 style="color: #2563eb;">Olá, ${nomeApresentacao}! 👋</h2>
          <p>Este email confirma que o endereço associado à sua conta foi alterado.</p>

          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <p style="margin: 0; color: #1e3a8a;">
              <strong>Antigo email:</strong> ${
                antigoEmail || "Não informado"
              }<br/>
              <strong>Novo email:</strong> ${novoEmail}
            </p>
          </div>

          <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 0; color: #991b1b;">
              Se você não solicitou essa alteração, entre em contato com nossa equipe imediatamente.
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            Dúvidas? suporte@pecaja.com
          </p>
        </div>
      `;

      return this.sendEmail(novoEmail, subject, html);
    }

    return null;
  }

  /**
   * Notificação de nova solicitação para autopeças e vendedores da mesma cidade
   */
  async sendNewRequestNotification(
    email,
    solicitacao,
    cliente,
    nomeDestinatario
  ) {
    // Formatar data/hora
    const dataHora = new Date(solicitacao.created_at || new Date()).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const subject = `🚨 Nova Solicitação de Peça em ${solicitacao.cidade_atendimento}!`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #2563eb; margin: 0;">PeçaJá</h1>
          <p style="color: #6b7280; margin: 5px 0;">Marketplace de Peças Automotivas</p>
        </div>
        
        <div style="padding: 20px;">
          <h2 style="color: #2563eb;">Olá ${nomeDestinatario}! 👋</h2>
          
          <p>Acabou de chegar uma nova solicitação de peça na sua cidade:</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <p style="margin: 10px 0;"><strong>📋 Solicitação:</strong> ${solicitacao.descricao_peca}</p>
            <p style="margin: 10px 0;"><strong>🚗 Veículo:</strong> ${solicitacao.marca} ${solicitacao.modelo} ${solicitacao.ano_fabricacao} - Placa: ${solicitacao.placa}</p>
            <p style="margin: 10px 0;"><strong>📍 Localização:</strong> ${solicitacao.cidade_atendimento}, ${solicitacao.uf_atendimento}</p>
            <p style="margin: 10px 0;"><strong>🕒 Data:</strong> ${dataHora}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.config.frontendURL}/dashboard/autopeca" 
               style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Acesse seu dashboard para ver detalhes e atender
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 14px;">
            <p style="margin-top: 20px;">
              Atenciosamente,<br>
              <strong>Equipe PeçaJá</strong>
            </p>
          </div>
        </div>
      </div>
    `;

    const text = `
Olá ${nomeDestinatario}!

Acabou de chegar uma nova solicitação de peça na sua cidade:

📋 Solicitação: ${solicitacao.descricao_peca}
🚗 Veículo: ${solicitacao.marca} ${solicitacao.modelo} ${solicitacao.ano_fabricacao} - Placa: ${solicitacao.placa}
📍 Localização: ${solicitacao.cidade_atendimento}, ${solicitacao.uf_atendimento}
🕒 Data: ${dataHora}

Acesse seu dashboard para ver detalhes e atender:
${this.config.frontendURL}/dashboard/autopeca

Atenciosamente,
Equipe PeçaJá
    `.trim();

    return this.sendEmail(email, subject, html, text);
  }

  /**
   * Email com credenciais para novos vendedores
   */
  async sendVendorCredentials(
    vendedorEmail,
    vendedorNome,
    senhaTemporaria,
    autopecaNome
  ) {
    const subject = `👔 Suas Credenciais de Vendedor - ${autopecaNome}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #2563eb; margin: 0;">PeçaJá</h1>
          <p style="color: #6b7280; margin: 5px 0;">Marketplace de Peças Automotivas</p>
        </div>

        <h2 style="color: #2563eb;">Olá, ${vendedorNome}! 👋</h2>
        
        <p>Você foi cadastrado como <strong>vendedor</strong> na <strong>${autopecaNome}</strong>.</p>

        <div style="background: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #d97706;">🔐 Suas Credenciais de Acesso:</h3>
          <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #fed7aa;">
            <p style="margin: 10px 0;"><strong>📧 Email:</strong> ${vendedorEmail}</p>
            <p style="margin: 10px 0;"><strong>🔑 Senha Temporária:</strong> <code style="background: #fef3c7; padding: 4px 8px; border-radius: 4px; font-size: 16px;">${senhaTemporaria}</code></p>
          </div>
          <p style="color: #92400e; margin: 15px 0 0 0;">
            <strong>⚠️ Importante:</strong> Recomendamos alterar sua senha no primeiro acesso.
          </p>
        </div>

        <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #0369a1; margin-top: 0;">🎯 Suas Principais Funções:</h3>
          <ul style="color: #1e40af;">
            <li>Visualizar solicitações de peças na sua cidade</li>
            <li>Entrar em contato com clientes via WhatsApp</li>
            <li>Registrar atendimentos realizados</li>
            <li>Acompanhar seu desempenho de vendas</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${this.config.frontendURL}/login" 
             style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Fazer Primeiro Login
          </a>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 14px;">
          <p><strong>Dúvidas?</strong> Entre em contato com o administrador da ${autopecaNome}.</p>
          
          <p style="margin-top: 20px;">
            Atenciosamente,<br>
            <strong>Equipe PeçaJá</strong>
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(vendedorEmail, subject, html);
  }

  /**
   * Email de confirmação de exclusão de conta
   */
  async sendAccountDeletionEmail(usuario, perfilData, tipoUsuario) {
    const nome =
      perfilData?.nome_completo || perfilData?.razao_social || usuario.email || "Usuário";

    const subject = `👋 Sua conta foi excluída - PeçaJá`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #2563eb; margin: 0;">PeçaJá</h1>
          <p style="color: #6b7280; margin: 5px 0;">Marketplace de Peças Automotivas</p>
        </div>

        <h2 style="color: #2563eb;">Olá, ${nome.split(" ")[0]}! 👋</h2>
        
        <p>Confirmamos que sua conta foi <strong>excluída com sucesso</strong> do PeçaJá em ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}.</p>

        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="color: #dc2626; margin-top: 0;">📋 O que foi removido:</h3>
          <ul style="color: #991b1b; margin: 10px 0;">
            <li>Todas as suas solicitações foram canceladas</li>
            <li>Seus dados pessoais foram removidos permanentemente</li>
            <li>Você perdeu acesso a todos os recursos da plataforma</li>
          </ul>
        </div>

        <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <p style="margin: 0; color: #1e40af;">
            <strong>Esta ação é irreversível.</strong> Se você não solicitou a exclusão da conta, 
            entre em contato conosco imediatamente para investigarmos.
          </p>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="color: #6b7280; margin: 0;">
            Sentiremos sua falta! Caso mude de ideia, você pode criar uma nova conta a qualquer momento.
          </p>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 14px;">
          <p><strong>Dúvidas ou problemas?</strong><br>
          Entre em contato conosco: suporte@pecaja.com</p>
          
          <p style="margin-top: 20px;">
            Atenciosamente,<br>
            <strong>Equipe PeçaJá</strong>
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(usuario.email, subject, html);
  }

  /**
   * Email de recuperação de senha
   */
  async sendPasswordResetEmail(usuario, resetToken) {
    const resetLink = `${this.config.frontendURL}/reset-password?token=${resetToken}`;
    const subject = "🔐 Redefinição de Senha - PeçaJá";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #2563eb; margin: 0;">PeçaJá</h1>
          <p style="color: #6b7280; margin: 5px 0;">Marketplace de Peças Automotivas</p>
        </div>

        <h2 style="color: #dc2626;">Redefinir sua Senha</h2>
        
        <p>Olá <strong>${usuario.nome || usuario.email}</strong>,</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="color: #dc2626; margin-top: 0;">⚠️ Link de Redefinição</h3>
          <p>Clique no botão abaixo para redefinir sua senha:</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetLink}" 
               style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
              🔑 Redefinir Minha Senha
            </a>
          </div>
          
          <p style="color: #b91c1c; margin: 10px 0 0 0;">
            <strong>Este link expira em 1 hora</strong>
          </p>
        </div>

        <div style="background: #fffbeb; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h4 style="color: #92400e; margin-top: 0;">📧 Não foi você?</h4>
          <p style="color: #92400e; margin: 0;">
            Se você não solicitou esta redefinição, ignore este email. 
            Sua senha permanecerá a mesma.
          </p>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 14px;">
          <p><strong>Dúvidas ou problemas?</strong><br>
          Entre em contato com nosso suporte: suporte@pecaja.com</p>
        </div>
      </div>
    `;

    return this.sendEmail(usuario.email, subject, html);
  }

  /**
   * Converter HTML para texto simples (fallback)
   */
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
}

// Exportar instância única
module.exports = new EmailService();
