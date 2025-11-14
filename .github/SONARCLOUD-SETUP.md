# Configuração do SonarCloud

Este documento descreve como configurar o SonarCloud para análise automática do código.

## Arquivos Criados

1. **`.github/workflows/build.yml`** - Workflow do GitHub Actions para executar a análise
2. **`sonar-project.properties`** - Configuração do projeto SonarCloud
3. **`frontend/vite.config.js`** - Atualizado com configuração de coverage para Vitest

## Pré-requisitos

1. Conta no [SonarCloud](https://sonarcloud.io)
2. Projeto vinculado à organização `v0cs`
3. Token de autenticação do SonarCloud

## Configuração do Secret no GitHub

Para que o workflow funcione, você precisa adicionar o token do SonarCloud como secret no GitHub:

1. Acesse as configurações do repositório no GitHub
2. Vá em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Nome: `SONAR_TOKEN`
5. Valor: Cole o token do SonarCloud (você pode obtê-lo em: https://sonarcloud.io/account/security)
6. Clique em **Add secret**

## Obter o Token do SonarCloud

1. Faça login no [SonarCloud](https://sonarcloud.io)
2. Clique no seu avatar no canto superior direito
3. Vá em **My Account** → **Security**
4. Em **Generate Tokens**, crie um novo token:
   - Name: `GitHub Actions - peca-ja`
   - Type: **Project Analysis Token**
   - Expiration: Escolha o período desejado
5. Clique em **Generate** e copie o token

## Como Funciona

O workflow será executado automaticamente quando:

- Houver um push nas branches `main` ou `develop`
- Houver um pull request aberto, sincronizado ou reaberto

### Etapas do Workflow

1. **Checkout do código** - Clona o repositório com histórico completo
2. **Setup Node.js** - Configura o Node.js v20
3. **Instalação de dependências** - Instala dependências do backend e frontend
4. **Testes do Backend** - Executa testes com Jest e gera coverage
5. **Testes do Frontend** - Executa testes com Vitest e gera coverage
6. **Análise SonarQube** - Envia código e coverage para o SonarCloud

## Configuração do Projeto no SonarCloud

Os seguintes parâmetros estão configurados:

- **Project Key**: `v0cs_peca-ja`
- **Organization**: `v0cs`
- **Project Name**: `Peça Já`
- **Sources**: `backend/src`, `frontend/src`
- **Tests**: `backend/tests`, `frontend/src`
- **Coverage**: Gerado automaticamente pelos testes

## Exclusões

Os seguintes arquivos/diretórios são excluídos da análise:

- `node_modules/`
- `dist/`, `build/`
- `coverage/`
- `uploads/`
- Arquivos de teste (`*.test.js`, `*.spec.js`, etc.)
- Arquivos de configuração de teste

## Verificar Resultados

Após a execução do workflow, você pode ver os resultados em:

- **GitHub Actions**: Na aba "Actions" do repositório
- **SonarCloud**: https://sonarcloud.io/project/overview?id=v0cs_peca-ja

## Troubleshooting

### Erro de Autenticação

Se você receber erro de autenticação:
- Verifique se o secret `SONAR_TOKEN` está configurado corretamente
- Certifique-se de que o token não expirou

### Erro no Coverage

Se houver problemas com coverage:
- Verifique se os testes estão passando localmente
- Confirme que os caminhos em `sonar.javascript.lcov.reportPaths` estão corretos

### Workflow não executando

- Certifique-se de que o workflow está habilitado em **Settings** → **Actions**
- Verifique se o push foi feito para `main` ou `develop`

## Executar Localmente (Opcional)

Para testar a análise localmente, você pode usar o SonarScanner:

```bash
# Instalar SonarScanner
npm install -g sonarqube-scanner

# Executar análise (necessário ter o SONAR_TOKEN configurado)
sonar-scanner \
  -Dsonar.login=SEU_TOKEN_AQUI
```

## Próximos Passos

1. Configure o secret `SONAR_TOKEN` no GitHub
2. Faça um push para `develop` ou `main`
3. Verifique a execução do workflow na aba Actions
4. Acesse o dashboard do SonarCloud para ver os resultados
5. Configure Quality Gates personalizados (opcional)

## Quality Gates (Opcional)

No SonarCloud, você pode configurar Quality Gates para definir critérios de qualidade:

1. Acesse o projeto no SonarCloud
2. Vá em **Project Settings** → **Quality Gates**
3. Configure os limites desejados para:
   - Cobertura de código
   - Duplicação
   - Vulnerabilidades
   - Code Smells
   - Bugs

## Suporte

Para mais informações, consulte:
- [Documentação do SonarCloud](https://docs.sonarcloud.io)
- [GitHub Actions SonarQube Scan](https://github.com/SonarSource/sonarqube-scan-action)





