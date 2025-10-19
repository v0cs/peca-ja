const { Resend } = require("resend");

class EmailService {
  constructor() {
    this.resend = new Resend(
      process.env.RESEND_API_KEY || "re_mU2nKnP6_ESPokZgH4y3FB7XJSvAPwu1r"
    );
  }

  /**
   * Enviar email genérico via Resend
   */
  async sendEmail(to, subject, html, text = null) {
    try {
      console.log(`📧 Tentando enviar email para: ${to}`);
      console.log(`📝 Assunto: ${subject}`);

      const result = await this.resend.emails.send({
        from: "PeçaJá <onboarding@resend.dev>",
        to: to,
        subject: subject,
        html: html,
        text: text || this.htmlToText(html),
      });

      // Debug: Log da resposta completa
      console.log(
        "📦 Resposta Resend (estrutura completa):",
        JSON.stringify(result, null, 2)
      );

      // Tentar diferentes caminhos para o ID
      const emailId =
        result.id || result.data?.id || result.data || "ID não disponível";

      console.log("✅ Email enviado via Resend. ID:", emailId);

      return result;
    } catch (error) {
      console.error("❌ Erro ao enviar email via Resend:", error);
      console.error("📋 Detalhes do erro:", {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
      });

      // Não throw error para não quebrar o fluxo principal
      return { error: error.message, details: error };
    }
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
          <a href="${process.env.APP_URL || "http://localhost:3000"}" 
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
   * Notificação de nova solicitação para autopeças da mesma cidade
   */
  async sendNewRequestNotification(
    autopecaEmail,
    solicitacao,
    cliente,
    autopecaNome
  ) {
    const subject = `🔔 Nova solicitação em ${solicitacao.cidade_atendimento} - ${solicitacao.descricao_peca}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="text-align: center; padding: 20px 0; background: #f0f9ff; border-radius: 8px 8px 0 0;">
          <h1 style="color: #2563eb; margin: 0;">🚗 Nova Solicitação no PeçaJá!</h1>
          <p style="color: #0369a1; margin: 5px 0;">Oportunidade de negócio na sua cidade</p>
        </div>
        
        <div style="padding: 20px;">
          <h2 style="color: #1e40af;">Detalhes da Solicitação:</h2>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p><strong>📋 Peça Solicitada:</strong> ${
              solicitacao.descricao_peca
            }</p>
            <p><strong>🚙 Veículo:</strong> ${solicitacao.marca} ${
      solicitacao.modelo
    } (${solicitacao.ano_fabricacao})</p>
            <p><strong>📍 Localização:</strong> ${
              solicitacao.cidade_atendimento
            }, ${solicitacao.uf_atendimento}</p>
            <p><strong>👤 Cliente:</strong> ${cliente.nome_completo}</p>
            <p><strong>📱 Contato:</strong> ${cliente.celular}</p>
          </div>

          <div style="background: #ecfdf5; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #047857; margin-top: 0;">💡 Dica Rápida:</h3>
            <p style="color: #065f46; margin: 0;">
              Clientes costumam responder rapidamente nos primeiros 30 minutos. 
              Seja o primeiro a entrar em contato!
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              process.env.APP_URL || "http://localhost:3000"
            }/autopeca/solicitacoes" 
               style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
              👀 Ver Todas as Solicitações
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            Esta notificação foi enviada para <strong>${autopecaNome}</strong> porque sua autopeça está localizada em <strong>${
      solicitacao.cidade_atendimento
    }</strong>.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(autopecaEmail, subject, html);
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
          <a href="${process.env.APP_URL || "http://localhost:3000"}/login" 
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
   * Email de recuperação de senha
   */
  async sendPasswordResetEmail(usuario, resetToken) {
    const resetLink = `${
      process.env.APP_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}`;
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
