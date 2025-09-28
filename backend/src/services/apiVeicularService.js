const axios = require("axios");
const NodeCache = require("node-cache");
const CircuitBreaker = require("opossum");
const config = require("../config/env");

/**
 * Serviço de Integração com API Veicular
 * Integração com consultarplaca.com.br para obtenção de dados automáticos do veículo
 * Inclui rate limiting e controle de quotas para evitar custos excessivos
 */
class ApiVeicularService {
  constructor() {
    // Cache com TTL de 24 horas (86400 segundos)
    this.cache = new NodeCache({ stdTTL: 86400 });

    // Cache para rate limiting (TTL de 15 minutos)
    this.rateLimitCache = new NodeCache({ stdTTL: 900 }); // 15 minutos

    // URL base da API
    this.baseUrl = config.API_VEICULAR_BASE_URL;

    // API Key e Email da variável de ambiente
    this.apiKey = config.API_VEICULAR_KEY;
    this.email = config.API_VEICULAR_EMAIL;

    // Configurações de rate limiting baseadas no ambiente
    this.rateLimitConfig = this.getRateLimitConfig();

    // Configuração do circuit breaker
    this.circuitBreakerConfig = this.getCircuitBreakerConfig();
    this.circuitBreaker = null;
    this.circuitBreakerMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      circuitOpenCount: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
    };

    // Configuração do axios
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000, // 10 segundos de timeout
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // Interceptor para adicionar API Key automaticamente com Basic Auth
    this.httpClient.interceptors.request.use((config) => {
      // === DEBUG API VEICULAR REQUEST ===
      console.log("=== DEBUG API VEICULAR REQUEST ===");
      console.log("📤 Request URL:", config?.url);
      console.log("📤 Request method:", config?.method);
      console.log("📤 Request baseURL:", config?.baseURL);
      console.log("📤 Request timeout:", config?.timeout);
      console.log("📤 Request headers (antes):", config?.headers);

      if (this.apiKey && this.apiKey !== "demo-key" && this.email) {
        // Basic Auth: codificar email:api_key em base64
        const basicAuth = Buffer.from(`${this.email}:${this.apiKey}`).toString(
          "base64"
        );
        config.headers["Authorization"] = `Basic ${basicAuth}`;
        config.headers["X-API-Key"] = this.apiKey;
        console.log("🔑 Basic Auth adicionado:", `Basic ${basicAuth}`);
      } else {
        console.warn(
          "API_VEICULAR_KEY ou API_VEICULAR_EMAIL não configurados ou usando chave demo. A consulta real não será feita."
        );
      }

      console.log("📤 Request headers (depois):", config?.headers);
      console.log("📤 Request data:", config?.data);
      console.log("📤 Request params:", config?.params);
      console.log("=== FIM DEBUG REQUEST ===");

      return config;
    });

    // Interceptor para tratamento de respostas
    this.httpClient.interceptors.response.use(
      (response) => {
        // === DEBUG API VEICULAR RESPONSE ===
        console.log("=== DEBUG API VEICULAR RESPONSE ===");
        console.log("📥 Response status:", response?.status);
        console.log("📥 Response statusText:", response?.statusText);
        console.log("📥 Response headers:", response?.headers);
        console.log(
          "📥 Response data:",
          JSON.stringify(response?.data, null, 2)
        );
        console.log("📥 Response config URL:", response?.config?.url);
        console.log("📥 Response config method:", response?.config?.method);
        console.log("📥 Response config headers:", response?.config?.headers);
        console.log("=== FIM DEBUG RESPONSE ===");
        return response;
      },
      (error) => {
        // === DEBUG API VEICULAR ERROR ===
        console.log("=== DEBUG API VEICULAR ERROR ===");
        console.log("❌ Error message:", error?.message);
        console.log("❌ Error code:", error?.code);
        console.log("❌ Error status:", error?.response?.status);
        console.log("❌ Error statusText:", error?.response?.statusText);
        console.log("❌ Error headers:", error?.response?.headers);
        console.log(
          "❌ Error data:",
          JSON.stringify(error?.response?.data, null, 2)
        );
        console.log("❌ Error config URL:", error?.config?.url);
        console.log("❌ Error config method:", error?.config?.method);
        console.log("❌ Error config headers:", error?.config?.headers);
        console.log("❌ Error stack:", error?.stack);
        console.log("=== FIM DEBUG ERROR ===");

        console.error(
          "Erro na API Veicular:",
          error.response?.data || error.message
        );
        return Promise.reject(error);
      }
    );

    // Inicializar circuit breaker
    this.initializeCircuitBreaker();
  }

  /**
   * Obtém configurações do circuit breaker
   * @returns {Object} Configurações do circuit breaker
   */
  getCircuitBreakerConfig() {
    return {
      timeout: 10000, // 10 segundos de timeout
      errorThresholdPercentage: 50, // 50% de falhas para abrir
      resetTimeout: 30000, // 30 segundos para tentar resetar
      rollingCountTimeout: 10000, // 10 segundos para janela de erro
      rollingCountBuckets: 10, // 10 buckets para estatísticas
      name: "api-veicular-circuit-breaker",
      group: "api-veicular",
      volumeThreshold: 5, // Mínimo 5 requests para considerar estatísticas
    };
  }

  /**
   * Inicializa o circuit breaker
   */
  initializeCircuitBreaker() {
    // Função que será protegida pelo circuit breaker
    const apiCall = async (placaNormalizada) => {
      console.log(
        `🔌 Circuit Breaker: Executando chamada para placa ${placaNormalizada}`
      );
      const response = await this.httpClient.get(
        `/consultarPlaca?placa=${placaNormalizada}`
      );
      return response.data;
    };

    // Criar circuit breaker
    this.circuitBreaker = new CircuitBreaker(
      apiCall,
      this.circuitBreakerConfig
    );

    // Configurar fallback
    this.circuitBreaker.fallback((error, placa) => {
      console.log(`🔄 Circuit Breaker: Fallback ativado para placa ${placa}`);
      return this.criarFallbackVeiculo(placa, error);
    });

    // Event listeners para monitoramento
    this.setupCircuitBreakerEvents();

    console.log(
      `🔌 Circuit Breaker: Inicializado com configuração:`,
      this.circuitBreakerConfig
    );
  }

  /**
   * Configura eventos do circuit breaker para logs e métricas
   */
  setupCircuitBreakerEvents() {
    // Circuit breaker aberto (falhas excessivas)
    this.circuitBreaker.on("open", () => {
      this.circuitBreakerMetrics.circuitOpenCount++;
      this.circuitBreakerMetrics.lastFailureTime = new Date().toISOString();
      console.log(
        `🔴 Circuit Breaker: ABERTO - API veicular com muitas falhas`
      );
      console.log(
        `📊 Circuit Breaker: Métricas - ${JSON.stringify(
          this.circuitBreakerMetrics
        )}`
      );
    });

    // Circuit breaker fechado (funcionando normalmente)
    this.circuitBreaker.on("close", () => {
      console.log(
        `🟢 Circuit Breaker: FECHADO - API veicular funcionando normalmente`
      );
      console.log(
        `📊 Circuit Breaker: Métricas - ${JSON.stringify(
          this.circuitBreakerMetrics
        )}`
      );
    });

    // Circuit breaker meio-aberto (testando se API voltou)
    this.circuitBreaker.on("halfOpen", () => {
      console.log(
        `🟡 Circuit Breaker: MEIO-ABERTO - Testando se API veicular voltou`
      );
    });

    // Request bem-sucedido
    this.circuitBreaker.on("success", (result) => {
      this.circuitBreakerMetrics.totalRequests++;
      this.circuitBreakerMetrics.successfulRequests++;
      this.circuitBreakerMetrics.lastSuccessTime = new Date().toISOString();
      console.log(`✅ Circuit Breaker: Request bem-sucedido`);
    });

    // Request falhou
    this.circuitBreaker.on("failure", (error) => {
      this.circuitBreakerMetrics.totalRequests++;
      this.circuitBreakerMetrics.failedRequests++;
      this.circuitBreakerMetrics.lastFailureTime = new Date().toISOString();
      console.log(`❌ Circuit Breaker: Request falhou - ${error.message}`);
    });

    // Timeout
    this.circuitBreaker.on("timeout", (error) => {
      this.circuitBreakerMetrics.totalRequests++;
      this.circuitBreakerMetrics.failedRequests++;
      this.circuitBreakerMetrics.lastFailureTime = new Date().toISOString();
      console.log(`⏰ Circuit Breaker: Timeout - ${error.message}`);
    });

    // Fallback executado
    this.circuitBreaker.on("fallback", (result, error) => {
      console.log(
        `🔄 Circuit Breaker: Fallback executado devido a: ${error.message}`
      );
    });
  }

  /**
   * Obtém configurações de rate limiting baseadas no ambiente
   * @returns {Object} Configurações de rate limiting
   */
  getRateLimitConfig() {
    const isDevelopment = process.env.NODE_ENV === "development";

    return {
      // Desenvolvimento: limites mais permissivos para testes
      development: {
        maxRequests: 500, // 500 consultas por 15 minutos
        windowMs: 900000, // 15 minutos (15 * 60 * 1000)
        message: "Limite de consultas de desenvolvimento atingido",
        headerPrefix: "X-RateLimit",
      },
      // Produção: limites mais restritivos para controle de custos
      production: {
        maxRequests: 100, // 100 consultas por 15 minutos
        windowMs: 900000, // 15 minutos (15 * 60 * 1000)
        message: "Limite de consultas atingido. Tente novamente em 15 minutos.",
        headerPrefix: "X-RateLimit",
      },
      // Ambiente atual
      current: isDevelopment ? "development" : "production",
    };
  }

  /**
   * Verifica se o IP pode fazer uma nova consulta (rate limiting)
   * @param {string} ip - IP do cliente
   * @returns {Object} Resultado da verificação
   */
  verificarRateLimit(ip) {
    const config = this.rateLimitConfig[this.rateLimitConfig.current];
    const cacheKey = `rate_limit_${ip}`;

    // Obter contador atual
    const currentCount = this.rateLimitCache.get(cacheKey) || 0;

    // Verificar se excedeu o limite
    if (currentCount >= config.maxRequests) {
      const ttl = this.rateLimitCache.getTtl(cacheKey);
      const resetTime = new Date(ttl);
      const now = new Date();
      const timeLeftSeconds = Math.ceil((resetTime - now) / 1000);
      const timeLeftMinutes = Math.ceil(timeLeftSeconds / 60);

      return {
        allowed: false,
        currentCount,
        maxRequests: config.maxRequests,
        remainingRequests: 0,
        resetTime: resetTime.toISOString(),
        resetTimeSeconds: timeLeftSeconds,
        timeLeftMinutes: timeLeftMinutes,
        headers: {
          [`${config.headerPrefix}-Limit`]: config.maxRequests,
          [`${config.headerPrefix}-Remaining`]: 0,
          [`${config.headerPrefix}-Reset`]: Math.ceil(
            resetTime.getTime() / 1000
          ),
          [`${config.headerPrefix}-Retry-After`]: timeLeftSeconds,
        },
        message: `${config.message} Limite: ${config.maxRequests} consultas por 15 minutos. Reset em ${timeLeftMinutes} minutos.`,
        environment: this.rateLimitConfig.current,
      };
    }

    // Incrementar contador
    this.rateLimitCache.set(cacheKey, currentCount + 1);
    const newCount = currentCount + 1;
    const remainingRequests = config.maxRequests - newCount;
    const resetTime = new Date(Date.now() + config.windowMs);

    return {
      allowed: true,
      currentCount: newCount,
      maxRequests: config.maxRequests,
      remainingRequests: remainingRequests,
      resetTime: resetTime.toISOString(),
      resetTimeSeconds: Math.ceil(resetTime.getTime() / 1000),
      headers: {
        [`${config.headerPrefix}-Limit`]: config.maxRequests,
        [`${config.headerPrefix}-Remaining`]: remainingRequests,
        [`${config.headerPrefix}-Reset`]: Math.ceil(resetTime.getTime() / 1000),
      },
      environment: this.rateLimitConfig.current,
    };
  }

  /**
   * Obtém estatísticas de rate limiting para um IP
   * @param {string} ip - IP do cliente
   * @returns {Object} Estatísticas de rate limiting
   */
  obterEstatisticasRateLimit(ip) {
    const config = this.rateLimitConfig[this.rateLimitConfig.current];
    const cacheKey = `rate_limit_${ip}`;
    const currentCount = this.rateLimitCache.get(cacheKey) || 0;
    const ttl = this.rateLimitCache.getTtl(cacheKey);

    return {
      ip,
      currentCount,
      maxRequests: config.maxRequests,
      remainingRequests: Math.max(0, config.maxRequests - currentCount),
      resetTime: ttl ? new Date(ttl).toISOString() : null,
      environment: this.rateLimitConfig.current,
      windowMs: config.windowMs,
    };
  }

  /**
   * Limpa rate limiting para um IP específico
   * @param {string} ip - IP do cliente
   */
  limparRateLimit(ip) {
    const cacheKey = `rate_limit_${ip}`;
    this.rateLimitCache.del(cacheKey);
    console.log(`🗑️ Rate limit limpo para IP: ${ip}`);
  }

  /**
   * Limpa todo o rate limiting
   */
  limparRateLimitCompleto() {
    this.rateLimitCache.flushAll();
    console.log("🗑️ Rate limiting completo limpo");
  }

  /**
   * Consulta dados do veículo pela placa
   * @param {string} placa - Placa do veículo (formato: ABC1234 ou ABC-1234)
   * @param {string} ip - IP do cliente (opcional, para rate limiting)
   * @returns {Promise<Object>} Dados formatados do veículo
   */
  async consultarVeiculoPorPlaca(placa, ip = null) {
    let rateLimitInfo = null;

    try {
      // Verificar rate limiting se IP fornecido
      if (ip) {
        rateLimitInfo = this.verificarRateLimit(ip);
        if (!rateLimitInfo.allowed) {
          console.warn(
            `⚠️ Rate limit excedido para IP ${ip}: ${rateLimitInfo.message}`
          );
          const error = new Error(
            `RATE_LIMIT_EXCEEDED: ${rateLimitInfo.message}`
          );
          error.rateLimitInfo = rateLimitInfo;
          throw error;
        }
        console.log(
          `✅ Rate limit OK para IP ${ip}: ${rateLimitInfo.currentCount}/${rateLimitInfo.maxRequests} consultas (${rateLimitInfo.remainingRequests} restantes)`
        );
      }

      // Validar e normalizar placa
      const placaNormalizada = this.normalizarPlaca(placa);

      if (!placaNormalizada) {
        throw new Error("Formato de placa inválido");
      }

      // Verificar cache primeiro
      const cacheKey = `veiculo_${placaNormalizada}`;
      const dadosCache = this.cache.get(cacheKey);

      if (dadosCache) {
        console.log(`Dados do veículo ${placaNormalizada} obtidos do cache`);
        return {
          ...dadosCache,
          origem_dados: "cache",
          timestamp_cache: new Date().toISOString(),
        };
      }

      // Fazer requisição para a API usando circuit breaker
      console.log(`Consultando API Veicular para placa: ${placaNormalizada}`);
      console.log(
        `🔌 Circuit Breaker: Estado atual - ${this.circuitBreaker.state}`
      );

      // === DEBUG API VEICULAR ===
      console.log("=== DEBUG API VEICULAR ===");
      console.log(
        "🔗 URL:",
        `${this.baseUrl}/consultarPlaca?placa=${placaNormalizada}`
      );
      console.log("🔑 API Key presente:", !!this.apiKey);
      console.log("🔑 API Key demo:", this.apiKey === "demo-key");

      // Simular headers que serão enviados
      const debugHeaders = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (this.apiKey && this.apiKey !== "demo-key") {
        const basicAuth = Buffer.from(`${this.apiKey}:`).toString("base64");
        debugHeaders["Authorization"] = `Basic ${basicAuth}`;
        debugHeaders["X-API-Key"] = this.apiKey;
      }

      console.log("🔑 Headers que serão enviados:", debugHeaders);
      console.log("=== FIM DEBUG ===");

      const responseData = await this.circuitBreaker.fire(placaNormalizada);

      // Validar responseData antes de processar
      if (!responseData) {
        throw new Error("Resposta da API veicular está vazia");
      }

      // Processar e formatar dados
      const dadosFormatados = this.formatarDadosVeiculo(responseData);

      // Armazenar no cache
      this.cache.set(cacheKey, dadosFormatados);

      console.log(
        `Dados do veículo ${placaNormalizada} obtidos da API e armazenados no cache`
      );

      const result = {
        ...dadosFormatados,
        origem_dados: "api",
        timestamp_consulta: new Date().toISOString(),
      };

      // Adicionar informações de rate limiting se disponível
      if (rateLimitInfo) {
        result.rate_limit_info = {
          current_count: rateLimitInfo.currentCount,
          max_requests: rateLimitInfo.maxRequests,
          remaining_requests: rateLimitInfo.remainingRequests,
          reset_time: rateLimitInfo.resetTime,
          environment: rateLimitInfo.environment,
          headers: rateLimitInfo.headers,
        };
      }

      return result;
    } catch (error) {
      console.error(`Erro ao consultar veículo ${placa}:`, error.message);

      // Fallback: retornar dados mínimos para não quebrar o sistema
      return this.criarFallbackVeiculo(placa, error);
    }
  }

  /**
   * Normaliza a placa para o formato esperado pela API
   * @param {string} placa - Placa em qualquer formato
   * @returns {string|null} Placa normalizada ou null se inválida
   */
  normalizarPlaca(placa) {
    if (!placa || typeof placa !== "string") {
      return null;
    }

    // Remove espaços e converte para maiúsculo
    let placaLimpa = placa.replace(/\s+/g, "").toUpperCase();

    // Remove hífen se existir
    placaLimpa = placaLimpa.replace(/-/g, "");

    // Valida formato (3 letras + 4 números ou 3 letras + 1 número + 1 letra + 2 números)
    const regexPlaca = /^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$|^[A-Z]{3}[0-9]{4}$/;

    if (!regexPlaca.test(placaLimpa)) {
      return null;
    }

    return placaLimpa;
  }

  /**
   * Formata os dados da API para o modelo do sistema
   * @param {Object} dadosApi - Dados retornados pela API
   * @returns {Object} Dados formatados
   */
  formatarDadosVeiculo(dadosApi) {
    try {
      // Validar se dadosApi existe e é um objeto
      if (!dadosApi || typeof dadosApi !== "object") {
        console.warn("Dados da API inválidos ou vazios:", dadosApi);
        throw new Error("Dados da API inválidos");
      }

      // Validar se dadosApi tem estrutura esperada da API v2
      if (
        dadosApi.status !== "ok" ||
        !dadosApi.dados ||
        !dadosApi.dados.informacoes_veiculo
      ) {
        console.warn("Estrutura de dados da API não reconhecida:", dadosApi);
        throw new Error("Estrutura de dados da API não reconhecida");
      }

      // Extrair dados da estrutura da API v2
      const dadosVeiculo = dadosApi.dados.informacoes_veiculo.dados_veiculo;

      // Mapear campos da API v2 para campos do nosso modelo
      const dadosFormatados = {
        placa: dadosVeiculo.placa || "Não informado",
        marca: this.mapearMarca(dadosVeiculo.marca),
        modelo: dadosVeiculo.modelo || "Não informado",
        ano_fabricacao: this.extrairAno(dadosVeiculo.ano_fabricacao),
        ano_modelo: this.extrairAno(dadosVeiculo.ano_modelo),
        categoria: this.mapearCategoria(
          dadosVeiculo.segmento ||
            dadosVeiculo.categoria ||
            dadosVeiculo.tipo_veiculo
        ),
        cor: dadosVeiculo.cor || "Não informado",
        chassi: dadosVeiculo.chassi || "Não informado",
        renavam: dadosVeiculo.renavam || "Não informado",
        origem_dados_veiculo: "api",
        api_veicular_metadata: {
          consultado_em: new Date().toISOString(),
          api_original_data: dadosApi,
          versao_api: "2.0",
          mensagem_api: dadosApi.mensagem,
        },
      };

      // Validar dados obrigatórios
      this.validarDadosFormatados(dadosFormatados);

      return dadosFormatados;
    } catch (error) {
      console.error("Erro ao formatar dados da API:", error.message);
      console.error("Dados recebidos:", dadosApi);
      throw new Error("Erro ao processar dados da API veicular");
    }
  }

  /**
   * Extrai campo de dados com validação segura
   * @param {Object} dados - Objeto de dados
   * @param {Array} camposPossiveis - Array de nomes de campos possíveis
   * @returns {string|null} Valor do campo ou null se não encontrado
   */
  extrairCampo(dados, camposPossiveis) {
    try {
      if (!dados || typeof dados !== "object") {
        return null;
      }

      for (const campo of camposPossiveis) {
        if (
          dados[campo] !== undefined &&
          dados[campo] !== null &&
          dados[campo] !== ""
        ) {
          return dados[campo];
        }
      }

      return null;
    } catch (error) {
      console.warn("Erro ao extrair campo:", error.message);
      return null;
    }
  }

  /**
   * Mapeia marca para valores padronizados
   * @param {string} marca - Marca retornada pela API
   * @returns {string} Marca padronizada
   */
  mapearMarca(marca) {
    try {
      if (!marca || typeof marca !== "string") {
        return "Não informado";
      }

      // Mapeamento de marcas comuns
      const marcasPadronizadas = {
        VOLKSWAGEN: "Volkswagen",
        FORD: "Ford",
        CHEVROLET: "Chevrolet",
        FIAT: "Fiat",
        HONDA: "Honda",
        TOYOTA: "Toyota",
        HYUNDAI: "Hyundai",
        NISSAN: "Nissan",
        RENAULT: "Renault",
        PEUGEOT: "Peugeot",
        CITROEN: "Citroën",
        BMW: "BMW",
        MERCEDES: "Mercedes-Benz",
        AUDI: "Audi",
        VOLVO: "Volvo",
      };

      const marcaUpper = marca.toUpperCase().trim();
      return marcasPadronizadas[marcaUpper] || marca.trim();
    } catch (error) {
      console.warn("Erro ao mapear marca:", error.message);
      return "Não informado";
    }
  }

  /**
   * Mapeia categoria para valores do enum do modelo
   * @param {string} categoria - Categoria retornada pela API
   * @returns {string} Categoria padronizada
   */
  mapearCategoria(categoria) {
    try {
      if (!categoria || typeof categoria !== "string") {
        return "outro";
      }

      const categoriaUpper = categoria.toUpperCase().trim();

      const categoriasPadronizadas = {
        // Mapeamento baseado na resposta real da API consultarplaca.com.br
        AUTO: "carro", // Campo "segmento" da API
        AUTOMOVEL: "carro",
        CARRO: "carro",
        AUTOMÓVEL: "carro",
        MOTOCICLETA: "moto", // Campo "segmento" da API
        MOTO: "moto",
        CAMINHAO: "caminhao", // Campo "segmento" da API
        CAMINHÃO: "caminhao",
        TRUCK: "caminhao",
        VAN: "van",
        ONIBUS: "onibus",
        ÔNIBUS: "onibus",
        BUS: "onibus",
        // Outros possíveis valores da API
        PICKUP: "caminhao",
        UTILITARIO: "van",
        MICROONIBUS: "onibus",
        MICROÔNIBUS: "onibus",
      };

      return categoriasPadronizadas[categoriaUpper] || "outro";
    } catch (error) {
      console.warn("Erro ao mapear categoria:", error.message);
      return "outro";
    }
  }

  /**
   * Extrai ano de diferentes formatos
   * @param {string|number} ano - Ano em qualquer formato
   * @returns {number} Ano como número
   */
  extrairAno(ano) {
    try {
      if (!ano) return new Date().getFullYear();

      // Converter para string primeiro para evitar erros
      const anoString = String(ano).trim();
      const anoNumero = parseInt(anoString);

      if (
        isNaN(anoNumero) ||
        anoNumero < 1900 ||
        anoNumero > new Date().getFullYear() + 1
      ) {
        return new Date().getFullYear();
      }

      return anoNumero;
    } catch (error) {
      console.warn("Erro ao extrair ano:", error.message);
      return new Date().getFullYear();
    }
  }

  /**
   * Valida dados formatados
   * @param {Object} dados - Dados formatados
   * @throws {Error} Se dados obrigatórios estiverem faltando
   */
  validarDadosFormatados(dados) {
    try {
      if (!dados || typeof dados !== "object") {
        throw new Error("Dados para validação inválidos");
      }

      const camposObrigatorios = [
        "placa",
        "marca",
        "modelo",
        "ano_fabricacao",
        "ano_modelo",
        "categoria",
        "cor",
      ];

      for (const campo of camposObrigatorios) {
        if (
          !dados[campo] ||
          dados[campo] === "Não informado" ||
          dados[campo] === null ||
          dados[campo] === undefined
        ) {
          throw new Error(
            `Campo obrigatório '${campo}' não encontrado ou inválido`
          );
        }
      }
    } catch (error) {
      console.error("Erro na validação de dados:", error.message);
      throw error;
    }
  }

  /**
   * Cria dados de fallback quando API não está disponível
   * @param {string} placa - Placa do veículo
   * @param {Error} error - Erro ocorrido
   * @returns {Object} Dados de fallback
   */
  criarFallbackVeiculo(placa, error) {
    // === DEBUG FALLBACK ===
    console.log("=== DEBUG FALLBACK ===");
    console.log("🚨 Placa:", placa);
    console.log("🚨 Error completo:", error);
    console.log("🚨 Error message:", error?.message);
    console.log("🚨 Error code:", error?.code);
    console.log("🚨 Error status:", error?.response?.status);
    console.log("🚨 Error statusText:", error?.response?.statusText);
    console.log(
      "🚨 Error response data:",
      JSON.stringify(error?.response?.data, null, 2)
    );
    console.log("🚨 Error response headers:", error?.response?.headers);
    console.log("🚨 Error config URL:", error?.config?.url);
    console.log("🚨 Error config method:", error?.config?.method);
    console.log("🚨 Error config headers:", error?.config?.headers);
    console.log("🚨 Error stack:", error?.stack);
    console.log("=== FIM DEBUG FALLBACK ===");

    const errorMessage =
      error && error.message ? error.message : "Erro desconhecido";
    console.warn(
      `Criando fallback para placa ${placa} devido ao erro: ${errorMessage}`
    );

    const fallbackData = {
      placa: placa,
      marca: "Não informado",
      modelo: "Não informado",
      ano_fabricacao: new Date().getFullYear(),
      ano_modelo: new Date().getFullYear(),
      categoria: "outro",
      cor: "Não informado",
      chassi: "Não informado",
      renavam: "Não informado",
      origem_dados_veiculo: "api_com_fallback",
      api_veicular_metadata: {
        erro: {
          message: errorMessage,
          timestamp: new Date().toISOString(),
          tipo:
            errorMessage &&
            typeof errorMessage === "string" &&
            errorMessage.includes("RATE_LIMIT_EXCEEDED")
              ? "rate_limit_excedido"
              : "api_indisponivel",
        },
        fallback_utilizado: true,
      },
    };

    // Adicionar informações de rate limiting se disponível
    if (error && error.rateLimitInfo) {
      fallbackData.rate_limit_info = {
        current_count: error.rateLimitInfo.currentCount,
        max_requests: error.rateLimitInfo.maxRequests,
        remaining_requests: error.rateLimitInfo.remainingRequests,
        reset_time: error.rateLimitInfo.resetTime,
        environment: error.rateLimitInfo.environment,
        headers: error.rateLimitInfo.headers,
        exceeded: true,
      };
    }

    return fallbackData;
  }

  /**
   * Limpa cache de uma placa específica
   * @param {string} placa - Placa do veículo
   * @returns {boolean} True se removido do cache
   */
  limparCachePlaca(placa) {
    const placaNormalizada = this.normalizarPlaca(placa);
    if (!placaNormalizada) return false;

    const cacheKey = `veiculo_${placaNormalizada}`;
    return this.cache.del(cacheKey);
  }

  /**
   * Limpa todo o cache
   * @returns {number} Número de chaves removidas
   */
  limparCache() {
    return this.cache.flushAll();
  }

  /**
   * Obtém estatísticas do cache e rate limiting
   * @returns {Object} Estatísticas do cache e rate limiting
   */
  obterEstatisticasCache() {
    const cacheStats = this.cache.getStats();
    const rateLimitStats = this.rateLimitCache.getStats();
    const rateLimitKeys = this.rateLimitCache.keys();

    // Obter estatísticas do circuit breaker
    const circuitBreakerStats = this.circuitBreaker
      ? this.circuitBreaker.stats
      : null;

    return {
      cache: {
        keys: this.cache.keys().length,
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        ttl: this.cache.options.stdTTL,
      },
      rate_limiting: {
        active_ips: rateLimitKeys.length,
        total_requests: rateLimitKeys.reduce((total, key) => {
          return total + (this.rateLimitCache.get(key) || 0);
        }, 0),
        hits: rateLimitStats.hits,
        misses: rateLimitStats.misses,
        ttl: this.rateLimitCache.options.stdTTL,
        config: this.rateLimitConfig[this.rateLimitConfig.current],
        environment: this.rateLimitConfig.current,
      },
      circuit_breaker: {
        state: this.circuitBreaker ? this.circuitBreaker.state : "unknown",
        enabled: !!this.circuitBreaker,
        metrics: this.circuitBreakerMetrics,
        stats: circuitBreakerStats,
        config: this.circuitBreakerConfig,
        last_failure: this.circuitBreakerMetrics.lastFailureTime,
        last_success: this.circuitBreakerMetrics.lastSuccessTime,
        success_rate:
          this.circuitBreakerMetrics.totalRequests > 0
            ? (
                (this.circuitBreakerMetrics.successfulRequests /
                  this.circuitBreakerMetrics.totalRequests) *
                100
              ).toFixed(2) + "%"
            : "0%",
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Verifica se a API está configurada corretamente
   * @returns {Object} Informações de configuração
   */
  verificarConfiguracao() {
    return {
      api_configured: !!this.apiKey && !!this.email,
      api_key_present: !!this.apiKey,
      api_email_present: !!this.email,
      api_key_demo: this.apiKey === "demo-key",
      authentication_type: "Basic Auth",
      authentication_format:
        "Authorization: Basic {base64_encode(email:api_key)}",
      cache_enabled: true,
      rate_limiting_enabled: true,
      circuit_breaker_enabled: !!this.circuitBreaker,
      circuit_breaker_state: this.circuitBreaker
        ? this.circuitBreaker.state
        : "unknown",
      timeout: 10000,
      environment: process.env.NODE_ENV || "development",
      rate_limit_config: this.rateLimitConfig[this.rateLimitConfig.current],
      circuit_breaker_config: this.circuitBreakerConfig,
    };
  }

  /**
   * Força abertura do circuit breaker (para testes ou emergência)
   */
  forcarAberturaCircuitBreaker() {
    if (this.circuitBreaker) {
      this.circuitBreaker.open();
      console.log(`🔴 Circuit Breaker: Forçado a ABRIR manualmente`);
    }
  }

  /**
   * Força fechamento do circuit breaker (para testes ou recuperação)
   */
  forcarFechamentoCircuitBreaker() {
    if (this.circuitBreaker) {
      this.circuitBreaker.close();
      console.log(`🟢 Circuit Breaker: Forçado a FECHAR manualmente`);
    }
  }

  /**
   * Reseta as métricas do circuit breaker
   */
  resetarMetricasCircuitBreaker() {
    this.circuitBreakerMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      circuitOpenCount: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
    };
    console.log(`🔄 Circuit Breaker: Métricas resetadas`);
  }

  /**
   * Obtém status detalhado do circuit breaker
   * @returns {Object} Status detalhado do circuit breaker
   */
  obterStatusCircuitBreaker() {
    if (!this.circuitBreaker) {
      return {
        enabled: false,
        state: "unknown",
        message: "Circuit breaker não inicializado",
      };
    }

    const stats = this.circuitBreaker.stats;
    const state = this.circuitBreaker.state;

    return {
      enabled: true,
      state: state,
      config: this.circuitBreakerConfig,
      metrics: this.circuitBreakerMetrics,
      stats: stats,
      health: {
        success_rate:
          this.circuitBreakerMetrics.totalRequests > 0
            ? (
                (this.circuitBreakerMetrics.successfulRequests /
                  this.circuitBreakerMetrics.totalRequests) *
                100
              ).toFixed(2) + "%"
            : "0%",
        failure_rate:
          this.circuitBreakerMetrics.totalRequests > 0
            ? (
                (this.circuitBreakerMetrics.failedRequests /
                  this.circuitBreakerMetrics.totalRequests) *
                100
              ).toFixed(2) + "%"
            : "0%",
        total_requests: this.circuitBreakerMetrics.totalRequests,
        circuit_open_count: this.circuitBreakerMetrics.circuitOpenCount,
      },
      last_activity: {
        success: this.circuitBreakerMetrics.lastSuccessTime,
        failure: this.circuitBreakerMetrics.lastFailureTime,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

// Instância singleton do serviço
const apiVeicularService = new ApiVeicularService();

module.exports = apiVeicularService;
