# 🧪 Guia Completo de Testes - Postman

**PeçaJá Backend v1.0.0 MVP**  
**Data:** 19 de Outubro de 2025

---

## 📦 Arquivos Necessários

1. **`PecaJa-Backend.postman_collection.json`** - Coleção com 45+ requests
2. **`PecaJa-Backend.postman_environment.json`** - Variáveis de ambiente

Ambos estão na pasta raiz do backend: `/backend/`

---

## 🚀 Instalação e Configuração

### 1️⃣ Instalar Postman

- **Desktop:** https://www.postman.com/downloads/
- **Web:** https://web.postman.com/ (requer login)

### 2️⃣ Importar Coleção

1. Abrir Postman
2. Clicar em **Import** (canto superior esquerdo)
3. Selecionar arquivo: `PecaJa-Backend.postman_collection.json`
4. Clicar em **Import**

### 3️⃣ Importar Environment

1. Clicar no ícone de **engrenagem** (⚙️) no canto superior direito
2. Clicar em **Import**
3. Selecionar arquivo: `PecaJa-Backend.postman_environment.json`
4. Clicar em **Import**
5. **Selecionar** o environment "PeçaJá Backend - Development"

### 4️⃣ Configurar Backend

Antes de testar, certifique-se que o backend está rodando:

```bash
cd backend
npm install          # Se ainda não instalou
npm run dev          # Ou: npm start
```

O servidor deve estar rodando em: **http://localhost:5000**

---

## 📋 Estrutura da Coleção

A coleção está organizada em **8 módulos + Health Check:**

```
PeçaJá Backend - Testes Completos
│
├─ 0. Health Check (1 request)
├─ 1. Autenticação (7 requests)
├─ 2. Clientes (2 requests)
├─ 3. Autopeças (4 requests)
├─ 4. Solicitações (7 requests)
├─ 5. Consulta Veicular (3 requests)
├─ 6. Notificações (5 requests)
├─ 7. Vendedores (4 requests)
└─ 8. Usuários (2 requests)

Total: 35 requests principais
```

---

## 🎯 Fluxo de Teste Recomendado

### ✅ **Passo 1: Verificar Saúde da API**

**Pasta:** 0. Health Check

1. **API Health**
   - Deve retornar: `{ "status": "OK" }`
   - Status Code: `200`

---

### ✅ **Passo 2: Criar Usuários**

**Pasta:** 1. Autenticação

1. **Registrar Cliente**
   - Status esperado: `201 Created`
   - Cria um cliente com email: `cliente@teste.com`
2. **Registrar Autopeça**
   - Status esperado: `201 Created`
   - Cria autopeça com email: `autopeca@teste.com`

**⚠️ Nota:** Se os emails já existirem, você receberá erro `409 Conflict`. Neste caso:

- Mude os emails no environment OU
- Use o comando no terminal para limpar o banco

---

### ✅ **Passo 3: Fazer Login**

**Pasta:** 1. Autenticação

1. **Login Cliente**
   - Status esperado: `200 OK`
   - **Token JWT é salvo automaticamente** em `{{cliente_token}}`
2. **Login Autopeça**
   - Status esperado: `200 OK`
   - **Token JWT é salvo automaticamente** em `{{autopeca_token}}`

**✨ Testes Automáticos:**

- Valida se token foi retornado
- Valida tipo de usuário correto
- Salva token automaticamente no environment

---

### ✅ **Passo 4: Testar Autenticação**

**Pasta:** 1. Autenticação

1. **Get User Info (Me)**
   - Status esperado: `200 OK`
   - Retorna dados completos do usuário logado
   - Usa token do cliente automaticamente

---

### ✅ **Passo 5: Testar Perfis**

#### **Cliente:**

**Pasta:** 2. Clientes

1. **Get Profile Cliente**

   - Status: `200 OK`
   - Retorna dados do cliente + usuário

2. **Update Profile Cliente**
   - Status: `200 OK`
   - Atualiza nome, telefone, cidade, UF

#### **Autopeça:**

**Pasta:** 3. Autopeças

1. **Get Profile Autopeça**

   - Status: `200 OK`
   - Retorna dados da autopeça

2. **Update Profile Autopeça**
   - Status: `200 OK`
   - Atualiza nome fantasia, telefone, endereço

---

### ✅ **Passo 6: Criar Solicitação**

**Pasta:** 4. Solicitações

1. **Criar Solicitação (sem imagens)**

   - Status: `201 Created`
   - **ID da solicitação é salvo automaticamente** em `{{solicitacao_id}}`
   - Cliente cria pedido de peça

2. **Criar Solicitação (com imagens)** _(opcional)_
   - Status: `201 Created`
   - Para testar upload de imagens
   - Habilite o campo "imagens" e adicione arquivos

**✨ Testes Automáticos:**

- Valida que solicitação foi criada
- Extrai e salva ID automaticamente

---

### ✅ **Passo 7: Listar Solicitações**

#### **Como Cliente:**

**Pasta:** 4. Solicitações

1. **Listar Solicitações do Cliente**

   - Status: `200 OK`
   - Retorna array de solicitações do cliente

2. **Buscar Solicitação por ID**
   - Status: `200 OK`
   - Usa `{{solicitacao_id}}` automaticamente

#### **Como Autopeça:**

**Pasta:** 3. Autopeças

1. **Listar Solicitações Disponíveis**
   - Status: `200 OK`
   - Retorna solicitações da **mesma cidade** da autopeça
   - Apenas solicitações **ativas** e **não atendidas**

---

### ✅ **Passo 8: Atender Solicitação**

**Pasta:** 3. Autopeças

1. **Marcar Solicitação como Atendida**
   - Status: `200 OK`
   - Autopeça marca solicitação como atendida
   - **Retorna link do WhatsApp** formatado

**✨ Response Esperado:**

```json
{
  "success": true,
  "message": "Solicitação marcada como atendida com sucesso",
  "data": {
    "atendimento": { ... },
    "cliente": { ... },
    "veiculo": { ... },
    "link_whatsapp": "https://wa.me/5511987654321?text=...",
    "mensagem_template": "Olá João! ..."
  }
}
```

---

### ✅ **Passo 9: Testar Consulta Veicular**

**Pasta:** 5. Consulta Veicular

1. **Vehicle Health**

   - Status: `200 OK`
   - Verifica se API veicular está configurada

2. **Consultar Placa**
   - Status: `200 OK`
   - Exemplo: `ABC1234`
   - Retorna dados do veículo (da API ou cache)

**⚠️ Nota:** Requer `API_VEICULAR_KEY` configurada no `.env`

---

### ✅ **Passo 10: Testar Notificações**

**Pasta:** 6. Notificações

1. **Listar Notificações**

   - Status: `200 OK`
   - Com paginação: `?page=1&limit=20`
   - Filtros opcionais: `tipo`, `lida`

2. **Contar Não Lidas**

   - Status: `200 OK`
   - Retorna número de notificações não lidas

3. **Marcar Como Lida**

   - Status: `200 OK`
   - Marca notificação específica como lida

4. **Marcar Todas Como Lidas**
   - Status: `200 OK`
   - Marca todas as notificações como lidas

---

### ✅ **Passo 11: Gerenciar Vendedores**

**Pasta:** 7. Vendedores  
**⚠️ Requer:** Token de autopeça

1. **Criar Vendedor**

   - Status: `201 Created`
   - Autopeça cria novo vendedor
   - **ID salvo em** `{{vendedor_id}}`

2. **Listar Vendedores**

   - Status: `200 OK`
   - Lista vendedores da autopeça

3. **Atualizar Vendedor**

   - Status: `200 OK`
   - Atualiza nome, cargo, etc.

4. **Inativar Vendedor**
   - Status: `200 OK`
   - Soft delete (marca como inativo)

---

### ✅ **Passo 12: Atualizar Solicitação**

**Pasta:** 4. Solicitações

1. **Atualizar Solicitação**
   - Status: `200 OK`
   - Cliente pode editar solicitação ativa
   - Atualiza descrição, cor, etc.

---

### ✅ **Passo 13: Cancelar Solicitação**

**Pasta:** 4. Solicitações

1. **Cancelar Solicitação**
   - Status: `200 OK`
   - Cliente cancela solicitação
   - Status muda para "cancelada"

---

### ✅ **Passo 14: Gerenciar Conta**

**Pasta:** 8. Usuários

1. **Update Profile (Email/Senha)**

   - Status: `200 OK`
   - Atualiza email ou senha do usuário
   - Requer senha atual

2. **Delete Account**
   - Status: `200 OK`
   - Soft delete da conta
   - Requer confirmação: `"EXCLUIR"`
   - Requer senha

---

### ✅ **Passo 15: Logout**

**Pasta:** 1. Autenticação

1. **Logout**
   - Status: `200 OK`
   - Registra logout para auditoria
   - **JWT stateless**: Token deve ser removido no cliente

---

## 🧪 Testes Automatizados

Cada request tem **testes automáticos** configurados:

### ✅ Validações Comuns:

- Status code correto
- Response com `success: true`
- Dados obrigatórios presentes
- Tokens salvos automaticamente

### 📊 Ver Resultados:

1. Após executar request, clicar na aba **Test Results**
2. **Verde** = passou ✅
3. **Vermelho** = falhou ❌

### 🏃 Rodar Toda Coleção:

1. Clicar na coleção (nome principal)
2. Clicar em **Run**
3. Selecionar todos os requests
4. Clicar em **Run PeçaJá Backend**
5. Ver relatório completo

---

## 🔑 Variáveis de Ambiente

### Variáveis Principais:

| Variável         | Descrição         | Valor Padrão            |
| ---------------- | ----------------- | ----------------------- |
| `base_url`       | URL da API        | `http://localhost:5000` |
| `cliente_email`  | Email do cliente  | `cliente@teste.com`     |
| `cliente_senha`  | Senha do cliente  | `senha123`              |
| `cliente_token`  | JWT do cliente    | _(auto)_                |
| `autopeca_email` | Email da autopeça | `autopeca@teste.com`    |
| `autopeca_senha` | Senha da autopeça | `senha123`              |
| `autopeca_token` | JWT da autopeça   | _(auto)_                |
| `solicitacao_id` | ID da solicitação | _(auto)_                |
| `vendedor_id`    | ID do vendedor    | _(auto)_                |
| `notificacao_id` | ID da notificação | _(auto)_                |

### 🔄 Variáveis Automáticas:

Tokens e IDs são salvos **automaticamente** após:

- Login → `cliente_token`, `autopeca_token`
- Criar Solicitação → `solicitacao_id`
- Criar Vendedor → `vendedor_id`

---

## 🐛 Troubleshooting

### ❌ Erro: Cannot POST /api/...

**Causa:** Backend não está rodando  
**Solução:**

```bash
cd backend
npm run dev
```

---

### ❌ Erro: 401 Unauthorized

**Causa:** Token inválido ou expirado  
**Solução:**

1. Fazer login novamente
2. Token será atualizado automaticamente

---

### ❌ Erro: 409 Conflict (Email já existe)

**Causa:** Usuário já cadastrado  
**Solução:**

1. Mudar emails no environment OU
2. Fazer login com usuários existentes OU
3. Limpar banco de dados e recriar

---

### ❌ Erro: 403 Forbidden (Tipo de usuário)

**Causa:** Endpoint requer tipo específico  
**Solução:**

- Usar token correto (cliente vs autopeça)
- Exemplo: Criar vendedor requer `autopeca_token`

---

### ❌ Erro: 404 Not Found

**Causa:** ID não existe  
**Solução:**

1. Verificar se `solicitacao_id` está setado
2. Criar solicitação antes de tentar acessá-la

---

### ❌ Erro: Connection Refused

**Causa:** Banco de dados não está rodando  
**Solução:**

```bash
# Se usando Docker:
docker-compose up -d

# Se local:
# Verificar PostgreSQL está rodando
```

---

## 📊 Cenários de Teste Completos

### 🎭 Cenário 1: Fluxo Cliente Completo

1. ✅ Health Check
2. ✅ Registrar Cliente
3. ✅ Login Cliente
4. ✅ Get Profile
5. ✅ Update Profile
6. ✅ Criar Solicitação
7. ✅ Listar Solicitações
8. ✅ Buscar Solicitação
9. ✅ Atualizar Solicitação
10. ✅ Listar Notificações
11. ✅ Cancelar Solicitação

**Tempo estimado:** 5 minutos

---

### 🎭 Cenário 2: Fluxo Autopeça Completo

1. ✅ Health Check
2. ✅ Registrar Autopeça
3. ✅ Login Autopeça
4. ✅ Get Profile
5. ✅ Update Profile
6. ✅ Listar Solicitações Disponíveis
7. ✅ Criar Vendedor
8. ✅ Listar Vendedores
9. ✅ Atender Solicitação (gera WhatsApp)
10. ✅ Vehicle Stats

**Tempo estimado:** 5 minutos

---

### 🎭 Cenário 3: Fluxo Completo Integrado

1. Cliente cria solicitação → Notificação gerada
2. Autopeça lista solicitações → Vê nova solicitação
3. Autopeça atende → Cliente recebe notificação
4. Cliente marca notificação como lida
5. Cliente vê lista atualizada

**Tempo estimado:** 8 minutos

---

## 📝 Checklist de Testes

Antes de iniciar o frontend, certifique-se:

### ✅ Autenticação

- [ ] Registro de cliente funciona
- [ ] Registro de autopeça funciona
- [ ] Login retorna token válido
- [ ] Token é aceito nas rotas protegidas
- [ ] Logout funciona

### ✅ Perfis

- [ ] Cliente pode ver/editar perfil
- [ ] Autopeça pode ver/editar perfil
- [ ] Validações de campos funcionam

### ✅ Solicitações

- [ ] Cliente pode criar solicitação
- [ ] Upload de imagens funciona
- [ ] Cliente pode listar suas solicitações
- [ ] Cliente pode editar solicitação ativa
- [ ] Cliente pode cancelar solicitação

### ✅ Autopeça

- [ ] Vê apenas solicitações da mesma cidade
- [ ] Pode marcar como atendida
- [ ] Link WhatsApp é gerado corretamente

### ✅ Vendedores

- [ ] Autopeça pode criar vendedor
- [ ] Autopeça pode listar vendedores
- [ ] Autopeça pode editar vendedor
- [ ] Autopeça pode inativar vendedor

### ✅ Notificações

- [ ] Notificações são criadas automaticamente
- [ ] Contador de não lidas funciona
- [ ] Marcar como lida funciona
- [ ] Deletar funciona

### ✅ API Veicular

- [ ] Health check funciona
- [ ] Consulta por placa funciona (se API key configurada)
- [ ] Cache funciona (segunda consulta é mais rápida)

### ✅ Segurança

- [ ] Rate limiting funciona (muitas requests = 429)
- [ ] Rotas protegidas requerem autenticação
- [ ] Usuários só acessam seus próprios dados

---

## 🚀 Próximos Passos

Após validar todos os testes:

1. **Documentar bugs encontrados**
2. **Corrigir problemas identificados**
3. **Iniciar desenvolvimento do frontend**
4. **Integrar frontend com backend**
5. **Testes E2E completos**

---

## 📞 Suporte

### Documentação Adicional:

- **Análise Completa:** `docs/ANALISE-SISTEMA.md`
- **API Reference:** `docs/API-REFERENCE-FRONTEND.md`
- **Endpoints:** `docs/ENDPOINTS-COMPLETOS.md`
- **Notificações:** `docs/SISTEMA-NOTIFICACOES.md`

### Problemas Comuns:

- Verificar `.env` configurado corretamente
- Verificar banco de dados rodando
- Verificar migrations executadas
- Verificar porta 5000 disponível

---

**Boa sorte com os testes! 🚀**

**Sistema PeçaJá Backend v1.0.0 - MVP Completo** ✅
