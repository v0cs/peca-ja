# 🚀 Início Rápido - Testes Postman

**5 minutos para validar todo o backend!**

---

## 📦 1. Importar no Postman

1. Abrir Postman
2. **Import** → Selecionar `PecaJa-Backend.postman_collection.json`
3. **Import** → Selecionar `PecaJa-Backend.postman_environment.json`
4. Selecionar environment "PeçaJá Backend - Development"

---

## ▶️ 2. Iniciar Backend

```bash
cd backend
npm install
npm run dev
```

Servidor rodando em: **http://localhost:5000**

---

## ✅ 3. Testar em Sequência

### Fluxo Mínimo (5 min):

1. **Health Check** → API Health ✅
2. **Autenticação** → Registrar Cliente ✅
3. **Autenticação** → Registrar Autopeça ✅
4. **Autenticação** → Login Cliente ✅ (token salvo automaticamente)
5. **Autenticação** → Login Autopeça ✅ (token salvo automaticamente)
6. **Solicitações** → Criar Solicitação ✅ (ID salvo automaticamente)
7. **Autopeças** → Listar Solicitações Disponíveis ✅
8. **Autopeças** → Marcar Como Atendida ✅ (gera WhatsApp)
9. **Notificações** → Listar Notificações ✅
10. **Clientes** → Get Profile ✅

**Pronto!** Se esses 10 requests passarem, o backend está funcionando! 🎉

---

## 🔑 Dica Rápida

Os **tokens JWT** são salvos **automaticamente** após login!

Você pode rodar requests protegidos sem copiar/colar tokens manualmente.

---

## 📚 Documentação Completa

Para testes detalhados, veja:

- **[GUIA-TESTES-POSTMAN.md](./docs/GUIA-TESTES-POSTMAN.md)** - Guia completo
- **[ANALISE-SISTEMA.md](./docs/ANALISE-SISTEMA.md)** - Análise técnica

---

## 🐛 Problemas?

### Backend não inicia?

```bash
# Verificar se PostgreSQL está rodando
# Verificar .env configurado
# Executar migrations: npm run db:migrate
```

### Erro 409 (Email já existe)?

- Mudar emails no environment OU
- Usar emails diferentes

### Erro 401 (Unauthorized)?

- Fazer login novamente
- Token será atualizado automaticamente

---

**Boa sorte! 🚀**
