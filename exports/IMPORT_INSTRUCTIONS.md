
# Supabase Import Instructions

## Files exported:
- categories.csv
- admin_users.csv
- users.csv
- products.csv
- orders.csv
- order_items.csv
- store_settings.csv
- delivery_zones.csv
- loyalty_transactions.csv
- loyalty_rewards.csv
- points_rules.csv
- loyalty_tiers_config.csv
- campaigns.csv

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
