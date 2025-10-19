# Sistema de Notificações In-App - MVP PeçaJá

## 📋 Visão Geral

Sistema de notificações in-app implementado seguindo os requisitos da especificação do projeto, focado nas notificações essenciais que agregam valor real ao MVP.

## 🎯 Implementação Completa

### ✅ Arquivos Criados

1. **Migration**: `backend/src/migrations/20250112000001-add-notification-types.js`

   - Adiciona novos tipos de notificação ao ENUM existente

2. **Service**: `backend/src/services/notificationService.js`

   - Métodos para criar notificações automaticamente
   - Lógica de negócio centralizada

3. **Controller**: `backend/src/controllers/notificationController.js`

   - CRUD completo de notificações
   - Métodos de listagem, marcação como lida, contagem e exclusão

4. **Routes**: `backend/src/routes/notificationRoutes.js`
   - Rotas RESTful para notificações
   - Base: `/api/notificacoes`

### ✅ Arquivos Atualizados

1. **Model**: `backend/src/models/Notificacao.js`

   - Adicionados 5 novos tipos de notificação ao ENUM

2. **Controllers**:

   - `solicitacaoController.js` - Integrado notificações em `create()` e `cancel()`
   - `autopecaController.js` - Integrado notificações em `marcarComoAtendida()`
   - `vendedorOperacoesController.js` - Integrado notificações em `marcarComoAtendida()`

3. **Index Files**:
   - `src/services/index.js` - Exporta `NotificationService`
   - `src/controllers/index.js` - Exporta `NotificationController`
   - `src/routes/index.js` - Registra rotas de notificações

## 📊 Tipos de Notificação Implementados

### 👤 Para CLIENTES:

- ✅ `solicitacao_atendida` - "Sua solicitação foi atendida por [autopeça/vendedor]"
- ✅ `solicitacao_cancelada` - "Sua solicitação foi cancelada com sucesso"

### 🏪 Para AUTOPEÇAS:

- ✅ `nova_solicitacao` - "Nova solicitação de [peça] em [cidade]"
- ✅ `vendedor_atendeu` - "Seu vendedor [nome] atendeu a solicitação"
- ✅ `solicitacao_cancelada` - "Solicitação foi cancelada pelo cliente"

### 👥 Para VENDEDORES:

- ✅ `nova_solicitacao` - "Nova solicitação disponível: [peça] para [veículo]"
- ✅ `perdeu_solicitacao` - "Outro vendedor atendeu a solicitação primeiro"
- ✅ `solicitacao_cancelada` - "Solicitação foi cancelada pelo cliente"

### ⚠️ Para ADMINS DE AUTOPEÇAS:

- ✅ `conflito_atendimento` - "Dois vendedores tentaram atender simultaneamente"

## 🔌 API Endpoints

### GET /api/notificacoes

Listar notificações do usuário com paginação e filtros

**Query Parameters:**

- `page` (opcional) - Número da página (padrão: 1)
- `limit` (opcional) - Limite por página (padrão: 20)
- `tipo` (opcional) - Filtrar por tipo de notificação
- `lida` (opcional) - Filtrar por lida true/false

**Resposta:**

```json
{
  "success": true,
  "message": "Notificações listadas com sucesso",
  "data": {
    "notificacoes": [...],
    "paginacao": {
      "total": 50,
      "pagina_atual": 1,
      "total_paginas": 3,
      "limite_por_pagina": 20,
      "tem_proxima": true,
      "tem_anterior": false
    }
  }
}
```

### GET /api/notificacoes/nao-lidas/contagem

Contar notificações não lidas

**Resposta:**

```json
{
  "success": true,
  "data": {
    "total_nao_lidas": 5,
    "por_tipo": {
      "nova_solicitacao": 3,
      "solicitacao_atendida": 2
    }
  }
}
```

### GET /api/notificacoes/:id

Buscar notificação específica por ID

### PUT /api/notificacoes/:id/ler

Marcar notificação como lida

### PUT /api/notificacoes/ler-todas

Marcar todas as notificações como lidas

**Resposta:**

```json
{
  "success": true,
  "message": "5 notificação(ões) marcada(s) como lida(s)",
  "data": {
    "quantidade_atualizada": 5
  }
}
```

### DELETE /api/notificacoes/:id

Deletar notificação específica

### DELETE /api/notificacoes/lidas

Deletar todas as notificações lidas

## 🔄 Fluxos de Notificação

### 1. Cliente cria solicitação

```
Cliente → solicitacaoController.create()
    ↓
NotificationService.notificarAutopecasNovaSolicitacao()
    ↓
Autopeças da cidade recebem notificação "nova_solicitacao"
```

### 2. Autopeça marca solicitação como atendida

```
Autopeça → autopecaController.marcarComoAtendida()
    ↓
NotificationService.notificarClienteSolicitacaoAtendida()
    ↓
Cliente recebe notificação "solicitacao_atendida"
```

### 3. Vendedor marca solicitação como atendida

```
Vendedor → vendedorOperacoesController.marcarComoAtendida()
    ↓
NotificationService executa 3 ações:
    ├─ notificarClienteSolicitacaoAtendida() → Cliente recebe "solicitacao_atendida"
    ├─ notificarAutopecaVendedorAtendeu() → Admin recebe "vendedor_atendeu"
    └─ notificarOutrosVendedoresPerderam() → Outros vendedores recebem "perdeu_solicitacao"
```

### 4. Cliente cancela solicitação

```
Cliente → solicitacaoController.cancel()
    ↓
NotificationService executa 2 ações:
    ├─ notificarClienteSolicitacaoCancelada() → Cliente recebe confirmação
    └─ notificarAutopecasSolicitacaoCancelada() → Autopeças/Vendedores que atenderam recebem aviso
```

## 🛠️ NotificationService - Métodos Principais

### `criarNotificacao(usuarioId, tipo, titulo, mensagem, dadosExtra)`

Método base para criar notificações no banco de dados.

### `notificarAutopecasNovaSolicitacao(solicitacao, autopecas)`

Notifica todas as autopeças da cidade sobre nova solicitação.

### `notificarClienteSolicitacaoAtendida(solicitacao, cliente, autopeca, vendedor)`

Notifica cliente que sua solicitação foi atendida.

### `notificarAutopecaVendedorAtendeu(solicitacao, vendedor, autopeca)`

Notifica admin da autopeça que vendedor atendeu solicitação.

### `notificarOutrosVendedoresPerderam(solicitacao, autopecaId, vendedorQueAtendeuId)`

Notifica outros vendedores da mesma autopeça que perderam a solicitação.

### `notificarAutopecasSolicitacaoCancelada(solicitacao, atendimentos)`

Notifica autopeças e vendedores sobre cancelamento de solicitação.

### `notificarClienteSolicitacaoCancelada(solicitacao, cliente)`

Confirma ao cliente o cancelamento da solicitação.

### `notificarConflitoAtendimento(solicitacao, autopeca)`

Notifica admin sobre conflito de atendimento (uso futuro).

## 📦 Estrutura de Dados da Notificação

```javascript
{
  id: "uuid",
  usuario_id: "uuid",
  tipo_notificacao: "nova_solicitacao",
  titulo: "🚨 Nova Solicitação na Sua Cidade",
  mensagem: "Nova solicitação de filtro de óleo para FIAT UNO em São Paulo",
  metadados: {
    solicitacao_id: "uuid",
    marca: "FIAT",
    modelo: "UNO",
    ano: 2020,
    cidade: "São Paulo",
    uf: "SP"
  },
  lida: false,
  enviada_email: false,
  data_criacao: "2025-01-12T10:30:00Z"
}
```

## 🚀 Como Usar no Frontend

### 1. Buscar notificações não lidas (badge)

```javascript
const response = await fetch("/api/notificacoes/nao-lidas/contagem", {
  headers: { Authorization: `Bearer ${token}` },
});
const { data } = await response.json();
console.log(`${data.total_nao_lidas} notificações não lidas`);
```

### 2. Listar notificações

```javascript
const response = await fetch("/api/notificacoes?page=1&limit=20", {
  headers: { Authorization: `Bearer ${token}` },
});
const { data } = await response.json();
// Renderizar data.notificacoes
```

### 3. Marcar como lida

```javascript
await fetch(`/api/notificacoes/${notificationId}/ler`, {
  method: "PUT",
  headers: { Authorization: `Bearer ${token}` },
});
```

### 4. Marcar todas como lidas

```javascript
await fetch("/api/notificacoes/ler-todas", {
  method: "PUT",
  headers: { Authorization: `Bearer ${token}` },
});
```

## 🧪 Testes Recomendados

### Teste 1: Criar solicitação e verificar notificações

1. Cliente cria solicitação
2. Verificar se autopeças da cidade receberam notificação
3. Verificar se `tipo_notificacao === 'nova_solicitacao'`

### Teste 2: Atendimento por vendedor

1. Vendedor marca como atendida
2. Verificar se cliente recebeu notificação
3. Verificar se admin da autopeça recebeu notificação
4. Verificar se outros vendedores receberam notificação

### Teste 3: Cancelamento

1. Cliente cancela solicitação
2. Verificar se cliente recebeu confirmação
3. Verificar se autopeças que atenderam receberam notificação

### Teste 4: Paginação e filtros

1. Criar várias notificações
2. Testar paginação com diferentes valores de `limit`
3. Testar filtros por `tipo` e `lida`

### Teste 5: Marcar como lida

1. Marcar notificação individual
2. Verificar contagem de não lidas
3. Marcar todas como lidas
4. Verificar se contagem zerou

## 📝 Próximos Passos (Opcional)

- [ ] Implementar notificações em tempo real com WebSockets
- [ ] Adicionar preferências de notificação por usuário
- [ ] Implementar sistema de template de mensagens
- [ ] Adicionar notificações por email para casos importantes
- [ ] Criar dashboard de estatísticas de notificações

## ✅ Status da Implementação

| Requisito                                 | Status      |
| ----------------------------------------- | ----------- |
| Migration para novos tipos                | ✅ Completo |
| NotificationService                       | ✅ Completo |
| NotificationController                    | ✅ Completo |
| NotificationRoutes                        | ✅ Completo |
| Integração em solicitacaoController       | ✅ Completo |
| Integração em autopecaController          | ✅ Completo |
| Integração em vendedorOperacoesController | ✅ Completo |
| Método cancel() implementado              | ✅ Completo |
| Atualização de index.js                   | ✅ Completo |
| Testes                                    | ⏳ Pendente |
| Documentação                              | ✅ Completo |

---

**Desenvolvido para o MVP PeçaJá** 🚗✨




