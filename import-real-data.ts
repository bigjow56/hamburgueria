import fs from 'fs';
import { db } from './server/db';
import * as schema from './shared/schema';

async function importRealData() {
  console.log('🔄 Importando dados reais do Supabase...');

  try {
    // Clear existing data first to avoid conflicts
    console.log('🧹 Limpando dados existentes...');
    await db.delete(schema.products);
    await db.delete(schema.categories);
    
    // Read and import categories
    console.log('📁 Importando categorias...');
    const categoriesData = JSON.parse(fs.readFileSync('./attached_assets/categories_1756492629118.json', 'utf8'));
    
    for (const category of categoriesData) {
      await db.insert(schema.categories).values({
        id: category.id,
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        displayOrder: category.display_order
      });
    }
    console.log(`✅ ${categoriesData.length} categorias importadas`);

    // Read and import products
    console.log('🍔 Importando produtos...');
    const productsData = JSON.parse(fs.readFileSync('./attached_assets/products_1756492629118.json', 'utf8'));
    
    for (const product of productsData) {
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
      });
    }
    console.log(`✅ ${productsData.length} produtos importados`);

    console.log('🎉 Importação dos dados reais concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a importação:', error);
    throw error;
  }
}

// Execute import
importRealData().then(() => {
  console.log('✅ Script de importação finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Falha na importação:', error);
  process.exit(1);
});