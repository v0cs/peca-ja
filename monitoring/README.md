# Monitoramento PeçaJá - Grafana e Prometheus

## 📊 Visão Geral

Sistema de monitoramento básico do PeçaJá usando **Prometheus** (coleta de métricas) e **Grafana** (visualização).

## 🚀 Início Rápido

### Iniciar Serviços
```bash
docker-compose up -d
```

### Acessar Interfaces
- **Grafana**: http://localhost:3002 (admin / admin123)
- **Prometheus**: http://localhost:9090
- **Backend Metrics**: http://localhost:3001/api/metrics

## 📈 Métricas Disponíveis

### Métricas HTTP (Customizadas)
- `pecaja_http_requests_total` - Total de requisições por método, rota e status
- `pecaja_http_request_duration_seconds` - Duração das requisições (histogram)

### Métricas do Node.js (Automáticas)
- `pecaja_process_cpu_user_seconds_total` - CPU usado pelo processo
- `pecaja_process_cpu_system_seconds_total` - CPU do sistema
- `pecaja_process_resident_memory_bytes` - Memória residente
- `pecaja_nodejs_heap_size_total_bytes` - Tamanho total do heap
- `pecaja_nodejs_heap_size_used_bytes` - Heap usado
- `pecaja_nodejs_eventloop_lag_seconds` - Lag do event loop

## 🔧 Configuração

### Prometheus
- Arquivo: `prometheus.yml`
- Coleta métricas do backend a cada 30 segundos
- Target: `backend:3001/api/metrics`

### Grafana
- Datasource provisionado automaticamente
- Dashboard: `PeçaJá - Monitoramento` (provisionado automaticamente)
- Configuração: `grafana/provisioning/`

## 🛠️ Troubleshooting

### Backend não expõe métricas
```bash
# Verificar se o backend está rodando
docker-compose ps backend

# Verificar logs
docker-compose logs backend

# Testar endpoint
curl http://localhost:3001/api/metrics
```

### Prometheus não coleta métricas
```bash
# Verificar targets
# Acesse: http://localhost:9090 → Status → Targets

# Verificar logs
docker-compose logs prometheus
```

### Grafana mostra "No data"
1. Verifique se o Prometheus está coletando dados
2. Verifique o intervalo de tempo do dashboard
3. Gere tráfego no backend para criar métricas

