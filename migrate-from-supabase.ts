import { Pool } from 'pg';
import { db } from './server/db';
import * as schema from './shared/schema';

// Supabase connection
const supabasePool = new Pool({
  host: 'db.miwlmxcfbcaefmcmfvmf.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'npg_Bw15mhGqYVCx',
  ssl: { rejectUnauthorized: false }
});

async function migrateData() {
  console.log('🔄 Iniciando migração dos dados do Supabase...');
  
  try {
    // Migrate categories
    console.log('📁 Migrando categorias...');
    const categoriesResult = await supabasePool.query('SELECT * FROM categories ORDER BY display_order');
    const categories = categoriesResult.rows;
    
    for (const category of categories) {
      await db.insert(schema.categories).values({
        id: category.id,
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        displayOrder: category.display_order
      }).onConflictDoNothing();
    }
    console.log(`✅ ${categories.length} categorias migradas`);

    // Migrate products
    console.log('🍔 Migrando produtos...');
    const productsResult = await supabasePool.query('SELECT * FROM products ORDER BY created_at');
    const products = productsResult.rows;
    
    for (const product of products) {
      await db.insert(schema.products).values({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        originalPrice: product.original_price,
        categoryId: product.category_id,
        imageUrl: product.image_url,
        isAvailable: product.is_available ?? true,
        isFeatured: product.is_featured ?? false,
        isPromotion: product.is_promotion ?? false,
        createdAt: product.created_at
      }).onConflictDoNothing();
    }
    console.log(`✅ ${products.length} produtos migrados`);

    // Migrate users
    console.log('👥 Migrando usuários...');
    const usersResult = await supabasePool.query('SELECT * FROM users ORDER BY created_at');
    const users = usersResult.rows;
    
    for (const user of users) {
      await db.insert(schema.users).values({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        createdAt: user.created_at
      }).onConflictDoNothing();
    }
    console.log(`✅ ${users.length} usuários migrados`);

    // Migrate orders
    console.log('🛒 Migrando pedidos...');
    const ordersResult = await supabasePool.query('SELECT * FROM orders ORDER BY created_at');
    const orders = ordersResult.rows;
    
    for (const order of orders) {
      await db.insert(schema.orders).values({
        id: order.id,
        orderNumber: order.order_number,
        userId: order.user_id,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        customerEmail: order.customer_email,
        deliveryType: order.delivery_type ?? 'delivery',
        streetName: order.street_name,
        houseNumber: order.house_number,
        neighborhood: order.neighborhood,
        referencePoint: order.reference_point,
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status ?? 'pending',
        orderStatus: order.order_status ?? 'pending',
        subtotal: order.subtotal,
        deliveryFee: order.delivery_fee,
        total: order.total,
        specialInstructions: order.special_instructions,
        estimatedDeliveryTime: order.estimated_delivery_time,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      }).onConflictDoNothing();
    }
    console.log(`✅ ${orders.length} pedidos migrados`);

    // Migrate order items
    console.log('📦 Migrando itens dos pedidos...');
    const orderItemsResult = await supabasePool.query('SELECT * FROM order_items');
    const orderItems = orderItemsResult.rows;
    
    for (const item of orderItems) {
      await db.insert(schema.orderItems).values({
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price
      }).onConflictDoNothing();
    }
    console.log(`✅ ${orderItems.length} itens de pedidos migrados`);

    // Migrate store settings
    console.log('⚙️ Migrando configurações da loja...');
    const storeSettingsResult = await supabasePool.query('SELECT * FROM store_settings LIMIT 1');
    if (storeSettingsResult.rows.length > 0) {
      const settings = storeSettingsResult.rows[0];
      await db.insert(schema.storeSettings).values({
        id: settings.id,
        isOpen: settings.is_open ?? true,
        closingTime: settings.closing_time ?? '23:00',
        minimumOrderAmount: settings.minimum_order_amount ?? '25.00',
        deliveryAreas: settings.delivery_areas ?? [],
        useNeighborhoodDelivery: settings.use_neighborhood_delivery ?? false,
        defaultDeliveryFee: settings.default_delivery_fee ?? '5.90',
        bannerTitle: settings.banner_title ?? 'Hambúrguers',
        bannerDescription: settings.banner_description ?? 'Ingredientes frescos, sabor incomparável.',
        bannerPrice: settings.banner_price ?? '18.90',
        bannerImageUrl: settings.banner_image_url ?? '',
        bannerColor1: settings.banner_color_1 ?? '#ff6b35',
        bannerColor2: settings.banner_color_2 ?? '#f7931e',
        bannerColor3: settings.banner_color_3 ?? '#ffd23f',
        bannerColor4: settings.banner_color_4 ?? '#ff8c42',
        bannerBackgroundImage: settings.banner_background_image,
        bannerUseImageBackground: settings.banner_use_image_background ?? false,
        storeTitle: settings.store_title ?? 'Nossa Loja',
        siteName: settings.site_name ?? 'Burger House',
        storeImageUrl: settings.store_image_url ?? '',
        storeAddress: settings.store_address ?? 'Rua das Delícias, 123',
        storeNeighborhood: settings.store_neighborhood ?? 'Centro, São Paulo - SP',
        storeHours: settings.store_hours ?? 'Segunda a Sexta: 18h - 23h\nSábado e Domingo: 18h - 00h',
        deliveryTime: settings.delivery_time ?? 'Tempo médio: 30-45 minutos',
        deliveryFeeRange: settings.delivery_fee_range ?? 'Taxa: R$ 3,90 - R$ 8,90',
        paymentMethods: settings.payment_methods ?? 'Dinheiro, Cartão, PIX\nMercado Pago integrado',
        updatedAt: settings.updated_at
      }).onConflictDoNothing();
      console.log('✅ Configurações da loja migradas');
    }

    // Try to migrate additional tables if they exist
    try {
      // Migrate delivery zones
      console.log('🚚 Migrando zonas de entrega...');
      const deliveryZonesResult = await supabasePool.query('SELECT * FROM delivery_zones ORDER BY created_at');
      const deliveryZones = deliveryZonesResult.rows;
      
      for (const zone of deliveryZones) {
        await db.insert(schema.deliveryZones).values({
          id: zone.id,
          neighborhoodName: zone.neighborhood_name,
          deliveryFee: zone.delivery_fee,
          isActive: zone.is_active ?? true,
          createdAt: zone.created_at,
          updatedAt: zone.updated_at
        }).onConflictDoNothing();
      }
      console.log(`✅ ${deliveryZones.length} zonas de entrega migradas`);
    } catch (error) {
      console.log('ℹ️ Tabela delivery_zones não encontrada, pulando...');
    }

    try {
      // Migrate expenses
      console.log('💰 Migrando despesas...');
      const expensesResult = await supabasePool.query('SELECT * FROM expenses ORDER BY date');
      const expenses = expensesResult.rows;
      
      for (const expense of expenses) {
        await db.insert(schema.expenses).values({
          id: expense.id,
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          date: expense.date,
          createdAt: expense.created_at,
          updatedAt: expense.updated_at
        }).onConflictDoNothing();
      }
      console.log(`✅ ${expenses.length} despesas migradas`);
    } catch (error) {
      console.log('ℹ️ Tabela expenses não encontrada, pulando...');
    }

    try {
      // Migrate ingredients
      console.log('🥬 Migrando ingredientes...');
      const ingredientsResult = await supabasePool.query('SELECT * FROM ingredients ORDER BY created_at');
      const ingredients = ingredientsResult.rows;
      
      for (const ingredient of ingredients) {
        await db.insert(schema.ingredients).values({
          id: ingredient.id,
          name: ingredient.name,
          category: ingredient.category,
          price: ingredient.price ?? '0.00',
          discountPrice: ingredient.discount_price ?? '0.00',
          isRemovable: ingredient.is_removable ?? true,
          isRequired: ingredient.is_required ?? false,
          maxQuantity: ingredient.max_quantity ?? 3,
          isActive: ingredient.is_active ?? true,
          createdAt: ingredient.created_at
        }).onConflictDoNothing();
      }
      console.log(`✅ ${ingredients.length} ingredientes migrados`);
    } catch (error) {
      console.log('ℹ️ Tabela ingredients não encontrada, pulando...');
    }

    console.log('🎉 Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await supabasePool.end();
  }
}

// Execute migration
migrateData().then(() => {
  console.log('✅ Script de migração finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Falha na migração:', error);
  process.exit(1);
});