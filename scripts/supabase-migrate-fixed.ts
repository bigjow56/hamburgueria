#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema';

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection with correct driver...');
  
  // Get source connection
  const sourceUrl = process.env.DATABASE_URL;
  if (!sourceUrl) {
    console.error('❌ Missing DATABASE_URL environment variable');
    return false;
  }

  // Update Supabase URL to use connection pooler (port 6543)
  let targetUrl = process.env.SUPABASE_DATABASE_URL;
  if (!targetUrl) {
    console.error('❌ Missing SUPABASE_DATABASE_URL environment variable');
    console.log('💡 Please update your .env file with the correct Supabase URL');
    return false;
  }

  // Convert to use port 6543 (connection pooler) with SSL
  targetUrl = targetUrl.replace(':5432/', ':6543/')
                     .replace('?', '?sslmode=require&')
                     .replace('postgres?sslmode=require&', 'postgres?sslmode=require');
  
  if (!targetUrl.includes('sslmode=require')) {
    targetUrl += targetUrl.includes('?') ? '&sslmode=require' : '?sslmode=require';
  }

  console.log('   Source URL configured ✅');
  console.log('   Target URL (pooler port 6543) configured ✅');

  try {
    // Test source connection (current Neon DB)
    console.log('   Testing source connection...');
    const sourcePool = new Pool({ connectionString: sourceUrl });
    const sourceDb = drizzle(sourcePool, { schema });
    
    const sourceTest = await sourceDb.select().from(schema.categories).limit(1);
    console.log('   ✅ Source database connected');
    await sourcePool.end();

    // Test target connection (Supabase with connection pooler)
    console.log('   Testing target connection (Supabase pooler)...');
    const targetPool = new Pool({ 
      connectionString: targetUrl,
      ssl: { rejectUnauthorized: false } // For development
    });
    
    const targetDb = drizzle(targetPool, { schema });
    
    // Simple test query
    const targetTest = await targetPool.query('SELECT 1 as test');
    console.log('   ✅ Target database connected via pooler');
    await targetPool.end();

    return { sourceUrl, targetUrl };
    
  } catch (error) {
    console.error('   ❌ Connection failed:', error.message);
    
    if (error.message.includes('Cannot assign requested address')) {
      console.log('\n💡 Network troubleshooting suggestions:');
      console.log('   1. The Supabase database may have IP restrictions');
      console.log('   2. Try updating the password in Supabase dashboard');
      console.log('   3. Consider using CSV export/import method instead');
    }
    
    return false;
  }
}

async function csvExportApproach() {
  console.log('\n📦 Alternative: CSV Export Approach');
  console.log('==================================');
  
  try {
    const sourceUrl = process.env.DATABASE_URL;
    const sourcePool = new Pool({ connectionString: sourceUrl });
    const sourceDb = drizzle(sourcePool, { schema });
    
    console.log('🔄 Exporting data to CSV format...');
    
    const tables = [
      { name: 'categories', table: schema.categories },
      { name: 'admin_users', table: schema.adminUsers },
      { name: 'users', table: schema.users },
      { name: 'products', table: schema.products },
    ];
    
    const exports: any = {};
    
    for (const { name, table } of tables) {
      console.log(`   📊 Exporting ${name}...`);
      const data = await sourceDb.select().from(table);
      exports[name] = data;
      console.log(`      ✅ ${data.length} records exported`);
    }
    
    await sourcePool.end();
    
    console.log('\n📄 Export Summary:');
    console.log('==================');
    
    for (const [tableName, data] of Object.entries(exports)) {
      console.log(`${tableName}: ${(data as any[]).length} records`);
      
      if ((data as any[]).length > 0) {
        // Show sample data structure
        const sample = (data as any[])[0];
        console.log(`   Sample fields: ${Object.keys(sample).join(', ')}`);
      }
    }
    
    console.log('\n📝 Manual Migration Steps:');
    console.log('========================');
    console.log('1. 🔑 Update Supabase password (security)');
    console.log('2. 🏗️  Apply schema to Supabase manually or via SQL editor');
    console.log('3. 📤 Export this data to CSV files');
    console.log('4. 📥 Import CSV files via Supabase dashboard');
    console.log('5. ✅ Test your application with new database');
    
    return exports;
    
  } catch (error) {
    console.error('❌ CSV export failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Supabase Migration Tool (Fixed)');
  console.log('==================================');
  console.log('Using correct pg driver and connection pooler');
  console.log('');

  // Test direct connection first
  const connectionResult = await testSupabaseConnection();
  
  if (connectionResult) {
    console.log('\n🎉 Direct connection successful!');
    console.log('You can now proceed with direct data migration');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('1. Update your application DATABASE_URL to point to Supabase');
    console.log('2. Run your migration script');
    console.log('3. Test your application');
  } else {
    console.log('\n⚠️  Direct connection failed. Using CSV export approach...');
    await csvExportApproach();
  }
}

main().catch(console.error);