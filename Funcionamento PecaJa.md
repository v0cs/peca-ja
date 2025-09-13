# 📌 Como Funcionará o PeçaJá

## 🎯 Conceito Geral
O **PeçaJá** é uma plataforma que conecta **clientes** (donos de carros/oficinas) com **autopeças**, funcionando como um **marketplace de solicitações**.  
O cliente descreve a peça que precisa e as autopeças da cidade podem visualizar e entrar em contato sendo redireionado para o **WhatsApp**.

---

## 👥 Tipos de Usuários e Suas Funções

### 1. **CLIENTE (Dono do Carro/Oficina)**
**O que faz:**
- Cadastra-se (E-mail, Cidade, Celular e Senha)
- Faz login
- Cria solicitações descrevendo a peça que precisa
- Pode anexar fotos na solicitação
- Recebe contato das autopeças via WhatsApp
- Encerra a solicitação (fica no histórico)

**Fluxo típico:**
1. Faz login (Google OAuth ou E-mail/Senha)
2. Cria solicitação:  
   - Preenche **Placa do veículo** (sistema busca dados automaticamente; se der erro, é preenchido manualmente)  
   - Descreve a peça: *"Preciso do para-choque dianteiro"*  
   - Anexa fotos (opcional)  
3. Autopeças interessadas entram em contato via WhatsApp  
4. Negocia/compra via WhatsApp  
5. Marca a solicitação como **"concluída"** → vira histórico  

---

### 2. **AUTOPEÇA (Empresa)**
**O que faz:**
- Cadastra-se na plataforma (CNPJ, E-mail, Cidade, Endereço, Celular e Senha)
- Visualiza solicitações de clientes da sua cidade
- Filtra por **marca, modelo e ano do veículo**
- Entra em contato via WhatsApp
- Marca solicitações como atendidas (gera histórico)
- Gerencia equipe de vendedores

**Fluxo típico:**
1. Faz login (Google OAuth ou E-mail/Senha)  
2. Acessa painel com solicitações da cidade  
3. Filtra por marca, modelo e ano  
4. Seleciona solicitação e clica em **"Entrar em contato"**  
5. É redirecionada para o WhatsApp do cliente  
6. Negocia via WhatsApp  
7. Marca como **"lida/atendida"** e acessa o histórico  

**Fluxo de gerenciamento de vendedores:**
1. Faz login  
2. Acessa painel de gestão de vendedores  
3. Cadastra vendedores (Nome, E-mail e Senha)  
4. Pode adicionar, editar e excluir vendedores (**CRUD Padrão**)  

---

### 3. **VENDEDOR (Funcionário da Autopeça)**
**O que faz:**
- É cadastrado pela autopeça
- Faz login independente (E-mail/Senha)
- Visualiza as mesmas solicitações da autopeça
- Marca solicitações como **"lida"**
- Contata clientes via WhatsApp

**Diferenciais:**
- **Sistema anti-conflito:** se um vendedor marcar como "lida", os demais da mesma autopeça não veem mais a solicitação  
- **Controle pela autopeça:** o dono pode ativar/desativar vendedores  
- **Controle geral:** todos veem solicitações novas e histórico de atendidas  

---

## 🔄 Fluxos Principais da Aplicação

### Fluxo 1: Cliente Solicita Peça


### **Fluxo 1: Cliente Solicita Peça**
```
Cliente → Login → Cria Solicitação → Anexa Fotos
↓
Sistema notifica autopeças da cidade por e-mail
↓
Autopeças veem solicitação no painel
↓
Interessadas clicam "Contatar" → Redirecionamento para WhatsApp
↓
Cliente recebe mensagens no WhatsApp e negocia
```

### **Fluxo 2: Autopeça Gerencia Vendedores**
```
Autopeça → Login → Painel Admin → Cadastra Vendedores
↓
Vendedor recebe credenciais → Faz login
↓
Vendedor vê solicitações → Marca como "lida"
↓
Outros vendedores não veem mais essa solicitação
```

### **Fluxo 3: Controle de Visibilidade**
```
Solicitação Nova → Todos vendedores da autopeça veem
↓
Vendedor A marca como "lida" → Some do feed dos outros
↓
Vendedor A contata cliente → Negocia
↓
Se não der certo → "Desmarcar" → Volta para o feed
```

---

## 🏗️ **Arquitetura Técnica**

### **Frontend (React)**
- **Telas para Cliente**: Login, criar solicitação, histórico de solictações atividas e atendidas
- **Telas para Autopeça**: Login, painel solicitações, filtros, gestão vendedores
- **Telas para Vendedor**: Login, painel solicitações, marcar como lida
- **Telas comuns para Usuários**: CRUD para gerenciamento da conta 
- **Telas Responsivas**

### **Backend (Node.js + Express)**
- **API REST**: Endpoints para todas as funcionalidades
- **Autenticação**: JWT para sessões, Google OAuth, senhas criptografadas
- **Segurança**: Rate limiting, validação inputs, proteção LGPD

### **Integrações Externas**
- **Google OAuth**: Login simplificado
- **API Veicular**: Busca dados do carro pela placa
- **WhatsApp**: Redirecionamento direto para conversa
- **Email**: Notificações de novas solicitações

---

## 💡 **Diferenciais da Solução**

### **1. Foco na Localidade**
- Autopeças só veem clientes da mesma cidade
- Reduz ruído, aumenta relevância

### **2. Sistema Anti-Conflito**
- Múltiplos vendedores não brigam pelo mesmo cliente
- Organização interna das autopeças

### **3. Simplicidade na Comunicação**
- Direciona para o WhatsApp que todo mundo já conhece e utiliza no dia a dia
- Autopeças mantêm seu fluxo natural de atendimento

### **4. Automação Inteligente**
- Dados do veículo preenchidos automaticamente
- Notificações para autopeças

---

## 🎯 **Problema que Resolve**

### **Antes (Situação Atual):**
- Cliente liga pra 10 autopeças: "Oi, vocês têm para-choque do Civic 2018?"
- Autopeça perde clientes porque não sabem que ele existe
- Vendedores da mesma autopeça atendem o mesmo cliente sem saber

### **Depois (Com PeçaJá):**
- Cliente posta uma vez: "Preciso para-choque Civic 2018" + foto
- Todas autopeças da cidade veem simultaneamente
- Interessadas entram em contato organizadamente
- Cliente recebe várias opções sem ligar pra ninguém

---

## 📱 **Experiência do Usuário**

### **Para o Cliente:**
"Preciso de uma peça → Acesso a aplicação → Preencho + placa + descrição + foto → Recebo WhatsApp de várias autopeças → Escolho a melhor → Encerro solicitação"

### **Para a Autopeça:**
"Cadastro vendedores → Vejo solicitação no painel → Clico contatar → Converso no WhatsApp → Fecho venda"

### **Para o Vendedor:**
"Marco como 'lida' → Ninguém mais da equipe vê → Tenho exclusividade pra atender → Se não rolar, desmarco"

---

## 🚀 **Escalabilidade**

O sistema é pensado para crescer:
- **Arquitetura limpa**: Fácil manutenção e evolução
- **Multi-tenant**: Cada autopeça é independente

A ideia é começar simples (MVP) e evoluir baseado no feedback dos usuários reais.
