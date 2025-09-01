import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './shared/schema.js';
import fs from 'fs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const db = drizzle({ client: pool, schema });

export async function clearTestData() {
  try {
    console.log('🗑️ Limpando dados de teste...');
    
    // Limpar na ordem correta para respeitar foreign keys
    await db.delete(schema.orderItemModifications);
    await db.delete(schema.orderItems);
    await db.delete(schema.orders);
    await db.delete(schema.productAdditionals);
    await db.delete(schema.productIngredients);
    await db.delete(schema.products);
    await db.delete(schema.categories);
    await db.delete(schema.deliveryZones);
    await db.delete(schema.ingredients);
    await db.delete(schema.storeSettings);
    await db.delete(schema.expenses);
    
    console.log('✅ Dados de teste removidos');
  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error);
    throw error;
  }
}

export async function importFromJSON(filePath) {
  try {
    console.log(`📂 Importando dados de ${filePath}...`);
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Importar cada tabela na ordem correta
    if (data.categories?.length > 0) {
      console.log(`📦 Importando ${data.categories.length} categorias...`);
      await db.insert(schema.categories).values(data.categories);
    }
    
    if (data.products?.length > 0) {
      console.log(`🍔 Importando ${data.products.length} produtos...`);
      await db.insert(schema.products).values(data.products);
    }
    
    if (data.store_settings?.length > 0) {
      console.log(`⚙️ Importando configurações da loja...`);
      await db.insert(schema.storeSettings).values(data.store_settings);
    }
    
    if (data.delivery_zones?.length > 0) {
      console.log(`🚚 Importando ${data.delivery_zones.length} zonas de entrega...`);
      await db.insert(schema.deliveryZones).values(data.delivery_zones);
    }
    
    if (data.ingredients?.length > 0) {
      console.log(`🥬 Importando ${data.ingredients.length} ingredientes...`);
      await db.insert(schema.ingredients).values(data.ingredients);
    }
    
    if (data.product_ingredients?.length > 0) {
      console.log(`🔗 Importando ingredientes dos produtos...`);
      await db.insert(schema.productIngredients).values(data.product_ingredients);
    }
    
    if (data.product_additionals?.length > 0) {
      console.log(`➕ Importando adicionais dos produtos...`);
      await db.insert(schema.productAdditionals).values(data.product_additionals);
    }
    
    console.log('✅ Importação concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na importação:', error);
    throw error;
  }
}

export async function importFromSQL(sqlFilePath) {
  try {
    console.log(`📄 Executando SQL de ${sqlFilePath}...`);
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    const client = await pool.connect();
    
    await client.query(sqlContent);
    client.release();
    
    console.log('✅ SQL executado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao executar SQL:', error);
    throw error;
  }
}

// Função principal para importação
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const filePath = args[1];
  
  try {
    switch (command) {
      case 'clear':
        await clearTestData();
        break;
        
      case 'json':
        if (!filePath) {
          console.error('❌ Forneça o caminho do arquivo JSON');
          process.exit(1);
        }
        await clearTestData();
        await importFromJSON(filePath);
        break;
        
      case 'sql':
        if (!filePath) {
          console.error('❌ Forneça o caminho do arquivo SQL');
          process.exit(1);
        }
        await clearTestData();
        await importFromSQL(filePath);
        break;
        
      default:
        console.log('📋 Comandos disponíveis:');
        console.log('  node import-data.js clear                # Limpar dados de teste');
        console.log('  node import-data.js json arquivo.json   # Importar de JSON');
        console.log('  node import-data.js sql arquivo.sql     # Importar de SQL dump');
        break;
    }
  } catch (error) {
    console.error('💥 Falha na operação:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}