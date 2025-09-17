# PeçaJá - Plataforma de Solicitação de Peças Automotivas

## 📋 Sobre o Projeto

O **PeçaJá** é uma aplicação web desenvolvida como **Produto Mínimo Viável (MVP)** que conecta clientes (proprietários de veículos e oficinas) e autopeças. Funciona como um marketplace de solicitações de orçamento, centralizando o processo e otimizando o contato entre as partes.

### 🎯 Problema que Resolve

- **Ineficiência na busca por peças**: clientes precisam consultar múltiplas autopeças manualmente.
- **Falta de visibilidade das autopeças**: dificuldade em alcançar novos clientes.
- **Processo manual de orçamentação**: ausência de plataforma centralizada.
- **Erros em dados veiculares**: dificuldade no preenchimento manual.

## 🚀 Funcionalidades Principais

### Clientes

- ✅ Cadastro e login (email/senha e Google OAuth 2.0)
- ✅ Consulta automática de dados do veículo via API
- ✅ Criação de solicitações com descrição detalhada e imagens
- ✅ Acompanhamento de solicitações ativas e histórico

### Autopeças

- ✅ Cadastro e autenticação com dados empresariais
- ✅ Gestão de vendedores e permissões
- ✅ Visualização de solicitações por localização
- ✅ Filtros avançados (marca, modelo, ano, categoria, data e palavra-chave)
- ✅ Notificações de novas solicitações (in-app e email)
- ✅ Contato direto via WhatsApp Business

## 🛠️ Stack Tecnológica

### Frontend

- **React.js + Vite** - Interface de usuário responsiva
- **JavaScript** - Linguagem principal

### Backend

- **Node.js + Express.js** - API REST
- **Passport.js + JWT** - Autenticação segura

### Banco de Dados

- **PostgreSQL** - Banco relacional
- **Sequelize ORM** - Migrações e modelos

### APIs Externas

- **Google OAuth 2.0** - Login social
- **Consultar Placa** - Dados automáticos do veículo
- **WhatsApp Business** - Redirecionamento

### Ferramentas de Desenvolvimento

- **Docker & docker-compose** - Containerização
- **GitHub Actions** - CI/CD
- **Jest/Vitest** - Testes unitários e integração
- **ESLint + Prettier** - Padrões de código

## 🏗️ Arquitetura

A aplicação segue uma **arquitetura monolítica modular** baseada em **MVC**.

## 🔒 Segurança

- **JWT + Google OAuth**
- **Hash de senhas com bcrypt**
- **Input validation** + sanitização
- **Rate limiting** para proteção contra ataques
- **HTTPS obrigatório em produção**
- **Helmet.js** para headers seguros
- **Conformidade LGPD**

## 📝 Documento de RFC

[📄 Documentação Técnica Completa](https://github.com/user-attachments/files/22353400/RFC__PecaJa.pdf)
