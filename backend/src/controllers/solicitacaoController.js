const {
  Solicitacao,
  Cliente,
  Usuario,
  ImagemSolicitacao,
  SolicitacoesAtendimento,
  Autopeca,
  Vendedor,
} = require("../models");
const { Op } = require("sequelize");
const { uploadMiddleware } = require("../middleware/uploadMiddleware");
const { emailService } = require("../services");
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
        ano_fabricacao: anoFabricacaoRaw,
        ano_modelo: anoModeloRaw,
        categoria,
        cor,
        chassi,
        renavam,
        origem_dados_veiculo,
        api_veicular_metadata,
      } = req.body;

      // Converter anos para números (FormData envia como string)
      const ano_fabricacao = parseInt(anoFabricacaoRaw, 10);
      const ano_modelo = parseInt(anoModeloRaw, 10);

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
        ano_fabricacao: anoFabricacaoRaw, // Usar valor raw para validação de presença
        ano_modelo: anoModeloRaw, // Usar valor raw para validação de presença
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

      // Validar se anos são números válidos
      if (isNaN(ano_fabricacao)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Ano de fabricação inválido",
          errors: {
            ano_fabricacao: "Ano de fabricação deve ser um número válido",
          },
        });
      }

      if (isNaN(ano_modelo)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Ano do modelo inválido",
          errors: {
            ano_modelo: "Ano do modelo deve ser um número válido",
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
          const file = req.uploadedFiles[i];
          const imagem = await ImagemSolicitacao.create(
            {
              solicitacao_id: novaSolicitacao.id,
              nome_arquivo: file.originalName,
              nome_arquivo_fisico: file.filename,
              caminho_arquivo: file.url, // URL completa (S3 ou local)
              tamanho_arquivo: file.size,
              tipo_mime: file.mimetype,
              extensao: path.extname(file.originalName).slice(1),
              ordem_exibicao: i + 1,
            },
            { transaction }
          );
          imagensCriadas.push(imagem);
        }
      }

      await transaction.commit();

      // 10. Enviar emails para autopeças e vendedores ATIVOS da mesma cidade (assíncrono)
      // Normalizar cidade e UF para comparação (trim e uppercase)
      const cidadeNormalizada = novaSolicitacao.cidade_atendimento.trim();
      const ufNormalizada = novaSolicitacao.uf_atendimento.trim().toUpperCase();

      console.log("📧 [NOTIFICAÇÃO] Iniciando envio de emails para nova solicitação:");
      console.log(`   - Solicitação ID: ${novaSolicitacao.id}`);
      console.log(`   - Cidade: ${cidadeNormalizada}`);
      console.log(`   - UF: ${ufNormalizada}`);

      try {
        // Buscar autopeças ATIVAS da mesma cidade (case-insensitive usando Op.iLike)
        // Op.iLike funciona no PostgreSQL para busca case-insensitive
        // Excluir o cliente que criou a solicitação (caso ele também seja autopeça)
        const autopecasDaCidade = await Autopeca.findAll({
          where: {
            [Op.and]: [
              {
                endereco_cidade: {
                  [Op.iLike]: cidadeNormalizada, // Case-insensitive
                },
              },
              {
                endereco_uf: {
                  [Op.iLike]: ufNormalizada, // Case-insensitive (mas já está uppercase)
                },
              },
              // Excluir o cliente que criou a solicitação
              {
                usuario_id: {
                  [Op.ne]: cliente.usuario_id,
                },
              },
            ],
          },
          include: [
            {
              model: Usuario,
              as: "usuario",
              where: {
                [Op.and]: [
                  { ativo: true }, // Apenas usuários ativos
                  { tipo_usuario: "autopeca" }, // Apenas usuários do tipo autopeca
                ],
              },
              required: true,
              attributes: ["id", "email", "ativo", "tipo_usuario"],
            },
          ],
        });

        console.log(
          `📧 [NOTIFICAÇÃO] Encontradas ${autopecasDaCidade.length} autopeças ativas em ${cidadeNormalizada}/${ufNormalizada}`
        );

        // Enviar email para cada autopeça ATIVA com delay para respeitar rate limit
        // Resend permite 2 requisições por segundo, então vamos usar 600ms de delay (seguro)
        let emailsEnviados = 0;
        let emailsFalhados = 0;
        
        for (let i = 0; i < autopecasDaCidade.length; i++) {
          const autopeca = autopecasDaCidade[i];
          
          if (autopeca.usuario && autopeca.usuario.email) {
            // Verificação defensiva: garantir que é realmente uma autopeça
            if (autopeca.usuario.tipo_usuario !== "autopeca") {
              console.warn(
                `⚠️ [NOTIFICAÇÃO] Pulando usuário ${autopeca.usuario.id} (${autopeca.usuario.email}) - tipo_usuario é "${autopeca.usuario.tipo_usuario}", esperado "autopeca"`
              );
              continue;
            }
            
            try {
              console.log(
                `📧 [NOTIFICAÇÃO] Enviando email para autopeça: ${autopeca.razao_social || autopeca.nome_fantasia} (${autopeca.usuario.email})`
              );
              
              const result = await emailService.sendNewRequestNotification(
                autopeca.usuario.email,
                novaSolicitacao,
                cliente,
                autopeca.razao_social || autopeca.nome_fantasia || "Autopeça"
              );
              
              // Verificar se houve erro no resultado
              if (result && result.error) {
                emailsFalhados++;
                console.error(
                  `❌ [NOTIFICAÇÃO] Falha ao enviar email para autopeça ${autopeca.id} (${autopeca.usuario.email}): ${result.error}`
                );
              } else {
                emailsEnviados++;
                console.log(`✅ [NOTIFICAÇÃO] Email enviado com sucesso para ${autopeca.usuario.email}`);
              }
              
              // Delay entre envios para respeitar rate limit (600ms = ~1.6 req/s, abaixo do limite de 2/s)
              // Não fazer delay após o último email
              if (i < autopecasDaCidade.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 600));
              }
            } catch (err) {
              emailsFalhados++;
              console.error(
                `❌ [NOTIFICAÇÃO] Erro ao enviar email para autopeça ${autopeca.id} (${autopeca.usuario.email}):`,
                err.message || err
              );
            }
          } else {
            console.warn(
              `⚠️ [NOTIFICAÇÃO] Autopeça ${autopeca.id} não tem email válido associado`
            );
          }
        }

        // Buscar vendedores ATIVOS da mesma cidade (através da autopeça)
        // Excluir o cliente que criou a solicitação (caso ele também seja vendedor)
        const vendedoresDaCidade = await Vendedor.findAll({
          where: {
            ativo: true, // Apenas vendedores ativos
            // Excluir o cliente que criou a solicitação
            usuario_id: {
              [Op.ne]: cliente.usuario_id,
            },
          },
          include: [
            {
              model: Autopeca,
              as: "autopeca",
              where: {
                [Op.and]: [
                  {
                    endereco_cidade: {
                      [Op.iLike]: cidadeNormalizada, // Case-insensitive
                    },
                  },
                  {
                    endereco_uf: {
                      [Op.iLike]: ufNormalizada, // Case-insensitive (mas já está uppercase)
                    },
                  },
                ],
              },
              required: true,
              attributes: ["id", "razao_social", "nome_fantasia", "endereco_cidade", "endereco_uf"],
            },
            {
              model: Usuario,
              as: "usuario",
              where: {
                [Op.and]: [
                  { ativo: true }, // Apenas usuários ativos
                  { tipo_usuario: "vendedor" }, // Apenas usuários do tipo vendedor
                ],
              },
              required: true,
              attributes: ["id", "email", "ativo", "tipo_usuario"],
            },
          ],
        });

        console.log(
          `📧 [NOTIFICAÇÃO] Encontrados ${vendedoresDaCidade.length} vendedores ativos em ${cidadeNormalizada}/${ufNormalizada}`
        );
        
        // Log detalhado para debug
        if (vendedoresDaCidade.length > 0) {
          console.log(
            `📧 [NOTIFICAÇÃO] Detalhes dos vendedores encontrados:`
          );
          vendedoresDaCidade.forEach(v => {
            console.log(
              `   - Vendedor: ${v.nome_completo} (ID: ${v.id}), Email: ${v.usuario?.email || 'N/A'}, Tipo: ${v.usuario?.tipo_usuario || 'N/A'}, Autopeça: ${v.autopeca?.id || 'N/A'}`
            );
          });
        }

        // Criar um Set com os emails que já foram notificados
        // para evitar duplicação apenas se o MESMO email já foi notificado
        // (caso vendedor e autopeça tenham o mesmo email)
        const emailsNotificados = new Set(
          autopecasDaCidade
            .filter(ap => ap.usuario && ap.usuario.email)
            .map(ap => ap.usuario.email.toLowerCase())
        );

        // REGRA DE NEGÓCIO: Vendedores DEVEM receber notificações independentemente
        // de se a autopeça também recebeu, pois são os vendedores que trabalham
        // diretamente atendendo as solicitações.
        // Apenas evitamos duplicação se o MESMO email já foi notificado.
        const vendedoresParaNotificar = vendedoresDaCidade.filter(vendedor => {
          // Se o email do vendedor já foi notificado (ex: autopeça e vendedor têm o mesmo email),
          // não notificar novamente para evitar spam
          if (vendedor.usuario && vendedor.usuario.email) {
            const emailVendedor = vendedor.usuario.email.toLowerCase();
            if (emailsNotificados.has(emailVendedor)) {
              console.log(
                `⏭️ [NOTIFICAÇÃO] Pulando vendedor ${vendedor.id} (${vendedor.nome_completo}) - email ${emailVendedor} já foi notificado (possivelmente pela autopeça)`
              );
              return false;
            }
          }
          
          // Todos os outros vendedores devem ser notificados
          return true;
        });

        console.log(
          `📧 [NOTIFICAÇÃO] Após filtrar duplicações: ${vendedoresParaNotificar.length} vendedores para notificar`
        );

        // Se não houver destinatários, apenas logar e continuar
        if (autopecasDaCidade.length === 0 && vendedoresParaNotificar.length === 0) {
          console.log(
            `ℹ️ [NOTIFICAÇÃO] Nenhuma autopeça ou vendedor ativo encontrado em ${cidadeNormalizada}/${ufNormalizada} para notificar`
          );
        }

        // Delay antes de começar a enviar para vendedores (se houver autopeças)
        if (autopecasDaCidade.length > 0 && vendedoresParaNotificar.length > 0) {
          await new Promise((resolve) => setTimeout(resolve, 600));
        }

        // Enviar email para cada vendedor ATIVO (após filtrar duplicações) com delay para respeitar rate limit
        for (let i = 0; i < vendedoresParaNotificar.length; i++) {
          const vendedor = vendedoresParaNotificar[i];
          
          if (vendedor.usuario && vendedor.usuario.email) {
            // Verificação defensiva: garantir que é realmente um vendedor
            if (vendedor.usuario.tipo_usuario !== "vendedor") {
              console.warn(
                `⚠️ [NOTIFICAÇÃO] Pulando usuário ${vendedor.usuario.id} (${vendedor.usuario.email}) - tipo_usuario é "${vendedor.usuario.tipo_usuario}", esperado "vendedor"`
              );
              continue;
            }
            
            try {
              console.log(
                `📧 [NOTIFICAÇÃO] Enviando email para vendedor: ${vendedor.nome_completo} (${vendedor.usuario.email})`
              );
              
              const result = await emailService.sendNewRequestNotification(
                vendedor.usuario.email,
                novaSolicitacao,
                cliente,
                vendedor.nome_completo
              );
              
              // Adicionar email à lista de notificados para evitar duplicação em caso de retentativas
              emailsNotificados.add(vendedor.usuario.email.toLowerCase());
              
              // Verificar se houve erro no resultado
              if (result && result.error) {
                emailsFalhados++;
                console.error(
                  `❌ [NOTIFICAÇÃO] Falha ao enviar email para vendedor ${vendedor.id} (${vendedor.usuario.email}): ${result.error}`
                );
              } else {
                emailsEnviados++;
                console.log(`✅ [NOTIFICAÇÃO] Email enviado com sucesso para ${vendedor.usuario.email}`);
              }
              
              // Delay entre envios para respeitar rate limit (600ms = ~1.6 req/s, abaixo do limite de 2/s)
              // Não fazer delay após o último email
              if (i < vendedoresParaNotificar.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 600));
              }
            } catch (err) {
              emailsFalhados++;
              console.error(
                `❌ [NOTIFICAÇÃO] Erro ao enviar email para vendedor ${vendedor.id} (${vendedor.usuario.email}):`,
                err.message || err
              );
            }
          } else {
            console.warn(
              `⚠️ [NOTIFICAÇÃO] Vendedor ${vendedor.id} não tem email válido associado`
            );
          }
        }

        console.log(
          `📧 [NOTIFICAÇÃO] Resumo final:`
        );
        console.log(
          `   - Autopeças encontradas: ${autopecasDaCidade.length}, Notificadas: ${autopecasDaCidade.filter(ap => ap.usuario && ap.usuario.email).length}`
        );
        console.log(
          `   - Vendedores encontrados: ${vendedoresDaCidade.length}, Para notificar: ${vendedoresParaNotificar.length}, Notificados: ${vendedoresParaNotificar.filter(v => v.usuario && v.usuario.email && v.usuario.tipo_usuario === "vendedor").length}`
        );
        console.log(
          `   - Total de emails: ${emailsEnviados} enviados com sucesso, ${emailsFalhados} falharam`
        );
      } catch (emailError) {
        console.error("❌ [NOTIFICAÇÃO] Erro no sistema de envio de emails:", emailError);
        console.error("❌ [NOTIFICAÇÃO] Stack trace:", emailError.stack);
        // Não interrompe o fluxo principal se houver erro no envio de emails
      }

      // 11. Log de sucesso com informações da origem dos dados
      console.log("✅ Controller: Solicitação criada com sucesso:");
      console.log("- ID:", novaSolicitacao.id);
      console.log("- Placa:", novaSolicitacao.placa);
      console.log("- Origem dos dados:", novaSolicitacao.origem_dados_veiculo);
      console.log("- Imagens:", imagensCriadas.length);

      // 12. Retornar resposta com informações da origem dos dados
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
          imagens: imagensCriadas.map((img) => {
            // Usar caminho_arquivo que já contém a URL correta (S3 ou local)
            const imageUrl = img.caminho_arquivo;
            console.log(`🖼️ [create] Imagem criada ${img.id}:`, {
              nome_arquivo_fisico: img.nome_arquivo_fisico,
              url: imageUrl,
              caminho_arquivo: img.caminho_arquivo,
            });
            return {
              id: img.id,
              nome_arquivo: img.nome_arquivo,
              url: imageUrl,
            };
          }),
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
      let { id } = req.params;
      // Remover ":" se existir no início (validação defensiva)
      id = id.startsWith(":") ? id.slice(1) : id;

      // 1. Determinar tipo de acesso (cliente ou autopeça)
      const { tipo } = req.user;
      let whereClause = { id };

      if (tipo === "cliente") {
        // Clientes só podem ver suas próprias solicitações
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

        whereClause.cliente_id = cliente.id;
      } else if (tipo === "autopeca") {
        // Autopeças podem ver solicitações ativas da mesma cidade
        // Também podem ver solicitações que foram atendidas por elas (mesmo que canceladas/concluídas)
        const autopeca = await Autopeca.findOne({
          where: { usuario_id: req.user.userId },
          attributes: ["id", "endereco_cidade", "endereco_uf"],
        });

        if (!autopeca) {
          return res.status(404).json({
            success: false,
            message: "Autopeça não encontrada",
            errors: {
              autopeca: "Usuário autenticado não possui perfil de autopeça",
            },
          });
        }

        // Verificar se a autopeça atendeu ou marcou como vista esta solicitação
        const atendimento = await SolicitacoesAtendimento.findOne({
          where: {
            solicitacao_id: id,
            autopeca_id: autopeca.id,
          },
        });

        // Normalizar cidade e UF para comparação case-insensitive
        const cidadeNormalizada = autopeca.endereco_cidade.trim();
        const ufNormalizada = autopeca.endereco_uf.trim().toUpperCase();
        
        // Construir condições base
        const condicoesBase = [{ id }];
        const condicoesCidade = [
          { cidade_atendimento: { [Op.iLike]: cidadeNormalizada } },
          { uf_atendimento: { [Op.iLike]: ufNormalizada } },
        ];
        
        if (atendimento) {
          // Se a autopeça tem registro (atendida ou vista), pode ver independente do status_cliente
          // Apenas garantir que é da mesma cidade (para segurança) - case-insensitive
          whereClause = {
            [Op.and]: [...condicoesBase, ...condicoesCidade],
          };
        } else {
          // Se não tem registro, só pode ver se estiver ativa e na mesma cidade - case-insensitive
          whereClause = {
            [Op.and]: [
              ...condicoesBase,
              { status_cliente: "ativa" },
              ...condicoesCidade,
            ],
          };
        }
      } else {
        if (tipo === "vendedor") {
          const vendedor = await Vendedor.findOne({
            where: { usuario_id: req.user.userId },
            include: [
              {
                model: Autopeca,
                as: "autopeca",
                attributes: ["id", "endereco_cidade", "endereco_uf"],
              },
            ],
          });

          if (!vendedor || !vendedor.autopeca) {
            return res.status(404).json({
              success: false,
              message: "Vendedor não encontrado",
              errors: {
                vendedor: "Usuário autenticado não possui perfil de vendedor",
              },
            });
          }

          // Verificar se o vendedor (ou a autopeça sem vendedor vinculado) já interagiu com a solicitação
          const atendimento = await SolicitacoesAtendimento.findOne({
            where: {
              solicitacao_id: id,
              [Op.or]: [
                { vendedor_id: vendedor.id },
                {
                  [Op.and]: [
                    { autopeca_id: vendedor.autopeca_id },
                    { vendedor_id: null },
                  ],
                },
              ],
            },
          });

          // Normalizar cidade e UF para comparação case-insensitive
          const cidadeNormalizadaVendedor = vendedor.autopeca.endereco_cidade.trim();
          const ufNormalizadaVendedor = vendedor.autopeca.endereco_uf.trim().toUpperCase();
          
          // Construir condições base
          const condicoesBaseVendedor = [{ id }];
          const condicoesCidadeVendedor = [
            { cidade_atendimento: { [Op.iLike]: cidadeNormalizadaVendedor } },
            { uf_atendimento: { [Op.iLike]: ufNormalizadaVendedor } },
          ];
          
          if (atendimento) {
            // Se o vendedor tem registro, pode ver independente do status_cliente
            // Apenas garantir que é da mesma cidade (para segurança) - case-insensitive
            whereClause = {
              [Op.and]: [...condicoesBaseVendedor, ...condicoesCidadeVendedor],
            };
          } else {
            // Se não tem registro, só pode ver se estiver ativa e na mesma cidade - case-insensitive
            whereClause = {
              [Op.and]: [
                ...condicoesBaseVendedor,
                { status_cliente: "ativa" },
                ...condicoesCidadeVendedor,
              ],
            };
          }
        } else {
          return res.status(403).json({
            success: false,
            message: "Acesso negado",
            errors: {
              authorization:
                "Apenas clientes, autopeças ou vendedores podem visualizar solicitações",
            },
          });
        }
      }

      // 2. Buscar solicitação específica
      // Autopeças NÃO devem ter acesso às informações do cliente
      // Elas apenas podem ver os dados da solicitação e do veículo
      const includes = [
        {
          model: ImagemSolicitacao,
          as: "imagens",
          attributes: [
            "id",
            "nome_arquivo",
            "nome_arquivo_fisico",
            "caminho_arquivo",
            "ordem_exibicao",
          ],
        },
      ];

      const solicitacao = await Solicitacao.findOne({
        where: whereClause,
        include: includes,
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

      // Formatar imagens com URL para o frontend
      const solicitacaoFormatada = {
        ...solicitacao.toJSON(),
        imagens: solicitacao.imagens
          ? solicitacao.imagens.map((img) => {
              // Usar caminho_arquivo que já contém a URL correta (S3 ou local)
              const imageUrl = img.caminho_arquivo;
              console.log(`🖼️ [getById] Imagem ${img.id}:`, {
                nome_arquivo_fisico: img.nome_arquivo_fisico,
                url: imageUrl,
                caminho_arquivo: img.caminho_arquivo,
              });
              return {
                id: img.id,
                nome_arquivo: img.nome_arquivo,
                nome_arquivo_fisico: img.nome_arquivo_fisico,
                url: imageUrl,
                ordem_exibicao: img.ordem_exibicao,
              };
            })
          : [],
      };

      return res.status(200).json({
        success: true,
        message: "Solicitação encontrada com sucesso",
        data: {
          solicitacao: solicitacaoFormatada,
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
      let { id } = req.params;
      // Remover ":" se existir no início (validação defensiva)
      id = id.startsWith(":") ? id.slice(1) : id;

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

      // 4. Verificar se a solicitação pode ser editada
      // Permite editar apenas se:
      // - A solicitação está ativa (pode editar qualquer campo)
      // - OU se está apenas atualizando o status para concluída (permitir sempre)
      const isOnlyStatusUpdate = 
        req.body.status_cliente && 
        Object.keys(req.body).filter(key => 
          key !== "status_cliente" && 
          key !== "imagens_para_deletar" && 
          !req.files
        ).length === 0;

      if (solicitacao.status_cliente !== "ativa" && !isOnlyStatusUpdate) {
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
        status_cliente,
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

      // Validar e atualizar status_cliente se fornecido
      if (status_cliente !== undefined) {
        const statusValidos = ["ativa", "concluida", "cancelada"];
        if (!statusValidos.includes(status_cliente)) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "Status inválido",
            errors: {
              status_cliente: `Status deve ser um dos seguintes: ${statusValidos.join(", ")}`,
            },
          });
        }

        // Validações específicas por status
        if (status_cliente === "concluida" && solicitacao.status_cliente === "cancelada") {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "Não é possível marcar uma solicitação cancelada como concluída",
            errors: {
              status_cliente: "Solicitações canceladas não podem ser concluídas",
            },
          });
        }

        if (status_cliente === "cancelada" && solicitacao.status_cliente === "concluida") {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "Não é possível cancelar uma solicitação já concluída",
            errors: {
              status_cliente: "Solicitações concluídas não podem ser canceladas",
            },
          });
        }

        dadosAtualizacao.status_cliente = status_cliente;

        // Se marcando como concluída, registrar data de conclusão
        if (status_cliente === "concluida") {
          dadosAtualizacao.data_conclusao = new Date();
        }
      }

      // 6. Processar exclusão de imagens se houver
      let imagensParaDeletar = [];
      if (req.body.imagens_para_deletar) {
        try {
          // Se for string JSON, fazer parse
          if (typeof req.body.imagens_para_deletar === "string") {
            imagensParaDeletar = JSON.parse(req.body.imagens_para_deletar);
          } else {
            imagensParaDeletar = req.body.imagens_para_deletar;
          }
        } catch (parseError) {
          console.warn("Erro ao fazer parse de imagens_para_deletar:", parseError);
        }

        if (Array.isArray(imagensParaDeletar) && imagensParaDeletar.length > 0) {
          // Verificar se as imagens pertencem à solicitação
          const imagensExistentes = await ImagemSolicitacao.findAll({
            where: {
              id: imagensParaDeletar,
              solicitacao_id: solicitacao.id,
            },
            transaction,
          });

          const idsValidos = imagensExistentes.map((img) => img.id);

          if (idsValidos.length !== imagensParaDeletar.length) {
            await transaction.rollback();
            return res.status(400).json({
              success: false,
              message: "Algumas imagens não foram encontradas ou não pertencem a esta solicitação",
              errors: {
                imagens: "Imagens inválidas para exclusão",
              },
            });
          }

          // Deletar arquivos físicos do servidor
          const fs = require("fs");
          const uploadDir = path.join(__dirname, "../../uploads");

          for (const imagem of imagensExistentes) {
            if (imagem.nome_arquivo_fisico) {
              const filePath = path.join(uploadDir, imagem.nome_arquivo_fisico);
              try {
                if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath);
                  console.log(`Arquivo deletado: ${filePath}`);
                }
              } catch (fileError) {
                console.warn(`Erro ao deletar arquivo ${filePath}:`, fileError);
                // Continuar mesmo se houver erro ao deletar arquivo
              }
            }
          }

          // Deletar registros do banco
          await ImagemSolicitacao.destroy({
            where: {
              id: idsValidos,
              solicitacao_id: solicitacao.id,
            },
            transaction,
          });

          console.log(`${idsValidos.length} imagem(ns) excluída(s) da solicitação ${id}`);
        }
      }

      // 7. Processar novas imagens se houver
      if (req.uploadedFiles && req.uploadedFiles.length > 0) {
        // Contar imagens existentes após exclusões
        const imagensRestantes = await ImagemSolicitacao.count({
          where: {
            solicitacao_id: solicitacao.id,
          },
          transaction,
        });

        const slotsDisponiveis = 3 - imagensRestantes;

        if (req.uploadedFiles.length > slotsDisponiveis) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Limite de 3 imagens excedido. Você pode adicionar apenas ${slotsDisponiveis} imagem(ns) mais`,
            errors: {
              imagens: `Máximo de 3 imagens permitidas. Você tentou adicionar ${req.uploadedFiles.length} mas só há ${slotsDisponiveis} slot(s) disponível(is)`,
            },
          });
        }

        // Adicionar novas imagens
        for (let i = 0; i < req.uploadedFiles.length; i++) {
          const file = req.uploadedFiles[i];
          await ImagemSolicitacao.create(
            {
              solicitacao_id: solicitacao.id,
              nome_arquivo: file.originalName,
              nome_arquivo_fisico: file.filename,
              caminho_arquivo: file.url, // URL completa (S3 ou local)
              tamanho_arquivo: file.size,
              tipo_mime: file.mimetype,
              extensao: path.extname(file.originalName).slice(1),
              ordem_exibicao: imagensRestantes + i + 1,
            },
            { transaction }
          );
        }

        console.log(`${req.uploadedFiles.length} nova(s) imagem(ns) adicionada(s) à solicitação ${id}`);
      }

      // 8. Atualizar solicitação se houver dados
      if (Object.keys(dadosAtualizacao).length > 0) {
        await solicitacao.update(dadosAtualizacao, { transaction });
      }

      await transaction.commit();

      // 9. Buscar solicitação atualizada com imagens
      const solicitacaoAtualizada = await Solicitacao.findByPk(id, {
        include: [
          {
            model: ImagemSolicitacao,
            as: "imagens",
            required: false,
            attributes: [
              "id",
              "nome_arquivo",
              "nome_arquivo_fisico",
              "caminho_arquivo",
              "ordem_exibicao",
            ],
          },
        ],
      });

      // Formatar imagens com URL
      const solicitacaoFormatada = {
        ...solicitacaoAtualizada.toJSON(),
        imagens: solicitacaoAtualizada.imagens
          ? solicitacaoAtualizada.imagens.map((img) => ({
              id: img.id,
              nome_arquivo: img.nome_arquivo,
              nome_arquivo_fisico: img.nome_arquivo_fisico,
              url: img.caminho_arquivo, // URL correta (S3 ou local)
              ordem_exibicao: img.ordem_exibicao,
            }))
          : [],
      };

      return res.status(200).json({
        success: true,
        message: "Solicitação atualizada com sucesso",
        data: {
          solicitacao: solicitacaoFormatada,
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
      let { id } = req.params;
      // Remover ":" se existir no início (validação defensiva)
      id = id.startsWith(":") ? id.slice(1) : id;

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

      // 4. Verificar se a solicitação pode ser cancelada (apenas ativas)
      if (solicitacao.status_cliente !== "ativa") {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Solicitação não pode ser cancelada",
          errors: {
            status: "Apenas solicitações ativas podem ser canceladas",
            status_atual: solicitacao.status_cliente,
          },
        });
      }

      // 5. Buscar atendimentos existentes da solicitação
      const atendimentos = await SolicitacoesAtendimento.findAll({
        where: {
          solicitacao_id: id,
        },
        transaction,
      });

      // 6. Atualizar status da solicitação para cancelada
      await solicitacao.update(
        {
          status_cliente: "cancelada",
        },
        { transaction }
      );

      // 7. Commit da transação
      await transaction.commit();

      // 8. Retornar sucesso
      return res.status(200).json({
        success: true,
        message: "Solicitação cancelada com sucesso",
        data: {
          solicitacao: {
            id: solicitacao.id,
            status_cliente: solicitacao.status_cliente,
            descricao_peca: solicitacao.descricao_peca,
            marca: solicitacao.marca,
            modelo: solicitacao.modelo,
          },
          atendimentos_afetados: atendimentos.length,
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
      let { id } = req.params;
      // Remover ":" se existir no início (validação defensiva)
      id = id.startsWith(":") ? id.slice(1) : id;

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
              nome_arquivo: file.originalName,
              nome_arquivo_fisico: file.filename,
              caminho_arquivo: file.url, // URL completa (S3 ou local)
              tamanho_arquivo: file.size,
              tipo_mime: file.mimetype,
              extensao: path.extname(file.originalName).slice(1),
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
            url: img.caminho_arquivo, // URL correta (S3 ou local)
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
