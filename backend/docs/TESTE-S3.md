# 🧪 Guia de Teste do AWS S3

Este guia explica como testar a integração com AWS S3 antes de fazer merge para a branch `main`.

## 📋 Pré-requisitos

1. **Conta AWS** com acesso ao S3
2. **Bucket S3 criado** na AWS
3. **Credenciais AWS** (Access Key ID e Secret Access Key)
4. **Permissões IAM** para o bucket (PutObject, GetObject, DeleteObject, HeadObject)

## 🔧 Configuração

### 1. Criar um Bucket S3

1. Acesse o [AWS Console](https://console.aws.amazon.com/s3/)
2. Crie um novo bucket (ex: `pecaja-uploads-dev` ou `pecaja-uploads-prod`)
3. Escolha a região (recomendado: mesma região onde você vai fazer deploy)
4. **Importante**: Configure as políticas de acesso conforme necessário

### 2. Criar Usuário IAM para Acesso ao S3

1. Vá para [IAM Console](https://console.aws.amazon.com/iam/)
2. Crie um novo usuário (ex: `pecaja-s3-uploader`)
3. Anexe uma política customizada com permissões mínimas:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::nome-do-seu-bucket/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::nome-do-seu-bucket"
    }
  ]
}
```

### 3. Gerar Access Keys

1. No IAM, selecione o usuário criado
2. Vá para a aba "Security credentials"
3. Clique em "Create access key"
4. Escolha "Application running outside AWS"
5. Copie o **Access Key ID** e **Secret Access Key** (você só verá o secret uma vez!)

### 4. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao arquivo `.env` na raiz do projeto:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=sua-access-key-id-aqui
AWS_SECRET_ACCESS_KEY=sua-secret-access-key-aqui
AWS_REGION=us-east-1  # ou sua região preferida
AWS_S3_BUCKET_NAME=nome-do-seu-bucket
```

**⚠️ IMPORTANTE**: 
- **NUNCA** commite o arquivo `.env` no Git
- Adicione `.env` ao `.gitignore`
- Use variáveis de ambiente seguras em produção

## 🧪 Executando o Teste

### Método 1: Script de Teste Standalone (Recomendado)

O script de teste verifica todos os aspectos da integração com S3:

```bash
# No diretório backend/
npm run test:s3

# Ou diretamente:
node scripts/test-s3-upload.js
```

O script irá:
1. ✅ Verificar se todas as variáveis de ambiente estão configuradas
2. ✅ Testar a conexão com o S3
3. ✅ Fazer upload de um arquivo de teste
4. ✅ Verificar se o arquivo foi enviado corretamente
5. ✅ Gerar a URL do arquivo
6. ✅ Baixar e verificar o conteúdo
7. ✅ Deletar o arquivo de teste (limpeza)

### Método 2: Testar com o Servidor em Execução

Você pode forçar o uso do S3 mesmo em ambiente de desenvolvimento:

1. **Adicione ao `.env`:**
```env
FORCE_S3=true
```

2. **Inicie o servidor:**
```bash
npm run dev
```

3. **Faça um upload real** através da API:
```bash
# Exemplo usando curl
curl -X POST http://localhost:3001/api/solicitacoes \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "images=@caminho/para/imagem.jpg" \
  -F "outros-campos=valores"
```

4. **Verifique no bucket S3** se o arquivo foi enviado

5. **Remova `FORCE_S3=true`** após o teste

## ✅ Checklist de Validação

Antes de fazer merge, certifique-se de que:

- [ ] O script `test:s3` executa sem erros
- [ ] O arquivo é enviado corretamente para o S3
- [ ] A URL gerada está correta e acessível (se bucket público)
- [ ] O arquivo pode ser baixado e verificado
- [ ] A limpeza do arquivo de teste funciona
- [ ] As variáveis de ambiente estão documentadas
- [ ] O código funciona tanto em desenvolvimento (local) quanto em produção (S3)

## 🐛 Troubleshooting

### Erro: "Access Denied"

**Causa**: Permissões IAM insuficientes ou credenciais incorretas.

**Solução**:
- Verifique se as credenciais estão corretas no `.env`
- Verifique se o usuário IAM tem as permissões necessárias
- Verifique se o bucket name está correto

### Erro: "Bucket não existe"

**Causa**: Nome do bucket incorreto ou bucket em outra região.

**Solução**:
- Verifique o nome exato do bucket no AWS Console
- Verifique se a região (`AWS_REGION`) está correta

### Erro: "URL não acessível"

**Causa**: Bucket não está configurado como público ou política bloqueada.

**Solução**:
- Configure a política do bucket para permitir acesso público (se necessário)
- Ou use CloudFront para servir os arquivos
- Ou use presigned URLs (requer ajuste no código)

### Erro: "Região incorreta"

**Causa**: A região especificada não corresponde à região do bucket.

**Solução**:
- Verifique a região do bucket no AWS Console
- Atualize `AWS_REGION` no `.env` para corresponder

## 📚 Recursos Adicionais

- [Documentação AWS S3](https://docs.aws.amazon.com/s3/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)
- [Políticas do S3 Bucket](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html)

## 🔒 Segurança

1. **Nunca commite credenciais** no código ou no Git
2. Use **variáveis de ambiente** em produção
3. Use **IAM roles** quando possível (ex: EC2, Lambda)
4. Aplique o **princípio do menor privilégio** nas permissões IAM
5. Rotacione as credenciais regularmente
6. Use **CloudFront** ou **presigned URLs** para acesso controlado

## 🚀 Próximos Passos

Após validar que o S3 está funcionando:

1. ✅ Faça commit das mudanças
2. ✅ Crie um Pull Request
3. ✅ Adicione as variáveis de ambiente no ambiente de produção
4. ✅ Configure as políticas do bucket de produção
5. ✅ Faça deploy e teste novamente em produção

