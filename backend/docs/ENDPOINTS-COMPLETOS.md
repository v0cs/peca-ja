# 🔌 ENDPOINTS COMPLETOS - API PeçaJá

**Base URL**: `http://localhost:3000/api`  
**Autenticação**: JWT via header `Authorization: Bearer TOKEN`

---

## 📑 ÍNDICE DE ENDPOINTS

### Autenticação (6 endpoints)
- POST `/auth/register/cliente` - Cadastro cliente
- POST `/auth/register/autopeca` - Cadastro autopeça
- POST `/auth/login` - Login
- POST `/auth/logout` - Logout
- POST `/auth/forgot-password` - Recuperar senha
- POST `/auth/reset-password` - Resetar senha

### Solicitações (5 endpoints)
- POST `/solicitacoes` - Criar solicitação
- GET `/solicitacoes` - Listar minhas solicitações
- GET `/solicitacoes/:id` - Buscar por ID
- PUT `/solicitacoes/:id` - Atualizar solicitação
- DELETE `/solicitacoes/:id` - Cancelar solicitação

### Autopeças (3 endpoints)
- GET `/autopecas/profile` - Ver perfil
- PUT `/autopecas/profile` - Atualizar perfil
- GET `/autopecas/solicitacoes-disponiveis` - Ver solicitações
- POST `/autopecas/solicitacoes/:id/atender` - Atender

### Vendedores (5 endpoints)
- GET `/vendedores` - Listar vendedores (admin)
- POST `/vendedores` - Criar vendedor (admin)
- PUT `/vendedores/:id` - Atualizar vendedor (admin)
- PUT `/vendedores/:id/ativar` - Ativar vendedor
- PUT `/vendedores/:id/inativar` - Inativar vendedor

### Operações Vendedor (3 endpoints)
- GET `/vendedor/dashboard` - Dashboard vendedor
- GET `/vendedor/solicitacoes-disponiveis` - Ver solicitações
- POST `/vendedor/solicitacoes/:id/atender` - Atender

### Notificações (7 endpoints)
- GET `/notificacoes` - Listar notificações
- GET `/notificacoes/:id` - Buscar por ID
- GET `/notificacoes/nao-lidas/contagem` - Contar não lidas
- PUT `/notificacoes/:id/ler` - Marcar como lida
- PUT `/notificacoes/ler-todas` - Marcar todas
- DELETE `/notificacoes/:id` - Deletar notificação
- DELETE `/notificacoes/lidas` - Deletar todas lidas

### Veículo (1 endpoint)
- GET `/vehicle/consultar?placa=ABC1234` - Consultar placa

---

## 📋 DETALHAMENTO POR ENDPOINT

### 🔐 AUTENTICAÇÃO

#### POST /auth/register/cliente

**Campos Obrigatórios:**
- `email` (string, único)
- `senha` (string, mínimo 6 caracteres)
- `nome_completo` (string)
- `celular` (string, formato: "(11)99999-9999")
- `cpf` (string)
- `cep` (string, 8 dígitos)
- `cidade` (string)
- `uf` (string, 2 caracteres)
- `termos_aceitos` (boolean, deve ser true)

**Campos Opcionais:**
- `consentimento_marketing` (boolean)

**Validações:**
- Email deve ser válido e único
- CPF deve ser válido
- Celular deve estar no formato correto
- Senha mínimo 6 caracteres

#### POST /auth/register/autopeca

**Campos Obrigatórios:**
- `email` (string, único)
- `senha` (string, mínimo 6 caracteres)
- `razao_social` (string)
- `cnpj` (string, formato: "12.345.678/0001-90")
- `telefone` (string, formato: "(11)3333-4444")
- `endereco_cep` (string)
- `endereco_rua` (string)
- `endereco_numero` (string)
- `endereco_bairro` (string)
- `endereco_cidade` (string)
- `endereco_uf` (string, 2 caracteres)
- `termos_aceitos` (boolean)

**Campos Opcionais:**
- `nome_fantasia` (string)
- `consentimento_marketing` (boolean)

**Validações:**
- CNPJ deve ser válido e único
- Telefone deve estar no formato correto

---

### 📝 SOLICITAÇÕES

#### POST /solicitacoes

**Tipo:** `multipart/form-data`

**Campos Obrigatórios:**
- `placa` (string) - Ex: "ABC1234" ou "ABC-1234"
- `marca` (string) - Ex: "FIAT"
- `modelo` (string) - Ex: "UNO"
- `ano_fabricacao` (number) - Ex: 2020
- `ano_modelo` (number) - Ex: 2020
- `categoria` (enum) - "carro" | "moto" | "caminhao" | "van" | "onibus" | "outro"
- `cor` (string) - Ex: "Branco"
- `descricao_peca` (string) - Ex: "Filtro de óleo original"

**Campos Opcionais:**
- `chassi` (string)
- `renavam` (string)
- `cidade_atendimento` (string) - Se não informado, usa do perfil
- `uf_atendimento` (string) - Se não informado, usa do perfil
- `imagens` (File[]) - Até 3 arquivos

**Comportamento Especial:**
- Se `placa` for fornecida, consulta API Veicular automaticamente
- Se API falhar, usa dados manuais fornecidos
- Gera notificações para autopeças da cidade

#### GET /solicitacoes

**Retorna:** Todas as solicitações do cliente autenticado

**Uso:** Lista para exibir no dashboard do cliente

#### GET /solicitacoes/:id

**Retorna:** Detalhes completos de uma solicitação específica

**Validação:** Só retorna se a solicitação pertencer ao cliente autenticado

#### PUT /solicitacoes/:id

**Campos Atualizáveis:**
- `descricao_peca`
- `cidade_atendimento`
- `uf_atendimento`
- `placa`
- `marca`
- `modelo`
- `ano_fabricacao`
- `ano_modelo`
- `categoria`
- `cor`
- `chassi`
- `renavam`

**Restrição:** Apenas solicitações com `status_cliente: "ativa"` podem ser editadas

#### DELETE /solicitacoes/:id

**Efeito:** 
- Muda `status_cliente` para "cancelada"
- Envia notificações para todos envolvidos
- Não deleta do banco (soft delete)

---

### 🏪 AUTOPEÇAS

#### GET /autopecas/solicitacoes-disponiveis

**Filtros Automáticos:**
- Mesma cidade da autopeça
- Status "ativa"
- Não atendida por esta autopeça

**Ordenação:** Por data de criação (mais recentes primeiro)

**Caso de Uso:** Dashboard da autopeça mostrando oportunidades

#### POST /autopecas/solicitacoes/:solicitacaoId/atender

**Validações:**
- Solicitação deve estar ativa
- Autopeça não pode ter atendido antes
- Outro vendedor da mesma autopeça não pode ter atendido

**Retorna:**
- Link do WhatsApp pronto
- Mensagem template
- Dados do cliente

**Notificações Geradas:**
- Cliente recebe "solicitacao_atendida"

---

### 👥 VENDEDORES

#### POST /vendedores (Admin da Autopeça)

**Campos:**
```json
{
  "nome_completo": "Carlos Vendedor",
  "email": "carlos@autopeca.com",
  "senha": "senha123"
}
```

**Efeito:**
- Cria usuário do tipo "vendedor"
- Associa à autopeça do admin autenticado
- Vendedor pode fazer login imediatamente

#### GET /vendedores (Admin da Autopeça)

**Retorna:** Todos os vendedores da autopeça autenticada

#### PUT /vendedores/:id/inativar

**Efeito:** 
- Muda campo `ativo` para `false`
- Vendedor não consegue mais fazer login
- Não deleta do banco

---

### 🔔 NOTIFICAÇÕES

#### GET /notificacoes

**Query Params Úteis:**
```
?page=1              # Paginação
&limit=20            # Itens por página
&tipo=nova_solicitacao  # Filtrar por tipo
&lida=false          # Apenas não lidas
```

**Uso Recomendado:**
- Para lista de notificações: `?limit=20`
- Para badge: usar `/nao-lidas/contagem`
- Para dropdown: `?limit=5&lida=false`

#### GET /notificacoes/nao-lidas/contagem

**Uso:** 
- Badge de notificações
- Atualizar a cada 30s (polling)
- Ou usar WebSocket (futuro)

**Exemplo:**
```tsx
useEffect(() => {
  const interval = setInterval(() => {
    fetchNotificationCount();
  }, 30000); // 30 segundos
  
  return () => clearInterval(interval);
}, []);
```

---

## 🎨 DESIGN PATTERNS RECOMENDADOS

### 1. Context API para Auth

```tsx
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (email, senha) => {
    const response = await api.post('/auth/login', { email, senha });
    const { token, usuario, perfil } = response.data.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ ...usuario, perfil }));
    setUser({ ...usuario, perfil });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 2. React Query para Cache

```tsx
// src/hooks/useSolicitacoes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function useSolicitacoes() {
  const queryClient = useQueryClient();

  // Listar solicitações
  const { data, isLoading, error } = useQuery({
    queryKey: ['solicitacoes'],
    queryFn: async () => {
      const response = await api.get('/solicitacoes');
      return response.data.data.solicitacoes;
    },
  });

  // Criar solicitação
  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post('/solicitacoes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidar cache para recarregar lista
      queryClient.invalidateQueries({ queryKey: ['solicitacoes'] });
    },
  });

  // Cancelar solicitação
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/solicitacoes/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes'] });
    },
  });

  return {
    solicitacoes: data,
    isLoading,
    error,
    createSolicitacao: createMutation.mutate,
    cancelSolicitacao: cancelMutation.mutate,
  };
}
```

### 3. Protected Routes

```tsx
// src/components/PrivateRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  tipo?: 'cliente' | 'autopeca' | 'vendedor';
}

export function PrivateRoute({ tipo }: PrivateRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (tipo && user.tipo_usuario !== tipo) {
    return <Navigate to="/unauthorized" />;
  }

  return <Outlet />;
}
```

---

## 📊 ESTRUTURAS DE RESPOSTA

### Resposta de Sucesso Padrão

```typescript
interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}
```

### Resposta de Erro Padrão

```typescript
interface ErrorResponse {
  success: false;
  message: string;
  errors: {
    [field: string]: string;
  };
}
```

---

## 🔍 FILTROS E BUSCA

### Solicitações para Autopeças

**Filtros Automáticos:**
- ✅ Mesma cidade/UF da autopeça
- ✅ Status "ativa"
- ✅ Não atendida por esta autopeça

**Como Implementar Filtros Adicionais:**

```tsx
// Frontend pode filtrar localmente
const filtrarSolicitacoes = (solicitacoes, filtros) => {
  return solicitacoes.filter(sol => {
    if (filtros.marca && sol.marca !== filtros.marca) return false;
    if (filtros.categoria && sol.categoria !== filtros.categoria) return false;
    if (filtros.busca && !sol.descricao_peca.toLowerCase().includes(filtros.busca.toLowerCase())) {
      return false;
    }
    return true;
  });
};
```

---

## 🖼️ UPLOAD DE IMAGENS

### Especificações

- **Máximo**: 3 imagens por solicitação
- **Formatos**: JPG, PNG, GIF, WEBP
- **Tamanho máximo**: 5MB por imagem
- **Campo**: `imagens` (array de arquivos)

### Exemplo Completo

```tsx
// src/components/ImageUpload.tsx
import React, { useState } from 'react';

export function ImageUpload({ onChange }) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).slice(0, 3);
    
    // Validar tamanho
    const validFiles = selectedFiles.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} é maior que 5MB`);
        return false;
      }
      return true;
    });

    setFiles(validFiles);
    onChange(validFiles);

    // Gerar previews
    const previewUrls = validFiles.map(file => URL.createObjectURL(file));
    setPreviews(previewUrls);
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        onChange={handleFileChange}
      />
      
      <div className="flex gap-2 mt-2">
        {previews.map((preview, index) => (
          <img
            key={index}
            src={preview}
            alt={`Preview ${index + 1}`}
            className="w-24 h-24 object-cover rounded"
          />
        ))}
      </div>
      
      <p className="text-sm text-gray-500">
        {files.length} de 3 imagens selecionadas
      </p>
    </div>
  );
}
```

---

## ⚡ CONSULTA AUTOMÁTICA DE VEÍCULO

### Como Funciona

1. Cliente digita a placa no formulário
2. Frontend faz blur do campo ou botão "Consultar"
3. Chama `GET /vehicle/consultar?placa=ABC1234`
4. Se sucesso, preenche campos automaticamente
5. Se falhar, mantém campos editáveis para preenchimento manual

### Exemplo de Implementação

```tsx
// src/components/VehicleForm.tsx
import React, { useState } from 'react';
import api from '../services/api';

export function VehicleForm() {
  const [placa, setPlaca] = useState('');
  const [dadosVeiculo, setDadosVeiculo] = useState(null);
  const [consultando, setConsultando] = useState(false);

  const consultarPlaca = async () => {
    if (!placa || placa.length < 7) return;
    
    setConsultando(true);
    try {
      const response = await api.get(`/vehicle/consultar?placa=${placa}`);
      const dados = response.data.data;
      
      setDadosVeiculo({
        marca: dados.marca,
        modelo: dados.modelo,
        ano_fabricacao: dados.ano_fabricacao,
        ano_modelo: dados.ano_modelo,
        categoria: dados.categoria,
        cor: dados.cor,
        chassi: dados.chassi,
        renavam: dados.renavam,
      });
      
      alert('Dados do veículo carregados com sucesso!');
    } catch (error) {
      alert('Não foi possível consultar a placa. Preencha manualmente.');
    } finally {
      setConsultando(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Placa (ABC1234)"
          value={placa}
          onChange={(e) => setPlaca(e.target.value.toUpperCase())}
          onBlur={consultarPlaca}
          maxLength={8}
        />
        <button onClick={consultarPlaca} disabled={consultando}>
          {consultando ? 'Consultando...' : 'Consultar'}
        </button>
      </div>

      {/* Campos preenchidos automaticamente ou manualmente */}
      <input
        type="text"
        placeholder="Marca"
        value={dadosVeiculo?.marca || ''}
        onChange={(e) => setDadosVeiculo({ ...dadosVeiculo, marca: e.target.value })}
      />
      
      {/* ... outros campos ... */}
    </div>
  );
}
```

---

## 🔔 SISTEMA DE NOTIFICAÇÕES IN-APP

### Tipos de Notificação por Usuário

#### 👤 Cliente Recebe:
- `solicitacao_atendida` - Quando autopeça/vendedor atende
- `solicitacao_cancelada` - Confirmação de cancelamento

#### 🏪 Autopeça Recebe:
- `nova_solicitacao` - Nova solicitação na cidade
- `vendedor_atendeu` - Seu vendedor atendeu
- `solicitacao_cancelada` - Cliente cancelou

#### 👥 Vendedor Recebe:
- `nova_solicitacao` - Nova disponível
- `perdeu_solicitacao` - Colega atendeu primeiro
- `solicitacao_cancelada` - Cliente cancelou

### Implementação Recomendada

```tsx
// src/components/NotificationBell.tsx
import React, { useState, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';

export function NotificationBell() {
  const { count, notifications, fetchNotifications, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = async (notification) => {
    // Marcar como lida
    await markAsRead(notification.id);
    
    // Navegar para a solicitação relacionada
    if (notification.metadados?.solicitacao_id) {
      window.location.href = `/solicitacoes/${notification.metadados.solicitacao_id}`;
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative">
        🔔
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5">
            {count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white shadow-lg rounded-lg">
          {notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-3 border-b cursor-pointer ${!notif.lida ? 'bg-blue-50' : ''}`}
            >
              <p className="font-semibold text-sm">{notif.titulo}</p>
              <p className="text-sm text-gray-600">{notif.mensagem}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(notif.data_criacao).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 ESTADOS DA APLICAÇÃO

### Estado Global Recomendado

```typescript
interface AppState {
  // Autenticação
  user: User | null;
  token: string | null;
  
  // Cliente
  minhasSolicitacoes: Solicitacao[];
  
  // Autopeça
  solicitacoesDisponiveis: Solicitacao[];
  meusVendedores: Vendedor[];
  
  // Vendedor
  estatisticas: {
    atendimentos_hoje: number;
    total_atendimentos: number;
    solicitacoes_disponiveis: number;
  };
  
  // Notificações
  notificacoes: Notificacao[];
  notificacoesNaoLidas: number;
  
  // UI
  loading: boolean;
  error: string | null;
}
```

---

## 🧪 TESTES SUGERIDOS PARA FRONTEND

### 1. Testes de Integração com API

```typescript
describe('Auth Flow', () => {
  it('deve fazer login com sucesso', async () => {
    const response = await api.post('/auth/login', {
      email: 'test@example.com',
      senha: 'senha123'
    });
    
    expect(response.data.success).toBe(true);
    expect(response.data.data.token).toBeDefined();
  });
});

describe('Solicitações', () => {
  it('deve criar solicitação com sucesso', async () => {
    const formData = new FormData();
    formData.append('placa', 'ABC1234');
    formData.append('descricao_peca', 'Filtro de óleo');
    // ... outros campos
    
    const response = await api.post('/solicitacoes', formData);
    
    expect(response.data.success).toBe(true);
    expect(response.data.data.solicitacao).toBeDefined();
  });
});
```

---

## 🎨 UI/UX RECOMENDAÇÕES

### Loading States

```tsx
{loading ? (
  <div className="flex justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
  </div>
) : (
  <SolicitacoesList solicitacoes={solicitacoes} />
)}
```

### Empty States

```tsx
{solicitacoes.length === 0 ? (
  <div className="text-center p-8">
    <p className="text-gray-500">Você ainda não tem solicitações</p>
    <button onClick={() => navigate('/nova-solicitacao')}>
      Criar Primeira Solicitação
    </button>
  </div>
) : (
  <SolicitacoesList solicitacoes={solicitacoes} />
)}
```

### Error States

```tsx
{error && (
  <div className="bg-red-50 border border-red-200 p-4 rounded">
    <p className="text-red-700">{error}</p>
    <button onClick={retry}>Tentar Novamente</button>
  </div>
)}
```

---

## 📱 RESPONSIVIDADE

### Breakpoints Recomendados

```css
/* Mobile First */
.container {
  padding: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

---

## ✅ VALIDAÇÕES NO FRONTEND

### Validação de Placa

```typescript
const validarPlaca = (placa: string): boolean => {
  // Mercosul: ABC1D23
  // Antigo: ABC-1234 ou ABC1234
  const regex = /^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$|^[A-Z]{3}-?[0-9]{4}$/;
  return regex.test(placa.replace(/-/g, ''));
};
```

### Validação de Email

```typescript
const validarEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};
```

### Validação de CPF

```typescript
const validarCPF = (cpf: string): boolean => {
  const numeros = cpf.replace(/\D/g, '');
  if (numeros.length !== 11) return false;
  
  // Implementar validação completa de CPF
  // ... algoritmo de validação
  
  return true;
};
```

### Validação de CNPJ

```typescript
const validarCNPJ = (cnpj: string): boolean => {
  const numeros = cnpj.replace(/\D/g, '');
  if (numeros.length !== 14) return false;
  
  // Implementar validação completa de CNPJ
  // ... algoritmo de validação
  
  return true;
};
```

---

## 🎯 PRÓXIMOS PASSOS

### 1. Começar pelo Básico
- ✅ Setup do projeto React
- ✅ Configurar Axios
- ✅ Implementar autenticação
- ✅ Criar rotas básicas

### 2. Implementar por Módulo
1. **Auth** - Login e cadastro
2. **Cliente** - Dashboard e criar solicitações
3. **Autopeça** - Ver e atender solicitações
4. **Vendedor** - Dashboard e atendimento
5. **Notificações** - Sistema in-app

### 3. Refinamentos
- Loading states
- Error handling
- Validações
- Responsividade
- Testes

---

## 📚 RECURSOS ÚTEIS

### Bibliotecas Recomendadas

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "tailwindcss": "^3.3.0"
  }
}
```

### Links Úteis

- **React Router**: https://reactrouter.com/
- **React Query**: https://tanstack.com/query/
- **Axios**: https://axios-http.com/
- **Tailwind CSS**: https://tailwindcss.com/

---

## 🎉 PRONTO PARA DESENVOLVER!

Você tem todas as informações necessárias para implementar um frontend completo e funcional!

### Documentos de Apoio

1. **Este documento** - Referência completa da API
2. `SISTEMA-NOTIFICACOES.md` - Detalhes de notificações
3. `EXEMPLO-USO-NOTIFICACOES.md` - Exemplos práticos
4. `API-REFERENCE-FRONTEND.md` - Guia principal

---

**Boa sorte no desenvolvimento do frontend!** 🚀

Qualquer dúvida, consulte a documentação ou teste os endpoints com Postman.

**PeçaJá - API Ready for Frontend** 🚗✨





