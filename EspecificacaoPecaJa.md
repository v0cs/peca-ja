# PeçaJá - Especificação Técnica e Funcional Completa

## CONCEITO CENTRAL
Plataforma web que conecta clientes (donos de veículos/oficinas) com autopeças locais através de solicitações de orçamentos. O cliente descreve a peça necessária e as autopeças da mesma cidade podem visualizar e entrar em contato via WhatsApp.

---

## ATORES DO SISTEMA

### 1. CLIENTE
**Dados de Cadastro:**
- E-mail (obrigatório)
- Cidade (obrigatório)  
- Celular (obrigatório)
- Senha (obrigatório)

**Funcionalidades:**
- Cadastro e login (email/senha OU Google OAuth)
- Criar solicitações de peças
- Anexar até 3 fotos por solicitação (opcional)
- Visualizar histórico de solicitações (ativas e concluídas)
- Encerrar solicitações quando obtiver os orçamentos necessários

**Fluxo de Solicitação:**
1. Login na aplicação
2. Criar nova solicitação:
   - Inserir placa do veículo → API consulta dados automaticamente
   - Se API falhar → preenchimento manual dos dados do veículo
   - Descrever a peça necessária (campo texto livre)
   - Anexar fotos (opcional, até 3 imagens)
3. Submeter solicitação
4. Sistema notifica autopeças da cidade automaticamente
5. Receber contatos via WhatsApp
6. Negociar via WhatsApp
7. Retornar à aplicação e marcar como "Concluída"

### 2. AUTOPEÇA  
**Dados de Cadastro:**
- CNPJ (obrigatório)
- E-mail (obrigatório)
- Cidade (obrigatório)
- Endereço completo (obrigatório)
- Celular (obrigatório)
- Senha (obrigatório)

**Funcionalidades Principais:**
- Cadastro e login (email/senha OU Google OAuth)
- Visualizar solicitações da mesma cidade
- Filtrar solicitações por marca, modelo e ano do veículo
- Entrar em contato com clientes via WhatsApp
- Marcar solicitações como "Atendidas"
- Visualizar histórico completo de solicitações atendidas

**Gestão de Vendedores:**
- Cadastrar vendedores (Nome, E-mail, Senha)
- Editar dados de vendedores
- Excluir vendedores
- Sem dashboards ou métricas - apenas CRUD básico

**Fluxo de Atendimento:**
1. Login na aplicação
2. Visualizar painel de solicitações da cidade
3. Aplicar filtros por dados do veículo (opcional)
4. Selecionar solicitação de interesse
5. Clicar "Entrar em contato" → redirecionamento para WhatsApp
6. Negociar via WhatsApp
7. Retornar à aplicação e marcar como "Atendida"

### 3. VENDEDOR
**Dados de Cadastro (feito pela autopeça):**
- Nome completo
- E-mail
- Senha

**Funcionalidades:**
- Login independente com email/senha
- Visualizar mesmas solicitações da autopeça proprietária
- Marcar solicitações como "Atendida" (sistema anti-conflito)
- Entrar em contato via WhatsApp
- Visualizar solicitações atendidas

**Sistema Anti-Conflito:**
- Quando vendedor marca solicitação como "Lida" → outros vendedores da mesma autopeça não veem mais
- Vendedor pode "Desmarcar" para devolver ao pool comum
- Autopeça proprietária sempre vê todas as solicitações
- Histórico de atendimentos fica visível para autopeça e vendedores

---

## REGRAS DE NEGÓCIO CRÍTICAS

### Visibilidade Geográfica
- Autopeças e vendedores só veem solicitações da mesma cidade do cliente
- Sistema deve validar cidade no cadastro

### Controle de Acesso de Vendedores  
- Vendedores só acessam dados da autopeça que os cadastrou
- Vendedores não podem cadastrar outros vendedores
- Autopeça pode excluir vendedor a qualquer momento
- Vendedor excluído perde acesso imediatamente

### Fluxo de Solicitações
- Solicitação sempre começa como "Nova"
- Cliente pode encerrar a qualquer momento (status "Concluída")
- Autopeça/Vendedor pode marcar como "Atendida" (uso interno para gerenciamento, sem impacto para o cliente) 
- Solicitação encerrada pelo cliente não aceita mais interações

### Histórico e Auditoria
- Todas as solicitações ficam no **histórico** após conclusão pelo cliente (status "Concluída")  
- A autopeça/vendedor pode marcar solicitações como **"Atendida"** para gerenciamento interno; essas marcações também ficam registradas no histórico  
- O histórico deve incluir dados essenciais para uso do sistema e rastreabilidade:
  - Status da solicitação (Nova, Atendida, Concluída)  
  - Data e hora de criação, alteração e encerramento  
  - Usuário responsável pela ação (cliente, autopeça ou vendedor)  
  - Dados básicos de identificação do cliente e do veículo (nome, e-mail, telefone, placa, modelo, ano)  
- **Auditoria:** logs técnicos devem registrar todas as ações importantes para segurança e conformidade, como:
  - Login e autenticação (horário e usuário)  
  - Criação, alteração e exclusão de solicitações  
  - Cadastro, edição e remoção de vendedores  
  - Consentimentos e aceite de termos de uso  
- **Conformidade LGPD:**
  - Apenas os dados necessários para a finalidade da plataforma devem ser mantidos  
  - Dados sensíveis ou irrelevantes não devem ser armazenados  
  - O cliente pode solicitar exclusão ou anonimização de seus dados pessoais  

---

## ARQUITETURA TÉCNICA

### Frontend (React.js)
**Páginas Cliente:**
- Login/Cadastro
- Dashboard (solicitações ativas)
- Criar solicitação
- Histórico de solicitações
- Perfil Pessoal

**Páginas Autopeça:**
- Login/Cadastro  
- Dashboard (solicitações da cidade)
- Filtros avançados
- Gestão de vendedores (CRUD)
- Histórico de atendimentos
- Perfil Autopeca

**Páginas Vendedor:**
- Login
- Dashboard (mesmas solicitações da autopeça)
- Histórico de atendimentos
- Perfil Vendedor

**Middleware Obrigatórios:**
- Autenticação JWT
- Rate limiting
- Validação de entrada
- Logs de auditoria
- Proteção LGPD

### Integrações Externas
- **Google OAuth 2.0**: Autenticação social
- **API Veicular**: Consulta dados por placa (com fallback manual)
- **WhatsApp Business API**: Redirecionamento para chat
- **SMTP**: Notificações por e-mail

---

## FLUXOS CRÍTICOS DO SISTEMA

### Fluxo 1: Nova Solicitação
```
Cliente cria solicitação → Sistema consulta API veicular → Notifica autopeças da cidade por email → Autopeças/vendedores visualizam no painel → Interessados contatam via WhatsApp → Negociação externa → Cliente/autopeça marca como concluída/atendida
```

### Fluxo 2: Sistema Anti-Conflito
```  
Solicitação Nova → Visível para todos vendedores da autopeça → Vendedor A marca "Atendida" → Invisível para vendedores B, C, D → Vendedor A negocia → Se não fechar, pode "Desmarcar" → Volta a ser visível para todos
```

### Fluxo 3: Gestão de Vendedores
```
Autopeça cadastra vendedor → Sistema gera credenciais → Vendedor faz login independente → Acessa solicitações da cidade → Marca como atendida 
```

---

## VALIDAÇÕES E RESTRIÇÕES

### Cadastros
- E-mail único por tipo de usuário
- CNPJ válido e único para autopeças
- Cidade obrigatória para filtros geográficos
- Senhas com mínimo 8 caracteres

### Solicitações  
- Máximo 3 imagens por solicitação
- Imagens até 5MB cada
- Formatos permitidos: JPG, PNG, WEBP
- Descrição obrigatoria
- Dados do veiculo obrigatorio

### Segurança
- Rate limiting: 100 requests/hora por IP
- JWT com expiração em 24h
- Senhas hasheadas com bcrypt
- Validação de todos inputs
- Logs de auditoria completos

---

## NOTIFICAÇÕES AUTOMÁTICAS

### Para Autopeças
- Nova solicitação na cidade (email imediato)
- Recuperação de senha 
- Confirmação de cadastro de vendedores
- Notificações padrões 

### Para Clientes  
- Confirmação de solicitação criada
- Recuperação de senha
- Sem spam - comunicação mínima
- Notificações padrões 

---

## STATUS E ESTADOS

### Solicitação Cliente
- **Ativa**: Recém-criada, visível para autopeças
- **Concluída**: Encerrada 

### Solicitação Autopeca
- **Atendida**: Marcada por autopeça/vendedor

### Vendedor
- **Ativo**: Pode acessar sistema
- **Inativo**: Cadastrado mas sem acesso

### Visibilidade (por vendedor)
- **Não Atendida**: Visível no feed principal
- **Atendida**: Invisível para outros vendedores da mesma autopeça

---

## DIFERENCIAIS COMPETITIVOS

1. **Foco Geográfico**: Apenas conexões locais relevantes
2. **Sistema Anti-Conflito**: Vendedores não competem internamente  
3. **Integração WhatsApp**: Usa ferramenta já conhecida
4. **Automação**: Dados veiculares preenchidos automaticamente
5. **Simplicidade**: Sem over-engineering, foco no essencial

---

## CONSIDERAÇÕES DE IMPLEMENTAÇÃO

### Prioridade MVP
1. Cadastros e autenticação básica
2. CRUD de solicitações
3. API para busca de iformações do veiculo
4. Sistema de visibilidade por vendedor
5. Redirecionamento WhatsApp
6. Notificações por email

Esta especificação deve servir como referência única e completa para desenvolvimento, garantindo que todas as funcionalidades estejam alinhadas com o conceito original do PeçaJá.
