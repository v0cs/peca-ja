/**
 * Script para testar upload no AWS S3
 * 
 * Este script testa se a configuração do S3 está funcionando corretamente
 * antes de fazer merge para a branch main.
 * 
 * Uso:
 *   1. Configure as variáveis de ambiente do AWS S3 no arquivo .env
 *   2. Execute: node scripts/test-s3-upload.js
 * 
 * Variáveis de ambiente necessárias:
 *   - AWS_ACCESS_KEY_ID
 *   - AWS_SECRET_ACCESS_KEY
 *   - AWS_REGION
 *   - AWS_S3_BUCKET_NAME
 */

require("dotenv").config({ path: "../.env" });

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Cores para output no terminal
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

async function testS3Upload() {
  console.log("\n" + "=".repeat(60));
  log("🧪 TESTE DE UPLOAD PARA AWS S3", colors.cyan);
  console.log("=".repeat(60) + "\n");

  // 1. Verificar variáveis de ambiente
  log("📋 Passo 1: Verificando variáveis de ambiente...", colors.blue);
  
  const requiredVars = {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION || "us-east-1",
    AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
  };

  const missingVars = [];
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      missingVars.push(key);
      error(`   ${key}: NÃO CONFIGURADA`);
    } else {
      // Mascarar valores sensíveis
      const displayValue = key.includes("SECRET") || key.includes("KEY") 
        ? `${value.substring(0, 4)}****` 
        : value;
      success(`   ${key}: ${displayValue}`);
    }
  }

  if (missingVars.length > 0) {
    error("\n❌ ERRO: Variáveis de ambiente faltando!");
    console.log("\nConfigure as seguintes variáveis no arquivo .env:\n");
    missingVars.forEach(v => console.log(`   ${v}=seu-valor`));
    console.log("\nConsulte a documentação para obter essas credenciais.\n");
    process.exit(1);
  }

  // 2. Criar cliente S3
  log("\n📡 Passo 2: Criando cliente S3...", colors.blue);
  let s3Client;
  
  try {
    s3Client = new S3Client({
      region: requiredVars.AWS_REGION,
      credentials: {
        accessKeyId: requiredVars.AWS_ACCESS_KEY_ID,
        secretAccessKey: requiredVars.AWS_SECRET_ACCESS_KEY,
      },
    });
    success("   Cliente S3 criado com sucesso");
  } catch (err) {
    error(`   Erro ao criar cliente S3: ${err.message}`);
    process.exit(1);
  }

  // 3. Gerar arquivo de teste
  log("\n📝 Passo 3: Criando arquivo de teste...", colors.blue);
  
  const testFileName = `test-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.txt`;
  const testFileContent = `Este é um arquivo de teste criado em ${new Date().toISOString()}\nTeste de upload S3 - PeçaJá`;
  const testFilePath = path.join(__dirname, "..", "uploads", testFileName);
  
  // Criar pasta uploads se não existir
  const uploadsDir = path.dirname(testFilePath);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  fs.writeFileSync(testFilePath, testFileContent);
  success(`   Arquivo de teste criado: ${testFileName}`);
  info(`   Tamanho: ${fs.statSync(testFilePath).size} bytes`);

  // 4. Fazer upload para S3
  log("\n⬆️  Passo 4: Fazendo upload para S3...", colors.blue);
  
  let uploadedKey = testFileName;
  
  try {
    const fileBuffer = fs.readFileSync(testFilePath);
    
    const uploadCommand = new PutObjectCommand({
      Bucket: requiredVars.AWS_S3_BUCKET_NAME,
      Key: uploadedKey,
      Body: fileBuffer,
      ContentType: "text/plain",
    });

    await s3Client.send(uploadCommand);
    success(`   Upload concluído: ${uploadedKey}`);
  } catch (err) {
    error(`   Erro no upload: ${err.message}`);
    console.log("\nPossíveis causas:");
    console.log("   - Credenciais inválidas");
    console.log("   - Bucket não existe ou não está acessível");
    console.log("   - Permissões insuficientes");
    console.log("   - Região incorreta");
    
    // Limpar arquivo local
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    process.exit(1);
  }

  // 5. Verificar se o arquivo existe no S3
  log("\n🔍 Passo 5: Verificando se o arquivo existe no S3...", colors.blue);
  
  try {
    const headCommand = new HeadObjectCommand({
      Bucket: requiredVars.AWS_S3_BUCKET_NAME,
      Key: uploadedKey,
    });

    const metadata = await s3Client.send(headCommand);
    success("   Arquivo encontrado no S3");
    info(`   Tamanho: ${metadata.ContentLength} bytes`);
    info(`   Content-Type: ${metadata.ContentType}`);
    info(`   Última modificação: ${metadata.LastModified}`);
  } catch (err) {
    error(`   Erro ao verificar arquivo: ${err.message}`);
    
    // Limpar arquivo local
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    process.exit(1);
  }

  // 6. Gerar URL do arquivo
  log("\n🔗 Passo 6: Gerando URL do arquivo...", colors.blue);
  
  let fileUrl;
  if (requiredVars.AWS_REGION === "us-east-1") {
    fileUrl = `https://${requiredVars.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${uploadedKey}`;
  } else {
    fileUrl = `https://${requiredVars.AWS_S3_BUCKET_NAME}.s3.${requiredVars.AWS_REGION}.amazonaws.com/${uploadedKey}`;
  }
  
  success("   URL gerada:");
  info(`   ${fileUrl}`);
  
  warning("\n⚠️  NOTA: A URL pode não ser acessível se o bucket não estiver configurado como público.");
  warning("   Configure a política do bucket para permitir acesso público, ou use CloudFront.");

  // 7. Baixar e verificar conteúdo (opcional)
  log("\n⬇️  Passo 7: Baixando arquivo do S3 para verificação...", colors.blue);
  
  try {
    const getCommand = new GetObjectCommand({
      Bucket: requiredVars.AWS_S3_BUCKET_NAME,
      Key: uploadedKey,
    });

    const response = await s3Client.send(getCommand);
    const chunks = [];
    
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    
    const downloadedContent = Buffer.concat(chunks).toString("utf-8");
    
    if (downloadedContent === testFileContent) {
      success("   Conteúdo verificado: arquivo está correto");
    } else {
      error("   Conteúdo não corresponde ao arquivo original");
    }
  } catch (err) {
    error(`   Erro ao baixar arquivo: ${err.message}`);
  }

  // 8. Deletar arquivo de teste do S3
  log("\n🗑️  Passo 8: Removendo arquivo de teste do S3...", colors.blue);
  
  try {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: requiredVars.AWS_S3_BUCKET_NAME,
      Key: uploadedKey,
    });

    await s3Client.send(deleteCommand);
    success("   Arquivo removido do S3");
  } catch (err) {
    warning(`   Aviso: Erro ao remover arquivo de teste: ${err.message}`);
    warning("   Você pode precisar remover manualmente do bucket.");
  }

  // 9. Limpar arquivo local
  log("\n🧹 Passo 9: Limpando arquivo local...", colors.blue);
  
  try {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      success("   Arquivo local removido");
    }
  } catch (err) {
    warning(`   Aviso: Erro ao remover arquivo local: ${err.message}`);
  }

  // Resumo final
  console.log("\n" + "=".repeat(60));
  log("✅ TESTE CONCLUÍDO COM SUCESSO!", colors.green);
  console.log("=".repeat(60));
  log("\n🎉 A configuração do S3 está funcionando corretamente!", colors.green);
  log("   Você pode fazer merge para a branch main com segurança.", colors.green);
  console.log("\n");
}

// Executar teste
testS3Upload().catch((err) => {
  error(`\n❌ Erro fatal: ${err.message}`);
  console.error(err);
  process.exit(1);
});



