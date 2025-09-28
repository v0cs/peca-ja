# Estrutura de Testes - PeçaJá

Este documento descreve a organização dos testes do projeto PeçaJá, seguindo as melhores práticas e a especificação do projeto.

## 📁 Estrutura de Pastas

```
backend/tests/
├── unit/                    # Testes unitários
│   ├── controllers/         # Testes de controllers
│   ├── services/           # Testes de serviços
│   ├── middleware/         # Testes de middleware
│   └── utils/             # Testes de utilitários
├── integration/            # Testes de integração
│   ├── auth/              # Testes de autenticação
│   ├── api-veicular/      # Testes da API veicular
│   ├── routes/            # Testes de rotas
│   └── database/         # Testes de banco de dados
└── e2e/                   # Testes end-to-end
    ├── auth-flow/         # Fluxos de autenticação
    └── solicitation-flow/ # Fluxos de solicitação
```

## 🎯 Tipos de Testes

### **Testes Unitários (`unit/`)**

Testam componentes individuais isoladamente:

- **Controllers**: Lógica de negócio dos controllers
- **Services**: Serviços e lógica de negócio
- **Middleware**: Middlewares de autenticação, validação, etc.
- **Utils**: Funções utilitárias

### **Testes de Integração (`integration/`)**

Testam a integração entre componentes:

- **Auth**: Fluxos de autenticação e autorização
- **API Veicular**: Integração com API externa
- **Routes**: Testes de rotas e endpoints
- **Database**: Conexão e operações de banco

### **Testes E2E (`e2e/`)**

Testam fluxos completos do usuário:

- **Auth Flow**: Cadastro → Login → Dashboard
- **Solicitation Flow**: Criar → Visualizar → Atender

## 📋 Arquivos Organizados

### **Testes Unitários**

- `test-auth-controller.js` → `unit/controllers/`
- `test-controller-atualizado.js` → `unit/controllers/`
- `test-consulta-veicular-middleware.js` → `unit/middleware/`
- `test-upload-middleware.js` → `unit/middleware/`
- `test-rate-limiting.js` → `unit/middleware/`
- `test-rate-limiting-enhanced.js` → `unit/middleware/`
- `test-ordem-middlewares.js` → `unit/middleware/`
- `test-circuit-breaker.js` → `unit/middleware/`
- `test-debug-logs.js` → `unit/utils/`

### **Testes de Integração**

- `test-login.js` → `integration/auth/`
- `test-login-updated.js` → `integration/auth/`
- `test-register-endpoint.js` → `integration/auth/`
- `test-register-autopeca.js` → `integration/auth/`
- `test-register-autopeca-final.js` → `integration/auth/`
- `test-protected-route.js` → `integration/auth/`
- `test-basic-auth-fix.js` → `integration/auth/`
- `test-auth-controller-docker.js` → `integration/auth/`
- `test-validacoes-melhoradas.js` → `integration/auth/`

- `test-api-veicular-service.js` → `integration/api-veicular/`
- `test-api-veicular-service-fixed.js` → `integration/api-veicular/`
- `test-api-real.js` → `integration/api-veicular/`
- `test-api-v2-corrected.js` → `integration/api-veicular/`
- `test-external-connection.js` → `integration/api-veicular/`
- `test-localizacao-automatica.js` → `integration/api-veicular/`
- `test-mapeamento-categoria.js` → `integration/api-veicular/`

- `test-routes.js` → `integration/routes/`
- `test-server-routes.js` → `integration/routes/`
- `test-solicitacao-routes.js` → `integration/routes/`
- `test-vehicle-routes.js` → `integration/routes/`
- `test-vehicle-routes-complete.js` → `integration/routes/`

- `test-db-connection.js` → `integration/database/`
- `test-db-docker.js` → `integration/database/`
- `test-models-connection.js` → `integration/database/`
- `test-models-docker.js` → `integration/database/`
- `test-simple-connection.js` → `integration/database/`

### **Testes E2E**

- `test-endpoints-api.js` → `e2e/auth-flow/`

## 🚀 Como Executar os Testes

### **Executar todos os testes:**

```bash
npm test
```

### **Executar por categoria:**

```bash
# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Testes E2E
npm run test:e2e
```

### **Executar testes específicos:**

```bash
# Testes de autenticação
npm run test:auth

# Testes de API veicular
npm run test:api-veicular

# Testes de banco de dados
npm run test:database
```

## 📊 Cobertura de Testes

O projeto segue a especificação de **cobertura mínima de 70%** conforme definido na documentação.

### **Métricas de Cobertura:**

- **Controllers**: > 80%
- **Services**: > 85%
- **Middleware**: > 75%
- **Utils**: > 90%
- **Routes**: > 70%

## 🔧 Configuração

### **Ambiente de Teste:**

- Banco de dados de teste separado
- Configurações específicas para testes
- Mocks para APIs externas
- Dados de teste isolados

### **Ferramentas:**

- **Jest**: Framework de testes principal
- **Supertest**: Testes de API
- **Sequelize**: Testes de banco de dados
- **Nock**: Mock de APIs externas

## 📝 Convenções

### **Nomenclatura:**

- Arquivos de teste: `test-*.js`
- Testes unitários: `*.unit.test.js`
- Testes de integração: `*.integration.test.js`
- Testes E2E: `*.e2e.test.js`

### **Estrutura dos Testes:**

```javascript
describe("Módulo/Funcionalidade", () => {
  describe("Cenário específico", () => {
    it("deve fazer algo específico", () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## 🎯 Próximos Passos

### **Testes Faltantes:**

- [ ] Testes para rotas `/api/users`
- [ ] Testes para rotas `/api/clients`
- [ ] Testes para rotas `/api/autopecas`
- [ ] Testes para rotas `/api/sellers`
- [ ] Testes para rotas `/api/images`
- [ ] Testes para rotas `/api/notifications`

### **Melhorias:**

- [ ] Implementar testes de performance
- [ ] Adicionar testes de segurança
- [ ] Implementar testes de carga
- [ ] Adicionar testes de acessibilidade

---

**Última atualização**: 26/09/2025  
**Versão**: 1.0.0  
**Conformidade**: Especificação PeçaJá v1.0

