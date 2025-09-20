# Middleware de Autenticação JWT

Este documento explica como usar o middleware de autenticação JWT implementado no sistema.

## Arquivos Criados/Modificados

- `src/middleware/authMiddleware.js` - Middleware principal de autenticação
- `src/middleware/index.js` - Exporta o middleware
- `src/controllers/authController.js` - Adicionado método `me()`
- `src/routes/authRoutes.js` - Adicionada rota protegida `/me`

## Como Funciona

### 1. Middleware de Autenticação (`authMiddleware.js`)

O middleware verifica e valida tokens JWT nas requisições:

```javascript
const { authMiddleware } = require("../middleware");

// Aplicar middleware em uma rota
router.get("/protected-route", authMiddleware, controller.method);
```

**Funcionalidades:**

- ✅ Verifica header `Authorization: Bearer <token>`
- ✅ Valida token usando `JWT_SECRET` do `.env`
- ✅ Adiciona dados do usuário ao `req.user = { userId, tipo }`
- ✅ Retorna 401 para token inválido/ausente
- ✅ Retorna 401 com mensagem específica para token expirado

### 2. Rota Protegida de Exemplo

**GET `/api/auth/me`** - Retorna informações do usuário logado

#### Requisição:

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <seu_token_jwt>"
```

#### Resposta de Sucesso (200):

```json
{
  "success": true,
  "message": "Informações do usuário recuperadas com sucesso",
  "data": {
    "usuario": {
      "id": 1,
      "email": "usuario@exemplo.com",
      "tipo_usuario": "cliente",
      "ativo": true,
      "termos_aceitos": true,
      "data_aceite_terms": "2024-01-01T00:00:00.000Z",
      "consentimento_marketing": false,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    },
    "cliente": {
      "id": 1,
      "nome_completo": "João Silva",
      "telefone": "(11)999999999",
      "celular": "(11)999999999",
      "cidade": "São Paulo",
      "uf": "SP",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## Cenários de Erro

### 1. Token Ausente (401)

```bash
curl -X GET http://localhost:3000/api/auth/me
```

```json
{
  "success": false,
  "message": "Token de acesso não fornecido",
  "errors": {
    "authorization": "Header Authorization é obrigatório"
  }
}
```

### 2. Formato de Token Incorreto (401)

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Token <token>"
```

```json
{
  "success": false,
  "message": "Formato de token inválido",
  "errors": {
    "authorization": "Formato esperado: Bearer <token>"
  }
}
```

### 3. Token Inválido (401)

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer token_invalido"
```

```json
{
  "success": false,
  "message": "Token inválido",
  "errors": {
    "token": "Token de acesso inválido ou malformado"
  }
}
```

### 4. Token Expirado (401)

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token_expirado>"
```

```json
{
  "success": false,
  "message": "Token expirado",
  "errors": {
    "token": "Seu token de acesso expirou. Faça login novamente."
  }
}
```

### 5. Usuário Inativo (403)

```json
{
  "success": false,
  "message": "Conta inativa",
  "errors": {
    "conta": "Sua conta está inativa. Entre em contato com o suporte."
  }
}
```

## Como Usar em Outras Rotas

### 1. Proteger uma rota específica:

```javascript
const { authMiddleware } = require("../middleware");

router.get("/minha-rota-protegida", authMiddleware, (req, res) => {
  // req.user contém { userId, tipo }
  const userId = req.user.userId;
  const tipoUsuario = req.user.tipo;

  res.json({ message: "Rota protegida acessada!", userId });
});
```

### 2. Proteger múltiplas rotas:

```javascript
// Aplicar middleware a todas as rotas do router
router.use(authMiddleware);

router.get("/rota1", controller.method1);
router.get("/rota2", controller.method2);
router.post("/rota3", controller.method3);
```

### 3. Proteger rotas com diferentes níveis de acesso:

```javascript
// Middleware para verificar tipo de usuário
const requireAdmin = (req, res, next) => {
  if (req.user.tipo !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Acesso negado",
      errors: {
        authorization: "Apenas administradores podem acessar esta rota",
      },
    });
  }
  next();
};

// Rota apenas para admins
router.get("/admin-only", authMiddleware, requireAdmin, adminController.method);
```

## Testando o Middleware

Execute o arquivo de teste para verificar se tudo está funcionando:

```bash
# Certifique-se de que o servidor está rodando
npm run dev

# Em outro terminal, execute o teste
node test-protected-route.js
```

## Configuração Necessária

Certifique-se de que o arquivo `.env` contém:

```env
JWT_SECRET=sua_chave_secreta_jwt_muito_segura_aqui
```

## Segurança

- ✅ Tokens JWT têm expiração de 24 horas
- ✅ Senhas são hasheadas com bcrypt (cost 12)
- ✅ Validação rigorosa de formato de token
- ✅ Verificação de conta ativa
- ✅ Mensagens de erro padronizadas
- ✅ Logs de erro para debugging
