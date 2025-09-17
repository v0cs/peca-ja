-- =====================================================
-- ESTRUTURA DO BANCO DE DADOS - PeçaJá
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- =====================================================
-- TABELA: usuarios
-- =====================================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    tipo_usuario VARCHAR(20) NOT NULL CHECK (tipo_usuario IN ('cliente', 'autopeca', 'vendedor')),
    google_id VARCHAR(255) UNIQUE,
    ativo BOOLEAN DEFAULT true,
    termos_aceitos BOOLEAN DEFAULT false,
    data_aceite_terms TIMESTAMP,
    consentimento_marketing BOOLEAN DEFAULT false,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: clientes 
-- =====================================================
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome_completo VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    celular VARCHAR(20) NOT NULL CHECK (celular ~ '^\([0-9]{2}\)[0-9]{8,9}$'),
    cidade VARCHAR(100) NOT NULL,
    uf VARCHAR(2) NOT NULL,
    data_exclusao_pedida TIMESTAMP,
    data_anonimizacao TIMESTAMP,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: autopecas 
-- =====================================================
CREATE TABLE autopecas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    razao_social VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    telefone VARCHAR(20) NOT NULL CHECK (telefone ~ '^\([0-9]{2}\)[0-9]{8,9}$'),
    endereco_rua VARCHAR(255) NOT NULL,
    endereco_numero VARCHAR(20) NOT NULL,
    endereco_bairro VARCHAR(100) NOT NULL,
    endereco_cidade VARCHAR(100) NOT NULL,
    endereco_uf VARCHAR(2) NOT NULL,
    endereco_cep VARCHAR(10) NOT NULL,
    data_exclusao_pedida TIMESTAMP,
    data_anonimizacao TIMESTAMP,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: vendedores
-- =====================================================
CREATE TABLE vendedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    autopeca_id UUID NOT NULL REFERENCES autopecas(id) ON DELETE CASCADE,
    nome_completo VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT true,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: solicitacoes
-- =====================================================
CREATE TABLE solicitacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    descricao_peca TEXT NOT NULL,
    status_cliente VARCHAR(20) DEFAULT 'ativa' CHECK (status_cliente IN ('ativa', 'concluida', 'cancelada')),
    cidade_atendimento VARCHAR(100) NOT NULL,
    uf_atendimento VARCHAR(2) NOT NULL,
    
    placa VARCHAR(10) NOT NULL CHECK (placa ~ '^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$' OR placa ~ '^[A-Z]{3}-?[0-9]{4}$'),
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    ano_fabricacao INTEGER NOT NULL CHECK (ano_fabricacao BETWEEN 1900 AND EXTRACT(YEAR FROM CURRENT_DATE) + 1),
    ano_modelo INTEGER NOT NULL CHECK (ano_modelo BETWEEN 1900 AND EXTRACT(YEAR FROM CURRENT_DATE) + 1),
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('carro', 'moto', 'caminhao', 'van', 'onibus', 'outro')),
    cor VARCHAR(50) NOT NULL CHECK (cor <> ''),
    chassi VARCHAR(50) DEFAULT 'Não informado',
    renavam VARCHAR(20) DEFAULT 'Não informado',
    
    origem_dados_veiculo VARCHAR(20) DEFAULT 'manual' CHECK (origem_dados_veiculo IN ('api', 'manual', 'api_com_fallback')),
    api_veicular_metadata JSONB,
    
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_conclusao TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: imagens_solicitacao
-- =====================================================
CREATE TABLE imagens_solicitacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solicitacao_id UUID NOT NULL REFERENCES solicitacoes(id) ON DELETE CASCADE,
    nome_arquivo VARCHAR(255) NOT NULL,
    nome_arquivo_fisico VARCHAR(255) NOT NULL UNIQUE,
    caminho_arquivo VARCHAR(500) NOT NULL,
    tamanho_arquivo INTEGER NOT NULL CHECK (tamanho_arquivo <= 5242880),
    tipo_mime VARCHAR(50) NOT NULL CHECK (tipo_mime IN ('image/jpeg','image/png','image/webp')),
    extensao VARCHAR(10) NOT NULL,
    ordem_exibicao INTEGER DEFAULT 1,
    data_upload TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: solicitacoes_atendimento
-- =====================================================
CREATE TABLE solicitacoes_atendimento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solicitacao_id UUID NOT NULL REFERENCES solicitacoes(id) ON DELETE CASCADE,
    autopeca_id UUID REFERENCES autopecas(id) ON DELETE CASCADE,
    vendedor_id UUID REFERENCES vendedores(id) ON DELETE CASCADE,
    status_atendimento VARCHAR(20) DEFAULT 'nao_lida' CHECK (status_atendimento IN ('nao_lida', 'lida', 'atendida', 'desmarcada')),
    data_marcacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_autopeca_ou_vendedor CHECK (
        (autopeca_id IS NOT NULL AND vendedor_id IS NULL) OR
        (autopeca_id IS NULL AND vendedor_id IS NOT NULL)
    ),
    UNIQUE(solicitacao_id, autopeca_id, vendedor_id)
);

-- =====================================================
-- TABELA: historico_solicitacoes
-- =====================================================
CREATE TABLE historico_solicitacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solicitacao_id UUID NOT NULL REFERENCES solicitacoes(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    status_anterior VARCHAR(20),
    status_novo VARCHAR(20) NOT NULL,
    motivo TEXT,
    data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: notificacoes (ATUALIZADA)
-- =====================================================
CREATE TABLE notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_notificacao VARCHAR(50) NOT NULL CHECK (tipo_notificacao IN (
        'nova_solicitacao', 
        'recuperacao_senha', 
        'confirmacao_cadastro', 
        'vendedor_cadastrado',
        'solicitacao_concluida',
        'novo_vendedor',
        'autopeca_cadastrada',
        'vendedor_inativado',
        'termos_atualizados',
        'marketing_comunicacao'
    )),
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT false,
    enviada_email BOOLEAN DEFAULT false,
    data_envio_email TIMESTAMP,
    metadados JSONB,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: tokens_reset_senha
-- =====================================================
CREATE TABLE tokens_reset_senha (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    usado BOOLEAN DEFAULT false,
    data_expiracao TIMESTAMP NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: logs_auditoria
-- =====================================================
CREATE TABLE logs_auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    acao VARCHAR(100) NOT NULL,
    tabela_afetada VARCHAR(100),
    registro_id UUID,
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_origem INET,
    user_agent TEXT,
    data_acao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- VIEWS 
-- =====================================================

CREATE OR REPLACE VIEW vw_solicitacoes_completas AS
SELECT 
    s.id,
    s.descricao_peca,
    s.status_cliente,
    s.cidade_atendimento,
    s.uf_atendimento,
    s.data_criacao,
    s.data_conclusao,
    -- Dados do veículo
    s.placa,
    s.marca,
    s.modelo,
    s.ano_fabricacao,
    s.ano_modelo,
    s.categoria,
    s.cor,
    s.chassi,
    s.renavam,
    s.origem_dados_veiculo,
    -- Dados do cliente
    c.nome_completo as cliente_nome,
    c.telefone as cliente_telefone,
    c.celular as cliente_celular,
    c.cidade as cliente_cidade,
    c.uf as cliente_uf,
    u.email as cliente_email,
    -- Contagem de imagens
    COALESCE(img.total_imagens, 0) as total_imagens,
    -- Status de atendimento
    sa.status_atendimento,
    sa.data_marcacao as data_marcacao_atendimento
FROM solicitacoes s
JOIN clientes c ON s.cliente_id = c.id
JOIN usuarios u ON c.usuario_id = u.id
LEFT JOIN (
    SELECT solicitacao_id, COUNT(*) as total_imagens 
    FROM imagens_solicitacao 
    GROUP BY solicitacao_id
) img ON s.id = img.solicitacao_id
LEFT JOIN solicitacoes_atendimento sa ON s.id = sa.solicitacao_id;

-- =====================================================
-- ÍNDICES PARA MELHOR PERFORMANCE
-- =====================================================

-- Índices para tabela usuarios
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_google_id ON usuarios(google_id);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo_usuario);

-- Índices para tabela clientes
CREATE INDEX idx_clientes_usuario_id ON clientes(usuario_id);
CREATE INDEX idx_clientes_cidade_uf ON clientes(cidade, uf);

-- Índices para tabela autopecas
CREATE INDEX idx_autopecas_usuario_id ON autopecas(usuario_id);
CREATE INDEX idx_autopecas_cidade_uf ON autopecas(endereco_cidade, endereco_uf);

-- Índices para tabela vendedores
CREATE INDEX idx_vendedores_usuario_id ON vendedores(usuario_id);
CREATE INDEX idx_vendedores_autopeca_id ON vendedores(autopeca_id);

-- Índices para tabela solicitacoes
CREATE INDEX idx_solicitacoes_cliente_id ON solicitacoes(cliente_id);
CREATE INDEX idx_solicitacoes_cidade_uf ON solicitacoes(cidade_atendimento, uf_atendimento);
CREATE INDEX idx_solicitacoes_status ON solicitacoes(status_cliente);

-- Índices para tabela solicitacoes_atendimento
CREATE INDEX idx_sol_atendimento_status ON solicitacoes_atendimento(status_atendimento);
CREATE INDEX idx_sol_atendimento_sol_id ON solicitacoes_atendimento(solicitacao_id);

-- Índices para tabela notificacoes
CREATE INDEX idx_notificacoes_usuario_id ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_tipo ON notificacoes(tipo_notificacao);
CREATE INDEX idx_notificacoes_lida ON notificacoes(lida);

-- Índices para tabela tokens_reset_senha
CREATE INDEX idx_tokens_usuario_id ON tokens_reset_senha(usuario_id);
CREATE INDEX idx_tokens_expiracao ON tokens_reset_senha(data_expiracao);

-- Índices para tabela logs_auditoria
CREATE INDEX idx_logs_usuario_id ON logs_auditoria(usuario_id);
CREATE INDEX idx_logs_data_acao ON logs_auditoria(data_acao);