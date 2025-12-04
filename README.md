<h1 align="center">
  <img width="136" height="134" alt="icone-pecaja" src="https://github.com/user-attachments/assets/6b91d9bb-d65f-4b8c-ae4c-55bc745289f9" alt= "PeçaJá - Marketplace de Peças Automotivas">
</h1>

<h4 align="center">
  🚗 Marketplace de Solicitação de Peças Automotivas 🔧
</h4>

<p align="center">
  <img alt="GitHub Language Count" src="https://img.shields.io/github/languages/count/v0cs/peca-ja?style=flat-square">
  <img alt="GitHub Top Language" src="https://img.shields.io/github/languages/top/v0cs/peca-ja?style=flat-square">
  <img alt="GitHub Issues" src="https://img.shields.io/github/issues/v0cs/peca-ja?style=flat-square">
  <img alt="GitHub Closed Issues" src="https://img.shields.io/github/issues-closed/v0cs/peca-ja?style=flat-square">
  <img alt="GitHub Pull Requests" src="https://img.shields.io/github/issues-pr/v0cs/peca-ja?style=flat-square">
  <img alt="GitHub Last Commit" src="https://img.shields.io/github/last-commit/v0cs/peca-ja?style=flat-square">
  <img alt="GitHub Repo Size" src="https://img.shields.io/github/repo-size/v0cs/peca-ja?style=flat-square">
  <img alt="GitHub License" src="https://img.shields.io/github/license/v0cs/peca-ja?style=flat-square">
</p>

<p align="center">
  <strong>🚀 Status:</strong> Em Produção | 
  <strong>📦 Versão:</strong> 1.0.0 | 
  <strong>🌐 Deploy:</strong> <a href="https://pecaja.cloud">pecaja.cloud</a> 🔒
</p>

<p align="center">
  <a href="#-sobre-o-projeto">Sobre</a> •
  <a href="#-funcionalidades">Funcionalidades</a> •
  <a href="#-demonstração">Demonstração</a> •
  <a href="#-tecnologias">Tecnologias</a> •
  <a href="#-arquitetura">Arquitetura</a> •
  <a href="#-deploy-e-infraestrutura">Deploy</a> •
  <a href="#-como-executar">Como Executar</a> •
  <a href="#-testes">Testes</a> •
  <a href="#-segurança">Segurança</a> •
  <a href="#-roadmap">Roadmap</a> •
  <a href="#-contribuindo">Contribuindo</a> •
  <a href="#-faq">FAQ</a> •
  <a href="#-licença">Licença</a> •
  <a href="#-autor">Autor</a>
</p>

---

## 💡 Sobre o Projeto

**PeçaJá** é uma plataforma web desenvolvida como **MVP (Produto Mínimo Viável)** que conecta proprietários de veículos e oficinas mecânicas a autopeças, funcionando como um marketplace de solicitação de orçamentos de peças automotivas.

### 📌 Contexto e Problema

Atualmente, o processo de busca por peças automotivas é manual, fragmentado e ineficiente. Proprietários de veículos precisam:
- 📞 Realizar múltiplos contatos telefônicos
- 🚶 Fazer visitas presenciais a diversas autopeças
- ⏰ Gastar tempo considerável sem garantia da melhor opção

Por outro lado, as autopeças enfrentam:
- 📉 Dificuldade em captar novos clientes
- 🤷 Dependência de métodos tradicionais de divulgação
- 📋 Falta de sistema centralizado para gerenciar demandas

### 🎯 Solução

O PeçaJá digitaliza e otimiza esse fluxo, permitindo que:
- **Clientes** criem solicitações detalhadas com fotos e dados do veículo
- **Autopeças** visualizem solicitações da sua região e façam contato direto
- **Vendedores** gerenciem suas oportunidades de forma organizada

### 🏆 Diferenciais

- ✅ Consulta automática de dados veiculares por placa (API integrada)
- ✅ Login com Google OAuth 2.0 para acesso rápido
- ✅ Sistema de gestão de equipe de vendedores para autopeças
- ✅ Notificações por email sobre novas solicitações
- ✅ Redirecionamento direto via links wa.me para negociação
- ✅ Filtros avançados por marca, modelo, ano e categoria
- ✅ SSL/HTTPS em produção com certificado Let's Encrypt
- ✅ Deploy automatizado com CI/CD (GitHub Actions)

---

## 🚀 Funcionalidades

### 👤 Para Clientes

- `Cadastro e Login` Registro com email/senha ou Google OAuth 2.0
- `Criar Solicitação` Preenchimento automático de dados do veículo pela placa
- `Upload de Imagens` Até 3 fotos por solicitação (peça danificada, localização, referências)
- `Gerenciar Solicitações` Editar, cancelar ou encerrar solicitações ativas
- `Histórico` Visualizar todas as solicitações passadas
- `Perfil` Editar dados cadastrais e gerenciar conta

### 🏪 Para Autopeças

- `Cadastro Completo` Registro com CNPJ, razão social e endereço
- `Feed de Solicitações` Visualizar solicitações da mesma cidade
- `Filtros Avançados` Filtrar por marca, modelo, ano, categoria e palavra-chave
- `Marcar como Atendida` Organizar solicitações já visualizadas
- `Contato Direto` Redirecionamento para WhatsApp do cliente
- `Gestão de Vendedores` Cadastrar e gerenciar equipe de vendas
- `Notificações` Receber alertas por email sobre novas solicitações

### 💼 Para Vendedores

- `Acesso Independente` Login próprio vinculado à autopeça
- `Feed Personalizado` Ver apenas solicitações não atendidas por outros vendedores da mesma autopeça
- `Marcar Atendimento` Remover solicitações do feed após contato
- `Histórico Individual` Visualizar solicitações já atendidas

---

## 📸 Demonstração

### 🌐 Acesse a Aplicação

**URL:** [https://pecaja.cloud](https://pecaja.cloud) 

<details>
<summary>📸 Screenshots</summary>

#### Landing Page
![Landing Page](./docs/screenshots/landing.png) 

#### Dashboard Cliente
![Dashboard Cliente](./docs/screenshots/dashboard-cliente.png)

#### Dashboard Autopeça
![Dashboard Autopeça](./docs/screenshots/dashboard-autopeca.png)

#### Criar Solicitação
![Nova Solicitação](./docs/screenshots/nova-solicitacao.png)

#### Monitoramento (Grafana)
![Grafana Dashboard](./docs/screenshots/grafana.png)

</details>

---

## 🛠️ Tecnologias

### Frontend

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| ![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=flat-square&logo=react) | 19.1.1 | Biblioteca JavaScript para UI |
| ![Vite](https://img.shields.io/badge/Vite-5.0.8-646CFF?style=flat-square&logo=vite) | 5.0.8 | Build tool rápido |
| ![TailwindCSS](https://img.shields.io/badge/Tailwind-3.3.0-06B6D4?style=flat-square&logo=tailwindcss) | 3.3.0 | Framework CSS utility-first |
| ![React Router](https://img.shields.io/badge/React_Router-7.9.5-CA4245?style=flat-square&logo=reactrouter) | 7.9.5 | Roteamento |
| ![Axios](https://img.shields.io/badge/Axios-1.13.1-5A29E4?style=flat-square&logo=axios) | 1.13.1 | Cliente HTTP |
| ![Zod](https://img.shields.io/badge/Zod-4.1.12-3E67B1?style=flat-square) | 4.1.12 | Validação de schemas |
| ![React Hook Form](https://img.shields.io/badge/RHF-7.65.0-EC5990?style=flat-square) | 7.65.0 | Gerenciamento de formulários |

### Backend

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| ![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=nodedotjs) | 20.x | Runtime JavaScript |
| ![Express](https://img.shields.io/badge/Express-5.1.0-000000?style=flat-square&logo=express) | 5.1.0 | Framework web |
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql) | 15 | Banco de dados relacional |
| ![Sequelize](https://img.shields.io/badge/Sequelize-6.37.7-52B0E7?style=flat-square&logo=sequelize) | 6.37.7 | ORM |
| ![JWT](https://img.shields.io/badge/JWT-9.0.2-000000?style=flat-square&logo=jsonwebtokens) | 9.0.2 | Autenticação |
| ![Passport](https://img.shields.io/badge/Passport-0.7.0-34E27A?style=flat-square) | 0.7.0 | Middleware de autenticação |
| ![AWS S3](https://img.shields.io/badge/AWS_S3-3.939.0-232F3E?style=flat-square&logo=amazonaws) | SDK 3.x | Storage de imagens |

### DevOps & Ferramentas

| Ferramenta | Descrição |
|------------|-----------|
| ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white) | Containerização |
| ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white) | CI/CD Pipeline |
| ![Nginx](https://img.shields.io/badge/Nginx-009639?style=flat-square&logo=nginx&logoColor=white) | Reverse Proxy + SSL |
| ![Jest](https://img.shields.io/badge/Jest-30.1.3-C21325?style=flat-square&logo=jest) | Testes Backend |
| ![Vitest](https://img.shields.io/badge/Vitest-1.0.4-6E9F18?style=flat-square&logo=vitest) | Testes Frontend |
| ![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=flat-square&logo=prometheus&logoColor=white) | Monitoramento |
| ![Grafana](https://img.shields.io/badge/Grafana-F46800?style=flat-square&logo=grafana&logoColor=white) | Dashboards |
| ![SonarCloud](https://img.shields.io/badge/SonarCloud-F3702A?style=flat-square&logo=sonarcloud&logoColor=white) | Qualidade de Código |

### APIs Externas

- 🔐 **Google OAuth 2.0** - Autenticação social
- 🚗 **API Veicular** (consultarplaca.com.br) - Consulta de dados por placa
- 💬 **WhatsApp Deep Linking** (wa.me) - Redirecionamento direto
- 📧 **Resend** - Envio de emails

---

## 🏗️ Arquitetura

### Padrões Arquiteturais

```
┌─────────────────────────────────────────────────────────────┐
│                    Arquitetura PeçaJá                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌───────────────┐     ┌──────────┐  │
│  │   Frontend   │────▶ │  Backend API  │────▶│PostgreSQL│  │
│  │  React + Vite│ HTTPS│Node + Express │ ORM │  Banco   │  │
│  └──────────────┘      └───────────────┘     └──────────┘  │
│         │                      │                            │
│         │                      ├─────▶ AWS S3 (Imagens)    │
│         │                      ├─────▶ API Veicular        │
│         │                      ├─────▶ Google OAuth        │
│         │                      ├─────▶ Resend (Email)      │
│         │                      └─────▶ WhatsApp            │
│         │                                                   │
│         └─────────────▶ Nginx (Reverse Proxy + SSL)        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Monitoramento: Prometheus + Grafana         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Estrutura de Pastas

```
pecaja/
├── 📁 backend/              # Backend Node.js/Express
│   ├── src/
│   │   ├── config/          # Configurações (DB, env, passport)
│   │   ├── controllers/     # Controladores (10 arquivos)
│   │   ├── middleware/      # Middlewares (auth, upload, rate-limit)
│   │   ├── models/          # Models Sequelize (12 entidades)
│   │   ├── routes/          # Rotas da API (10 arquivos)
│   │   ├── services/        # Serviços (email, upload, API veicular)
│   │   └── utils/           # Utilitários
│   ├── tests/               # Testes (107 arquivos)
│   │   ├── unit/            # Testes unitários (88 arquivos)
│   │   ├── integration/     # Testes de integração (18 arquivos)
│   │   └── e2e/             # Testes end-to-end (1 arquivo)
│   └── migrations/          # Migrações do banco (8 arquivos)
│
├── 📁 frontend/             # Frontend React/Vite
│   ├── src/
│   │   ├── components/      # Componentes React (52 arquivos)
│   │   ├── pages/           # Páginas/Rotas (25 arquivos)
│   │   ├── hooks/           # Custom hooks (9 arquivos)
│   │   ├── contexts/        # React Contexts (3 arquivos)
│   │   ├── services/        # API calls (2 arquivos)
│   │   └── utils/           # Utilitários (3 arquivos)
│   └── public/              # Arquivos estáticos
│
├── 📁 monitoring/           # Prometheus + Grafana
│   ├── prometheus.yml
│   └── grafana/
│       └── provisioning/
│
├── 📁 nginx/                # Configurações Nginx
│   └── nginx.conf
│
├── 📄 docker-compose.yml    # Compose desenvolvimento
├── 📄 docker-compose.prod.yml  # Compose produção
└── 📄 .env.production.example  # Template de variáveis
```

### Banco de Dados (PostgreSQL)

**Principais Entidades:**

- `usuarios` - Tabela base de usuários
- `clientes` - Clientes (herança de usuários)
- `autopecas` - Autopeças (herança de usuários)
- `vendedores` - Vendedores vinculados a autopeças
- `solicitacoes` - Solicitações de peças
- `imagens_solicitacao` - Imagens anexadas
- `solicitacoes_atendimento` - Controle de atendimentos
- `notificacoes` - Sistema de notificações
- `historico_solicitacoes` - Auditoria de alterações
- `tokens_recuperacao_senha` - Recuperação de senha
- `log_auditoria` - Logs do sistema

---

## 🚀 Deploy e Infraestrutura

### Ambiente de Produção

- **Hospedagem:** AWS Lightsail (VPS Ubuntu 22.04)
- **CI/CD:** GitHub Actions (deploy automático)
- **Proxy:** Nginx com SSL/HTTPS (Let's Encrypt)
- **Containerização:** Docker + Docker Compose
- **Monitoramento:** Prometheus + Grafana
- **Storage:** AWS S3 (imagens)
- **Banco de Dados:** PostgreSQL 15

### Pipeline CI/CD

```
┌─────────────┐
│  Git Push   │
│   (main)    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  GitHub Actions     │
│  - Build & Test     │
│  - SonarCloud Scan  │
└──────┬──────────────┘
       │
       ▼
    ┌──────┐
    │Passou?│
    └─┬──┬─┘
  Sim │  │ Não
      │  └────────────┐
      ▼               ▼
┌──────────┐    ┌─────────┐
│  Build   │    │❌Deploy │
│  Docker  │    │Cancelado│
└────┬─────┘    └─────────┘
     │
     ▼
┌──────────────┐
│  Deploy SSH  │
│  AWS         │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│✅ Produção   │
│  pecaja.cloud│
└──────────────┘
```

**Tempo médio de deploy:** ~4-6 minutos

### Monitoramento

Acesse o Grafana em: [https://pecaja.cloud/grafana](https://pecaja.cloud/grafana)

**Métricas disponíveis:**
- Requisições HTTP (total, por rota, status codes)
- Tempo de resposta das APIs
- Uso de memória e CPU
- Consultas ao banco de dados
- Taxa de erros
- Uptime da aplicação

---

## 💻 Como Executar

### Pré-requisitos

Antes de começar, você vai precisar ter instalado em sua máquina:
- [Git](https://git-scm.com)
- [Node.js](https://nodejs.org/en/) (v20.x ou superior)
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL](https://www.postgresql.org/) (caso não use Docker)

### 🎲 Rodando a Aplicação (Modo Desenvolvimento)

```bash
# Clone este repositório
$ git clone https://github.com/v0cs/peca-ja.git

# Acesse a pasta do projeto
$ cd peca-ja

# Copie o arquivo de variáveis de ambiente
$ cp .env.production.example .env

# Edite o arquivo .env com suas credenciais
$ nano .env  # ou use seu editor favorito

# Suba os containers com Docker Compose
$ docker-compose up -d

# A aplicação estará rodando em:
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
# Grafana: http://localhost:3002
# Prometheus: http://localhost:9090
```

### 🔧 Configuração das Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Application
NODE_ENV=development
PORT=3001
DOMAIN=localhost
PROTOCOL=http

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=pecaja
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui

# JWT
JWT_SECRET=seu_jwt_secret_aqui

# Google OAuth
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_secret

# API Veicular
API_VEICULAR_KEY=sua_chave_api
API_VEICULAR_EMAIL=seu_email_api

# AWS S3
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=sua_aws_key
AWS_SECRET_ACCESS_KEY=sua_aws_secret
AWS_S3_BUCKET_NAME=seu_bucket

# Email (Resend)
RESEND_API_KEY=sua_chave_resend
EMAIL_FROM=PeçaJá <noreply@pecaja.cloud>

# Frontend
VITE_API_URL=http://localhost:3001/api
```

### 📦 Instalação Manual (sem Docker)

```bash
# Backend
cd backend
npm install
npm run db:create      # Cria o banco
npm run db:migrate     # Executa migrações
npm run dev            # Inicia servidor

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev            # Inicia aplicação
```

---

## 🧪 Testes

### 📊 Cobertura Atual

| Módulo | Cobertura | Arquivos | Status |
|--------|-----------|----------|--------|
| Backend | 78% | 88 testes unitários + 18 integração | ✅ |
| Frontend | 72% | 52 testes de componentes | ✅ |
| **Total** | **75%** | **107 arquivos de teste** | ✅ |

### 🔍 Qualidade de Código

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=v0cs_peca-ja&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=v0cs_peca-ja)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=v0cs_peca-ja&metric=coverage)](https://sonarcloud.io/summary/new_code?id=v0cs_peca-ja)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=v0cs_peca-ja&metric=bugs)](https://sonarcloud.io/summary/new_code?id=v0cs_peca-ja)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=v0cs_peca-ja&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=v0cs_peca-ja)

### Executar Testes do Backend

```bash
cd backend

# Todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Cobertura de testes
npm run test:coverage

# Apenas testes unitários
npm run test:unit

# Apenas testes de integração
npm run test:integration
```

### Executar Testes do Frontend

```bash
cd frontend

# Todos os testes
npm test

# Interface visual de testes
npm run test:ui

# Cobertura
npm run test:coverage
```

### Estrutura de Testes

```
backend/tests/
├── unit/           # 88 arquivos
│   ├── config/     # Testes de configuração
│   ├── controllers/ # Testes de controllers
│   ├── middleware/ # Testes de middlewares
│   ├── services/   # Testes de serviços
│   └── utils/      # Testes de utilitários
├── integration/    # 18 arquivos
└── e2e/           # 1 arquivo
```

---

## 🔒 Segurança

### Implementações de Segurança

- ✅ **HTTPS/SSL** com certificados Let's Encrypt (renovação automática)
- ✅ **JWT** para autenticação stateless (armazenados em cookies httpOnly)
- ✅ **Rate Limiting** em todas as rotas da API
- ✅ **Helmet.js** para headers de segurança HTTP
- ✅ **CORS** configurado adequadamente
- ✅ **Sanitização** de inputs com validação Zod
- ✅ **Hashing** de senhas com bcrypt (salt rounds: 10)
- ✅ **Variáveis de ambiente** protegidas (.env não versionado)
- ✅ **Secrets** gerenciados via GitHub Secrets
- ✅ **SQL Injection** prevenido via Sequelize ORM
- ✅ **XSS Protection** via sanitização de inputs
- ✅ **CSRF Protection** via tokens

### Rate Limiting Configurado

| Rota | Limite | Janela |
|------|--------|--------|
| Geral | 100 requisições | 15 minutos |
| Autenticação | 10 tentativas | 15 minutos |
| API | 200 requisições | 15 minutos |
| Upload | 10 uploads | 1 hora |
| Solicitações | 20 criações | 1 hora |
| Cadastro Vendedores | 5 cadastros | 1 dia |

### Conformidade

- ✅ **LGPD** - Lei Geral de Proteção de Dados
- ✅ **OAuth 2.0** - Padrão de autorização
- ✅ **OWASP Top 10** - Principais vulnerabilidades mitigadas

---

## 🗺️ Roadmap

### ✅ Versão 1.0 (Atual - MVP)
- [x] Sistema de autenticação completo (JWT + OAuth)
- [x] CRUD de solicitações com upload de imagens
- [x] Consulta automática de dados veiculares
- [x] Sistema de notificações por email
- [x] Gestão de vendedores para autopeças
- [x] Deploy em produção com CI/CD
- [x] SSL/HTTPS configurado (Let's Encrypt)
- [x] Monitoramento (Prometheus + Grafana)
- [x] Testes automatizados (75% de cobertura)

### 🚧 Versão 1.1 (Próximas Sprints)
- [ ] Sistema de chat em tempo real (WebSocket)
- [ ] Avaliações e reviews de autopeças
- [ ] Histórico de preços e comparativo
- [ ] Dashboard administrativo (super admin)
- [ ] Notificações push no navegador
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Sistema de favoritos

### 💡 Versão 2.0 (Futuro)
- [ ] App mobile (React Native)
- [ ] Sistema de pagamento integrado (Stripe/Mercado Pago)
- [ ] Inteligência Artificial para recomendações
- [ ] Sistema de fidelidade e cashback
- [ ] Marketplace de peças usadas
- [ ] Integração com oficinas mecânicas
- [ ] API pública para parceiros

---

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Siga os passos abaixo:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### 📋 Convenções de Commit

Este projeto segue [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona nova funcionalidade
fix: corrige um bug
docs: apenas mudanças na documentação
style: mudanças que não afetam o código (espaços, formatação)
refactor: mudança de código que não corrige bug nem adiciona feature
test: adiciona ou corrige testes
chore: mudanças em ferramentas, configurações, etc
perf: melhoria de performance
ci: mudanças em arquivos de CI/CD
```

### 🐛 Reportar Bugs

Encontrou um bug? Abra uma [issue](https://github.com/v0cs/peca-ja/issues) descrevendo:
- Passos para reproduzir
- Comportamento esperado
- Comportamento atual
- Screenshots (se aplicável)
- Ambiente (navegador, SO, versão)

---

## ❓ FAQ (Perguntas Frequentes)

<details>
<summary><strong>Como faço para testar a aplicação?</strong></summary>

Acesse [pecaja.cloud](https://pecaja.cloud) e crie uma conta ou use as credenciais de teste fornecidas na seção de Demonstração.
</details>

<details>
<summary><strong>O projeto está completo?</strong></summary>

O projeto é um MVP (Produto Mínimo Viável) funcional e está em produção. Melhorias contínuas estão sendo implementadas conforme o roadmap.
</details>

<details>
<summary><strong>Posso contribuir com o projeto?</strong></summary>