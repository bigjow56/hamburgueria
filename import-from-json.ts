import { db } from './server/db';
import * as schema from './shared/schema';

// Function to import data from JSON files or objects
export async function importDataFromJSON(data: {
  categories?: any[];
  products?: any[];
  users?: any[];
  orders?: any[];
  orderItems?: any[];
  storeSettings?: any;
  deliveryZones?: any[];
  expenses?: any[];
  ingredients?: any[];
}) {
  console.log('🔄 Iniciando importação dos dados...');

  try {
    // Import categories
    if (data.categories?.length) {
      console.log('📁 Importando categorias...');
      for (const category of data.categories) {
        await db.insert(schema.categories).values({
          id: category.id,
          name: category.name,
          slug: category.slug,
          icon: category.icon,
          displayOrder: category.display_order
        }).onConflictDoNothing();
      }
      console.log(`✅ ${data.categories.length} categorias importadas`);
    }

    // Import products
    if (data.products?.length) {
      console.log('🍔 Importando produtos...');
      for (const product of data.products) {
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
          createdAt: product.created_at ? new Date(product.created_at) : new Date()
        }).onConflictDoNothing();
      }
      console.log(`✅ ${data.products.length} produtos importados`);
    }

    // Import users
    if (data.users?.length) {
      console.log('👥 Importando usuários...');
      for (const user of data.users) {
        await db.insert(schema.users).values({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          createdAt: user.created_at ? new Date(user.created_at) : new Date()
        }).onConflictDoNothing();
      }
      console.log(`✅ ${data.users.length} usuários importados`);
    }

    // Import orders
    if (data.orders?.length) {
      console.log('🛒 Importando pedidos...');
      for (const order of data.orders) {
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
          createdAt: order.created_at ? new Date(order.created_at) : new Date(),
          updatedAt: order.updated_at ? new Date(order.updated_at) : new Date()
        }).onConflictDoNothing();
      }
      console.log(`✅ ${data.orders.length} pedidos importados`);
    }

    // Import order items
    if (data.orderItems?.length) {
      console.log('📦 Importando itens dos pedidos...');
      for (const item of data.orderItems) {
        await db.insert(schema.orderItems).values({
          id: item.id,
          orderId: item.order_id,
          productId: item.product_id,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price
        }).onConflictDoNothing();
      }
      console.log(`✅ ${data.orderItems.length} itens de pedidos importados`);
    }

    // Import store settings
    if (data.storeSettings) {
      console.log('⚙️ Importando configurações da loja...');
      const settings = data.storeSettings;
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
        updatedAt: settings.updated_at ? new Date(settings.updated_at) : new Date()
      }).onConflictDoNothing();
      console.log('✅ Configurações da loja importadas');
    }

    // Import additional tables if they exist
    if (data.deliveryZones?.length) {
      console.log('🚚 Importando zonas de entrega...');
      for (const zone of data.deliveryZones) {
        await db.insert(schema.deliveryZones).values({
          id: zone.id,
          neighborhoodName: zone.neighborhood_name,
          deliveryFee: zone.delivery_fee,
          isActive: zone.is_active ?? true,
          createdAt: zone.created_at ? new Date(zone.created_at) : new Date(),
          updatedAt: zone.updated_at ? new Date(zone.updated_at) : new Date()
        }).onConflictDoNothing();
      }
      console.log(`✅ ${data.deliveryZones.length} zonas de entrega importadas`);
    }

    if (data.expenses?.length) {
      console.log('💰 Importando despesas...');
      for (const expense of data.expenses) {
        await db.insert(schema.expenses).values({
          id: expense.id,
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          date: new Date(expense.date),
          createdAt: expense.created_at ? new Date(expense.created_at) : new Date(),
          updatedAt: expense.updated_at ? new Date(expense.updated_at) : new Date()
        }).onConflictDoNothing();
      }
      console.log(`✅ ${data.expenses.length} despesas importadas`);
    }

    if (data.ingredients?.length) {
      console.log('🥬 Importando ingredientes...');
      for (const ingredient of data.ingredients) {
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
          createdAt: ingredient.created_at ? new Date(ingredient.created_at) : new Date()
        }).onConflictDoNothing();
      }
      console.log(`✅ ${data.ingredients.length} ingredientes importados`);
    }

    console.log('🎉 Importação concluída com sucesso!');
    return true;

  } catch (error) {
    console.error('❌ Erro durante a importação:', error);
    throw error;
  }
}

// Example usage if you paste JSON data here:
/*
const sampleData = {
  categories: [
    // paste your categories data here
  ],
  products: [
    // paste your products data here  
  ],
  // ... other tables
};

importDataFromJSON(sampleData).then(() => {
  console.log('✅ Importação finalizada');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Falha na importação:', error);
  process.exit(1);
});
*/