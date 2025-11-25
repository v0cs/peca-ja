# 📡 STATUS - APIs EXTERNAS E MONITORING

**Data da Análise:** 2025-01-20  
**Plataforma:** AWS Lightsail  
**Foco:** Integrações externas e observabilidade

---

## 🔌 APIs EXTERNAS - STATUS ATUAL

### ✅ 1. AWS S3 (Upload de Imagens)

**Status:** ✅ **CONFIGURADO** (com ajustes necessários)

**Implementação:**

- ✅ SDK: `@aws-sdk/client-s3` v3.939.0
- ✅ Serviço: `backend/src/services/uploadService.js`
- ✅ Fallback local em desenvolvimento
- ✅ Detecção automática de ambiente

**Ajustes Necessários para Lightsail:**

1. **Validar AWS_REGION** ⚠️

   - **Problema:** `env.js` não valida `AWS_REGION` como obrigatório
   - **Impacto:** Pode falhar silenciosamente se não configurado
   - **Correção:** Adicionar validação em `backend/src/config/env.js`:

   ```javascript
   if (!process.env.AWS_REGION) {
     errors.push("❌ AWS_REGION: Variável obrigatória para S3!");
   }
   ```

2. **Configurar Bucket Policy** 📋

   - **Ação:** Criar bucket S3 na mesma região do Lightsail
   - **Política:** Permitir leitura pública OU usar CloudFront
   - **CORS:** Configurar CORS se necessário

3. **IAM User/Policy** 🔐
   - **Ação:** Criar IAM User específico para S3
   - **Permissões mínimas:** `s3:PutObject`, `s3:DeleteObject`, `s3:GetObject`
   - **Bucket específico:** Restringir a um bucket apenas

**Configuração Lightsail:**

```env
AWS_ACCESS_KEY_ID=<iam-user-key>
AWS_SECRET_ACCESS_KEY=<iam-user-secret>
AWS_REGION=us-east-1  # Mesma região do Lightsail
AWS_S3_BUCKET_NAME=pecaja-uploads-prod
```

**Status:** 🟡 **PRECISA AJUSTE** (validação AWS_REGION)

---

### ✅ 2. Resend (Envio de Emails)

**Status:** ✅ **CONFIGURADO** (com ajustes necessários)

**Implementação:**

- ✅ SDK: `resend` v6.1.2
- ✅ Serviço: `backend/src/services/emailService.js`
- ✅ Retry automático para rate limits
- ✅ Tratamento de erros robusto

**Ajustes Necessários para Lightsail:**

1. **EMAIL_FROM em Produção** ⚠️

   - **Problema:** Usa domínio padrão em dev (`onboarding@resend.dev`)
   - **Impacto:** Emails podem ir para spam ou serem bloqueados
   - **Correção:**
     - Verificar domínio no Resend Dashboard
     - Usar domínio verificado: `PeçaJá <contato@pecaja.cloud>`
     - Configurar SPF/DKIM no DNS

2. **Configurar Domínio no Resend** 📋

   - **Ação:** Adicionar domínio `pecaja.cloud` no Resend
   - **DNS Records:** Adicionar registros SPF, DKIM, DMARC
   - **Verificação:** Aguardar verificação do domínio

3. **Rate Limits** ⚠️
   - **Status:** Já implementado retry automático
   - **Limite Resend:** 2 requisições/segundo
   - **Ação:** Monitorar logs em produção

**Configuração Lightsail:**

```env
RESEND_API_KEY=<resend-api-key>
EMAIL_FROM=PeçaJá <contato@pecaja.cloud>  # Domínio verificado
```

**Checklist:**

- [ ] Verificar domínio no Resend Dashboard
- [ ] Adicionar registros DNS (SPF, DKIM)
- [ ] Testar envio de email em produção
- [ ] Configurar EMAIL_FROM correto

**Status:** 🟡 **PRECISA AJUSTE** (verificação de domínio)

---

### ✅ 3. Google OAuth 2.0

**Status:** ✅ **CONFIGURADO** (com ajustes necessários)

**Implementação:**

- ✅ SDK: `passport-google-oauth20` v2.0.0
- ✅ Configuração: `backend/src/config/passport.js`
- ✅ Scopes: `profile`, `email`
- ✅ Fallback gracioso se não configurado

**Ajustes Necessários para Lightsail:**

1. **Callback URL em Produção** ⚠️

   - **Problema:** Fallback usa `localhost:3001` se não configurado
   - **Impacto:** OAuth não funcionará em produção
   - **Correção:**
     - Configurar `GOOGLE_CALLBACK_URL` explicitamente
     - Adicionar URL no Google Cloud Console

2. **Configurar no Google Cloud Console** 📋

   - **Ação:** Adicionar callback URL autorizado
   - **URL:** `https://api.pecaja.cloud/auth/google/callback`
   - **OU:** `https://pecaja.cloud/api/auth/google/callback` (se mesmo domínio)

3. **Client ID/Secret** 🔐
   - **Ação:** Usar credenciais de produção (não de desenvolvimento)
   - **Segurança:** Rotacionar secrets periodicamente

**Configuração Lightsail:**

```env
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_CALLBACK_URL=https://api.pecaja.cloud/auth/google/callback
```

**Checklist:**

- [ ] Adicionar callback URL no Google Cloud Console
- [ ] Verificar scopes necessários (`profile`, `email`)
- [ ] Testar OAuth em produção
- [ ] Configurar GOOGLE_CALLBACK_URL corretamente

**Status:** 🟡 **PRECISA AJUSTE** (callback URL)

---

### ✅ 4. API Veicular (consultarplaca.com.br)

**Status:** ✅ **CONFIGURADO** (pronto para produção)

**Implementação:**

- ✅ SDK: `axios` v1.12.2
- ✅ Serviço: `backend/src/services/apiVeicularService.js`
- ✅ Circuit Breaker: `opossum` v9.0.0
- ✅ Cache: `node-cache` (24h TTL)
- ✅ Rate limiting implementado
- ✅ Fallback manual robusto
- ✅ Timeout: 10 segundos

**Ajustes Necessários para Lightsail:**

1. **Nenhum ajuste crítico** ✅

   - API funciona via HTTPS (não precisa configuração especial)
   - Rate limiting já implementado
   - Circuit breaker protege contra falhas
   - Cache reduz custos

2. **Monitoramento Recomendado** 📊
   - Monitorar taxa de sucesso/falha
   - Monitorar tempo de resposta
   - Alertar se circuit breaker abrir

**Configuração Lightsail:**

```env
API_VEICULAR_KEY=<api-key>
API_VEICULAR_EMAIL=<email-cadastrado>
```

**Status:** ✅ **PRONTO** (sem ajustes necessários)

---

### ✅ 5. WhatsApp (Deep Linking)

**Status:** ✅ **PRONTO** (sem ajustes necessários)

**Implementação:**

- ✅ Geração de links `wa.me`
- ✅ Não usa API oficial (apenas deep linking)
- ✅ Funciona em qualquer ambiente

**Ajustes Necessários para Lightsail:**

**Nenhum** ✅

- Deep linking funciona independente do ambiente
- Não precisa configuração especial

**Status:** ✅ **PRONTO** (sem ajustes)

---

## 📊 MONITORING - STATUS ATUAL

### ❌ Grafana + Prometheus

**Status:** ❌ **NÃO IMPLEMENTADO**

**Situação Atual:**

- Não há Prometheus configurado
- Não há Grafana configurado
- Não há coleta de métricas estruturada
- Apenas logs básicos no console

**Recomendação para Lightsail:**

### Opção 1: CloudWatch (Recomendado para Lightsail)

**Vantagens:**

- ✅ Gerenciado pela AWS (sem infraestrutura)
- ✅ Integração nativa com Lightsail
- ✅ Custo baixo inicialmente
- ✅ Alertas nativos
- ✅ Dashboards básicos

**Implementação:**

```javascript
// npm install aws-sdk
const CloudWatch = require("aws-sdk").CloudWatch;

const cloudwatch = new CloudWatch({ region: process.env.AWS_REGION });

// Enviar métrica
await cloudwatch
  .putMetricData({
    Namespace: "PecaJa/Backend",
    MetricData: [
      {
        MetricName: "HttpRequests",
        Value: 1,
        Unit: "Count",
        Timestamp: new Date(),
        Dimensions: [
          { Name: "Route", Value: "/api/solicitacoes" },
          { Name: "Status", Value: "200" },
        ],
      },
    ],
  })
  .promise();
```

**Custo:** ~$0.30/milhão de métricas + $0.50/alarme

**Status:** 🟢 **RECOMENDADO** (não bloqueia deploy)

---

### Opção 2: Prometheus + Grafana (Self-hosted)

**Vantagens:**

- ✅ Mais controle
- ✅ Grafana mais poderoso
- ✅ Open source

**Desvantagens:**

- ❌ Precisa gerenciar infraestrutura
- ❌ Custo adicional de instância
- ❌ Mais complexo

**Implementação:**

- Adicionar Prometheus + Grafana no docker-compose
- Expor endpoint `/metrics` no backend
- Configurar scraping

**Custo:** +$10-20/mês (instância adicional)

**Status:** 🟡 **OPCIONAL** (pode adicionar depois)

---

### Opção 3: Sem Monitoring Inicial

**Vantagens:**

- ✅ Deploy mais rápido
- ✅ Sem custo adicional
- ✅ Pode adicionar depois

**Desvantagens:**

- ❌ Sem visibilidade de problemas
- ❌ Dificulta troubleshooting

**Status:** 🟡 **ACEITÁVEL** (mas não recomendado)

---

## 📋 CHECKLIST COMPLETO - APIs E MONITORING

### 🔴 CRÍTICOS (Fazer Antes do Deploy)

- [ ] **API-1** Validar `AWS_REGION` em `env.js`
- [ ] **API-2** Criar bucket S3 e configurar política
- [ ] **API-3** Criar IAM User para S3 com permissões mínimas
- [ ] **API-4** Verificar domínio no Resend e configurar DNS
- [ ] **API-5** Configurar `EMAIL_FROM` com domínio verificado
- [ ] **API-6** Adicionar callback URL no Google Cloud Console
- [ ] **API-7** Configurar `GOOGLE_CALLBACK_URL` corretamente

### 🟡 IMPORTANTES (Fazer o Quanto Antes)

- [ ] **MON-1** Decidir estratégia de monitoring (CloudWatch recomendado)
- [ ] **MON-2** Implementar métricas básicas (se escolher CloudWatch)
- [ ] **API-8** Testar todas as integrações em ambiente de staging
- [ ] **API-9** Configurar alertas básicos (erros, latência)

### 🟢 RECOMENDADOS (Melhorias)

- [ ] **MON-3** Implementar Prometheus + Grafana (se necessário)
- [ ] **MON-4** Configurar dashboards personalizados
- [ ] **API-10** Rotacionar secrets periodicamente
- [ ] **API-11** Monitorar custos das APIs externas

---

## 🔧 CONFIGURAÇÕES NECESSÁRIAS

### 1. AWS S3 - Setup

```bash
# 1. Criar bucket
aws s3 mb s3://pecaja-uploads-prod --region us-east-1

# 2. Configurar política pública (se necessário)
# Ou usar CloudFront para distribuição

# 3. Criar IAM User
aws iam create-user --user-name pecaja-s3-user

# 4. Criar policy
cat > s3-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject"
    ],
    "Resource": "arn:aws:s3:::pecaja-uploads-prod/*"
  }]
}
EOF

# 5. Anexar policy
aws iam put-user-policy \
  --user-name pecaja-s3-user \
  --policy-name S3UploadPolicy \
  --policy-document file://s3-policy.json

# 6. Criar access keys
aws iam create-access-key --user-name pecaja-s3-user
```

---

### 2. Resend - Setup

1. **Acessar Resend Dashboard:** https://resend.com/domains
2. **Adicionar domínio:** `pecaja.cloud`
3. **Adicionar registros DNS:**
   - SPF: `v=spf1 include:resend.com ~all`
   - DKIM: (fornecido pelo Resend)
   - DMARC: (opcional)
4. **Aguardar verificação**
5. **Usar domínio verificado no EMAIL_FROM**

---

### 3. Google OAuth - Setup

1. **Acessar Google Cloud Console:** https://console.cloud.google.com
2. **Criar/Selecionar projeto**
3. **Habilitar Google+ API**
4. **Criar OAuth 2.0 Credentials:**
   - Tipo: Web application
   - Authorized redirect URIs: `https://api.pecaja.cloud/auth/google/callback`
5. **Copiar Client ID e Secret**

---

### 4. API Veicular - Setup

1. **Cadastrar em:** https://consultarplaca.com.br
2. **Obter API Key**
3. **Configurar email cadastrado**
4. **Adicionar variáveis no .env**

---

## 📊 RESUMO EXECUTIVO

### APIs Externas

| API              | Status         | Ajustes Necessários               | Prioridade |
| ---------------- | -------------- | --------------------------------- | ---------- |
| **AWS S3**       | 🟡 Configurado | Validar AWS_REGION, criar bucket  | 🔴 Crítico |
| **Resend**       | 🟡 Configurado | Verificar domínio, configurar DNS | 🔴 Crítico |
| **Google OAuth** | 🟡 Configurado | Configurar callback URL           | 🔴 Crítico |
| **API Veicular** | ✅ Pronto      | Nenhum                            | ✅ OK      |
| **WhatsApp**     | ✅ Pronto      | Nenhum                            | ✅ OK      |

### Monitoring

| Solução        | Status              | Recomendação                           |
| -------------- | ------------------- | -------------------------------------- |
| **CloudWatch** | ❌ Não implementado | 🟢 Recomendado (pode adicionar depois) |
| **Prometheus** | ❌ Não implementado | 🟡 Opcional (self-hosted)              |
| **Grafana**    | ❌ Não implementado | 🟡 Opcional (self-hosted)              |

---

## ✅ CONCLUSÃO

### Status Geral: 🟡 **PRECISA AJUSTES** (mas não bloqueia deploy básico)

**BLOQUEADORES:**

1. ❌ Validar `AWS_REGION` (5 min)
2. ❌ Configurar S3 bucket e IAM (15 min)
3. ❌ Verificar domínio Resend (10 min)
4. ❌ Configurar Google OAuth callback (5 min)

**NÃO BLOQUEADORES:**

- ✅ API Veicular: Pronto
- ✅ WhatsApp: Pronto
- 🟡 Monitoring: Pode adicionar depois

**TEMPO ESTIMADO PARA AJUSTES:** 35-45 minutos

**RECOMENDAÇÃO:**

1. ✅ Fazer ajustes críticos das APIs (35 min)
2. 🟡 Deploy básico sem monitoring
3. 🟢 Adicionar CloudWatch depois (1-2h)

---

**Próximos Passos:**

1. Corrigir validação `AWS_REGION`
2. Configurar S3 bucket e IAM
3. Verificar domínio Resend
4. Configurar Google OAuth callback
5. Testar todas as integrações
6. (Opcional) Adicionar CloudWatch monitoring
