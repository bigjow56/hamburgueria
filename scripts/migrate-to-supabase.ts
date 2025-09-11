#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// Environment variables are automatically loaded in Replit

interface MigrationConfig {
  sourceUrl: string;
  targetUrl: string;
  dryRun: boolean;
}

class DatabaseMigrator {
  private sourceDb: any;
  private targetDb: any;
  private config: MigrationConfig;

  constructor(config: MigrationConfig) {
    this.config = config;
    
    // Source database (current Replit/Neon)
    const sourceClient = neon(config.sourceUrl);
    this.sourceDb = drizzle(sourceClient, { schema });

    // Target database (Supabase)
    const targetClient = neon(config.targetUrl);
    this.targetDb = drizzle(targetClient, { schema });
  }

  async migrateSchema() {
    console.log('🔄 Starting schema migration...');
    
    try {
      // Apply schema to target database
      await migrate(this.targetDb, { migrationsFolder: './migrations' });
      console.log('✅ Schema migration completed');
    } catch (error) {
      console.error('❌ Schema migration failed:', error);
      throw error;
    }
  }

  async migrateData() {
    console.log('🔄 Starting data migration...');

    const tables = [
      { name: 'categories', table: schema.categories },
      { name: 'users', table: schema.users },
      { name: 'admin_users', table: schema.adminUsers },
      { name: 'products', table: schema.products },
      { name: 'ingredients', table: schema.ingredients },
      { name: 'product_ingredients', table: schema.productIngredients },
      { name: 'product_additionals', table: schema.productAdditionals },
      { name: 'orders', table: schema.orders },
      { name: 'order_items', table: schema.orderItems },
      { name: 'order_item_modifications', table: schema.orderItemModifications },
      { name: 'store_settings', table: schema.storeSettings },
      { name: 'delivery_zones', table: schema.deliveryZones },
      { name: 'expenses', table: schema.expenses },
      { name: 'banner_themes', table: schema.bannerThemes },
      { name: 'loyalty_transactions', table: schema.loyaltyTransactions },
      { name: 'loyalty_rewards', table: schema.loyaltyRewards },
      { name: 'loyalty_redemptions', table: schema.loyaltyRedemptions },
      { name: 'points_rules', table: schema.pointsRules },
      { name: 'loyalty_tiers_config', table: schema.loyaltyTiersConfig },
      { name: 'campaigns', table: schema.campaigns },
      { name: 'referral_transactions', table: schema.referralTransactions },
      { name: 'user_streaks', table: schema.userStreaks },
      { name: 'seasonal_rewards', table: schema.seasonalRewards },
    ];

    let totalRecords = 0;
    let migratedRecords = 0;

    for (const { name, table } of tables) {
      try {
        console.log(`📊 Migrating table: ${name}`);
        
        // Get all data from source
        const sourceData = await this.sourceDb.select().from(table);
        console.log(`   Found ${sourceData.length} records in ${name}`);
        totalRecords += sourceData.length;

        if (sourceData.length === 0) {
          console.log(`   ⏭️  Skipping empty table: ${name}`);
          continue;
        }

        if (this.config.dryRun) {
          console.log(`   🔍 DRY RUN: Would migrate ${sourceData.length} records from ${name}`);
          continue;
        }

        // Clear target table first (optional - remove if you want to preserve existing data)
        await this.targetDb.delete(table);
        console.log(`   🗑️  Cleared target table: ${name}`);

        // Insert data in batches to avoid timeout
        const batchSize = 100;
        for (let i = 0; i < sourceData.length; i += batchSize) {
          const batch = sourceData.slice(i, i + batchSize);
          await this.targetDb.insert(table).values(batch);
          migratedRecords += batch.length;
          console.log(`   ✅ Migrated batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(sourceData.length/batchSize)} (${batch.length} records)`);
        }

        console.log(`   ✅ Completed migration for ${name}: ${sourceData.length} records`);
        
      } catch (error) {
        console.error(`   ❌ Failed to migrate table ${name}:`, error);
        throw error;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   Total records found: ${totalRecords}`);
    console.log(`   Records migrated: ${migratedRecords}`);
    console.log(`   Tables processed: ${tables.length}`);
  }

  async verifyMigration() {
    console.log('🔍 Verifying migration...');

    const tables = [
      { name: 'categories', table: schema.categories },
      { name: 'users', table: schema.users },
      { name: 'products', table: schema.products },
      { name: 'orders', table: schema.orders },
    ];

    for (const { name, table } of tables) {
      try {
        const sourceCount = await this.sourceDb.select().from(table);
        const targetCount = await this.targetDb.select().from(table);
        
        console.log(`   ${name}: Source(${sourceCount.length}) -> Target(${targetCount.length}) ${sourceCount.length === targetCount.length ? '✅' : '❌'}`);
      } catch (error) {
        console.error(`   ❌ Failed to verify table ${name}:`, error);
      }
    }
  }

  async close() {
    // Neon serverless clients don't need explicit closing
    console.log('✅ Database connections closed');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verify = args.includes('--verify-only');

  console.log('🚀 Supabase Migration Tool');
  console.log('==========================');
  
  if (dryRun) {
    console.log('🔍 Running in DRY RUN mode - no data will be modified');
  }

  const sourceUrl = process.env.DATABASE_URL;
  const targetUrl = process.env.SUPABASE_DATABASE_URL;

  if (!sourceUrl || !targetUrl) {
    console.error('❌ Missing required environment variables:');
    console.error('   - DATABASE_URL (source database)');
    console.error('   - SUPABASE_DATABASE_URL (target database)');
    process.exit(1);
  }

  const migrator = new DatabaseMigrator({
    sourceUrl,
    targetUrl,
    dryRun
  });

  try {
    if (verify) {
      await migrator.verifyMigration();
    } else {
      // Step 1: Migrate schema
      if (!dryRun) {
        await migrator.migrateSchema();
      }

      // Step 2: Migrate data
      await migrator.migrateData();

      // Step 3: Verify migration
      if (!dryRun) {
        await migrator.verifyMigration();
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await migrator.close();
  }
}

// Handle interruption gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Migration interrupted by user');
  process.exit(1);
});

// Run the migration
main().catch(console.error);