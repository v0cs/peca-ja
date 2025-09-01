# PeçaJá - Plataforma de Solicitação de Peças Automotivas

## 📋 Sobre o Projeto

O **PeçaJá** é uma aplicação web desenvolvida como Produto Mínimo Viável (MVP) que atua como ponte entre clientes (proprietários de veículos e oficinas) e autopeças, otimizando o processo de solicitação de orçamentos para peças automotivas.

### 🎯 Problema que Resolve

- **Ineficiência na busca por peças**: Clientes precisam consultar múltiplas autopeças manualmente
- **Falta de visibilidade das autopeças**: Dificuldade em alcançar novos clientes
- **Processo manual de orçamentação**: Ausência de plataforma centralizada
- **Dificuldade no preenchimento de dados veiculares**: Erros em informações técnicas

## 🚀 Funcionalidades Principais

### Para Clientes
- ✅ Cadastro e autenticação via Google OAuth 2.0
- ✅ Consulta automática de dados do veículo via placa
- ✅ Criação de solicitações com descrição detalhada e imagens
- ✅ Acompanhamento de solicitações ativas e histórico

### Para Autopeças
- ✅ Cadastro e autenticação com dados empresariais
- ✅ Visualização de solicitações por cidade
- ✅ Filtros por marca, modelo, ano, categoria e data
- ✅ Sistema de busca por palavra-chave
- ✅ Marcar solicitações como lidas
- ✅ Notificações de novas solicitações
- ✅ Contato direto via WhatsApp

## 🛠️ Stack Tecnológica

### Frontend
- **React.js** - Interface de usuário responsiva
- **JavaScript** - Linguagem principal

### Backend
- **Node.js** - Ambiente de execução
- **Express.js** - Framework web
- **Passport.js** - Autenticação OAuth 2.0

### Banco de Dados
- **PostgreSQL** - Banco relacional
- **Sequelize ORM** - Mapeamento objeto-relacional

### APIs Externas
- **Google OAuth 2.0** - Autenticação social
- **API de Consulta Veicular** - Dados automáticos do veículo
- **WhatsApp Business** - Redirecionamento para chat

### Ferramentas de Desenvolvimento
- **Git & GitHub** - Controle de versão
- **Docker** - Containerização
- **GitHub Actions** - CI/CD
- **Jest/Vitest** - Testes unitários
- **ESLint + Prettier** - Padronização de código

## 🏗️ Arquitetura

A aplicação segue uma **arquitetura monolítica modular** com três camadas principais:

1. **Frontend (React.js)** - Interface responsiva
2. **Backend (Node.js/Express)** - API RESTful
3. **Database (PostgreSQL)** - Persistência de dados

### Padrões Arquiteturais
- **MVC (Model-View-Controller)**
- **RESTful API**
- **Modular Monolith**

## 📋 Requisitos do Sistema

### Funcionais
- Sistema de cadastro e autenticação
- Gestão de solicitações e uploads de imagens
- Filtros e buscas avançadas
- Integração com APIs externas
- Sistema de notificações

### Não Funcionais
- Suporte a 1000 usuários simultâneos
- Interface responsiva (desktop, tablet, mobile)
- Tempo de resposta < 2 segundos
- Cobertura de testes > 70%
- Compatibilidade com principais navegadores
  
## 🔒 Segurança

- **Autenticação JWT** com tokens seguros
- **Criptografia bcrypt** para senhas
- **Validação rigorosa** de entradas
- **Rate limiting** para prevenção de ataques
- **HTTPS obrigatório** em produção
- **Conformidade LGPD** para dados sensíveis

## 📝 Documento RFC 

- **RFC Completo**: [Documentação técnica detalhada](./docs/RFC_PecaJa.pdf)
