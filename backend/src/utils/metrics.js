const client = require("prom-client");

// Criar um registry customizado para as métricas do PeçaJá
const register = new client.Registry();

// Coletar métricas padrão do Node.js
client.collectDefaultMetrics({ register, prefix: "pecaja_" });

// Histograma para duração das requisições HTTP
const httpRequestDuration = new client.Histogram({
  name: "pecaja_http_request_duration_seconds",
  help: "Duração das requisições HTTP em segundos",
  labelNames: ["method", "route", "status"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register],
});

// Contador para total de requisições HTTP
const httpRequestTotal = new client.Counter({
  name: "pecaja_http_requests_total",
  help: "Total de requisições HTTP",
  labelNames: ["method", "route", "status"],
  registers: [register],
});

// Gauge para usuários ativos
const activeUsers = new client.Gauge({
  name: "pecaja_active_users",
  help: "Número de usuários ativos",
  registers: [register],
});

// Gauge para conexões com banco de dados
const databaseConnections = new client.Gauge({
  name: "pecaja_database_connections",
  help: "Número de conexões com banco de dados",
  registers: [register],
});

// Middleware para coletar métricas de requisições HTTP
const metricsMiddleware = (req, res, next) => {
  // Ignorar o próprio endpoint de métricas
  if (req.path === "/api/metrics" || req.path === "/metrics") {
    return next();
  }

  const start = Date.now();

  // Função para obter a rota normalizada
  const getRoute = () => {
    if (req.route && req.route.path) {
      return req.route.path;
    }
    const path =
      req.path || (req.originalUrl ? req.originalUrl.split("?")[0] : "/");
    return path.startsWith("/api") ? path : `/api${path}`;
  };

  // Capturar métricas quando a resposta terminar
  res.on("finish", () => {
    try {
      const duration = (Date.now() - start) / 1000;
      const route = getRoute();
      const method = req.method || "UNKNOWN";
      const status = res.statusCode || 0;

      httpRequestDuration.observe(
        { method, route, status: status.toString() },
        duration
      );

      httpRequestTotal.inc({
        method,
        route,
        status: status.toString(),
      });
    } catch (error) {
      console.error("❌ Erro ao coletar métricas:", error.message);
    }
  });

  // Capturar métricas se a conexão for fechada antes de terminar
  res.on("close", () => {
    if (res.writableEnded === false) {
      try {
        const duration = (Date.now() - start) / 1000;
        const route = getRoute();
        const method = req.method || "UNKNOWN";
        const status = res.statusCode || 0;

        httpRequestDuration.observe(
          { method, route, status: `closed_${status.toString()}` },
          duration
        );
        httpRequestTotal.inc({
          method,
          route,
          status: `closed_${status.toString()}`,
        });
      } catch (error) {
        console.error("❌ Erro ao coletar métricas em close:", error.message);
      }
    }
  });

  next();
};

// Função para obter métricas no formato Prometheus
const getMetrics = async () => {
  return register.metrics();
};

module.exports = {
  metricsMiddleware,
  getMetrics,
  register,
  httpRequestDuration,
  httpRequestTotal,
  activeUsers,
  databaseConnections,
};



