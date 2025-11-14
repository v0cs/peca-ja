/**
 * Script temporário para ativar usuário como vendedor
 * Uso: node scripts/ativar-vendedor.js <email> [autopeca_id]
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { sequelize } = require("../src/config/database");
const db = require("../src/models");
const { Usuario, Vendedor, Autopeca } = db;

const EMAIL = process.argv[2] || "pedroteste@gmail.com";
const AUTOPECA_ID = process.argv[3]; // Opcional - se não fornecido, tentará usar um existente

async function ativarVendedor() {
  try {
    console.log(`\n🔍 Buscando usuário: ${EMAIL}\n`);

    // Buscar usuário
    const usuario = await Usuario.findOne({
      where: { email: EMAIL.toLowerCase().trim() },
      include: [
        {
          model: Vendedor,
          as: "vendedores",
          include: [
            {
              model: Autopeca,
              as: "autopeca",
              attributes: ["id", "razao_social", "nome_fantasia"],
            },
          ],
        },
        {
          model: Autopeca,
          as: "autopeca",
          attributes: ["id", "razao_social", "nome_fantasia"],
        },
      ],
    });

    if (!usuario) {
      console.error(`❌ Usuário com email ${EMAIL} não encontrado.`);
      process.exit(1);
    }

    console.log(`✅ Usuário encontrado:`);
    console.log(`   ID: ${usuario.id}`);
    console.log(`   Email: ${usuario.email}`);
    console.log(`   Tipo: ${usuario.tipo_usuario}`);
    console.log(`   Ativo: ${usuario.ativo}\n`);

    // Verificar se já existe vendedor vinculado
    const vendedorExistente = usuario.vendedores && usuario.vendedores.length > 0 
      ? usuario.vendedores[0] 
      : null;

    if (vendedorExistente) {
      console.log(`📋 Vendedor existente encontrado:`);
      console.log(`   ID: ${vendedorExistente.id}`);
      console.log(`   Nome: ${vendedorExistente.nome_completo}`);
      console.log(`   Autopeça: ${vendedorExistente.autopeca?.nome_fantasia || vendedorExistente.autopeca?.razao_social || 'N/A'}`);
      console.log(`   Ativo: ${vendedorExistente.ativo}\n`);

      // Ativar vendedor e usuário
      await sequelize.transaction(async (transaction) => {
        await vendedorExistente.update({ ativo: true }, { transaction });
        await usuario.update(
          { 
            ativo: true,
            tipo_usuario: "vendedor" 
          },
          { transaction }
        );
      });

      console.log(`✅ Vendedor ativado com sucesso!`);
      console.log(`   Usuário agora está ativo como vendedor.`);
      console.log(`   Autopeça vinculada: ${vendedorExistente.autopeca?.nome_fantasia || vendedorExistente.autopeca?.razao_social || 'N/A'}\n`);
    } else {
      // Precisamos criar um novo vendedor
      console.log(`⚠️  Nenhum vendedor encontrado para este usuário.`);

      // Tentar encontrar uma autopeça
      let autopecaId = AUTOPECA_ID;

      if (!autopecaId) {
        // Buscar primeira autopeça ativa
        const autopeca = await Autopeca.findOne({
          where: { ativo: true },
          include: [
            {
              model: Usuario,
              as: "usuario",
              where: { ativo: true },
              required: true,
            },
          ],
          order: [["data_criacao", "ASC"]],
        });

        if (!autopeca) {
          console.error(`❌ Nenhuma autopeça ativa encontrada.`);
          console.error(`   Por favor, forneça um autopeca_id como segundo argumento.`);
          console.error(`   Uso: node scripts/ativar-vendedor.js ${EMAIL} <autopeca_id>\n`);
          process.exit(1);
        }

        autopecaId = autopeca.id;
        console.log(`   Usando autopeça: ${autopeca.nome_fantasia || autopeca.razao_social} (ID: ${autopeca.id})`);
      }

      // Verificar se autopeca existe
      const autopeca = await Autopeca.findByPk(autopecaId);
      if (!autopeca) {
        console.error(`❌ Autopeça com ID ${autopecaId} não encontrada.`);
        process.exit(1);
      }

      // Criar vendedor
      await sequelize.transaction(async (transaction) => {
        const novoVendedor = await Vendedor.create(
          {
            usuario_id: usuario.id,
            autopeca_id: autopecaId,
            nome_completo: usuario.email.split("@")[0] || "Vendedor",
            ativo: true,
          },
          { transaction }
        );

        await usuario.update(
          {
            ativo: true,
            tipo_usuario: "vendedor",
          },
          { transaction }
        );

        console.log(`✅ Novo vendedor criado e ativado:`);
        console.log(`   ID: ${novoVendedor.id}`);
        console.log(`   Nome: ${novoVendedor.nome_completo}`);
        console.log(`   Autopeça: ${autopeca.nome_fantasia || autopeca.razao_social}`);
        console.log(`   Usuário agora está ativo como vendedor.\n`);
      });
    }
  } catch (error) {
    console.error(`\n❌ Erro ao ativar vendedor:`, error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Executar script
ativarVendedor();

