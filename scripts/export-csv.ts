#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

async function exportToCSV() {
  console.log('📤 Exporting data to CSV files...');
  
  try {
    // Create export directory
    const exportDir = 'exports';
    mkdirSync(exportDir, { recursive: true });
    
    // Connect to source database
    const sourceUrl = process.env.DATABASE_URL!;
    const pool = new Pool({ connectionString: sourceUrl });
    const db = drizzle(pool, { schema });
    
    // Tables to export
    const tables = [
      { name: 'categories', table: schema.categories },
      { name: 'admin_users', table: schema.adminUsers },
      { name: 'users', table: schema.users },
      { name: 'products', table: schema.products },
      { name: 'orders', table: schema.orders },
      { name: 'order_items', table: schema.orderItems },
      { name: 'store_settings', table: schema.storeSettings },
      { name: 'delivery_zones', table: schema.deliveryZones },
      { name: 'loyalty_transactions', table: schema.loyaltyTransactions },
      { name: 'loyalty_rewards', table: schema.loyaltyRewards },
      { name: 'points_rules', table: schema.pointsRules },
      { name: 'loyalty_tiers_config', table: schema.loyaltyTiersConfig },
      { name: 'campaigns', table: schema.campaigns },
    ];
    
    let totalExported = 0;
    
    for (const { name, table } of tables) {
      try {
        console.log(`   📊 Exporting ${name}...`);
        
        const data = await db.select().from(table);
        console.log(`      Found ${data.length} records`);
        
        if (data.length === 0) {
          console.log(`      ⏭️  No data to export`);
          continue;
        }
        
        // Convert to CSV
        const headers = Object.keys(data[0]);
        const csvContent = [
          headers.join(','), // Header row
          ...data.map(row => 
            headers.map(header => {
              const value = (row as any)[header];
              if (value === null || value === undefined) return '';
              if (typeof value === 'string' && value.includes(',')) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return String(value);
            }).join(',')
          )
        ].join('\n');
        
        // Write CSV file
        const filePath = join(exportDir, `${name}.csv`);
        writeFileSync(filePath, csvContent, 'utf8');
        
        console.log(`      ✅ Exported to ${filePath}`);
        totalExported += data.length;
        
      } catch (error) {
        console.error(`      ❌ Failed to export ${name}:`, error.message);
      }
    }
    
    await pool.end();
    
    console.log(`\n🎉 Export completed!`);
    console.log(`   Total records exported: ${totalExported}`);
    console.log(`   Files created in: ${exportDir}/`);
    
    // Create import instructions
    const instructions = `
# Supabase Import Instructions

## Files exported:
${tables.map(t => `- ${t.name}.csv`).join('\n')}

## Import steps:
1. 🔑 First, update your Supabase password for security
2. 🏗️  Apply the database schema to Supabase:
   - Open Supabase SQL Editor
   - Copy schema from shared/schema.ts
   - Execute CREATE TABLE statements
3. 📥 Import each CSV file:
   - Go to Supabase Table Editor
   - Select table
   - Click "Insert" > "Import data from CSV"
   - Upload corresponding CSV file
4. ✅ Verify data integrity
5. 🔄 Update your app's DATABASE_URL to point to Supabase

## Order of import (due to foreign keys):
1. categories.csv
2. admin_users.csv  
3. users.csv
4. products.csv
5. orders.csv
6. order_items.csv
7. All other files

## Troubleshooting:
- If import fails due to foreign keys, import in the order above
- Check that UUIDs are preserved correctly
- Verify timestamps are in correct format
`;
    
    writeFileSync(join(exportDir, 'IMPORT_INSTRUCTIONS.md'), instructions);
    console.log(`   📝 Import instructions: ${exportDir}/IMPORT_INSTRUCTIONS.md`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    return false;
  }
}

exportToCSV();