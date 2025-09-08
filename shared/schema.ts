import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").unique(),
  phone: text("phone").notNull().unique(),
  password: text("password").notNull(),
  address: text("address"),
  // Sistema de fidelidade
  pointsBalance: integer("points_balance").default(0),
  loyaltyTier: text("loyalty_tier").default("bronze"), // bronze, silver, gold
  totalPointsEarned: integer("total_points_earned").default(0),
  // Sistema de leads e recaptação
  lastPurchaseDate: timestamp("last_purchase_date"),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0.00"),
  totalOrders: integer("total_orders").default(0),
  customerStatus: text("customer_status").default("active"), // active, inactive, dormant
  lastContactDate: timestamp("last_contact_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon").notNull(),
  displayOrder: integer("display_order").default(0),
});

// Products table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  categoryId: varchar("category_id").references(() => categories.id).notNull(),
  imageUrl: text("image_url").notNull(),
  isAvailable: boolean("is_available").default(true),
  isFeatured: boolean("is_featured").default(false),
  isPromotion: boolean("is_promotion").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(), // ID único legível para n8n
  userId: varchar("user_id").references(() => users.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  deliveryType: text("delivery_type").default("delivery"), // "delivery" or "pickup"
  // Campos separados de endereço
  streetName: text("street_name"),
  houseNumber: text("house_number"),
  neighborhood: text("neighborhood"),
  referencePoint: text("reference_point"),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").default("pending"),
  orderStatus: text("order_status").default("pending"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  specialInstructions: text("special_instructions"),
  estimatedDeliveryTime: integer("estimated_delivery_time"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

// Store settings table
export const storeSettings = pgTable("store_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  isOpen: boolean("is_open").default(true),
  closingTime: text("closing_time").default("23:00"),
  minimumOrderAmount: decimal("minimum_order_amount", { precision: 10, scale: 2 }).default("25.00"),
  deliveryAreas: jsonb("delivery_areas").default([]),
  // Novos campos para taxa de entrega por bairro
  useNeighborhoodDelivery: boolean("use_neighborhood_delivery").default(false),
  defaultDeliveryFee: decimal("default_delivery_fee", { precision: 10, scale: 2 }).default("5.90"),
  
  // Banner principal (seção topo)
  bannerTitle: text("banner_title").default("Hambúrguers"),
  bannerDescription: text("banner_description").default("Ingredientes frescos, sabor incomparável."),
  bannerPrice: decimal("banner_price", { precision: 10, scale: 2 }).default("18.90"),
  bannerImageUrl: text("banner_image_url").default(""),
  
  // Personalização visual do banner
  bannerColor1: text("banner_color_1").default("#ff6b35"),
  bannerColor2: text("banner_color_2").default("#f7931e"),
  bannerColor3: text("banner_color_3").default("#ffd23f"),
  bannerColor4: text("banner_color_4").default("#ff8c42"),
  bannerBackgroundImage: text("banner_background_image"),
  bannerUseImageBackground: boolean("banner_use_image_background").default(false),
  
  // Informações da loja (seção Nossa Loja)
  storeTitle: text("store_title").default("Nossa Loja"),
  // Nome da loja no cabeçalho
  siteName: text("site_name").default("Burger House"),
  storeImageUrl: text("store_image_url").default(""),
  storeAddress: text("store_address").default("Rua das Delícias, 123"),
  storeNeighborhood: text("store_neighborhood").default("Centro, São Paulo - SP"),
  storeHours: text("store_hours").default("Segunda a Sexta: 18h - 23h\nSábado e Domingo: 18h - 00h"),
  deliveryTime: text("delivery_time").default("Tempo médio: 30-45 minutos"),
  deliveryFeeRange: text("delivery_fee_range").default("Taxa: R$ 3,90 - R$ 8,90"),
  paymentMethods: text("payment_methods").default("Dinheiro, Cartão, PIX\nMercado Pago integrado"),
  
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Delivery zones table (bairros e suas taxas)
export const deliveryZones = pgTable("delivery_zones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  neighborhoodName: text("neighborhood_name").notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Expenses table for financial analytics
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(), // ex: ingredientes, marketing, aluguel, etc
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ingredients/Additionals table
export const ingredients = pgTable("ingredients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(), // 'protein', 'cheese', 'vegetable', 'sauce', 'extra'
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0.00"), // preço adicional
  discountPrice: decimal("discount_price", { precision: 10, scale: 2 }).default("0.00"), // desconto se removido
  isRemovable: boolean("is_removable").default(true), // pode ser removido?
  isRequired: boolean("is_required").default(false), // ingrediente obrigatório?
  maxQuantity: integer("max_quantity").default(3), // quantidade máxima permitida
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Product ingredients (base ingredients for each product)
export const productIngredients = pgTable("product_ingredients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  ingredientId: varchar("ingredient_id").references(() => ingredients.id).notNull(),
  isIncludedByDefault: boolean("is_included_by_default").default(true),
  quantity: integer("quantity").default(1),
});

// Product additionals (available additionals for each product)
export const productAdditionals = pgTable("product_additionals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  ingredientId: varchar("ingredient_id").references(() => ingredients.id).notNull(),
  customPrice: decimal("custom_price", { precision: 10, scale: 2 }), // preço específico para este produto (opcional)
  isActive: boolean("is_active").default(true),
});

// Order item modifications (customizations applied to order items)
export const orderItemModifications = pgTable("order_item_modifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderItemId: varchar("order_item_id").references(() => orderItems.id).notNull(),
  ingredientId: varchar("ingredient_id").references(() => ingredients.id).notNull(),
  modificationType: text("modification_type").notNull(), // 'add', 'remove', 'extra'
  quantity: integer("quantity").default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

// Banner themes table
export const bannerThemes = pgTable("banner_themes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  isCustomizable: boolean("is_customizable").default(false),
  htmlContent: text("html_content"),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
  gradientColor1: varchar("gradient_color_1", { length: 7 }),
  gradientColor2: varchar("gradient_color_2", { length: 7 }),
  gradientColor3: varchar("gradient_color_3", { length: 7 }),
  gradientColor4: varchar("gradient_color_4", { length: 7 }),
  useBackgroundImage: boolean("use_background_image").default(false),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SISTEMA DE FIDELIDADE ===

// Loyalty transactions table (pontos ganhos/gastos)
export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  orderId: varchar("order_id").references(() => orders.id), // Opcional, para compras
  type: text("type").notNull(), // 'purchase', 'reward_redemption', 'bonus', 'welcome'
  pointsChange: integer("points_change").notNull(), // Positivo para ganhar, negativo para gastar
  description: text("description").notNull(),
  multiplier: decimal("multiplier", { precision: 3, scale: 2 }).default("1.00"), // Para multiplicadores de tier
  createdAt: timestamp("created_at").defaultNow(),
});

// Loyalty rewards table (produtos/descontos que podem ser resgatados)
export const loyaltyRewards = pgTable("loyalty_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  pointsRequired: integer("points_required").notNull(),
  category: text("category").notNull(), // 'discount', 'freebie', 'cashback', 'product'
  value: decimal("value", { precision: 10, scale: 2 }), // Valor em R$ para descontos/cashback
  discountPercentage: integer("discount_percentage"), // Para descontos percentuais
  imageUrl: text("image_url"),
  stock: integer("stock").default(-1), // -1 = ilimitado
  isActive: boolean("is_active").default(true),
  minTier: text("min_tier").default("bronze"), // Tier mínimo para resgatar
  createdAt: timestamp("created_at").defaultNow(),
});

// Loyalty redemptions table (histórico de resgates)
export const loyaltyRedemptions = pgTable("loyalty_redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  rewardId: varchar("reward_id").references(() => loyaltyRewards.id).notNull(),
  pointsUsed: integer("points_used").notNull(),
  status: text("status").default("pending"), // 'pending', 'approved', 'delivered', 'cancelled'
  redemptionCode: text("redemption_code").unique(), // Código único para usar o benefício
  adminNote: text("admin_note"), // Nota do admin para resgates manuais
  expiresAt: timestamp("expires_at"), // Data de expiração do benefício
  usedAt: timestamp("used_at"), // Quando foi utilizado
  createdAt: timestamp("created_at").defaultNow(),
});

// === SISTEMA ADMIN DE FIDELIDADE ===

// Admin users table (usuários administradores)
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // hash bcrypt
  role: text("role").default("admin"), // admin, super_admin
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Points rules table (regras de pontuação)
export const pointsRules = pgTable("points_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ruleType: text("rule_type").notNull(), // base, category_multiplier, tier_multiplier, action_bonus
  isActive: boolean("is_active").default(true),
  // Regra base: 1 real = X pontos
  basePointsPerReal: decimal("base_points_per_real", { precision: 5, scale: 2 }).default("1.00"),
  // Multiplicador por categoria
  categoryId: varchar("category_id").references(() => categories.id),
  categoryMultiplier: decimal("category_multiplier", { precision: 5, scale: 2 }).default("1.00"),
  // Multiplicador por tier
  tierName: text("tier_name"), // bronze, silver, gold
  tierMultiplier: decimal("tier_multiplier", { precision: 5, scale: 2 }).default("1.00"),
  // Bônus por ações
  actionType: text("action_type"), // signup, first_purchase, referral, review, birthday
  actionPoints: integer("action_points").default(0),
  // Configurações gerais
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Loyalty tiers configuration (configuração dos tiers)
export const loyaltyTiersConfig = pgTable("loyalty_tiers_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // bronze, silver, gold, diamond
  displayName: text("display_name").notNull(), // Bronze, Prata, Ouro, Diamante
  color: text("color").default("#8B5A2B"), // cor hex para UI
  icon: text("icon").default("medal"), // nome do ícone
  // Requisitos para atingir este tier
  minPointsRequired: integer("min_points_required").default(0),
  minTotalSpent: decimal("min_total_spent", { precision: 10, scale: 2 }).default("0.00"),
  minOrdersCount: integer("min_orders_count").default(0),
  // Benefícios do tier
  pointsMultiplier: decimal("points_multiplier", { precision: 5, scale: 2 }).default("1.00"),
  freeShippingEnabled: boolean("free_shipping_enabled").default(false),
  exclusiveDiscounts: boolean("exclusive_discounts").default(false),
  prioritySupport: boolean("priority_support").default(false),
  birthdayBonus: integer("birthday_bonus").default(0),
  // Descrição dos benefícios
  benefits: text("benefits").array().default(sql`'{}'`), // lista de benefícios em texto
  description: text("description"),
  // Ordem de exibição
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaigns table (campanhas especiais)
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  campaignType: text("campaign_type").notNull(), // double_points, seasonal, group_goal, tier_bonus
  isActive: boolean("is_active").default(false),
  // Configurações da campanha
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  // Multiplicador de pontos (para campanhas de pontos duplos/triplos)
  pointsMultiplier: decimal("points_multiplier", { precision: 5, scale: 2 }).default("2.00"),
  // Meta de grupo (se aplicável)
  groupGoalTarget: integer("group_goal_target"), // ex: vender 100 produtos
  groupGoalCurrent: integer("group_goal_current").default(0),
  groupGoalReward: integer("group_goal_reward"), // pontos que todos ganham se atingir a meta
  // Filtros da campanha
  applicableCategories: text("applicable_categories").array().default(sql`'{}'`), // IDs das categorias
  applicableTiers: text("applicable_tiers").array().default(sql`'{}'`), // bronze, silver, gold
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
  // Limites
  maxRedemptionsPerUser: integer("max_redemptions_per_user").default(-1), // -1 = ilimitado
  totalBudget: decimal("total_budget", { precision: 10, scale: 2 }), // orçamento total em pontos
  usedBudget: decimal("used_budget", { precision: 10, scale: 2 }).default("0.00"),
  // Configurações visuais
  bannerImageUrl: text("banner_image_url"),
  backgroundColor: text("background_color").default("#ff6b35"),
  textColor: text("text_color").default("#ffffff"),
  // Termos e condições
  termsAndConditions: text("terms_and_conditions"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true, // Generated automatically
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertDeliveryZoneSchema = createInsertSchema(deliveryZones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z.string().or(z.date()).transform((val) => new Date(val)),
});

export const insertIngredientSchema = createInsertSchema(ingredients).omit({
  id: true,
  createdAt: true,
}).extend({
  price: z.string().or(z.number()).transform((val) => val.toString()),
  discountPrice: z.string().or(z.number()).transform((val) => val.toString()),
});

export const insertProductIngredientSchema = createInsertSchema(productIngredients).omit({
  id: true,
});

export const insertProductAdditionalSchema = createInsertSchema(productAdditionals).omit({
  id: true,
});

export const insertOrderItemModificationSchema = createInsertSchema(orderItemModifications).omit({
  id: true,
});

export const insertBannerThemeSchema = createInsertSchema(bannerThemes).omit({
  id: true,
  createdAt: true,
});

// === LOYALTY SYSTEM SCHEMAS ===

export const insertLoyaltyTransactionSchema = createInsertSchema(loyaltyTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertLoyaltyRewardSchema = createInsertSchema(loyaltyRewards).omit({
  id: true,
  createdAt: true,
});

export const insertLoyaltyRedemptionSchema = createInsertSchema(loyaltyRedemptions).omit({
  id: true,
  createdAt: true,
});

// === ADMIN SYSTEM SCHEMAS ===

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

export const insertPointsRuleSchema = createInsertSchema(pointsRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLoyaltyTiersConfigSchema = createInsertSchema(loyaltyTiersConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type DeliveryZone = typeof deliveryZones.$inferSelect;
export type InsertDeliveryZone = z.infer<typeof insertDeliveryZoneSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type Ingredient = typeof ingredients.$inferSelect;
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;

export type ProductIngredient = typeof productIngredients.$inferSelect;
export type InsertProductIngredient = z.infer<typeof insertProductIngredientSchema>;

export type ProductAdditional = typeof productAdditionals.$inferSelect;
export type InsertProductAdditional = z.infer<typeof insertProductAdditionalSchema>;

export type OrderItemModification = typeof orderItemModifications.$inferSelect;
export type InsertOrderItemModification = z.infer<typeof insertOrderItemModificationSchema>;

export type BannerTheme = typeof bannerThemes.$inferSelect;
export type InsertBannerTheme = z.infer<typeof insertBannerThemeSchema>;

// === LOYALTY SYSTEM TYPES ===

export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
export type InsertLoyaltyTransaction = z.infer<typeof insertLoyaltyTransactionSchema>;

export type LoyaltyReward = typeof loyaltyRewards.$inferSelect;
export type InsertLoyaltyReward = z.infer<typeof insertLoyaltyRewardSchema>;

export type LoyaltyRedemption = typeof loyaltyRedemptions.$inferSelect;
export type InsertLoyaltyRedemption = z.infer<typeof insertLoyaltyRedemptionSchema>;

export type StoreSettings = typeof storeSettings.$inferSelect;

// === ADMIN SYSTEM TYPES ===

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

export type PointsRule = typeof pointsRules.$inferSelect;
export type InsertPointsRule = z.infer<typeof insertPointsRuleSchema>;

export type LoyaltyTiersConfig = typeof loyaltyTiersConfig.$inferSelect;
export type InsertLoyaltyTiersConfig = z.infer<typeof insertLoyaltyTiersConfigSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
