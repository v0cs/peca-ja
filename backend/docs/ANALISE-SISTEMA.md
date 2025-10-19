# 📊 Análise Completa do Sistema PeçaJá Backend

**Data:** 19 de Outubro de 2025  
**Versão:** 1.0.0 MVP  
**Status:** ✅ Pronto para Testes

---

## 🏗️ Arquitetura Geral

### Stack Tecnológica

- **Runtime:** Node.js v20+
- **Framework:** Express.js v5
- **Banco de Dados:** PostgreSQL
- **ORM:** Sequelize v6
- **Autenticação:** JWT (jsonwebtoken)
- **Hash de Senhas:** bcryptjs
- **Upload de Arquivos:** Multer
- **Cache:** node-cache
- **Circuit Breaker:** Opossum
- **Rate Limiting:** express-rate-limit
- **Segurança:** Helmet
- **Validação:** Zod
- **Testes:** Jest + Supertest

### Estrutura de Pastas

```
backend/
├── src/
│   ├── config/          # Configurações (DB, env)
│   ├── controllers/     # 10 controllers (lógica de negócio)
│   ├── middleware/      # Auth, upload, consulta veicular
│   ├── models/          # 12 models Sequelize
│   ├── routes/          # 10 arquivos de rotas
│   ├── services/        # API veicular, email, notificações
│   └── migrations/      # 7 migrations
├── docs/                # Documentação completa
├── tests/               # Testes unitários e integração
└── server.js            # Entry point
```

---

## 📡 Endpoints Implementados

### **Total: 45+ endpoints organizados em 9 módulos**

### 1️⃣ **Autenticação** (`/api/auth`)

- ✅ POST `/register` - Cadastro de cliente
- ✅ POST `/register-autopeca` - Cadastro de autopeça
- ✅ POST `/login` - Login
- ✅ POST `/logout` - Logout (JWT stateless)
- ✅ POST `/forgot-password` - Solicitar recuperação de senha
- ✅ POST `/reset-password` - Redefinir senha com token
- ✅ GET `/me` - Dados do usuário logado

### 2️⃣ **Clientes** (`/api/clientes`)

- ✅ GET `/profile` - Buscar perfil do cliente
- ✅ PUT `/profile` - Editar perfil do cliente

### 3️⃣ **Autopeças** (`/api/autopecas`)

- ✅ GET `/profile` - Buscar perfil da autopeça
- ✅ PUT `/profile` - Editar perfil da autopeça
- ✅ GET `/solicitacoes-disponiveis` - Listar solicitações na mesma cidade
- ✅ POST `/solicitacoes/:id/atender` - Marcar solicitação como atendida

### 4️⃣ **Vendedores** (`/api/vendedores`)

- ✅ POST `/` - Criar vendedor (apenas autopeça)
- ✅ GET `/` - Listar vendedores da autopeça
- ✅ PUT `/:vendedorId` - Atualizar vendedor
- ✅ DELETE `/:vendedorId` - Inativar vendedor

### 5️⃣ **Operações de Vendedor** (`/api/vendedor`)

- ✅ GET `/dashboard` - Dashboard do vendedor
- ✅ GET `/solicitacoes-disponiveis` - Solicitações não atendidas
- ✅ POST `/solicitacoes/:id/atender` - Atender solicitação

### 6️⃣ **Solicitações** (`/api/solicitacoes`)

- ✅ POST `/` - Criar solicitação com upload de imagens
- ✅ POST `/:id/imagens` - Adicionar imagens a solicitação existente
- ✅ GET `/` - Listar solicitações do cliente
- ✅ GET `/:id` - Buscar solicitação por ID
- ✅ PUT `/:id` - Editar solicitação
- ✅ DELETE `/:id` - Cancelar solicitação

### 7️⃣ **Consulta Veicular** (`/api/vehicle`)

- ✅ GET `/consulta/:placa` - Consultar dados do veículo
- ✅ GET `/stats` - Estatísticas do cache
- ✅ DELETE `/cache` - Limpar cache
- ✅ GET `/health` - Health check da API
- ✅ GET `/circuit-breaker/status` - Status do circuit breaker
- ✅ POST `/circuit-breaker/open` - Forçar abertura
- ✅ POST `/circuit-breaker/close` - Forçar fechamento
- ✅ DELETE `/circuit-breaker/metrics` - Resetar métricas
- ✅ GET `/docs` - Documentação da API veicular

### 8️⃣ **Notificações** (`/api/notificacoes`)

- ✅ GET `/` - Listar notificações (paginação + filtros)
- ✅ GET `/nao-lidas/contagem` - Contar não lidas
- ✅ GET `/:id` - Buscar notificação específica
- ✅ PUT `/:id/ler` - Marcar como lida
- ✅ PUT `/ler-todas` - Marcar todas como lidas
- ✅ DELETE `/:id` - Deletar notificação
- ✅ DELETE `/lidas` - Deletar todas as lidas

### 9️⃣ **Usuários** (`/api/usuarios`)

- ✅ PUT `/profile` - Editar email/senha
- ✅ DELETE `/profile` - Excluir conta (soft delete)

### 🏥 **Health Check** (`/api/health`)

- ✅ GET `/health` - Status da API

---

## 🔐 Sistema de Autenticação

### JWT (JSON Web Token)

- **Tipo:** Bearer Token
- **Header:** `Authorization: Bearer <token>`
- **Expiração:** Configurável via `JWT_EXPIRES_IN`
- **Secret:** Configurável via `JWT_SECRET`

### Tipos de Usuário

1. **Cliente** - Cria solicitações
2. **Autopeça** - Visualiza e atende solicitações, gerencia vendedores
3. **Vendedor** - Atende solicitações em nome da autopeça

### Middleware de Autenticação

- `authMiddleware` - Valida JWT em todas as rotas protegidas
- Adiciona `req.user` com `userId` e `tipo`
- Retorna 401 se token inválido/expirado

---

## 📊 Modelos de Dados

### 12 Models Implementados

1. **Usuario** - Base para todos os usuários
2. **Cliente** - Proprietários de veículos/oficinas
3. **Autopeca** - Estabelecimentos comerciais
4. **Vendedor** - Funcionários das autopeças
5. **Solicitacao** - Pedidos de orçamento
6. **ImagemSolicitacao** - Imagens das solicitações (max 3)
7. **SolicitacoesAtendimento** - Controle de atendimentos
8. **Notificacao** - Notificações in-app
9. **HistoricoSolicitacao** - Auditoria de alterações
10. **LogAuditoria** - Logs de sistema
11. **TokenRecuperacaoSenha** - Tokens de reset de senha
12. **Vendedor** - Dados dos vendedores

### Relacionamentos Principais

```
Usuario 1:1 (Cliente | Autopeca)
Usuario 1:N Vendedor
Cliente 1:N Solicitacao
Solicitacao 1:N ImagemSolicitacao
Solicitacao N:M Autopeca (via SolicitacoesAtendimento)
Usuario 1:N Notificacao
```

---

## 🛡️ Segurança Implementada

### Rate Limiting

- **Consultas Veiculares:** 10 req/min por IP
- **Operações Admin:** 5 req/min por IP
- **Headers:** `RateLimit-*` para informar limites

### Validações

- ✅ Email único no sistema
- ✅ CNPJ válido para autopeças
- ✅ CEP com 8 dígitos
- ✅ UF brasileiras (27 estados)
- ✅ Telefone formato brasileiro
- ✅ Senha mínima 6 caracteres
- ✅ Hash bcrypt com 12 rounds

### CORS

- Configurado para aceitar origens do frontend
- Headers permitidos para JWT

### Helmet

- Headers de segurança HTTP
- Proteção contra XSS, clickjacking, etc.

---

## 🚗 Integração API Veicular

### Serviço: consultarplaca.com.br

- **Cache:** 24 horas por placa
- **Circuit Breaker:** Proteção contra falhas
- **Fallback:** Dados manuais se API falhar
- **Validação:** Formato Mercosul e antigo
- **Mapeamento:** Marca/categoria automático

### Dados Retornados

- Marca, Modelo, Ano Fab/Modelo
- Categoria (carro, moto, caminhão)
- Cor, Chassi, Renavam
- `origem_dados_veiculo`: "api" ou "manual"

---

## 📧 Sistema de Notificações

### 6 Tipos de Notificação

1. **nova_solicitacao** - Cliente criou solicitação
2. **solicitacao_atendida** - Autopeça/vendedor atendeu
3. **novo_vendedor** - Vendedor cadastrado
4. **vendedor_inativado** - Vendedor desativado
5. **perfil_atualizado** - Dados alterados
6. **senha_alterada** - Senha modificada

### Features

- ✅ Notificações in-app
- ✅ Paginação e filtros
- ✅ Contador de não lidas
- ✅ Marcar como lida (individual/todas)
- ✅ Deletar (individual/todas lidas)

---

## 📁 Upload de Arquivos

### Multer Configuration

- **Pasta:** `uploads/`
- **Limite:** 3 imagens por solicitação
- **Formatos:** jpg, jpeg, png, gif
- **Tamanho Máximo:** Configurável
- **Nomeação:** Timestamp + random + extensão

---

## 🧪 Testes Implementados

### Cobertura Atual

```
Tests:       39 passing
Coverage:    17.63% (em crescimento)
```

### Tipos de Teste

- ✅ Testes Unitários (controllers, middleware)
- ✅ Testes de Integração (API, DB, routes)
- ✅ Testes E2E (fluxos completos)

### Áreas Testadas

- AuthController (15 testes)
- SolicitacaoController (14 testes)
- AuthMiddleware (7 testes)
- API Veicular (5 testes)
- Notificações (integração)

---

## 🚀 Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev              # Nodemon com hot-reload

# Produção
npm start                # Node server.js

# Testes
npm test                 # Rodar todos os testes
npm run test:watch       # Modo watch

# Banco de Dados
npm run db:create        # Criar database
npm run db:migrate       # Rodar migrations
npm run db:migrate:undo  # Reverter última migration
npm run db:seed:all      # Popular com dados
```

---

## ⚙️ Variáveis de Ambiente

### Obrigatórias

```env
# Servidor
PORT=5000
NODE_ENV=development

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pecaja
DB_USER=postgres
DB_PASSWORD=senha

# JWT
JWT_SECRET=sua_chave_secreta
JWT_EXPIRES_IN=7d

# API Veicular
API_VEICULAR_KEY=sua_chave_api

# Email (Resend)
RESEND_API_KEY=sua_chave_resend
```

---

## 📈 Métricas do Sistema

### Performance

- ✅ Cache de consultas veiculares (24h)
- ✅ Rate limiting para proteger APIs
- ✅ Circuit breaker para APIs externas
- ✅ Índices no banco de dados

### Escalabilidade

- ✅ JWT stateless (sem sessão no servidor)
- ✅ Transações de banco otimizadas
- ✅ Paginação em listagens
- ✅ Soft delete (preserva dados)

---

## ✅ Conformidade com Especificação

### RF01-RF20 Implementados

- ✅ Cadastro de usuários (clientes, autopeças)
- ✅ Autenticação JWT
- ✅ Recuperação de senha
- ✅ Criação de solicitações
- ✅ Upload de imagens
- ✅ Integração API veicular
- ✅ Filtro por localização (mesma cidade)
- ✅ Sistema de atendimento
- ✅ Gestão de vendedores
- ✅ Notificações in-app
- ✅ Edição de perfil
- ✅ Exclusão de conta

---

## 🎯 Próximos Passos

### Frontend

1. Implementar páginas com React
2. Integrar com API usando Axios
3. Gerenciar estado com Context API
4. Implementar autenticação
5. Upload de imagens
6. Sistema de notificações real-time

### Backend (Melhorias)

1. Aumentar cobertura de testes para 80%+
2. Implementar WebSockets para notificações real-time
3. Adicionar Google OAuth 2.0
4. Implementar sistema de logs centralizado
5. Adicionar monitoramento (APM)
6. Otimizar queries com eager loading

---

## 📞 Suporte

Para dúvidas sobre a API:

- **Documentação Completa:** `/backend/docs/`
- **API Reference:** `API-REFERENCE-FRONTEND.md`
- **Endpoints:** `ENDPOINTS-COMPLETOS.md`
- **Notificações:** `SISTEMA-NOTIFICACOES.md`

---

**Sistema PeçaJá Backend v1.0.0 - MVP Completo** ✅
