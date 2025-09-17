# PeçaJá - Plataforma de Solicitação de Peças Automotivas

## Sobre o Projeto
O **PeçaJá** é uma aplicação web desenvolvida como **Produto Mínimo Viável (MVP)** que conecta clientes (proprietários de veículos e oficinas) e autopeças. Funciona como um marketplace de solicitações de orçamento, centralizando o processo e otimizando o contato entre as partes.

### Problema que Resolve
- **Ineficiência na busca por peças**: clientes precisam consultar múltiplas autopeças manualmente.  
- **Falta de visibilidade das autopeças**: dificuldade em alcançar novos clientes.  
- **Processo manual de orçamentação**: ausência de plataforma centralizada.  
- **Erros em dados veiculares**: dificuldade no preenchimento manual.  

## Funcionalidades Principais

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
- ✅ Notificações de novas solicitações
- ✅ Contato direto via WhatsApp Business

## Stack Tecnológica

<p align="center"> <img src="https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/> <img src="https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB" alt="Express.js"/> <img src="https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens" alt="JWT"/> <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"/> <img src="https://img.shields.io/badge/PostgreSQL-000?style=for-the-badge&logo=postgresql" alt="PostgreSQL"/> <img src="https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/> 

- **Frontend:** React.js com Vite para interface responsiva
- **Backend:** Node.js com Express.js, JWT para autenticação
- **Autenticação:** Passport.js com Google OAuth 2.0
- **Banco de Dados:** PostgreSQL com Sequelize ORM
- **Conteinerização:** Docker e docker-compose
- **Testes Unitários e Integração:** Jest (backend), Vitest (frontend)
- **APIs Externas:** Google OAuth 2.0, Consultar Placa, WhatsApp Busines
- **Ferramentas de Qualidade:** ESLint + Prettier para padronização de código

## Arquitetura

A aplicação segue uma **arquitetura monolítica modular** baseada em **MVC**.  

## Segurança
- **JWT + Google OAuth**  
- **Hash de senhas com bcrypt**  
- **Input validation** + sanitização  
- **Rate limiting** para proteção contra ataques  
- **HTTPS obrigatório em produção**  
- **Helmet.js** para headers seguros  
- **Conformidade LGPD**

## Documentação
[📄 Documento de RFC](https://github.com/user-attachments/files/22353400/RFC__PecaJa.pdf)
