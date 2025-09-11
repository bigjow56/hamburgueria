#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

async function testConnection() {
  console.log('🔍 Testing database connections...');
  
  const sourceUrl = process.env.DATABASE_URL;
  const targetUrl = process.env.SUPABASE_DATABASE_URL;

  if (!sourceUrl || !targetUrl) {
    console.error('❌ Missing environment variables:');
    console.error('   - DATABASE_URL:', !!sourceUrl);
    console.error('   - SUPABASE_DATABASE_URL:', !!targetUrl);
    return false;
  }

  try {
    // Test source connection
    console.log('   Testing source database...');
    const sourceClient = neon(sourceUrl);
    const sourceDb = drizzle(sourceClient, { schema });
    const sourceTest = await sourceDb.select().from(schema.categories).limit(1);
    console.log('   ✅ Source database connected');

    // Test target connection
    console.log('   Testing target database (Supabase)...');
    const targetClient = neon(targetUrl);
    const targetDb = drizzle(targetClient, { schema });
    
    // Simple test query to verify connection
    await targetClient`SELECT 1 as test`;
    console.log('   ✅ Target database connected');

    return { sourceDb, targetDb };
  } catch (error) {
    console.error('   ❌ Connection test failed:', error);
    return false;
  }
}

async function countRecords(db: any) {
  console.log('📊 Counting records in source database:');
  
  const tables = [
    { name: 'categories', table: schema.categories },
    { name: 'users', table: schema.users },
    { name: 'admin_users', table: schema.adminUsers },
    { name: 'products', table: schema.products },
    { name: 'orders', table: schema.orders },
    { name: 'order_items', table: schema.orderItems },
  ];

  let totalRecords = 0;
  for (const { name, table } of tables) {
    try {
      const count = await db.select().from(table);
      console.log(`   ${name}: ${count.length} records`);
      totalRecords += count.length;
    } catch (error) {
      console.log(`   ${name}: Error - ${error.message}`);
    }
  }
  
  console.log(`   Total: ${totalRecords} records`);
  return totalRecords;
}

async function migrateTableData(sourceDb: any, targetDb: any, tableName: string, table: any) {
  console.log(`📦 Migrating ${tableName}...`);
  
  try {
    // Get source data
    const sourceData = await sourceDb.select().from(table);
    console.log(`   Found ${sourceData.length} records`);
    
    if (sourceData.length === 0) {
      console.log(`   ⏭️  No data to migrate`);
      return 0;
    }

    // Clear target table (optional)
    await targetDb.delete(table);
    console.log(`   🗑️  Cleared target table`);

    // Insert data in smaller batches
    const batchSize = 50;
    let migratedCount = 0;
    
    for (let i = 0; i < sourceData.length; i += batchSize) {
      const batch = sourceData.slice(i, i + batchSize);
      await targetDb.insert(table).values(batch);
      migratedCount += batch.length;
      console.log(`   ✅ Migrated ${migratedCount}/${sourceData.length} records`);
    }

    return migratedCount;
  } catch (error) {
    console.error(`   ❌ Failed to migrate ${tableName}:`, error.message);
    return 0;
  }
}

async function main() {
  console.log('🚀 Simple Supabase Migration Tool');
  console.log('=================================');

  // Test connections
  const connections = await testConnection();
  if (!connections) {
    process.exit(1);
  }

  const { sourceDb, targetDb } = connections;

  // Count source records
  await countRecords(sourceDb);

  // Confirm migration
  console.log('\n⚠️  This will clear and overwrite data in the target database.');
  console.log('Continue with migration? (Press Ctrl+C to cancel, or wait 5 seconds)');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  console.log('🔄 Starting migration...\n');

  // Migrate essential tables first
  const coreTables = [
    { name: 'categories', table: schema.categories },
    { name: 'admin_users', table: schema.adminUsers },
    { name: 'users', table: schema.users },
    { name: 'products', table: schema.products },
    { name: 'store_settings', table: schema.storeSettings },
  ];

  let totalMigrated = 0;
  for (const { name, table } of coreTables) {
    const migrated = await migrateTableData(sourceDb, targetDb, name, table);
    totalMigrated += migrated;
  }

  console.log(`\n🎉 Migration completed!`);
  console.log(`   Total records migrated: ${totalMigrated}`);
  console.log('\n📝 Next steps:');
  console.log('   1. Update DATABASE_URL to point to Supabase');
  console.log('   2. Test your application');
  console.log('   3. Migrate remaining tables if needed');
}

main().catch(console.error);