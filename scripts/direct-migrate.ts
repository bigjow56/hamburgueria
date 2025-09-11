#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema';
import { resolve4 } from 'dns';
import { promisify } from 'util';

const resolveAsync = promisify(resolve4);

async function forceIPv4Connection() {
  console.log('🔍 Resolving Supabase host to IPv4...');
  
  try {
    const hostname = 'db.miwlmxcfbcaefmcmfvmf.supabase.co';
    const ips = await resolveAsync(hostname);
    console.log(`   Found IPv4 addresses: ${ips.join(', ')}`);
    
    // Use first IPv4 address
    const targetIP = ips[0];
    
    // Build connection string with IP instead of hostname
    let supabaseUrl = process.env.SUPABASE_DATABASE_URL!;
    const targetUrl = supabaseUrl
      .replace('db.miwlmxcfbcaefmcmfvmf.supabase.co', targetIP)
      .replace(':5432/', ':6543/') // Use connection pooler
      .concat(supabaseUrl.includes('?') ? '&sslmode=require' : '?sslmode=require');
    
    console.log(`   Using IPv4 connection to: ${targetIP}:6543`);
    return targetUrl;
    
  } catch (error) {
    console.error('   ❌ IPv4 resolution failed:', error.message);
    return null;
  }
}

async function directMigration() {
  console.log('🚀 Direct Migration with IPv4 + Connection Pooler');
  console.log('================================================');
  
  // Get IPv4 connection string
  const targetUrl = await forceIPv4Connection();
  if (!targetUrl) {
    console.log('❌ Cannot resolve Supabase IPv4, fallback to CSV export');
    return false;
  }
  
  try {
    // Setup connections
    const sourceUrl = process.env.DATABASE_URL!;
    
    console.log('🔗 Testing connections...');
    
    // Source connection
    const sourcePool = new Pool({ connectionString: sourceUrl });
    const sourceDb = drizzle(sourcePool, { schema });
    
    // Target connection with IPv4 and pooler
    const targetPool = new Pool({ 
      connectionString: targetUrl,
      ssl: { rejectUnauthorized: false }
    });
    const targetDb = drizzle(targetPool, { schema });
    
    // Test connections
    await sourceDb.select().from(schema.categories).limit(1);
    console.log('   ✅ Source connected');
    
    await targetPool.query('SELECT 1');
    console.log('   ✅ Target connected (IPv4 + pooler)');
    
    // Migrate data
    console.log('\n📦 Starting data migration...');
    
    const tables = [
      { name: 'categories', table: schema.categories },
      { name: 'admin_users', table: schema.adminUsers },
      { name: 'users', table: schema.users },
      { name: 'products', table: schema.products },
    ];
    
    let totalMigrated = 0;
    
    for (const { name, table } of tables) {
      console.log(`   🔄 Migrating ${name}...`);
      
      // Get source data
      const sourceData = await sourceDb.select().from(table);
      console.log(`      Source: ${sourceData.length} records`);
      
      if (sourceData.length === 0) {
        console.log(`      ⏭️  No data to migrate`);
        continue;
      }
      
      // Clear target and insert in batches
      await targetDb.delete(table);
      
      const batchSize = 50;
      for (let i = 0; i < sourceData.length; i += batchSize) {
        const batch = sourceData.slice(i, i + batchSize);
        await targetDb.insert(table).values(batch);
        console.log(`      ✅ Migrated batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(sourceData.length/batchSize)}`);
      }
      
      totalMigrated += sourceData.length;
      console.log(`      ✅ Completed ${name}: ${sourceData.length} records`);
    }
    
    // Verify migration
    console.log('\n🔍 Verifying migration...');
    for (const { name, table } of tables) {
      const targetCount = await targetDb.select().from(table);
      console.log(`   ${name}: ${targetCount.length} records ✅`);
    }
    
    await sourcePool.end();
    await targetPool.end();
    
    console.log(`\n🎉 Direct migration completed!`);
    console.log(`   Total records migrated: ${totalMigrated}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Direct migration failed:', error.message);
    return false;
  }
}

directMigration();