#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// Using environment variables securely
const SOURCE_URL = process.env.DATABASE_URL!;
const TARGET_URL = process.env.SUPABASE_DATABASE_URL!;

async function quickMigrate() {
  console.log('🚀 Quick Migration to Supabase');
  console.log('=============================');

  try {
    console.log('🔗 Connecting to databases...');
    
    // Setup connections
    const sourceClient = neon(SOURCE_URL);
    const sourceDb = drizzle(sourceClient, { schema });
    
    const targetClient = neon(TARGET_URL);
    const targetDb = drizzle(targetClient, { schema });

    // Test connections
    console.log('   Testing source...');
    const sourceTest = await sourceDb.select().from(schema.categories).limit(1);
    console.log('   ✅ Source connected');

    console.log('   Testing target...');
    await targetClient`SELECT 1`;
    console.log('   ✅ Target connected');

    // Quick data migration for essential tables
    const essentialTables = [
      { name: 'categories', table: schema.categories },
      { name: 'admin_users', table: schema.adminUsers },
      { name: 'users', table: schema.users },
      { name: 'products', table: schema.products },
    ];

    console.log('\n📊 Migrating essential data...');
    
    for (const { name, table } of essentialTables) {
      try {
        console.log(`   📦 ${name}...`);
        
        // Get source data
        const data = await sourceDb.select().from(table);
        console.log(`      Found ${data.length} records`);
        
        if (data.length > 0) {
          // Clear target and insert
          await targetDb.delete(table);
          await targetDb.insert(table).values(data);
          console.log(`      ✅ Migrated ${data.length} records`);
        } else {
          console.log(`      ⏭️  No data to migrate`);
        }
        
      } catch (error) {
        console.log(`      ❌ Error: ${error.message}`);
      }
    }

    console.log('\n🎉 Quick migration completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test the connection');
    console.log('   2. Update your app configuration');
    console.log('   3. Migrate remaining tables if needed');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

quickMigrate();