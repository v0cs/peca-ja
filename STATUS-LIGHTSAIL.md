# 🚀 STATUS PARA AWS LIGHTSAIL - PeçaJá

**Data da Análise:** 2025-01-20  
**Plataforma Alvo:** AWS Lightsail  
**Objetivo:** Deploy completo em produção

---

## 📋 SOBRE AWS LIGHTSAIL

### O que é Lightsail?
- Serviço simplificado da AWS com preço fixo
- Ideal para aplicações pequenas/médias
- Inclui: instâncias, banco de dados, load balancer, snapshots
- Mais simples que EC2/ECS, mas com menos flexibilidade

### Arquitetura Recomendada no Lightsail

```
┌─────────────────────────────────────────┐
│  Lightsail Container Service            │
│  ┌──────────────┐  ┌──────────────┐    │
│  │  Frontend    │  │   Backend    │    │
│  │  (Container) │  │  (Container) │    │
│  └──────────────┘  └──────────────┘    │
│         │                  │            │
│         └────────┬─────────┘            │
│                  │                       │
│         ┌────────▼─────────┐            │
│         │  Load Balancer   │            │
│         └────────┬─────────┘            │
└──────────────────┼───────────────────────┘
                   │
         ┌─────────▼─────────┐
         │  Lightsail DB     │
         │  (PostgreSQL)     │
         └───────────────────┘
```

**OU**

```
┌─────────────────────────────────────────┐
│  Lightsail Instance (Ubuntu)            │
│  ┌──────────────────────────────────┐  │
│  │  Docker + docker-compose         │  │
│  │  - Frontend (nginx)              │  │
│  │  - Backend (Node.js)             │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
         │
         │ (conecta via rede privada)
         │
┌────────▼─────────┐
│  Lightsail DB    │
│  (PostgreSQL)    │
└──────────────────┘
```

---

## 🚨 PROBLEMAS CRÍTICOS (Bloqueiam Deploy)

### 1. **Backend Dockerfile - Modo Desenvolvimento**

**PROBLEMA ATUAL:**
```dockerfile
CMD ["npm", "run", "dev"]  # ❌ Nodemon em produção
```

**CORREÇÃO NECESSÁRIA:**
```dockerfile
CMD ["npm", "start"]  # ✅ Node.js em produção
```

**IMPACTO:** Nodemon consome mais recursos e não é necessário em produção.

---

### 2. **Frontend Dockerfile - Dev Server**

**PROBLEMA ATUAL:**
```dockerfile
CMD ["npm", "start"]  # ❌ Vite dev server
```

**CORREÇÃO NECESSÁRIA:**
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**IMPACTO:** Vite dev server não é para produção. Precisa build estático + nginx.

---

### 3. **Docker Compose - Volumes de Desenvolvimento**

**PROBLEMA ATUAL:**
```yaml
volumes:
  - ./backend:/app  # ❌ Monta código local
  - ./frontend:/app  # ❌ Monta código local
```

**CORREÇÃO NECESSÁRIA:**
Criar `docker-compose.prod.yml` sem volumes (usa imagens buildadas).

**IMPACTO:** Em produção não deve montar código do host.

---

### 4. **Frontend - URLs Hardcoded**

**PROBLEMAS:**
- `frontend/src/services/api.js`: fallback `http://localhost:3001/api`
- `frontend/src/pages/Login.jsx`: fallback `http://localhost:3001/api`
- `frontend/src/pages/Registro.jsx`: fallback `http://localhost:3001/api`
- `frontend/src/pages/EditarSolicitacao.jsx`: fallback `http://localhost:3001`
- `frontend/src/components/solicitacoes/ImageGallery.jsx`: fallback `http://localhost:3001/api`

**CORREÇÃO NECESSÁRIA:**
- Garantir que `VITE_API_URL` seja obrigatória no build
- Remover ou tornar fallbacks mais explícitos

**IMPACTO:** Se `VITE_API_URL` não estiver definida, usará localhost e falhará.

---

### 5. **Migrations Não Executadas Automaticamente**

**PROBLEMA:**
- Não há script que execute migrations no startup
- Dockerfile não executa `npm run db:migrate`

**CORREÇÃO NECESSÁRIA:**
Criar `entrypoint.sh` no backend:
```bash
#!/bin/sh
echo "🔄 Executando migrations..."
npm run db:migrate
echo "✅ Migrations concluídas"
echo "🚀 Iniciando servidor..."
exec npm start
```

**IMPACTO:** Banco pode não estar atualizado em produção.

---

### 6. **AWS_REGION Não Validado**

**PROBLEMA:**
- `env.js` valida outras variáveis AWS, mas não `AWS_REGION`

**CORREÇÃO NECESSÁRIA:**
Adicionar validação em `backend/src/config/env.js`:
```javascript
if (!process.env.AWS_REGION) {
  errors.push("❌ AWS_REGION: Variável obrigatória para S3!");
}
```

---

## ⚠️ PROBLEMAS IMPORTANTES

### 7. **Docker Compose - Configuração de Dev**

**PROBLEMA:**
```yaml
environment:
  REACT_APP_API_URL: http://localhost:3001  # ❌ Hardcoded
```

**CORREÇÃO:** Remover (frontend usa build-time vars via Dockerfile ARG).

---

### 8. **Health Checks Ausentes**

**PROBLEMA:**
- Backend tem endpoint `/health`, mas docker-compose não define healthcheck

**CORREÇÃO:**
```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

---

### 9. **Backend Serve /uploads Localmente**

**PROBLEMA:**
```javascript
app.use("/uploads", express.static(uploadsDir));
```

**CORREÇÃO:**
Condicionar apenas se não usar S3:
```javascript
if (!config.isProduction || !config.AWS_S3_BUCKET_NAME) {
  app.use("/uploads", express.static(uploadsDir));
}
```

---

### 10. **Falta Nginx Config para Frontend**

**PROBLEMA:**
- Frontend precisa de nginx.conf para SPA

**CORREÇÃO NECESSÁRIA:**
Criar `frontend/nginx.conf`:
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📋 CHECKLIST COMPLETO PARA LIGHTSAIL

### 🔴 CRÍTICOS (Fazer Primeiro)

- [ ] **1.1** Corrigir `backend/Dockerfile` → `CMD ["npm", "start"]`
- [ ] **1.2** Criar `frontend/Dockerfile` multi-stage (build + nginx)
- [ ] **1.3** Criar `frontend/nginx.conf` para SPA
- [ ] **1.4** Criar `docker-compose.prod.yml` sem volumes de dev
- [ ] **1.5** Criar `backend/entrypoint.sh` para executar migrations
- [ ] **1.6** Adicionar validação de `AWS_REGION` em `env.js`
- [ ] **1.7** Garantir `VITE_API_URL` obrigatória no build do frontend

### 🟡 IMPORTANTES (Fazer Depois)

- [ ] **2.1** Adicionar health checks no `docker-compose.prod.yml`
- [ ] **2.2** Condicionar servir `/uploads` apenas se não usar S3
- [ ] **2.3** Criar `.env.example` com todas as variáveis
- [ ] **2.4** Configurar logging adequado (winston/pino)
- [ ] **2.5** Adicionar script de inicialização robusto

### 🟢 RECOMENDADOS (Melhorias)

- [ ] **3.1** Otimizar Dockerfiles (multi-stage, .dockerignore)
- [ ] **3.2** Configurar SSL/HTTPS (Lightsail Load Balancer)
- [ ] **3.3** Configurar snapshots automáticos do banco
- [ ] **3.4** Adicionar monitoring básico (CloudWatch)
- [ ] **3.5** Criar script de deploy automatizado

---

## 🏗️ ARQUITETURA LIGHTSAIL RECOMENDADA

### Opção 1: Lightsail Containers (Recomendado)

**Vantagens:**
- Gerenciado pela AWS
- Auto-scaling básico
- Load balancer incluído
- Mais simples de gerenciar

**Estrutura:**
```
Lightsail Container Service ($10-40/mês)
├── Frontend Container
│   ├── Port: 80
│   └── Health: /health
├── Backend Container
│   ├── Port: 3001
│   └── Health: /health
└── Load Balancer
    ├── SSL/TLS (via ACM)
    └── Roteamento: /api/* → backend, /* → frontend

Lightsail Database ($15-60/mês)
└── PostgreSQL 15
    ├── Backup automático
    └── Snapshots

S3 Bucket ($5-10/mês)
└── Uploads de imagens
```

**Custo Estimado:** $30-110/mês

---

### Opção 2: Lightsail Instance + Docker (Mais Econômico)

**Vantagens:**
- Mais barato ($3.50-20/mês)
- Controle total
- Pode rodar tudo em uma instância

**Estrutura:**
```
Lightsail Instance ($10-20/mês)
└── Ubuntu 22.04
    ├── Docker + docker-compose
    ├── Frontend (nginx:80)
    ├── Backend (Node.js:3001)
    └── Nginx Reverse Proxy
        └── SSL/TLS (Let's Encrypt)

Lightsail Database ($15-60/mês)
└── PostgreSQL 15

S3 Bucket ($5-10/mês)
└── Uploads
```

**Custo Estimado:** $30-90/mês

---

## 🔧 CONFIGURAÇÕES NECESSÁRIAS

### 1. Backend Dockerfile (Produção)

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar apenas arquivos necessários
COPY package*.json ./
RUN npm ci --only=production

# Copiar código
COPY . .

# Criar diretório de uploads (caso não use S3)
RUN mkdir -p uploads

# Script de entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3001

# Usar entrypoint para migrations
ENTRYPOINT ["/entrypoint.sh"]
```

---

### 2. Frontend Dockerfile (Produção)

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build-time variable
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

### 3. docker-compose.prod.yml

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DB_HOST: ${DB_HOST}
      DB_PORT: ${DB_PORT:-5432}
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      AWS_REGION: ${AWS_REGION}
      AWS_S3_BUCKET_NAME: ${AWS_S3_BUCKET_NAME}
      RESEND_API_KEY: ${RESEND_API_KEY}
      EMAIL_FROM: ${EMAIL_FROM}
      DOMAIN: ${DOMAIN}
      FRONTEND_URL: ${FRONTEND_URL}
      API_URL: ${API_URL}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      GOOGLE_CALLBACK_URL: ${GOOGLE_CALLBACK_URL}
      API_VEICULAR_KEY: ${API_VEICULAR_KEY}
      API_VEICULAR_EMAIL: ${API_VEICULAR_EMAIL}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: ${VITE_API_URL}
    ports:
      - "80:80"
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

### 4. backend/entrypoint.sh

```bash
#!/bin/sh
set -e

echo "🔄 Aguardando banco de dados..."
until nc -z ${DB_HOST:-postgres} ${DB_PORT:-5432}; do
  echo "⏳ Banco não está pronto, aguardando..."
  sleep 2
done

echo "✅ Banco de dados conectado!"

echo "🔄 Executando migrations..."
npm run db:migrate || {
  echo "⚠️  Aviso: Erro ao executar migrations (pode ser normal se já executadas)"
}

echo "✅ Migrations concluídas"
echo "🚀 Iniciando servidor Node.js..."
exec npm start
```

---

### 5. frontend/nginx.conf

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy (se necessário)
    location /api {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

---

## 📝 VARIÁVEIS DE AMBIENTE PARA LIGHTSAIL

### Backend (.env na instância)

```env
NODE_ENV=production
PORT=3001

# Database (Lightsail Database)
DB_HOST=<lightsail-db-endpoint>
DB_PORT=5432
DB_NAME=pecaja
DB_USER=postgres
DB_PASSWORD=<senha-forte>

# JWT
JWT_SECRET=<gerar-com-openssl-rand-base64-64>
JWT_EXPIRES_IN=24h

# AWS S3
AWS_ACCESS_KEY_ID=<iam-user-access-key>
AWS_SECRET_ACCESS_KEY=<iam-user-secret-key>
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=<nome-do-bucket>

# Domínio e URLs
DOMAIN=pecaja.cloud
FRONTEND_URL=https://pecaja.cloud
API_URL=https://api.pecaja.cloud
BASE_URL=https://pecaja.cloud

# Email (Resend)
RESEND_API_KEY=<resend-api-key>
EMAIL_FROM=PeçaJá <contato@pecaja.cloud>

# Google OAuth
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_CALLBACK_URL=https://api.pecaja.cloud/auth/google/callback

# API Veicular
API_VEICULAR_KEY=<api-key>
API_VEICULAR_EMAIL=<email>
```

### Frontend (Build-time)

```env
VITE_API_URL=https://api.pecaja.cloud/api
```

---

## 🚀 PASSOS PARA DEPLOY NO LIGHTSAIL

### Preparação Local

1. **Corrigir Dockerfiles**
   ```bash
   # Backend: CMD ["npm", "start"]
   # Frontend: Multi-stage build
   ```

2. **Criar arquivos de produção**
   ```bash
   # docker-compose.prod.yml
   # backend/entrypoint.sh
   # frontend/nginx.conf
   ```

3. **Testar build localmente**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   docker-compose -f docker-compose.prod.yml up
   ```

### Setup Lightsail

4. **Criar Lightsail Database**
   - Tipo: PostgreSQL 15
   - Plano: $15-60/mês (conforme necessidade)
   - Habilitar backup automático
   - Anotar endpoint e credenciais

5. **Criar S3 Bucket**
   - Nome: `pecaja-uploads-<regiao>`
   - Região: mesma do Lightsail
   - Política pública de leitura (ou CloudFront)
   - Criar IAM User com permissões S3

6. **Criar Lightsail Instance OU Container Service**

   **Opção A: Container Service**
   - Criar container service
   - Fazer push das imagens Docker
   - Configurar load balancer
   - Configurar SSL/TLS

   **Opção B: Instance**
   - Criar instância Ubuntu 22.04 ($10-20/mês)
   - Instalar Docker + docker-compose
   - Clonar repositório
   - Configurar .env
   - Executar docker-compose.prod.yml

7. **Configurar DNS (se tiver domínio)**
   - Route 53 ou DNS do domínio
   - A/AAAA records apontando para Lightsail

8. **Configurar SSL/TLS**
   - Lightsail Load Balancer (se usar containers)
   - Let's Encrypt (se usar instance)

9. **Executar Migrations**
   ```bash
   # Se usar instance:
   docker-compose -f docker-compose.prod.yml exec backend npm run db:migrate
   ```

10. **Validar Deploy**
    - Testar health checks
    - Testar uploads S3
    - Testar autenticação
    - Testar integrações

---

## 📊 RESUMO EXECUTIVO

### Status Atual: ⚠️ **NÃO PRONTO PARA LIGHTSAIL**

**BLOQUEADORES CRÍTICOS:**
1. ❌ Backend Dockerfile usa `npm run dev`
2. ❌ Frontend Dockerfile usa dev server
3. ❌ Sem docker-compose.prod.yml
4. ❌ Migrations não executam automaticamente
5. ❌ URLs hardcoded para localhost
6. ❌ AWS_REGION não validado

**TEMPO ESTIMADO PARA CORREÇÕES:** 6-8 horas

**PRIORIDADES:**
1. 🔴 **CRÍTICO:** Dockerfiles e build do frontend (4h)
2. 🟡 **IMPORTANTE:** docker-compose.prod.yml e migrations (2h)
3. 🟢 **RECOMENDADO:** Health checks e nginx (2h)

---

## 💰 CUSTOS ESTIMADOS LIGHTSAIL

### Opção 1: Container Service
- Container Service: $10-40/mês
- Database: $15-60/mês
- S3: $5-10/mês
- **Total: $30-110/mês**

### Opção 2: Instance + Docker
- Instance: $10-20/mês
- Database: $15-60/mês
- S3: $5-10/mês
- **Total: $30-90/mês**

---

## ✅ PRÓXIMOS PASSOS

1. **Corrigir Dockerfiles** (backend e frontend)
2. **Criar docker-compose.prod.yml**
3. **Criar entrypoint.sh e nginx.conf**
4. **Testar build localmente**
5. **Criar recursos no Lightsail**
6. **Fazer deploy**
7. **Validar funcionamento**

---

**Status:** Aguardando correções críticas para iniciar deploy.

