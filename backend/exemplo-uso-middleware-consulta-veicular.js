/**
 * Exemplo de Uso do Middleware de Consulta Veicular
 * Demonstra como o middleware funciona automaticamente no controlador
 */

const { Solicitacao } = require("./src/models");
const { apiVeicularService } = require("./src/services");

/**
 * Exemplo de como o controlador de solicitações funciona com o middleware
 * O middleware já processou os dados da API veicular automaticamente
 */
class ExemploControllerComMiddleware {
  /**
   * Criação de solicitação com middleware automático
   * O middleware já consultou a API veicular e mesclou os dados
   */
  static async criarSolicitacao(req, res) {
    const transaction = await Solicitacao.sequelize.transaction();

    try {
      console.log(
        "📋 Controller: Dados recebidos (já processados pelo middleware):"
      );
      console.log("- Placa:", req.body.placa);
      console.log("- Marca:", req.body.marca);
      console.log("- Modelo:", req.body.modelo);
      console.log("- Origem dos dados:", req.body.origem_dados_veiculo);
      console.log("- Info da API:", req.apiVeicularInfo);

      // Os dados já foram processados pelo middleware
      const dadosSolicitacao = {
        cliente_id: req.user.cliente_id,
        descricao_peca: req.body.descricao_peca,
        cidade_atendimento: req.body.cidade_atendimento,
        uf_atendimento: req.body.uf_atendimento,

        // Dados do veículo (já processados pelo middleware)
        placa: req.body.placa,
        marca: req.body.marca,
        modelo: req.body.modelo,
        ano_fabricacao: req.body.ano_fabricacao,
        ano_modelo: req.body.ano_modelo,
        categoria: req.body.categoria,
        cor: req.body.cor,
        chassi: req.body.chassi,
        renavam: req.body.renavam,

        // Metadados da API (adicionados pelo middleware)
        origem_dados_veiculo: req.body.origem_dados_veiculo,
        api_veicular_metadata: req.body.api_veicular_metadata,
      };

      // Criar solicitação
      const solicitacao = await Solicitacao.create(dadosSolicitacao, {
        transaction,
      });

      await transaction.commit();

      // Resposta com informações sobre a origem dos dados
      res.status(201).json({
        success: true,
        message: "Solicitação criada com sucesso",
        data: {
          solicitacao: {
            id: solicitacao.id,
            placa: solicitacao.placa,
            marca: solicitacao.marca,
            modelo: solicitacao.modelo,
            ano_fabricacao: solicitacao.ano_fabricacao,
            ano_modelo: solicitacao.ano_modelo,
            categoria: solicitacao.categoria,
            cor: solicitacao.cor,
            origem_dados_veiculo: solicitacao.origem_dados_veiculo,
          },
          api_veicular_info: {
            consultado: req.apiVeicularInfo?.consultado || false,
            origem: req.apiVeicularInfo?.origem || "manual",
            motivo: req.apiVeicularInfo?.motivo || "nao_consultado",
            timestamp:
              req.apiVeicularInfo?.timestamp || new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Erro ao criar solicitação:", error);

      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Exemplo de como seria sem o middleware (processamento manual)
   * Este método demonstra o que o middleware faz automaticamente
   */
  static async criarSolicitacaoSemMiddleware(req, res) {
    const transaction = await Solicitacao.sequelize.transaction();

    try {
      const {
        placa,
        descricao_peca,
        cidade_atendimento,
        uf_atendimento,
        ...outrosDados
      } = req.body;

      let dadosVeiculo = {};
      let origemDados = "manual";

      // Processamento manual que o middleware faz automaticamente
      if (placa) {
        try {
          console.log("🔍 Processamento manual: Consultando API veicular...");
          const dadosApi = await apiVeicularService.consultarVeiculoPorPlaca(
            placa
          );

          if (
            dadosApi.origem_dados === "api" ||
            dadosApi.origem_dados === "cache"
          ) {
            dadosVeiculo = {
              placa: dadosApi.placa,
              marca: dadosApi.marca,
              modelo: dadosApi.modelo,
              ano_fabricacao: dadosApi.ano_fabricacao,
              ano_modelo: dadosApi.ano_modelo,
              categoria: dadosApi.categoria,
              cor: dadosApi.cor,
              chassi: dadosApi.chassi,
              renavam: dadosApi.renavam,
              origem_dados_veiculo: dadosApi.origem_dados_veiculo,
              api_veicular_metadata: dadosApi.api_veicular_metadata,
            };
            origemDados = dadosApi.origem_dados;
            console.log("✅ Processamento manual: Dados obtidos da API");
          } else {
            console.log(
              "⚠️ Processamento manual: API falhou, usando dados manuais"
            );
            dadosVeiculo = {
              placa: placa,
              marca: outrosDados.marca || "Não informado",
              modelo: outrosDados.modelo || "Não informado",
              ano_fabricacao:
                outrosDados.ano_fabricacao || new Date().getFullYear(),
              ano_modelo: outrosDados.ano_modelo || new Date().getFullYear(),
              categoria: outrosDados.categoria || "outro",
              cor: outrosDados.cor || "Não informado",
              chassi: outrosDados.chassi || "Não informado",
              renavam: outrosDados.renavam || "Não informado",
              origem_dados_veiculo: "api_com_fallback",
              api_veicular_metadata: dadosApi.api_veicular_metadata,
            };
            origemDados = "api_com_fallback";
          }
        } catch (error) {
          console.log(
            "❌ Processamento manual: Erro na API, usando dados manuais"
          );
          dadosVeiculo = {
            placa: placa,
            marca: outrosDados.marca || "Não informado",
            modelo: outrosDados.modelo || "Não informado",
            ano_fabricacao:
              outrosDados.ano_fabricacao || new Date().getFullYear(),
            ano_modelo: outrosDados.ano_modelo || new Date().getFullYear(),
            categoria: outrosDados.categoria || "outro",
            cor: outrosDados.cor || "Não informado",
            chassi: outrosDados.chassi || "Não informado",
            renavam: outrosDados.renavam || "Não informado",
            origem_dados_veiculo: "manual",
            api_veicular_metadata: {
              erro: {
                message: error.message,
                timestamp: new Date().toISOString(),
                tipo: "erro_api",
              },
            },
          };
          origemDados = "manual";
        }
      } else {
        console.log("📝 Processamento manual: Sem placa, usando dados manuais");
        dadosVeiculo = {
          placa: "Não informado",
          marca: outrosDados.marca || "Não informado",
          modelo: outrosDados.modelo || "Não informado",
          ano_fabricacao:
            outrosDados.ano_fabricacao || new Date().getFullYear(),
          ano_modelo: outrosDados.ano_modelo || new Date().getFullYear(),
          categoria: outrosDados.categoria || "outro",
          cor: outrosDados.cor || "Não informado",
          chassi: outrosDados.chassi || "Não informado",
          renavam: outrosDados.renavam || "Não informado",
          origem_dados_veiculo: "manual",
        };
      }

      // Criar solicitação com dados processados manualmente
      const solicitacao = await Solicitacao.create(
        {
          cliente_id: req.user.cliente_id,
          descricao_peca: descricao_peca,
          cidade_atendimento: cidade_atendimento,
          uf_atendimento: uf_atendimento,
          ...dadosVeiculo,
        },
        { transaction }
      );

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: "Solicitação criada com processamento manual",
        data: {
          solicitacao: {
            id: solicitacao.id,
            placa: solicitacao.placa,
            marca: solicitacao.marca,
            modelo: solicitacao.modelo,
            origem_dados_veiculo: solicitacao.origem_dados_veiculo,
          },
          processamento: "manual",
          origem_dados: origemDados,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Erro ao criar solicitação:", error);

      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = ExemploControllerComMiddleware;
