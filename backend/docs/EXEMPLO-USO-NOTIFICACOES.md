# 📱 Exemplo de Uso - Sistema de Notificações

## Fluxo Completo de Teste

### Passo 1: Executar a Migration

Primeiro, execute a migration para adicionar os novos tipos de notificação:

```bash
cd backend
npx sequelize-cli db:migrate
```

Você deve ver:

```
== 20250112000001-add-notification-types: migrating =======
== 20250112000001-add-notification-types: migrated (0.XXXs)
```

### Passo 2: Testar Fluxo de Nova Solicitação

#### 2.1. Login como Cliente

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@example.com",
    "senha": "senha123"
  }'
```

Salve o token retornado: `TOKEN_CLIENTE`

#### 2.2. Criar Nova Solicitação

```bash
curl -X POST http://localhost:3000/api/solicitacoes \
  -H "Authorization: Bearer TOKEN_CLIENTE" \
  -H "Content-Type: application/json" \
  -d '{
    "placa": "ABC1234",
    "marca": "FIAT",
    "modelo": "UNO",
    "ano_fabricacao": 2020,
    "ano_modelo": 2020,
    "categoria": "carro",
    "cor": "Branco",
    "descricao_peca": "Filtro de óleo original",
    "cidade_atendimento": "São Paulo",
    "uf_atendimento": "SP"
  }'
```

**Resultado:** Autopeças de São Paulo receberão notificação `nova_solicitacao`

#### 2.3. Login como Autopeça (São Paulo)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "autopeca@example.com",
    "senha": "senha123"
  }'
```

Salve o token: `TOKEN_AUTOPECA`

#### 2.4. Verificar Notificações da Autopeça

```bash
# Contagem de não lidas
curl http://localhost:3000/api/notificacoes/nao-lidas/contagem \
  -H "Authorization: Bearer TOKEN_AUTOPECA"
```

Resposta esperada:

```json
{
  "success": true,
  "data": {
    "total_nao_lidas": 1,
    "por_tipo": {
      "nova_solicitacao": 1
    }
  }
}
```

#### 2.5. Listar Notificações

```bash
curl http://localhost:3000/api/notificacoes \
  -H "Authorization: Bearer TOKEN_AUTOPECA"
```

Resposta esperada:

```json
{
  "success": true,
  "data": {
    "notificacoes": [
      {
        "id": "uuid...",
        "tipo_notificacao": "nova_solicitacao",
        "titulo": "🚨 Nova Solicitação na Sua Cidade",
        "mensagem": "Nova solicitação de Filtro de óleo original para FIAT UNO em São Paulo",
        "lida": false,
        "metadados": {
          "solicitacao_id": "uuid...",
          "marca": "FIAT",
          "modelo": "UNO",
          "cidade": "São Paulo"
        },
        "data_criacao": "2025-01-12T10:30:00Z"
      }
    ],
    "paginacao": {
      "total": 1,
      "pagina_atual": 1,
      "total_paginas": 1
    }
  }
}
```

### Passo 3: Testar Fluxo de Atendimento por Vendedor

#### 3.1. Login como Vendedor

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendedor@example.com",
    "senha": "senha123"
  }'
```

Salve o token: `TOKEN_VENDEDOR`

#### 3.2. Marcar Solicitação como Atendida

```bash
curl -X POST http://localhost:3000/api/vendedor/solicitacoes/SOLICITACAO_ID/atender \
  -H "Authorization: Bearer TOKEN_VENDEDOR"
```

**Resultado:**

- ✅ Cliente recebe notificação `solicitacao_atendida`
- ✅ Admin da autopeça recebe `vendedor_atendeu`
- ✅ Outros vendedores recebem `perdeu_solicitacao`

#### 3.3. Verificar Notificação do Cliente

```bash
curl http://localhost:3000/api/notificacoes \
  -H "Authorization: Bearer TOKEN_CLIENTE"
```

Você verá:

```json
{
  "tipo_notificacao": "solicitacao_atendida",
  "titulo": "✅ Sua Solicitação Foi Atendida",
  "mensagem": "Sua solicitação de Filtro de óleo original foi atendida por João da AutoPeças Silva...",
  "lida": false
}
```

#### 3.4. Verificar Notificação do Admin da Autopeça

```bash
curl http://localhost:3000/api/notificacoes \
  -H "Authorization: Bearer TOKEN_AUTOPECA"
```

Você verá:

```json
{
  "tipo_notificacao": "vendedor_atendeu",
  "titulo": "👤 Vendedor Atendeu Solicitação",
  "mensagem": "Seu vendedor João atendeu a solicitação de Filtro de óleo original para FIAT UNO",
  "lida": false
}
```

### Passo 4: Marcar Notificação como Lida

#### 4.1. Marcar Notificação Individual

```bash
curl -X PUT http://localhost:3000/api/notificacoes/NOTIFICACAO_ID/ler \
  -H "Authorization: Bearer TOKEN_CLIENTE"
```

Resposta:

```json
{
  "success": true,
  "message": "Notificação marcada como lida",
  "data": {
    "notificacao": {
      "id": "uuid...",
      "lida": true
    }
  }
}
```

#### 4.2. Marcar Todas como Lidas

```bash
curl -X PUT http://localhost:3000/api/notificacoes/ler-todas \
  -H "Authorization: Bearer TOKEN_CLIENTE"
```

Resposta:

```json
{
  "success": true,
  "message": "3 notificação(ões) marcada(s) como lida(s)",
  "data": {
    "quantidade_atualizada": 3
  }
}
```

### Passo 5: Testar Cancelamento de Solicitação

#### 5.1. Cliente Cancela Solicitação

```bash
curl -X DELETE http://localhost:3000/api/solicitacoes/SOLICITACAO_ID \
  -H "Authorization: Bearer TOKEN_CLIENTE"
```

**Resultado:**

- ✅ Cliente recebe confirmação `solicitacao_cancelada`
- ✅ Autopeça que atendeu recebe notificação de cancelamento
- ✅ Vendedor que atendeu recebe notificação de cancelamento

#### 5.2. Verificar Notificações

```bash
# Cliente
curl http://localhost:3000/api/notificacoes?tipo=solicitacao_cancelada \
  -H "Authorization: Bearer TOKEN_CLIENTE"

# Autopeça/Vendedor
curl http://localhost:3000/api/notificacoes?tipo=solicitacao_cancelada \
  -H "Authorization: Bearer TOKEN_AUTOPECA"
```

### Passo 6: Testar Filtros e Paginação

#### 6.1. Filtrar por Tipo

```bash
curl "http://localhost:3000/api/notificacoes?tipo=nova_solicitacao" \
  -H "Authorization: Bearer TOKEN_AUTOPECA"
```

#### 6.2. Filtrar por Lida/Não Lida

```bash
# Apenas não lidas
curl "http://localhost:3000/api/notificacoes?lida=false" \
  -H "Authorization: Bearer TOKEN_AUTOPECA"

# Apenas lidas
curl "http://localhost:3000/api/notificacoes?lida=true" \
  -H "Authorization: Bearer TOKEN_AUTOPECA"
```

#### 6.3. Paginação

```bash
# Página 1 com 10 itens
curl "http://localhost:3000/api/notificacoes?page=1&limit=10" \
  -H "Authorization: Bearer TOKEN_AUTOPECA"

# Página 2 com 10 itens
curl "http://localhost:3000/api/notificacoes?page=2&limit=10" \
  -H "Authorization: Bearer TOKEN_AUTOPECA"
```

### Passo 7: Deletar Notificações

#### 7.1. Deletar Notificação Individual

```bash
curl -X DELETE http://localhost:3000/api/notificacoes/NOTIFICACAO_ID \
  -H "Authorization: Bearer TOKEN_CLIENTE"
```

#### 7.2. Deletar Todas as Lidas

```bash
curl -X DELETE http://localhost:3000/api/notificacoes/lidas \
  -H "Authorization: Bearer TOKEN_CLIENTE"
```

Resposta:

```json
{
  "success": true,
  "message": "5 notificação(ões) deletada(s)",
  "data": {
    "quantidade_deletada": 5
  }
}
```

## 🧪 Script de Teste Automatizado

Crie um arquivo `test-notifications.js`:

```javascript
const axios = require("axios");

const API_URL = "http://localhost:3000/api";
let clienteToken, autopecaToken, vendedorToken;
let solicitacaoId;

async function login(email, senha) {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email,
    senha,
  });
  return response.data.token;
}

async function criarSolicitacao(token) {
  const response = await axios.post(
    `${API_URL}/solicitacoes`,
    {
      placa: "ABC1234",
      marca: "FIAT",
      modelo: "UNO",
      ano_fabricacao: 2020,
      ano_modelo: 2020,
      categoria: "carro",
      cor: "Branco",
      descricao_peca: "Filtro de óleo original",
      cidade_atendimento: "São Paulo",
      uf_atendimento: "SP",
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data.data.solicitacao.id;
}

async function verificarNotificacoes(token, tipo = null) {
  const url = tipo
    ? `${API_URL}/notificacoes?tipo=${tipo}`
    : `${API_URL}/notificacoes`;

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

async function contarNaoLidas(token) {
  const response = await axios.get(
    `${API_URL}/notificacoes/nao-lidas/contagem`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data.data;
}

async function runTests() {
  console.log("🧪 Iniciando testes do sistema de notificações...\n");

  // 1. Login
  console.log("1️⃣ Fazendo login...");
  clienteToken = await login("cliente@example.com", "senha123");
  autopecaToken = await login("autopeca@example.com", "senha123");
  console.log("✅ Logins realizados\n");

  // 2. Criar solicitação
  console.log("2️⃣ Criando solicitação...");
  solicitacaoId = await criarSolicitacao(clienteToken);
  console.log(`✅ Solicitação criada: ${solicitacaoId}\n`);

  // 3. Verificar notificações da autopeça
  console.log("3️⃣ Verificando notificações da autopeça...");
  const contagem = await contarNaoLidas(autopecaToken);
  console.log(
    `📊 Autopeça tem ${contagem.total_nao_lidas} notificações não lidas`
  );
  console.log(
    `   - nova_solicitacao: ${contagem.por_tipo.nova_solicitacao || 0}\n`
  );

  const notificacoes = await verificarNotificacoes(
    autopecaToken,
    "nova_solicitacao"
  );
  console.log(
    `📬 Notificações recebidas: ${notificacoes.data.notificacoes.length}`
  );
  notificacoes.data.notificacoes.forEach((n) => {
    console.log(`   - ${n.titulo}`);
    console.log(`   - ${n.mensagem}\n`);
  });

  console.log("✅ Todos os testes concluídos!");
}

runTests().catch(console.error);
```

Execute:

```bash
node test-notifications.js
```

## 📊 Exemplo de Componente React

```jsx
import React, { useState, useEffect } from "react";

function NotificationBell() {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchCount();
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchCount() {
    const response = await fetch("/api/notificacoes/nao-lidas/contagem", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const { data } = await response.json();
    setCount(data.total_nao_lidas);
  }

  async function fetchNotifications() {
    const response = await fetch("/api/notificacoes?limit=10", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const { data } = await response.json();
    setNotifications(data.notificacoes);
  }

  async function markAsRead(id) {
    await fetch(`/api/notificacoes/${id}/ler`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    fetchCount();
    fetchNotifications();
  }

  const handleBellClick = () => {
    if (!showDropdown) {
      fetchNotifications();
    }
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="notification-bell">
      <button onClick={handleBellClick}>
        🔔
        {count > 0 && <span className="badge">{count}</span>}
      </button>

      {showDropdown && (
        <div className="notifications-dropdown">
          <h3>Notificações</h3>
          {notifications.length === 0 ? (
            <p>Nenhuma notificação</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`notification-item ${!n.lida ? "unread" : ""}`}
                onClick={() => markAsRead(n.id)}
              >
                <strong>{n.titulo}</strong>
                <p>{n.mensagem}</p>
                <small>{new Date(n.data_criacao).toLocaleString()}</small>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
```

---

**Pronto para testar!** 🚀




