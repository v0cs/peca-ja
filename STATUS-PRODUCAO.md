# 📊 STATUS DE PRODUÇÃO - PeçaJá

**Data da Análise:** 2025-01-20  
**Objetivo:** Deploy na AWS (RDS PostgreSQL, EC2/ECS, S3)

---

## ✅ PONTOS POSITIVOS

### Configurações Corretas
- ✅ **Variáveis de ambiente** bem estruturadas com validação para produção
- ✅ **AWS S3** configurado e funcionando (uploadService.js)
- ✅ **Validação de env vars** obrigatórias em produção (env.js)
- ✅ **CORS** configurado dinamicamente baseado em ambiente
- ✅ **Rate limiting** implementado e configurado
- ✅ **Health check** básico implementado (`/health`)
- ✅ **Migrations** do Sequelize configuradas
- ✅ **Segurança**: Helmet, JWT, bcrypt, validações
- ✅ **Estrutura de banco** bem definida com índices

---

## 🚨 PROBLEMAS CRÍTICOS (Bloqueiam Deploy)

### 1. **Dockerfiles Não Otimizados para Produção**

#### Backend Dockerfile
```dockerfile
# ❌ PROBLEMA: Usa npm run dev (nodemon) em produção
CMD ["npm", "run", "dev"]
```
**IMPACTO:** Nodemon não deve rodar em produção, consome mais recursos e não é necessário.

#### Frontend Dockerfile  
```dockerfile
# ❌ PROBLEMA: Usa npm start (vite dev server) em produção
CMD ["npm", "start"]
```
**IMPACTO:** Vite dev server não é para produção. Precisa fazer build e servir arquivos estáticos.

**SOLUÇÃO NECESSÁRIA:**
- Backend: Mudar para `CMD ["npm", "start"]` (já existe no package.json)
- Frontend: Criar build de produção e servir com nginx ou similar

---

### 2. **Frontend Não Configurado para Build de Produção**

**PROBLEMA:** 
- Frontend usa Vite dev server em produção
- Não há configuração para build estático
- Variável `VITE_API_URL` precisa ser injetada no build

**IMPACTO:** Frontend não funcionará em produção.

**SOLUÇÃO NECESSÁRIA:**
- Criar Dockerfile multi-stage para build
- Configurar nginx ou servidor estático
- Garantir que `VITE_API_URL` seja definida no build

---

### 3. **Docker Compose Configurado para Desenvolvimento**

**PROBLEMA:**
```yaml
volumes:
  - ./backend:/app  # ❌ Monta código local (não para produção)
  - /app/node_modules
```

**IMPACTO:** Em produção não deve montar volumes locais.

**SOLUÇÃO NECESSÁRIA:**
- Criar `docker-compose.prod.yml` ou remover volumes para produção
- Usar imagens buildadas ao invés de montar código

---

### 4. **URLs Hardcoded para Localhost**

**PROBLEMAS ENCONTRADOS:**
- `frontend/src/services/api.js`: fallback `http://localhost:3001/api`
- `frontend/src/pages/Login.jsx`: fallback `http://localhost:3001/api`
- `frontend/src/pages/Registro.jsx`: fallback `http://localhost:3001/api`
- `frontend/src/pages/EditarSolicitacao.jsx`: fallback `http://localhost:3001`
- `frontend/src/components/solicitacoes/ImageGallery.jsx`: fallback `http://localhost:3001/api`

**IMPACTO:** Em produção, se `VITE_API_URL` não estiver definida, usará localhost e falhará.

**SOLUÇÃO NECESSÁRIA:**
- Garantir que `VITE_API_URL` seja obrigatória no build de produção
- Remover fallbacks para localhost ou torná-los mais explícitos

---

### 5. **Migrations Não Executadas Automaticamente**

**PROBLEMA:**
- Não há script de inicialização que execute migrations
- Dockerfile não executa `npm run db:migrate`

**IMPACTO:** Banco pode não estar atualizado em produção.

**SOLUÇÃO NECESSÁRIA:**
- Adicionar script de inicialização no backend
- Executar migrations no startup ou via entrypoint script

---

### 6. **Falta Configuração de AWS_REGION**

**PROBLEMA:**
- `env.js` valida `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`
- Mas `AWS_REGION` não é validado como obrigatório

**IMPACTO:** Pode falhar silenciosamente se região não estiver configurada.

**SOLUÇÃO NECESSÁRIA:**
- Adicionar validação de `AWS_REGION` em produção

---

## ⚠️ PROBLEMAS IMPORTANTES (Devem ser Corrigidos)

### 7. **Docker Compose com Configurações de Dev**

**PROBLEMA:**
```yaml
environment:
  REACT_APP_API_URL: http://localhost:3001  # ❌ Hardcoded localhost
```

**SOLUÇÃO:** Usar variáveis de ambiente ou remover (frontend deve usar build-time vars)

---

### 8. **Falta Health Check no Docker Compose**

**PROBLEMA:**
- Backend tem health check endpoint (`/health`)
- Mas docker-compose não define healthcheck para backend

**SOLUÇÃO:** Adicionar healthcheck no docker-compose

---

### 9. **Backend Serve Arquivos Estáticos Localmente**

**PROBLEMA:**
```javascript
// server.js linha 119
app.use("/uploads", express.static(uploadsDir));
```

**IMPACTO:** Em produção com S3, não precisa servir `/uploads` localmente. Pode causar confusão.

**SOLUÇÃO:** Condicionar servir `/uploads` apenas se não estiver usando S3

---

### 10. **Falta Configuração de Logging para Produção**

**PROBLEMA:**
- Logs podem expor informações sensíveis
- Não há configuração de níveis de log por ambiente

**SOLUÇÃO:** Configurar logging adequado (winston, pino, etc.)

---

## 📋 CHECKLIST DE AJUSTES NECESSÁRIOS

### Críticos (Fazer Antes do Deploy)
- [ ] **Ajustar Backend Dockerfile** para usar `npm start` ao invés de `npm run dev`
- [ ] **Criar Frontend Dockerfile** para produção (build + nginx)
- [ ] **Criar docker-compose.prod.yml** sem volumes de desenvolvimento
- [ ] **Garantir VITE_API_URL** no build do frontend
- [ ] **Adicionar script de migrations** no startup do backend
- [ ] **Validar AWS_REGION** como obrigatório em produção
- [ ] **Remover/condicionar fallbacks** de localhost no frontend

### Importantes (Fazer o Quanto Antes)
- [ ] **Adicionar health checks** no docker-compose
- [ ] **Configurar logging** adequado para produção
- [ ] **Condicionar servir /uploads** apenas se não usar S3
- [ ] **Criar .env.example** com todas as variáveis necessárias
- [ ] **Documentar processo de deploy** na AWS

### Recomendados (Melhorias)
- [ ] **Multi-stage builds** nos Dockerfiles para otimização
- [ ] **Configurar SSL/HTTPS** (via ALB ou CloudFront)
- [ ] **Adicionar monitoring** (CloudWatch, etc.)
- [ ] **Configurar backup automático** do banco
- [ ] **Criar script de deploy** automatizado

---

## 🔧 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

### Backend (Produção)
```env
NODE_ENV=production
PORT=3001

# Database (RDS PostgreSQL)
DB_HOST=<rds-endpoint>
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

### Frontend (Build Time)
```env
VITE_API_URL=https://api.pecaja.cloud/api
```

---

## 🚀 RECOMENDAÇÕES PARA DEPLOY NA AWS

### Arquitetura Sugerida (Simples e Assertiva)

1. **RDS PostgreSQL**
   - Instance: db.t3.micro (ou maior conforme necessidade)
   - Multi-AZ: Não necessário inicialmente (pode ativar depois)
   - Backup automático: Sim
   - Security Group: Permitir apenas do backend

2. **S3 Bucket**
   - Bucket para uploads de imagens
   - Política pública de leitura (ou CloudFront)
   - Versionamento: Opcional inicialmente

3. **EC2 ou ECS**
   - **Opção 1 (Mais Simples):** EC2 com Docker
     - t3.small ou t3.medium
     - Docker + docker-compose
     - Nginx como reverse proxy
   
   - **Opção 2 (Mais Escalável):** ECS Fargate
     - Task Definition para backend
     - Task Definition para frontend
     - Application Load Balancer

4. **Application Load Balancer (ALB)**
   - SSL/TLS via ACM (certificado gratuito)
   - Roteamento: `/api/*` → backend, `/*` → frontend

5. **Route 53 (Opcional)**
   - DNS management
   - Pode usar domínio próprio

### Passos Recomendados

1. **Preparar Código**
   - ✅ Corrigir Dockerfiles
   - ✅ Criar docker-compose.prod.yml
   - ✅ Ajustar variáveis de ambiente

2. **Criar Infraestrutura AWS**
   - Criar RDS PostgreSQL
   - Criar S3 Bucket
   - Criar IAM User para S3 (com permissões mínimas)
   - Criar EC2 ou ECS

3. **Configurar Segurança**
   - Security Groups
   - IAM Roles
   - SSL/TLS

4. **Deploy**
   - Build das imagens Docker
   - Push para ECR (se usar ECS) ou build no EC2
   - Configurar variáveis de ambiente
   - Executar migrations
   - Iniciar serviços

5. **Validação**
   - Testar health checks
   - Testar uploads S3
   - Testar autenticação
   - Testar integrações

---

## 📝 RESUMO EXECUTIVO

### Status Geral: ⚠️ **NÃO PRONTO PARA PRODUÇÃO**

**Principais Bloqueadores:**
1. Dockerfiles configurados para desenvolvimento
2. Frontend não tem build de produção
3. URLs hardcoded para localhost
4. Migrations não executadas automaticamente

**Tempo Estimado para Correções:** 4-6 horas

**Prioridade de Ajustes:**
1. 🔴 **CRÍTICO:** Dockerfiles e build do frontend
2. 🟡 **IMPORTANTE:** Variáveis de ambiente e migrations
3. 🟢 **RECOMENDADO:** Melhorias de infraestrutura

---

**Próximos Passos Sugeridos:**
1. Corrigir Dockerfiles (backend e frontend)
2. Criar docker-compose.prod.yml
3. Testar build localmente
4. Preparar variáveis de ambiente
5. Fazer deploy de teste em ambiente staging

