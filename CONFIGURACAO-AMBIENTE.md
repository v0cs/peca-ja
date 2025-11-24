# 🔐 Guia de Configuração de Ambiente - PeçaJá

Este documento descreve onde e como configurar todas as variáveis de ambiente necessárias para o projeto.

## 📋 Índice

1. [Arquivo .env (Backend)](#arquivo-env-backend)
2. [Arquivo .env (Frontend)](#arquivo-env-frontend)
3. [GitHub Secrets (CI/CD)](#github-secrets-cicd)
4. [Validação de Variáveis Críticas](#validação-de-variáveis-críticas)

---

## 📁 Arquivo .env (Backend)

**Localização:** Raiz do projeto (`/pecaja/.env`) ou `/backend/.env`

### ⚠️ Variáveis OBRIGATÓRIAS em Produção

```bash
# ============================================
# AMBIENTE
# ============================================
NODE_ENV=production
PORT=3001

# ============================================
# BANCO DE DADOS (PostgreSQL)
# ============================================
DB_HOST=localhost              # ou o host do seu banco
DB_PORT=5432
DB_NAME=pecaja
DB_USER=postgres
DB_PASSWORD=SUA_SENHA_SEGURA_AQUI  # ⚠️ ALTERE OBRIGATORIAMENTE!

# ============================================
# JWT (JSON Web Token)
# ============================================
# ⚠️ CRÍTICO: Gere uma chave segura!
# Use um dos comandos abaixo:
#   openssl rand -base64 64
#   node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
JWT_SECRET=SUA_CHAVE_JWT_SEGURA_AQUI  # ⚠️ ALTERE OBRIGATORIAMENTE!
JWT_EXPIRES_IN=24h

# ============================================
# GOOGLE OAUTH 2.0
# ============================================
# Obtenha em: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=seu-client-id-aqui
GOOGLE_CLIENT_SECRET=seu-client-secret-aqui
# Callback URL será gerada automaticamente baseada no ambiente

# ============================================
# EMAIL (Resend)
# ============================================
# Obtenha em: https://resend.com/api-keys
RESEND_API_KEY=re_sua-chave-api-aqui
# Formato: "Nome <email@dominio.com>"
# Deve usar domínio verificado no Resend
EMAIL_FROM=PeçaJá <noreply@pecaja.cloud>

# ============================================
# API VEICULAR (Consultar Placa)
# ============================================
# Obtenha em: https://consultarplaca.com.br/
API_VEICULAR_KEY=sua-chave-api-aqui
API_VEICULAR_EMAIL=seu-email@exemplo.com
```

### 📝 Variáveis Opcionais

```bash
# URLs e Domínios (Produção)
DOMAIN=pecaja.cloud
BASE_URL=https://pecaja.cloud
FRONTEND_URL=https://pecaja.cloud
API_URL=https://api.pecaja.cloud

# Upload de Arquivos
MAX_FILE_SIZE=10485760  # 10MB em bytes
UPLOAD_PATH=./uploads

# Rate Limiting (valores padrão já configurados)
# RATE_LIMIT_WINDOW_MS=900000
# RATE_LIMIT_MAX_REQUESTS=100
# RATE_LIMIT_AUTH_MAX=20
# RATE_LIMIT_API_MAX=500
# RATE_LIMIT_UPLOAD_MAX=20
# RATE_LIMIT_SOLICITATION_MAX=20
# RATE_LIMIT_VENDEDOR_MAX=10
```

---

## 📁 Arquivo .env (Frontend)

**Localização:** `/frontend/.env`

```bash
# URL da API Backend
# Desenvolvimento:
VITE_API_URL=http://localhost:3001/api

# Produção:
# VITE_API_URL=https://api.pecaja.cloud/api
```

---

## 🔑 GitHub Secrets (CI/CD)

**Localização:** GitHub → Settings → Secrets and variables → Actions

### Secret Obrigatório

| Secret        | Descrição                           | Como Obter                                                                                                                          |
| ------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `SONAR_TOKEN` | Token de autenticação do SonarCloud | 1. Acesse https://sonarcloud.io<br>2. Vá em **My Account → Security**<br>3. Gere um novo token<br>4. Copie e cole no GitHub Secrets |

### Como Configurar

1. Acesse: `https://github.com/SEU_USUARIO/pecaja/settings/secrets/actions`
2. Clique em **New repository secret**
3. Nome: `SONAR_TOKEN`
4. Valor: Cole o token gerado no SonarCloud
5. Clique em **Add secret**

---

## ✅ Validação de Variáveis Críticas

O código valida automaticamente variáveis críticas em produção. Se alguma estiver faltando, o servidor **não iniciará** e mostrará um erro claro.

### Variáveis Validadas em Produção

- ✅ `JWT_SECRET` - Deve ser diferente do valor padrão
- ✅ `DB_PASSWORD` - Deve ser diferente do valor padrão
- ✅ `RESEND_API_KEY` - Deve estar configurado
- ⚠️ `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` - Opcionais (OAuth desabilitado se não configurado)

---

## 🚀 Como Gerar Valores Seguros

### JWT_SECRET

```bash
# Opção 1: OpenSSL
openssl rand -base64 64

# Opção 2: Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Opção 3: Online (use apenas se confiar no serviço)
# https://randomkeygen.com/
```

### DB_PASSWORD

```bash
# Gere uma senha forte com:
openssl rand -base64 32

# Ou use um gerenciador de senhas como:
# - 1Password
# - LastPass
# - Bitwarden
```

---

## 📝 Checklist de Configuração

### Desenvolvimento

- [ ] Criar `.env` na raiz do projeto
- [ ] Configurar `DB_PASSWORD` (pode usar valor padrão para dev)
- [ ] Configurar `JWT_SECRET` (pode usar valor padrão para dev)
- [ ] Configurar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` (opcional)
- [ ] Configurar `RESEND_API_KEY` (opcional para dev)
- [ ] Criar `frontend/.env` com `VITE_API_URL`

### Produção

- [ ] ✅ **OBRIGATÓRIO:** Alterar `DB_PASSWORD` para senha forte
- [ ] ✅ **OBRIGATÓRIO:** Gerar e configurar `JWT_SECRET` seguro
- [ ] ✅ **OBRIGATÓRIO:** Configurar `RESEND_API_KEY` válido
- [ ] ✅ **OBRIGATÓRIO:** Configurar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`
- [ ] Configurar `DOMAIN`, `BASE_URL`, `FRONTEND_URL`, `API_URL`
- [ ] Configurar `EMAIL_FROM` com domínio verificado no Resend
- [ ] Configurar `API_VEICULAR_KEY` e `API_VEICULAR_EMAIL`
- [ ] Configurar `SONAR_TOKEN` no GitHub Secrets

---

## 🔒 Segurança

### ⚠️ NUNCA faça:

- ❌ Commitar arquivo `.env` no Git
- ❌ Compartilhar `.env` por email/mensagem
- ❌ Usar valores padrão em produção
- ❌ Expor secrets em logs ou console.log

### ✅ SEMPRE faça:

- ✅ Adicionar `.env` ao `.gitignore` (já está configurado)
- ✅ Usar valores diferentes para dev/staging/prod
- ✅ Rotacionar secrets periodicamente
- ✅ Usar variáveis de ambiente do servidor em produção

---

## 📚 Links Úteis

- **Google OAuth:** https://console.cloud.google.com/apis/credentials
- **Resend API:** https://resend.com/api-keys
- **Consultar Placa:** https://consultarplaca.com.br/
- **SonarCloud:** https://sonarcloud.io

---

## 🆘 Problemas Comuns

### "Arquivo .env não encontrado"

- Verifique se o arquivo está na raiz do projeto ou em `/backend/`
- Certifique-se de que o arquivo se chama exatamente `.env` (sem extensão)

### "JWT_SECRET não configurado"

- Em produção, o servidor não iniciará se usar o valor padrão
- Gere uma nova chave usando os comandos acima

### "SONAR_TOKEN inválido"

- Verifique se o token está configurado no GitHub Secrets
- Gere um novo token no SonarCloud se necessário

---

**Última atualização:** Janeiro 2025

