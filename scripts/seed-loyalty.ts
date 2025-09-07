import { db } from "../server/db";
import { loyaltyRewards } from "../shared/schema";

const sampleRewards = [
  {
    name: "Desconto 10%",
    description: "10% de desconto na próxima compra",
    pointsRequired: 500,
    category: "discount",
    discountPercentage: 10,
    imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400",
    stock: -1, // Ilimitado
    minTier: "bronze"
  },
  {
    name: "Frete Grátis",
    description: "Frete grátis na próxima compra",
    pointsRequired: 300,
    category: "freebie",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    stock: -1,
    minTier: "bronze"
  },
  {
    name: "Hambúrguer Grátis",
    description: "Hambúrguer clássico grátis",
    pointsRequired: 1200,
    category: "product",
    value: "18.90",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
    stock: 10,
    minTier: "silver"
  },
  {
    name: "Desconto 25%",
    description: "25% de desconto na próxima compra",
    pointsRequired: 1500,
    category: "discount",
    discountPercentage: 25,
    imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400",
    stock: -1,
    minTier: "silver"
  },
  {
    name: "Cashback R$50",
    description: "R$50 de volta em pontos",
    pointsRequired: 2500,
    category: "cashback",
    value: "50.00",
    imageUrl: "https://images.unsplash.com/photo-1632246733401-98985805ceb8?w=400",
    stock: -1,
    minTier: "gold"
  },
  {
    name: "Combo Premium",
    description: "Hambúrguer + Batata + Bebida grátis",
    pointsRequired: 3000,
    category: "product",
    value: "45.90",
    imageUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400",
    stock: 5,
    minTier: "gold"
  }
];

export async function seedLoyaltyRewards() {
  try {
    console.log("🎯 Populando recompensas de fidelidade...");

    // Check if rewards already exist
    const existingRewards = await db.select().from(loyaltyRewards);
    if (existingRewards.length > 0) {
      console.log("✅ Recompensas já existem no banco de dados.");
      return;
    }

    // Insert sample rewards
    await db.insert(loyaltyRewards).values(sampleRewards);
    
    console.log(`✅ ${sampleRewards.length} recompensas adicionadas com sucesso!`);
    
    console.log("📊 Recompensas disponíveis:");
    sampleRewards.forEach(reward => {
      console.log(`  - ${reward.name}: ${reward.pointsRequired} pontos (${reward.minTier})`);
    });

  } catch (error) {
    console.error("❌ Erro ao popular recompensas:", error);
  }
}