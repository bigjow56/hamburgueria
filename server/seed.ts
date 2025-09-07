import { db } from './db';
import { categories, products, storeSettings } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { seedLoyaltyRewards } from '../scripts/seed-loyalty';

export async function seedDatabase() {
  try {
    console.log('Verificando se é necessário popular o banco de dados...');

    // Verifica se já existem dados
    const existingCategories = await db.select({ count: sql<number>`count(*)` }).from(categories);
    const categoryCount = Number(existingCategories[0]?.count ?? 0);

    if (categoryCount > 0) {
      console.log('Banco de dados já possui dados. Seed não necessário.');
      return;
    }

    console.log('Populando banco de dados com dados iniciais...');

    // Criar categorias
    const categoriesData = await db.insert(categories).values([
      {
        name: 'Hambúrguers',
        slug: 'hamburguers',
        icon: 'hamburguer',
        displayOrder: 1,
      },
      {
        name: 'Bebidas',
        slug: 'bebidas', 
        icon: 'drink',
        displayOrder: 2,
      },
      {
        name: 'Sobremesas',
        slug: 'sobremesas',
        icon: 'dessert',
        displayOrder: 3,
      },
      {
        name: 'Porções',
        slug: 'porcoes',
        icon: 'sides',
        displayOrder: 4,
      }
    ]).returning();

    // Encontrar IDs das categorias
    const hamburguerCategory = categoriesData.find(c => c.slug === 'hamburguers');
    const bebidaCategory = categoriesData.find(c => c.slug === 'bebidas');
    const sobremesaCategory = categoriesData.find(c => c.slug === 'sobremesas');
    const porcaoCategory = categoriesData.find(c => c.slug === 'porcoes');

    if (!hamburguerCategory || !bebidaCategory || !sobremesaCategory || !porcaoCategory) {
      throw new Error('Erro ao criar categorias');
    }

    // Criar produtos
    await db.insert(products).values([
      // Hambúrguers
      {
        name: 'Burger Clássico',
        description: 'Hambúrguer artesanal 150g, queijo, alface, tomate, cebola, picles e molho especial',
        price: '18.90',
        categoryId: hamburguerCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
        isFeatured: true,
        isAvailable: true,
      },
      {
        name: 'Burger Bacon',
        description: 'Hambúrguer artesanal 150g, queijo, bacon crocante, alface, tomate e molho barbecue',
        price: '22.90',
        categoryId: hamburguerCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400',
        isFeatured: true,
        isAvailable: true,
      },
      {
        name: 'Burger Duplo',
        description: '2 hambúrguers artesanais 150g cada, queijo duplo, alface, tomate, cebola e molho especial',
        price: '28.90',
        categoryId: hamburguerCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400',
        isAvailable: true,
      },
      {
        name: 'Chicken Burger',
        description: 'Filé de frango grelhado, queijo, alface, tomate, cebola roxa e molho de ervas',
        price: '19.90',
        categoryId: hamburguerCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1606755962773-d324e9a13086?w=400',
        isAvailable: true,
      },

      // Bebidas
      {
        name: 'Coca-Cola 350ml',
        description: 'Refrigerante Coca-Cola gelado',
        price: '5.50',
        categoryId: bebidaCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400',
        isAvailable: true,
      },
      {
        name: 'Suco Natural 300ml',
        description: 'Suco natural de laranja, limão ou acerola',
        price: '7.90',
        categoryId: bebidaCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1622484804318-1b1b61c3bb4e?w=400',
        isAvailable: true,
      },
      {
        name: 'Água Mineral 500ml',
        description: 'Água mineral sem gás gelada',
        price: '3.50',
        categoryId: bebidaCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400',
        isAvailable: true,
      },

      // Sobremesas
      {
        name: 'Brownie c/ Sorvete',
        description: 'Brownie de chocolate quente com bola de sorvete de baunilha',
        price: '12.90',
        categoryId: sobremesaCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1541781408260-3c61143b63d5?w=400',
        isAvailable: true,
      },
      {
        name: 'Milk Shake',
        description: 'Milk shake cremoso nos sabores chocolate, morango ou baunilha',
        price: '9.90',
        categoryId: sobremesaCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400',
        isAvailable: true,
      },

      // Porções
      {
        name: 'Batata Frita P',
        description: 'Porção pequena de batata frita crocante',
        price: '8.90',
        categoryId: porcaoCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
        isAvailable: true,
      },
      {
        name: 'Batata Frita G',
        description: 'Porção grande de batata frita crocante',
        price: '12.90',
        categoryId: porcaoCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=400',
        isAvailable: true,
      },
      {
        name: 'Onion Rings',
        description: 'Anéis de cebola empanados e crocantes',
        price: '9.90',
        categoryId: porcaoCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400',
        isAvailable: true,
      }
    ]);

    // Verificar se já existem configurações da loja
    const existingSettings = await db.select().from(storeSettings).limit(1);
    
    if (existingSettings.length === 0) {
      // Criar configurações básicas da loja
      await db.insert(storeSettings).values({
        isOpen: true,
        closingTime: '23:00',
        minimumOrderAmount: '25.00',
        defaultDeliveryFee: '5.90',
        
        // Banner principal
        bannerTitle: 'Hambúrguers Artesanais',
        bannerDescription: 'Ingredientes frescos, sabor incomparável. Faça seu pedido!',
        bannerPrice: '18.90',
        
        // Informações da loja
        siteName: 'Burger House',
        storeTitle: 'Nossa Loja',
        storeAddress: 'Rua dos Sabores, 123',
        storeNeighborhood: 'Centro, São Paulo - SP',
        storeHours: 'Segunda a Sexta: 18h - 23h\nSábado e Domingo: 18h - 00h',
        deliveryTime: 'Tempo médio: 30-45 minutos',
        deliveryFeeRange: 'Taxa: R$ 3,90 - R$ 8,90',
        paymentMethods: 'Dinheiro, Cartão, PIX\nMercado Pago integrado',
      });
    }

    console.log('✅ Banco de dados populado com sucesso!');
    console.log('📦 Criadas 4 categorias');
    console.log('🍔 Criados 12 produtos');
    console.log('⚙️ Configurações da loja inicializadas');

    // Populate loyalty rewards
    await seedLoyaltyRewards();
    
  } catch (error) {
    console.error('❌ Erro ao popular banco de dados:', error);
    throw error;
  }
}