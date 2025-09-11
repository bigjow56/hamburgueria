import {
  users,
  categories,
  products,
  orders,
  orderItems,
  storeSettings,
  deliveryZones,
  expenses,
  ingredients,
  productIngredients,
  productAdditionals,
  orderItemModifications,
  bannerThemes,
  loyaltyTransactions,
  loyaltyRewards,
  loyaltyRedemptions,
  // Referral system tables
  referralTransactions,
  userStreaks,
  seasonalRewards,
  rewardAnalytics,
  type User,
  type InsertUser,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type StoreSettings,
  type DeliveryZone,
  type InsertDeliveryZone,
  type Expense,
  type InsertExpense,
  type Ingredient,
  type InsertIngredient,
  type ProductIngredient,
  type InsertProductIngredient,
  type ProductAdditional,
  type InsertProductAdditional,
  type OrderItemModification,
  type InsertOrderItemModification,
  type BannerTheme,
  type InsertBannerTheme,
  type LoyaltyTransaction,
  type InsertLoyaltyTransaction,
  type LoyaltyReward,
  type InsertLoyaltyReward,
  type LoyaltyRedemption,
  type InsertLoyaltyRedemption,
  // Referral system types
  type ReferralTransaction,
  type InsertReferralTransaction,
  type UserStreak,
  type InsertUserStreak,
  type SeasonalReward,
  type InsertSeasonalReward,
  type RewardAnalytics,
  type InsertRewardAnalytics,
  // Admin system imports
  adminUsers,
  pointsRules,
  loyaltyTiersConfig,
  campaigns,
  type AdminUser,
  type InsertAdminUser,
  type PointsRule,
  type InsertPointsRule,
  type LoyaltyTiersConfig,
  type InsertLoyaltyTiersConfig,
  type Campaign,
  type InsertCampaign,
  // Webhook system imports
  webhookConfigs,
  webhookEvents,
  type WebhookConfig,
  type InsertWebhookConfig,
  type WebhookEvent,
  type InsertWebhookEvent,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count, or, gt, isNotNull } from "drizzle-orm";
import bcrypt from 'bcryptjs';

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  deleteCategory(id: string): Promise<boolean>;
  
  // Product operations
  getProducts(): Promise<Product[]>;
  getAllProducts(): Promise<Product[]>; // For admin - shows all products including unavailable
  getProductsByCategory(categoryId: string): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: InsertProduct): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  calculateProductPrice(productId: string): Promise<number>;
  
  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  addOrderItems(items: InsertOrderItem[]): Promise<OrderItem[]>;
  addOrderItemModifications(modifications: InsertOrderItemModification[]): Promise<OrderItemModification[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getUserOrders(userId: string): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(id: string, status: string): Promise<boolean>;
  updateOrderPaymentStatus(id: string, paymentStatus: string): Promise<boolean>;
  deleteOrder(id: string): Promise<boolean>;
  
  // Store settings
  getStoreSettings(): Promise<StoreSettings | undefined>;
  updateStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings>;
  
  // Delivery zones
  getDeliveryZones(): Promise<DeliveryZone[]>;
  getActiveDeliveryZones(): Promise<DeliveryZone[]>;
  getDeliveryZone(id: string): Promise<DeliveryZone | undefined>;
  createDeliveryZone(zone: InsertDeliveryZone): Promise<DeliveryZone>;
  updateDeliveryZone(id: string, zone: Partial<InsertDeliveryZone>): Promise<DeliveryZone | undefined>;
  deleteDeliveryZone(id: string): Promise<boolean>;
  getDeliveryFeeByNeighborhood(neighborhood: string): Promise<number | null>;
  
  // Expenses
  getExpenses(): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;
  
  // Ingredients
  getIngredients(): Promise<Ingredient[]>;
  getIngredientsByCategory(category: string): Promise<Ingredient[]>;
  getIngredient(id: string): Promise<Ingredient | undefined>;
  createIngredient(ingredient: InsertIngredient): Promise<Ingredient>;
  updateIngredient(id: string, ingredient: Partial<InsertIngredient>): Promise<Ingredient | undefined>;
  deleteIngredient(id: string): Promise<boolean>;
  
  // Product Ingredients & Additionals
  getProductIngredients(productId: string): Promise<ProductIngredient[]>;
  getProductAdditionals(productId: string): Promise<ProductAdditional[]>;
  addProductIngredient(data: InsertProductIngredient): Promise<ProductIngredient>;
  addProductAdditional(data: InsertProductAdditional): Promise<ProductAdditional>;
  removeProductIngredient(productId: string, ingredientId: string): Promise<boolean>;
  removeProductAdditional(productId: string, ingredientId: string): Promise<boolean>;
  updateProductIngredients(productId: string, ingredientConfigs: any[]): Promise<void>;
  recalculateProductPrice(productId: string): Promise<Product | undefined>;
  
  // Banner themes
  getBannerThemes(): Promise<BannerTheme[]>;
  getActiveBanner(): Promise<BannerTheme | undefined>;
  getBannerTheme(id: string): Promise<BannerTheme | undefined>;
  createBannerTheme(banner: InsertBannerTheme): Promise<BannerTheme>;
  updateBannerTheme(id: string, banner: Partial<InsertBannerTheme>): Promise<BannerTheme | undefined>;
  activateBanner(id: string): Promise<BannerTheme | undefined>;
  deleteBannerTheme(id: string): Promise<boolean>;
  
  // Loyalty system
  getUserLoyaltyBalance(userId: string): Promise<{ user: User; nextTier: { tier: string; pointsNeeded: number } } | undefined>;
  getUserLoyaltyTransactions(userId: string): Promise<LoyaltyTransaction[]>;
  addLoyaltyPoints(userId: string, data: { orderId?: string; amount: number; type: string; description: string }): Promise<{ transaction: LoyaltyTransaction; newBalance: number; newTier: string }>;
  getLoyaltyRewards(userTier?: string): Promise<LoyaltyReward[]>;
  getAllLoyaltyRewardsAdmin(): Promise<LoyaltyReward[]>;
  createLoyaltyReward(reward: InsertLoyaltyReward): Promise<LoyaltyReward>;
  updateLoyaltyReward(id: string, reward: Partial<InsertLoyaltyReward>): Promise<LoyaltyReward | undefined>;
  deleteLoyaltyReward(id: string): Promise<boolean>;
  redeemLoyaltyReward(userId: string, rewardId: string): Promise<{ redemption: LoyaltyRedemption; newBalance: number }>;
  getUserLoyaltyRedemptions(userId: string): Promise<LoyaltyRedemption[]>;
  getAllLoyaltyRedemptions(): Promise<LoyaltyRedemption[]>;
  updateRedemptionStatus(id: string, status: string): Promise<LoyaltyRedemption | undefined>;

  // === ADMIN SYSTEM OPERATIONS ===
  
  // Admin users operations
  createAdminUser(admin: InsertAdminUser): Promise<AdminUser>;
  getAdminUser(id: string): Promise<AdminUser | undefined>;
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  authenticateAdmin(username: string, password: string): Promise<AdminUser | undefined>;
  updateAdminUser(id: string, updates: Partial<InsertAdminUser>): Promise<AdminUser | undefined>;

  // Points rules operations
  createPointsRule(rule: InsertPointsRule): Promise<PointsRule>;
  getPointsRules(isActive?: boolean): Promise<PointsRule[]>;
  getPointsRule(id: string): Promise<PointsRule | undefined>;
  updatePointsRule(id: string, updates: Partial<InsertPointsRule>): Promise<PointsRule | undefined>;
  deletePointsRule(id: string): Promise<boolean>;

  // Loyalty tiers config operations
  createLoyaltyTierConfig(config: InsertLoyaltyTiersConfig): Promise<LoyaltyTiersConfig>;
  getLoyaltyTiersConfigs(isActive?: boolean): Promise<LoyaltyTiersConfig[]>;
  getLoyaltyTierConfig(id: string): Promise<LoyaltyTiersConfig | undefined>;
  getLoyaltyTierConfigByName(name: string): Promise<LoyaltyTiersConfig | undefined>;
  updateLoyaltyTierConfig(id: string, updates: Partial<InsertLoyaltyTiersConfig>): Promise<LoyaltyTiersConfig | undefined>;
  deleteLoyaltyTierConfig(id: string): Promise<boolean>;

  // Campaigns operations
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  getCampaigns(isActive?: boolean): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  updateCampaign(id: string, updates: Partial<InsertCampaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: string): Promise<boolean>;
  getActiveCampaigns(): Promise<Campaign[]>;

  // Admin dashboard statistics
  getAdminDashboardStats(): Promise<{
    totalRewards: number;
    activeRewards: number;
    totalRedemptions: number;
    totalUsers: number;
    totalPointsDistributed: number;
    activePointsRules: number;
    activeCampaigns: number;
  }>;

  // Admin leads operations
  getLeadsWithDetails(): Promise<any[]>;
  getLeadsStats(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    inactiveCustomers: number;
    dormantCustomers: number;
    averageOrderValue: number;
    totalRevenue: number;
  }>;
  updateCustomerStatus(customerId: string, status: string): Promise<boolean>;
  registerCustomerContact(customerId: string): Promise<boolean>;

  // === REFERRAL SYSTEM METHODS ===
  registerUserWithReferral(data: {
    name: string;
    email?: string;
    phone: string;
    password: string;
    address?: string;
    referralCode?: string;
  }): Promise<{
    user: User;
    referralBonus?: number;
    message: string;
  }>;
  getUserReferralInfo(userId: string): Promise<{
    referralCode: string;
    totalReferrals: number;
    totalReferralPoints: number;
    referredUsers: any[];
    referralTransactions: ReferralTransaction[];
  }>;
  validateReferralCode(code: string): Promise<boolean>;
  getReferralAnalytics(): Promise<{
    totalReferrals: number;
    pendingReferrals: number;
    confirmedReferrals: number;
    totalPointsAwarded: number;
    topReferrers: any[];
  }>;
  getAllReferralTransactions(): Promise<ReferralTransaction[]>;
  createSeasonalReward(reward: InsertSeasonalReward): Promise<SeasonalReward>;
  getActiveSeasonalRewards(): Promise<SeasonalReward[]>;
  getUserStreaks(userId: string): Promise<UserStreak[]>;
  updateUserStreak(userId: string, streakType: string, orderValue?: number): Promise<{
    streak: UserStreak;
    bonusPoints: number;
    message: string;
  }>;
  
  // Fraud detection methods
  logFraudDetection(data: {
    userId: string;
    actionType: string;
    riskScore: number;
    blocked: boolean;
    ipAddress?: string;
    userAgent?: string;
    additionalData: any;
  }): Promise<void>;
  countReferralValidationAttempts(ipAddress: string, timeWindow: number): Promise<number>;
  countSameIpReferrals(ipAddress: string): Promise<number>;
  countSameUserAgentReferrals(userAgent: string): Promise<number>;

  // === WEBHOOK SYSTEM METHODS ===
  
  // Webhook configuration methods
  createWebhookConfig(config: InsertWebhookConfig): Promise<WebhookConfig>;
  getWebhookConfigs(): Promise<WebhookConfig[]>;
  getActiveWebhookConfigs(): Promise<WebhookConfig[]>;
  getWebhookConfig(id: string): Promise<WebhookConfig | undefined>;
  updateWebhookConfig(id: string, updates: Partial<InsertWebhookConfig>): Promise<WebhookConfig | undefined>;
  deleteWebhookConfig(id: string): Promise<boolean>;
  
  // Webhook event methods
  createWebhookEvent(event: InsertWebhookEvent): Promise<WebhookEvent>;
  getWebhookEvents(webhookConfigId?: string, limit?: number): Promise<WebhookEvent[]>;
  getWebhookEvent(id: string): Promise<WebhookEvent | undefined>;
  updateWebhookEventStatus(id: string, status: string, httpStatus?: number, response?: string, errorMessage?: string): Promise<WebhookEvent | undefined>;
  getPendingWebhookEvents(): Promise<WebhookEvent[]>;
  getFailedWebhookEvents(): Promise<WebhookEvent[]>;
  retryWebhookEvent(id: string): Promise<WebhookEvent | undefined>;
  
  // Webhook notification methods
  notifyWebhookChange(tableName: string, operationType: string, recordId: string, oldData?: any, newData?: any): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Check for existing email
    if (userData.email) {
      const existingEmail = await this.getUserByEmail(userData.email);
      if (existingEmail) {
        throw new Error('Um usuário com este email já existe');
      }
    }

    // Check for existing phone
    const existingPhone = await this.getUserByPhone(userData.phone);
    if (existingPhone) {
      throw new Error('Um usuário com este telefone já existe');
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Give welcome bonus points to new users
    const [user] = await db.insert(users).values({
      ...userData,
      password: hashedPassword,
      pointsBalance: 100, // Welcome bonus
      totalPointsEarned: 100
    }).returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.displayOrder);
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(categoryData).returning();
    return category;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(eq(categories.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isAvailable, true));
  }

  // Calculate product price based on its ingredients (using custom prices when available)
  async calculateProductPrice(productId: string): Promise<number> {
    const productIngredientsData = await db
      .select({
        ingredientPrice: ingredients.price,
        customPrice: productAdditionals.customPrice,
        quantity: productIngredients.quantity,
        isActive: productAdditionals.isActive
      })
      .from(productIngredients)
      .leftJoin(ingredients, eq(productIngredients.ingredientId, ingredients.id))
      .leftJoin(productAdditionals, and(
        eq(productIngredients.productId, productAdditionals.productId),
        eq(productIngredients.ingredientId, productAdditionals.ingredientId)
      ))
      .where(eq(productIngredients.productId, productId));
    
    const totalPrice = productIngredientsData.reduce((sum, item) => {
      // Use custom price if available and active, otherwise use ingredient price
      const priceToUse = (item.isActive !== false && item.customPrice) 
        ? item.customPrice 
        : item.ingredientPrice;
      
      const price = parseFloat(priceToUse || '0');
      const quantity = item.quantity || 1;
      return sum + (price * quantity);
    }, 0);
    
    return Math.round(totalPrice * 100) / 100; // Round to 2 decimal places
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.categoryId, categoryId));
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.isFeatured, true))
      .limit(6);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    // If price is not provided, set it to 0 initially
    let finalProductData = productData;
    if (!productData.price) {
      finalProductData = {
        ...productData,
        price: "0.00"
      };
    }
    
    const [product] = await db.insert(products).values(finalProductData).returning();
    return product;
  }

  async updateProduct(id: string, productData: InsertProduct): Promise<Product | undefined> {
    // If price is not provided, calculate it from ingredients
    let finalProductData = productData;
    if (!productData.price) {
      const calculatedPrice = await this.calculateProductPrice(id);
      finalProductData = {
        ...productData,
        price: calculatedPrice.toString()
      };
    }
    
    const [product] = await db
      .update(products)
      .set(finalProductData)
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(eq(products.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Helper function to generate unique order number
  private generateOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const time = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `BH${year}${month}${day}${time}${random}`;
  }

  // Order operations
  async createOrder(orderData: InsertOrder): Promise<Order> {
    const orderNumber = this.generateOrderNumber();
    const [order] = await db.insert(orders).values({
      ...orderData,
      orderNumber
    }).returning();
    return order;
  }

  async addOrderItems(items: InsertOrderItem[]): Promise<OrderItem[]> {
    return await db.insert(orderItems).values(items).returning();
  }

  async addOrderItemModifications(modifications: InsertOrderItemModification[]): Promise<OrderItemModification[]> {
    return await db.insert(orderItemModifications).values(modifications).returning();
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(id: string, status: string): Promise<boolean> {
    const result = await db
      .update(orders)
      .set({ orderStatus: status, updatedAt: new Date() })
      .where(eq(orders.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async updateOrderPaymentStatus(id: string, paymentStatus: string): Promise<boolean> {
    const result = await db
      .update(orders)
      .set({ paymentStatus: paymentStatus, updatedAt: new Date() })
      .where(eq(orders.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAllOrders(): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));
  }

  async deleteOrder(id: string): Promise<boolean> {
    try {
      // First get all order items for this order
      const orderItemsResult = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, id));

      // Delete order item modifications for each order item
      for (const orderItem of orderItemsResult) {
        await db
          .delete(orderItemModifications)
          .where(eq(orderItemModifications.orderItemId, orderItem.id));
      }

      // Delete order items
      await db
        .delete(orderItems)
        .where(eq(orderItems.orderId, id));

      // Finally delete the order itself
      const result = await db
        .delete(orders)
        .where(eq(orders.id, id));

      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting order:", error);
      return false;
    }
  }

  // Store settings
  async getStoreSettings(): Promise<StoreSettings | undefined> {
    const [settings] = await db.select().from(storeSettings).limit(1);
    return settings;
  }

  async updateStoreSettings(settingsData: Partial<StoreSettings>): Promise<StoreSettings> {
    const [settings] = await db
      .update(storeSettings)
      .set({ ...settingsData, updatedAt: new Date() })
      .returning();
    return settings;
  }

  // Delivery zones
  async getDeliveryZones(): Promise<DeliveryZone[]> {
    return await db.select().from(deliveryZones).orderBy(deliveryZones.neighborhoodName);
  }

  async getActiveDeliveryZones(): Promise<DeliveryZone[]> {
    return await db
      .select()
      .from(deliveryZones)
      .where(eq(deliveryZones.isActive, true))
      .orderBy(deliveryZones.neighborhoodName);
  }

  async getDeliveryZone(id: string): Promise<DeliveryZone | undefined> {
    const [zone] = await db.select().from(deliveryZones).where(eq(deliveryZones.id, id));
    return zone;
  }

  async createDeliveryZone(zoneData: InsertDeliveryZone): Promise<DeliveryZone> {
    const [zone] = await db.insert(deliveryZones).values(zoneData).returning();
    return zone;
  }

  async updateDeliveryZone(id: string, zoneData: Partial<InsertDeliveryZone>): Promise<DeliveryZone | undefined> {
    const [zone] = await db
      .update(deliveryZones)
      .set({ ...zoneData, updatedAt: new Date() })
      .where(eq(deliveryZones.id, id))
      .returning();
    return zone;
  }

  async deleteDeliveryZone(id: string): Promise<boolean> {
    const result = await db.delete(deliveryZones).where(eq(deliveryZones.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getDeliveryFeeByNeighborhood(neighborhood: string): Promise<number | null> {
    const [zone] = await db
      .select()
      .from(deliveryZones)
      .where(and(
        eq(deliveryZones.neighborhoodName, neighborhood),
        eq(deliveryZones.isActive, true)
      ));
    
    return zone ? parseFloat(zone.deliveryFee) : null;
  }

  // Expenses operations
  async getExpenses(): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .orderBy(desc(expenses.date), desc(expenses.createdAt));
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense;
  }

  async createExpense(expenseData: InsertExpense): Promise<Expense> {
    const [expense] = await db.insert(expenses).values(expenseData).returning();
    return expense;
  }

  async updateExpense(id: string, expenseData: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [expense] = await db
      .update(expenses)
      .set({ ...expenseData, updatedAt: new Date() })
      .where(eq(expenses.id, id))
      .returning();
    return expense;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Ingredients operations
  async getIngredients(): Promise<Ingredient[]> {
    return await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.isActive, true))
      .orderBy(ingredients.category, ingredients.name);
  }

  async getIngredientsByCategory(category: string): Promise<Ingredient[]> {
    return await db
      .select()
      .from(ingredients)
      .where(and(
        eq(ingredients.category, category),
        eq(ingredients.isActive, true)
      ))
      .orderBy(ingredients.name);
  }

  async getIngredient(id: string): Promise<Ingredient | undefined> {
    const [ingredient] = await db.select().from(ingredients).where(eq(ingredients.id, id));
    return ingredient;
  }

  async createIngredient(ingredientData: InsertIngredient): Promise<Ingredient> {
    const [ingredient] = await db.insert(ingredients).values(ingredientData).returning();
    return ingredient;
  }

  async updateIngredient(id: string, ingredientData: Partial<InsertIngredient>): Promise<Ingredient | undefined> {
    const [ingredient] = await db
      .update(ingredients)
      .set(ingredientData)
      .where(eq(ingredients.id, id))
      .returning();
    return ingredient;
  }

  async deleteIngredient(id: string): Promise<boolean> {
    const result = await db.delete(ingredients).where(eq(ingredients.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Product Ingredients & Additionals operations
  async getProductIngredients(productId: string): Promise<ProductIngredient[]> {
    return await db
      .select({
        id: productIngredients.id,
        productId: productIngredients.productId,
        ingredientId: productIngredients.ingredientId,
        isIncludedByDefault: productIngredients.isIncludedByDefault,
        quantity: productIngredients.quantity,
        customPrice: productAdditionals.customPrice, // Buscar customPrice dos additionals
        ingredient: ingredients
      })
      .from(productIngredients)
      .leftJoin(ingredients, eq(productIngredients.ingredientId, ingredients.id))
      .leftJoin(productAdditionals, and(
        eq(productIngredients.productId, productAdditionals.productId),
        eq(productIngredients.ingredientId, productAdditionals.ingredientId)
      ))
      .where(eq(productIngredients.productId, productId));
  }

  async getProductAdditionals(productId: string): Promise<ProductAdditional[]> {
    return await db
      .select({
        id: productAdditionals.id,
        productId: productAdditionals.productId,
        ingredientId: productAdditionals.ingredientId,
        customPrice: productAdditionals.customPrice,
        isActive: productAdditionals.isActive,
        ingredient: ingredients
      })
      .from(productAdditionals)
      .leftJoin(ingredients, eq(productAdditionals.ingredientId, ingredients.id))
      .where(and(
        eq(productAdditionals.productId, productId),
        eq(productAdditionals.isActive, true)
      ));
  }

  async addProductIngredient(data: InsertProductIngredient): Promise<ProductIngredient> {
    const [productIngredient] = await db.insert(productIngredients).values(data).returning();
    return productIngredient;
  }

  async addProductAdditional(data: InsertProductAdditional): Promise<ProductAdditional> {
    const [productAdditional] = await db.insert(productAdditionals).values(data).returning();
    return productAdditional;
  }

  async removeProductIngredient(productId: string, ingredientId: string): Promise<boolean> {
    const result = await db
      .delete(productIngredients)
      .where(and(
        eq(productIngredients.productId, productId),
        eq(productIngredients.ingredientId, ingredientId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async removeProductAdditional(productId: string, ingredientId: string): Promise<boolean> {
    const result = await db
      .delete(productAdditionals)
      .where(and(
        eq(productAdditionals.productId, productId),
        eq(productAdditionals.ingredientId, ingredientId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async updateProductIngredients(productId: string, ingredientConfigs: any[]): Promise<void> {
    // Only update ingredients if ingredientConfigs is provided and not empty
    if (!ingredientConfigs || ingredientConfigs.length === 0) {
      return; // Don't delete existing ingredients if no new ones are provided
    }

    // Remove existing product ingredients
    await db.delete(productIngredients).where(eq(productIngredients.productId, productId));
    
    // Remove existing product additionals 
    await db.delete(productAdditionals).where(eq(productAdditionals.productId, productId));

    // Add new product ingredients and additionals
    for (const config of ingredientConfigs) {
      // Add as product ingredient - usar configuração real do frontend
      await db.insert(productIngredients).values({
        productId,
        ingredientId: config.ingredientId,
        isIncludedByDefault: config.isIncludedByDefault !== undefined ? config.isIncludedByDefault : true,
        quantity: config.quantity || 1,
      });

      // Also add as product additional (for customization)
      await db.insert(productAdditionals).values({
        productId,
        ingredientId: config.ingredientId,
        customPrice: config.customPrice || null,
        isActive: config.isActive !== undefined ? config.isActive : true,
      });
    }
    
    // Don't automatically recalculate price when updating ingredients
    // Let the user manually set prices or use the explicit recalculate function
  }

  async recalculateProductPrice(productId: string): Promise<Product | undefined> {
    const calculatedPrice = await this.calculateProductPrice(productId);
    const [product] = await db
      .update(products)
      .set({ price: calculatedPrice.toString() })
      .where(eq(products.id, productId))
      .returning();
    return product;
  }

  // Banner themes operations
  async getBannerThemes(): Promise<BannerTheme[]> {
    return await db.select().from(bannerThemes).orderBy(desc(bannerThemes.createdAt));
  }

  async getActiveBanner(): Promise<BannerTheme | undefined> {
    const [banner] = await db.select().from(bannerThemes).where(eq(bannerThemes.isActive, true));
    return banner;
  }

  async getBannerTheme(id: string): Promise<BannerTheme | undefined> {
    const [banner] = await db.select().from(bannerThemes).where(eq(bannerThemes.id, id));
    return banner;
  }

  async createBannerTheme(bannerData: InsertBannerTheme): Promise<BannerTheme> {
    const [banner] = await db.insert(bannerThemes).values(bannerData).returning();
    return banner;
  }

  async updateBannerTheme(id: string, bannerData: Partial<InsertBannerTheme>): Promise<BannerTheme | undefined> {
    const [banner] = await db
      .update(bannerThemes)
      .set(bannerData)
      .where(eq(bannerThemes.id, id))
      .returning();
    return banner;
  }

  async activateBanner(id: string): Promise<BannerTheme | undefined> {
    // First, deactivate all banners
    await db
      .update(bannerThemes)
      .set({ isActive: false });
    
    // Then, activate the selected banner
    const [banner] = await db
      .update(bannerThemes)
      .set({ isActive: true })
      .where(eq(bannerThemes.id, id))
      .returning();
    
    return banner;
  }

  async deleteBannerTheme(id: string): Promise<boolean> {
    const result = await db
      .delete(bannerThemes)
      .where(eq(bannerThemes.id, id));
    return (result.rowCount || 0) > 0;
  }

  // === LOYALTY SYSTEM METHODS ===

  private getTierMultiplier(tier: string): number {
    switch (tier) {
      case 'silver': return 1.2;
      case 'gold': return 1.5;
      default: return 1.0; // bronze
    }
  }

  private calculateTier(totalPoints: number): string {
    if (totalPoints >= 5000) return 'gold';
    if (totalPoints >= 1000) return 'silver';
    return 'bronze';
  }

  private getNextTierInfo(currentTier: string, totalPoints: number): { tier: string; pointsNeeded: number } {
    switch (currentTier) {
      case 'bronze':
        return { tier: 'silver', pointsNeeded: 1000 - totalPoints };
      case 'silver':
        return { tier: 'gold', pointsNeeded: 5000 - totalPoints };
      case 'gold':
        return { tier: 'gold', pointsNeeded: 0 }; // Already at max tier
      default:
        return { tier: 'silver', pointsNeeded: 1000 - totalPoints };
    }
  }

  async getUserLoyaltyBalance(userId: string): Promise<{ user: User; nextTier: { tier: string; pointsNeeded: number } } | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const nextTier = this.getNextTierInfo(user.loyaltyTier || 'bronze', user.totalPointsEarned || 0);
    
    return {
      user,
      nextTier
    };
  }

  async getUserLoyaltyTransactions(userId: string): Promise<LoyaltyTransaction[]> {
    return await db
      .select()
      .from(loyaltyTransactions)
      .where(eq(loyaltyTransactions.userId, userId))
      .orderBy(desc(loyaltyTransactions.createdAt));
  }

  async addLoyaltyPoints(userId: string, data: { orderId?: string; amount: number; type: string; description: string }): Promise<{ transaction: LoyaltyTransaction; newBalance: number; newTier: string }> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Calculate points based on amount and tier multiplier
    const multiplier = this.getTierMultiplier(user.loyaltyTier || 'bronze');
    const pointsEarned = data.type === 'welcome' ? 100 : Math.floor(data.amount * multiplier);

    // Create transaction
    const [transaction] = await db
      .insert(loyaltyTransactions)
      .values({
        userId,
        orderId: data.orderId,
        type: data.type,
        pointsChange: pointsEarned,
        description: data.description,
        multiplier: multiplier.toString()
      })
      .returning();

    // Update user balance and tier
    const newBalance = (user.pointsBalance || 0) + pointsEarned;
    const newTotalPoints = (user.totalPointsEarned || 0) + pointsEarned;
    const newTier = this.calculateTier(newTotalPoints);

    await db
      .update(users)
      .set({
        pointsBalance: newBalance,
        totalPointsEarned: newTotalPoints,
        loyaltyTier: newTier
      })
      .where(eq(users.id, userId));

    return {
      transaction,
      newBalance,
      newTier
    };
  }

  async getLoyaltyRewards(userTier: string = 'bronze'): Promise<any[]> {
    // Define tier hierarchy
    const tierHierarchy = { bronze: 0, silver: 1, gold: 2 };
    const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0;

    const allRewards = await db
      .select()
      .from(loyaltyRewards)
      .where(eq(loyaltyRewards.isActive, true))
      .orderBy(loyaltyRewards.pointsRequired);

    // Filter rewards based on user tier and map pointsRequired to pointsCost
    return allRewards
      .filter(reward => {
        const rewardTierLevel = tierHierarchy[reward.minTier as keyof typeof tierHierarchy] || 0;
        return rewardTierLevel <= userTierLevel;
      })
      .map(reward => ({
        ...reward,
        pointsCost: reward.pointsRequired // Map pointsRequired to pointsCost for frontend
      }));
  }

  async getAllLoyaltyRewardsAdmin(): Promise<LoyaltyReward[]> {
    // Admin deve ver todas as recompensas, sem filtro de tier ou ativo
    return await db
      .select()
      .from(loyaltyRewards)
      .orderBy(loyaltyRewards.pointsRequired);
  }

  async createLoyaltyReward(rewardData: InsertLoyaltyReward): Promise<LoyaltyReward> {
    const [reward] = await db
      .insert(loyaltyRewards)
      .values(rewardData)
      .returning();
    return reward;
  }

  async updateLoyaltyReward(id: string, rewardData: Partial<InsertLoyaltyReward>): Promise<LoyaltyReward | undefined> {
    const [reward] = await db
      .update(loyaltyRewards)
      .set(rewardData)
      .where(eq(loyaltyRewards.id, id))
      .returning();
    return reward;
  }

  async deleteLoyaltyReward(id: string): Promise<boolean> {
    const result = await db
      .delete(loyaltyRewards)
      .where(eq(loyaltyRewards.id, id));
    return (result.rowCount || 0) > 0;
  }

  async redeemLoyaltyReward(userId: string, rewardId: string): Promise<{ redemption: LoyaltyRedemption; newBalance: number }> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const [reward] = await db
      .select()
      .from(loyaltyRewards)
      .where(eq(loyaltyRewards.id, rewardId));

    if (!reward) {
      throw new Error("Reward not found");
    }

    if (!reward.isActive) {
      throw new Error("Reward is not available");
    }

    if ((user.pointsBalance || 0) < reward.pointsRequired) {
      throw new Error("Insufficient points");
    }

    // Check stock if applicable
    if (reward.stock !== null && reward.stock !== -1 && reward.stock <= 0) {
      throw new Error("Reward out of stock");
    }

    // Generate unique redemption code
    const redemptionCode = `${reward.category.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    // Create redemption
    const [redemption] = await db
      .insert(loyaltyRedemptions)
      .values({
        userId,
        rewardId,
        pointsUsed: reward.pointsRequired,
        redemptionCode,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      })
      .returning();

    // Create negative points transaction
    await db
      .insert(loyaltyTransactions)
      .values({
        userId,
        type: 'reward_redemption',
        pointsChange: -reward.pointsRequired,
        description: `Resgate: ${reward.name}`
      });

    // Update user balance
    const newBalance = (user.pointsBalance || 0) - reward.pointsRequired;
    await db
      .update(users)
      .set({ pointsBalance: newBalance })
      .where(eq(users.id, userId));

    // Update stock if applicable
    if (reward.stock !== null && reward.stock !== -1) {
      await db
        .update(loyaltyRewards)
        .set({ stock: reward.stock - 1 })
        .where(eq(loyaltyRewards.id, rewardId));
    }

    return {
      redemption,
      newBalance
    };
  }

  async getUserLoyaltyRedemptions(userId: string): Promise<LoyaltyRedemption[]> {
    return await db
      .select()
      .from(loyaltyRedemptions)
      .where(eq(loyaltyRedemptions.userId, userId))
      .orderBy(desc(loyaltyRedemptions.createdAt));
  }

  async getAllLoyaltyRedemptions(): Promise<LoyaltyRedemption[]> {
    return await db
      .select()
      .from(loyaltyRedemptions)
      .orderBy(desc(loyaltyRedemptions.createdAt));
  }

  async updateRedemptionStatus(id: string, status: string): Promise<LoyaltyRedemption | undefined> {
    const updateData: any = { status };
    
    if (status === 'delivered') {
      updateData.usedAt = new Date();
    }

    const [redemption] = await db
      .update(loyaltyRedemptions)
      .set(updateData)
      .where(eq(loyaltyRedemptions.id, id))
      .returning();
    
    return redemption;
  }

  // === ADMIN SYSTEM IMPLEMENTATIONS ===

  // Admin users operations
  async createAdminUser(admin: InsertAdminUser): Promise<AdminUser> {
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(admin.password, 12);
    const adminWithHashedPassword = { ...admin, password: hashedPassword };
    
    const [adminUser] = await db.insert(adminUsers).values(adminWithHashedPassword).returning();
    return adminUser;
  }

  async getAdminUser(id: string): Promise<AdminUser | undefined> {
    const [adminUser] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return adminUser;
  }

  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    const [adminUser] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return adminUser;
  }

  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [adminUser] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return adminUser;
  }

  async authenticateAdmin(username: string, password: string): Promise<AdminUser | undefined> {
    console.log(`🔍 DEBUG: Authenticating admin with username: ${username}`);
    const admin = await this.getAdminUserByUsername(username);
    
    if (!admin) {
      console.log(`❌ DEBUG: Admin user not found for username: ${username}`);
      return undefined;
    }
    
    console.log(`✅ DEBUG: Admin user found:`, {
      id: admin.id,
      username: admin.username,
      isActive: admin.isActive,
      passwordExists: !!admin.password
    });
    
    if (!admin.isActive) {
      console.log(`❌ DEBUG: Admin user is inactive: ${username}`);
      return undefined;
    }
    
    // Use bcrypt to verify password
    console.log(`🔐 DEBUG: Comparing passwords for ${username}`);
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    console.log(`🔐 DEBUG: Password valid for ${username}:`, isPasswordValid);
    
    if (isPasswordValid) {
      console.log(`✅ DEBUG: Authentication successful for ${username}`);
      // Update last login
      await db
        .update(adminUsers)
        .set({ lastLogin: new Date() })
        .where(eq(adminUsers.id, admin.id));
      return admin;
    }
    
    console.log(`❌ DEBUG: Invalid password for ${username}`);
    return undefined;
  }

  async updateAdminUser(id: string, updates: Partial<InsertAdminUser>): Promise<AdminUser | undefined> {
    const [adminUser] = await db
      .update(adminUsers)
      .set(updates)
      .where(eq(adminUsers.id, id))
      .returning();
    return adminUser;
  }

  // Points rules operations
  async createPointsRule(rule: InsertPointsRule): Promise<PointsRule> {
    const [pointsRule] = await db.insert(pointsRules).values(rule).returning();
    return pointsRule;
  }

  async getPointsRules(isActive?: boolean): Promise<PointsRule[]> {
    const query = db.select().from(pointsRules);
    if (isActive !== undefined) {
      query.where(eq(pointsRules.isActive, isActive));
    }
    return query.orderBy(desc(pointsRules.createdAt));
  }

  async getPointsRule(id: string): Promise<PointsRule | undefined> {
    const [rule] = await db.select().from(pointsRules).where(eq(pointsRules.id, id));
    return rule;
  }

  async updatePointsRule(id: string, updates: Partial<InsertPointsRule>): Promise<PointsRule | undefined> {
    const [rule] = await db
      .update(pointsRules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pointsRules.id, id))
      .returning();
    return rule;
  }

  async deletePointsRule(id: string): Promise<boolean> {
    const result = await db.delete(pointsRules).where(eq(pointsRules.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Loyalty tiers config operations
  async createLoyaltyTierConfig(config: InsertLoyaltyTiersConfig): Promise<LoyaltyTiersConfig> {
    const [tierConfig] = await db.insert(loyaltyTiersConfig).values(config).returning();
    return tierConfig;
  }

  async getLoyaltyTiersConfigs(isActive?: boolean): Promise<LoyaltyTiersConfig[]> {
    const query = db.select().from(loyaltyTiersConfig);
    if (isActive !== undefined) {
      query.where(eq(loyaltyTiersConfig.isActive, isActive));
    }
    return query.orderBy(loyaltyTiersConfig.sortOrder);
  }

  async getLoyaltyTierConfig(id: string): Promise<LoyaltyTiersConfig | undefined> {
    const [config] = await db.select().from(loyaltyTiersConfig).where(eq(loyaltyTiersConfig.id, id));
    return config;
  }

  async getLoyaltyTierConfigByName(name: string): Promise<LoyaltyTiersConfig | undefined> {
    const [config] = await db.select().from(loyaltyTiersConfig).where(eq(loyaltyTiersConfig.name, name));
    return config;
  }

  async updateLoyaltyTierConfig(id: string, updates: Partial<InsertLoyaltyTiersConfig>): Promise<LoyaltyTiersConfig | undefined> {
    const [config] = await db
      .update(loyaltyTiersConfig)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(loyaltyTiersConfig.id, id))
      .returning();
    return config;
  }

  async deleteLoyaltyTierConfig(id: string): Promise<boolean> {
    const result = await db.delete(loyaltyTiersConfig).where(eq(loyaltyTiersConfig.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Campaigns operations
  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [newCampaign] = await db.insert(campaigns).values(campaign).returning();
    return newCampaign;
  }

  async getCampaigns(isActive?: boolean): Promise<Campaign[]> {
    const query = db.select().from(campaigns);
    if (isActive !== undefined) {
      query.where(eq(campaigns.isActive, isActive));
    }
    return query.orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }

  async updateCampaign(id: string, updates: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const [campaign] = await db
      .update(campaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return campaign;
  }

  async deleteCampaign(id: string): Promise<boolean> {
    const result = await db.delete(campaigns).where(eq(campaigns.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    const now = new Date();
    return db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.isActive, true),
          sql`${campaigns.startDate} <= ${now}`,
          sql`${campaigns.endDate} >= ${now}`
        )
      );
  }

  // Admin dashboard statistics
  async getAdminDashboardStats(): Promise<{
    totalRewards: number;
    activeRewards: number;
    totalRedemptions: number;
    totalUsers: number;
    totalPointsDistributed: number;
    activePointsRules: number;
    activeCampaigns: number;
  }> {
    const [totalRewards] = await db.select({ count: count() }).from(loyaltyRewards);
    const [activeRewards] = await db.select({ count: count() }).from(loyaltyRewards).where(eq(loyaltyRewards.isActive, true));
    const [totalRedemptions] = await db.select({ count: count() }).from(loyaltyRedemptions);
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [pointsDistributed] = await db.select({ total: sql`SUM(${loyaltyTransactions.pointsChange})` }).from(loyaltyTransactions).where(sql`${loyaltyTransactions.pointsChange} > 0`);
    const [activeRules] = await db.select({ count: count() }).from(pointsRules).where(eq(pointsRules.isActive, true));
    const [activeCampaignsCount] = await db.select({ count: count() }).from(campaigns).where(eq(campaigns.isActive, true));

    return {
      totalRewards: totalRewards?.count || 0,
      activeRewards: activeRewards?.count || 0,
      totalRedemptions: totalRedemptions?.count || 0,
      totalUsers: totalUsers?.count || 0,
      totalPointsDistributed: Number(pointsDistributed?.total) || 0,
      activePointsRules: activeRules?.count || 0,
      activeCampaigns: activeCampaignsCount?.count || 0,
    };
  }

  // === ADMIN USERS METHODS ===

  async getAllUsersWithLoyaltyData(): Promise<any[]> {
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        pointsBalance: users.pointsBalance,
        totalPointsEarned: users.totalPointsEarned,
        loyaltyTier: users.loyaltyTier,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        or(
          gt(users.pointsBalance, 0),
          gt(users.totalPointsEarned, 0)
        )
      )
      .orderBy(desc(users.totalPointsEarned));

    return allUsers;
  }

  async getAllRedemptionsWithUserData(): Promise<any[]> {
    const allRedemptions = await db
      .select({
        id: loyaltyRedemptions.id,
        userId: loyaltyRedemptions.userId,
        userName: users.name,
        userEmail: users.email,
        userPhone: users.phone,
        rewardName: loyaltyRewards.name,
        pointsUsed: loyaltyRedemptions.pointsUsed,
        status: loyaltyRedemptions.status,
        redemptionCode: loyaltyRedemptions.redemptionCode,
        createdAt: loyaltyRedemptions.createdAt,
      })
      .from(loyaltyRedemptions)
      .leftJoin(users, eq(loyaltyRedemptions.userId, users.id))
      .leftJoin(loyaltyRewards, eq(loyaltyRedemptions.rewardId, loyaltyRewards.id))
      .orderBy(desc(loyaltyRedemptions.createdAt));

    return allRedemptions;
  }

  // === ADMIN LEADS OPERATIONS ===

  async getLeadsWithDetails(): Promise<any[]> {
    // Get all registered users only (exclude guest customers)
    const registeredUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        totalSpent: users.totalSpent,
        totalOrders: users.totalOrders,
        lastPurchaseDate: users.lastPurchaseDate,
        customerStatus: users.customerStatus,
        loyaltyTier: users.loyaltyTier,
        pointsBalance: users.pointsBalance,
        createdAt: users.createdAt,
        lastContactDate: users.lastContactDate,
      })
      .from(users);

    // Process registered users only
    const allLeads: any[] = [];

    registeredUsers.forEach(user => {
      let daysSinceLastPurchase: number | null = null;
      
      if (user.lastPurchaseDate) {
        const lastPurchase = new Date(user.lastPurchaseDate);
        const today = new Date();
        daysSinceLastPurchase = Math.floor((today.getTime() - lastPurchase.getTime()) / (1000 * 3600 * 24));
      }

      allLeads.push({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        totalSpent: user.totalSpent || "0.00",
        totalOrders: user.totalOrders || 0,
        lastPurchaseDate: user.lastPurchaseDate,
        customerStatus: user.customerStatus || "active",
        loyaltyTier: user.loyaltyTier || "bronze",
        pointsBalance: user.pointsBalance || 0,
        createdAt: user.createdAt,
        lastContactDate: user.lastContactDate,
        daysSinceLastPurchase,
        isRegistered: true,
      });
    });

    // Sort by last purchase date (most recent first)
    allLeads.sort((a, b) => {
      if (!a.lastPurchaseDate && !b.lastPurchaseDate) return 0;
      if (!a.lastPurchaseDate) return 1;
      if (!b.lastPurchaseDate) return -1;
      return new Date(b.lastPurchaseDate).getTime() - new Date(a.lastPurchaseDate).getTime();
    });

    return allLeads;
  }

  async getLeadsStats(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    inactiveCustomers: number;
    dormantCustomers: number;
    averageOrderValue: number;
    totalRevenue: number;
  }> {
    // Get all leads to calculate proper statistics including guest customers
    const allLeads = await this.getLeadsWithDetails();
    
    const totalCustomers = allLeads.length;
    let activeCustomers = 0;
    let inactiveCustomers = 0;
    let dormantCustomers = 0;

    // Count customers by status
    allLeads.forEach(lead => {
      switch (lead.customerStatus) {
        case 'active':
          activeCustomers++;
          break;
        case 'inactive':
          inactiveCustomers++;
          break;
        case 'dormant':
          dormantCustomers++;
          break;
      }
    });

    // Calculate average order value and total revenue from all orders
    const [orderStats] = await db
      .select({
        totalRevenue: sql<string>`COALESCE(SUM(${orders.total}), 0)`,
        totalOrders: sql<string>`COALESCE(COUNT(*), 0)`
      })
      .from(orders);

    const totalRevenue = parseFloat(orderStats.totalRevenue || "0");
    const totalOrdersCount = parseInt(orderStats.totalOrders || "0");
    const averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

    return {
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      dormantCustomers,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
    };
  }

  async updateCustomerStatus(customerId: string, status: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ customerStatus: status })
      .where(eq(users.id, customerId));

    return (result.rowCount || 0) > 0;
  }

  async registerCustomerContact(customerId: string): Promise<boolean> {
    const now = new Date();
    const result = await db
      .update(users)
      .set({ lastContactDate: now })
      .where(eq(users.id, customerId));

    return (result.rowCount || 0) > 0;
  }

  // === ADMIN MANUAL OPERATIONS ===
  
  async createUserByAdmin(userData: InsertUser): Promise<User> {
    // Check for existing email
    if (userData.email) {
      const existingEmail = await this.getUserByEmail(userData.email);
      if (existingEmail) {
        throw new Error('Um usuário com este email já existe');
      }
    }

    // Check for existing phone
    const existingPhone = await this.getUserByPhone(userData.phone);
    if (existingPhone) {
      throw new Error('Um usuário com este telefone já existe');
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Admin can create users directly with all loyalty data
    const welcomeBonus = 100; // Same as normal registration
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
        pointsBalance: welcomeBonus,
        totalPointsEarned: welcomeBonus,
        loyaltyTier: 'bronze'
      })
      .returning();

    // Create welcome bonus transaction record
    await db.insert(loyaltyTransactions).values({
      userId: user.id,
      type: 'welcome',
      pointsChange: welcomeBonus,
      description: 'Bônus de boas-vindas - Cadastro pelo admin',
      multiplier: '1.0'
    });

    return user;
  }

  async redeemRewardByAdmin(userId: string, rewardId: string, adminNote?: string): Promise<{ redemption: LoyaltyRedemption; newBalance: number }> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const [reward] = await db
      .select()
      .from(loyaltyRewards)
      .where(eq(loyaltyRewards.id, rewardId));

    if (!reward) {
      throw new Error("Reward not found");
    }

    if (!reward.isActive) {
      throw new Error("Reward is not active");
    }

    // Check stock (if limited)
    if (reward.stock !== -1 && (reward.stock || 0) <= 0) {
      throw new Error("Reward is out of stock");
    }

    // Check if user has enough points
    if ((user.pointsBalance || 0) < reward.pointsRequired) {
      throw new Error("Insufficient points");
    }

    // Check tier eligibility
    const tierHierarchy = { bronze: 0, silver: 1, gold: 2 };
    const userTierLevel = tierHierarchy[user.loyaltyTier as keyof typeof tierHierarchy] || 0;
    const rewardTierLevel = tierHierarchy[reward.minTier as keyof typeof tierHierarchy] || 0;
    
    if (userTierLevel < rewardTierLevel) {
      throw new Error(`This reward requires ${reward.minTier} tier or higher`);
    }

    // Generate redemption code
    const redemptionCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create redemption record - start as 'approved' since admin is doing it manually
    const [redemption] = await db
      .insert(loyaltyRedemptions)
      .values({
        userId: userId,
        rewardId: rewardId,
        pointsUsed: reward.pointsRequired,
        status: 'approved', // Admin redemptions start as approved
        redemptionCode: redemptionCode,
        adminNote: adminNote || 'Resgate manual realizado pelo admin'
      })
      .returning();

    // Update user points balance
    const newBalance = (user.pointsBalance || 0) - reward.pointsRequired;
    await db
      .update(users)
      .set({
        pointsBalance: newBalance
      })
      .where(eq(users.id, userId));

    // Create transaction record for points deduction
    await db.insert(loyaltyTransactions).values({
      userId,
      type: 'redemption',
      pointsChange: -reward.pointsRequired,
      description: `Resgate: ${reward.name} (admin: ${adminNote || 'resgate manual'})`,
      multiplier: '1.0'
    });

    // Update stock if limited
    if (reward.stock !== -1) {
      await db
        .update(loyaltyRewards)
        .set({
          stock: (reward.stock || 0) - 1
        })
        .where(eq(loyaltyRewards.id, rewardId));
    }

    return {
      redemption,
      newBalance
    };
  }

  async getUsersByPhoneOrName(searchTerm: string): Promise<User[]> {
    // Search users by phone or name for admin redemption interface
    return await db
      .select()
      .from(users)
      .where(
        or(
          sql`${users.phone} ILIKE ${`%${searchTerm}%`}`,
          sql`${users.name} ILIKE ${`%${searchTerm}%`}`
        )
      )
      .limit(10);
  }

  // === REFERRAL SYSTEM IMPLEMENTATIONS ===

  async registerUserWithReferral(data: {
    name: string;
    email?: string;
    phone: string;
    password: string;
    address?: string;
    referralCode?: string;
  }): Promise<{
    user: User;
    referralBonus?: number;
    message: string;
  }> {
    // Generate unique referral code for new user
    const newReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    let referrerId: string | null = null;
    let referralBonus = 0;
    let message = "Usuário cadastrado com sucesso!";

    // Validate referral code if provided
    if (data.referralCode) {
      const referrer = await db
        .select()
        .from(users)
        .where(eq(users.referralCode, data.referralCode))
        .limit(1);

      if (referrer.length === 0) {
        throw new Error("Código de indicação inválido");
      }

      referrerId = referrer[0].id;
      
      // Get points rule for referral
      const referralRule = await db
        .select()
        .from(pointsRules)
        .where(and(
          eq(pointsRules.ruleType, "action_bonus"),
          eq(pointsRules.actionType, "referral"),
          eq(pointsRules.isActive, true)
        ))
        .limit(1);

      if (referralRule.length > 0) {
        referralBonus = referralRule[0].actionPoints || 100; // Default 100 points
        message = `Usuário cadastrado com sucesso! Você ganhou ${referralBonus} pontos de bônus por indicação!`;
      }
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        address: data.address,
        referralCode: newReferralCode,
        referredByCode: data.referralCode,
        referredById: referrerId,
        pointsBalance: referralBonus
      })
      .returning();

    // If referred by someone, create referral transaction and update referrer
    if (referrerId && referralBonus > 0) {
      // Create referral transaction
      await db.insert(referralTransactions).values({
        referrerId: referrerId,
        referredId: newUser.id,
        referralCode: data.referralCode!,
        status: "confirmed",
        pointsAwarded: referralBonus,
        validatedAt: new Date()
      });

      // Update referrer's stats and points
      const referrer = await db
        .select()
        .from(users)
        .where(eq(users.id, referrerId))
        .limit(1);

      if (referrer.length > 0) {
        await db
          .update(users)
          .set({
            totalReferrals: (referrer[0].totalReferrals || 0) + 1,
            totalReferralPoints: (referrer[0].totalReferralPoints || 0) + referralBonus,
            pointsBalance: (referrer[0].pointsBalance || 0) + referralBonus
          })
          .where(eq(users.id, referrerId));

        // Create loyalty transaction for referrer
        await db.insert(loyaltyTransactions).values({
          userId: referrerId,
          type: "referral",
          pointsChange: referralBonus,
          description: `Indicação confirmada: ${newUser.name}`,
          multiplier: "1.0"
        });
      }
    }

    // Create welcome bonus transaction if applicable
    if (referralBonus > 0) {
      await db.insert(loyaltyTransactions).values({
        userId: newUser.id,
        type: "welcome",
        pointsChange: referralBonus,
        description: "Bônus de boas-vindas por indicação",
        multiplier: "1.0"
      });
    }

    return {
      user: newUser,
      referralBonus: referralBonus > 0 ? referralBonus : undefined,
      message
    };
  }

  async getUserReferralInfo(userId: string): Promise<{
    referralCode: string;
    totalReferrals: number;
    totalReferralPoints: number;
    referredUsers: any[];
    referralTransactions: ReferralTransaction[];
  }> {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      throw new Error("Usuário não encontrado");
    }

    // Get referred users
    const referredUsers = await db
      .select({
        id: users.id,
        name: users.name,
        createdAt: users.createdAt,
        pointsBalance: users.pointsBalance
      })
      .from(users)
      .where(eq(users.referredById, userId));

    // Get referral transactions
    const transactions = await db
      .select()
      .from(referralTransactions)
      .where(eq(referralTransactions.referrerId, userId))
      .orderBy(desc(referralTransactions.createdAt));

    return {
      referralCode: user[0].referralCode || "",
      totalReferrals: user[0].totalReferrals || 0,
      totalReferralPoints: user[0].totalReferralPoints || 0,
      referredUsers,
      referralTransactions: transactions
    };
  }

  async validateReferralCode(code: string): Promise<boolean> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.referralCode, code))
      .limit(1);

    return result.length > 0;
  }

  async getReferralAnalytics(): Promise<{
    totalReferrals: number;
    pendingReferrals: number;
    confirmedReferrals: number;
    totalPointsAwarded: number;
    topReferrers: any[];
  }> {
    // Get total referrals
    const totalReferralsResult = await db
      .select({ count: count() })
      .from(referralTransactions);

    // Get pending referrals
    const pendingReferralsResult = await db
      .select({ count: count() })
      .from(referralTransactions)
      .where(eq(referralTransactions.status, "pending"));

    // Get confirmed referrals
    const confirmedReferralsResult = await db
      .select({ count: count() })
      .from(referralTransactions)
      .where(eq(referralTransactions.status, "confirmed"));

    // Get total points awarded
    const pointsAwardedResult = await db
      .select({ total: sql<number>`SUM(${referralTransactions.pointsAwarded})` })
      .from(referralTransactions)
      .where(eq(referralTransactions.status, "confirmed"));

    // Get top referrers
    const topReferrers = await db
      .select({
        userId: users.id,
        name: users.name,
        totalReferrals: users.totalReferrals,
        totalReferralPoints: users.totalReferralPoints
      })
      .from(users)
      .where(gt(users.totalReferrals, 0))
      .orderBy(desc(users.totalReferrals))
      .limit(10);

    return {
      totalReferrals: totalReferralsResult[0]?.count || 0,
      pendingReferrals: pendingReferralsResult[0]?.count || 0,
      confirmedReferrals: confirmedReferralsResult[0]?.count || 0,
      totalPointsAwarded: pointsAwardedResult[0]?.total || 0,
      topReferrers
    };
  }

  async getAllReferralTransactions(): Promise<ReferralTransaction[]> {
    return await db
      .select()
      .from(referralTransactions)
      .orderBy(desc(referralTransactions.createdAt));
  }

  async createSeasonalReward(reward: InsertSeasonalReward): Promise<SeasonalReward> {
    const [newReward] = await db
      .insert(seasonalRewards)
      .values(reward)
      .returning();

    return newReward;
  }

  async getActiveSeasonalRewards(): Promise<SeasonalReward[]> {
    const now = new Date();
    
    return await db
      .select()
      .from(seasonalRewards)
      .where(and(
        eq(seasonalRewards.isActive, true),
        sql`${seasonalRewards.startDate} <= ${now}`,
        sql`${seasonalRewards.endDate} >= ${now}`
      ))
      .orderBy(seasonalRewards.pointsRequired);
  }

  async getUserStreaks(userId: string): Promise<UserStreak[]> {
    return await db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, userId))
      .orderBy(desc(userStreaks.currentStreak));
  }

  async updateUserStreak(userId: string, streakType: string, orderValue?: number): Promise<{
    streak: UserStreak;
    bonusPoints: number;
    message: string;
  }> {
    const now = new Date();
    let bonusPoints = 0;
    let message = "Streak atualizada!";

    // Get or create streak record
    let streak = await db
      .select()
      .from(userStreaks)
      .where(and(
        eq(userStreaks.userId, userId),
        eq(userStreaks.streakType, streakType)
      ))
      .limit(1);

    if (streak.length === 0) {
      // Create new streak
      const [newStreak] = await db
        .insert(userStreaks)
        .values({
          userId,
          streakType,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: now,
          isActive: true
        })
        .returning();

      streak = [newStreak];
      message = "Nova sequência iniciada!";
    } else {
      // Update existing streak
      const currentStreak = streak[0];
      const lastActivity = currentStreak.lastActivityDate;
      const daysDiff = lastActivity ? Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)) : 999;

      let newCurrentStreak = 1;
      
      if (daysDiff === 1) {
        // Consecutive day - increment streak
        newCurrentStreak = (currentStreak.currentStreak || 0) + 1;
        
        // Calculate bonus points based on streak length
        if (newCurrentStreak >= 7) {
          bonusPoints = Math.floor(newCurrentStreak / 7) * 50; // 50 points per week
        }
        
        message = `Sequência de ${newCurrentStreak} dias! +${bonusPoints} pontos bônus`;
      } else if (daysDiff > 1) {
        // Streak broken - reset
        newCurrentStreak = 1;
        message = "Sequência reiniciada!";
      }

      const newLongestStreak = Math.max(newCurrentStreak, currentStreak.longestStreak || 0);

      const [updatedStreak] = await db
        .update(userStreaks)
        .set({
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          lastActivityDate: now,
          bonusPointsEarned: (currentStreak.bonusPointsEarned || 0) + bonusPoints
        })
        .where(eq(userStreaks.id, currentStreak.id))
        .returning();

      streak = [updatedStreak];
    }

    // Award bonus points if any
    if (bonusPoints > 0) {
      await db
        .update(users)
        .set({
          pointsBalance: sql`${users.pointsBalance} + ${bonusPoints}`
        })
        .where(eq(users.id, userId));

      // Create loyalty transaction
      await db.insert(loyaltyTransactions).values({
        userId,
        type: "bonus",
        pointsChange: bonusPoints,
        description: `Bônus de sequência: ${streakType}`,
        multiplier: "1.0"
      });
    }

    return {
      streak: streak[0],
      bonusPoints,
      message
    };
  }

  // Fraud detection methods - simplified for now
  async logFraudDetection(data: {
    userId: string;
    actionType: string;
    riskScore: number;
    blocked: boolean;
    ipAddress?: string;
    userAgent?: string;
    additionalData: any;
  }): Promise<void> {
    // Log to console for now - can be enhanced later with proper table
    console.log(`[FRAUD DETECTION] ${data.actionType} by ${data.userId} - Risk: ${data.riskScore}${data.blocked ? ' [BLOCKED]' : ''}`);
  }

  async countReferralValidationAttempts(ipAddress: string, timeWindow: number): Promise<number> {
    // Simplified implementation - returns 0 for now
    // In a real implementation, this would query the fraud_detection_logs table
    return 0;
  }

  async countSameIpReferrals(ipAddress: string): Promise<number> {
    // Simplified implementation - returns 0 for now
    return 0;
  }

  async countSameUserAgentReferrals(userAgent: string): Promise<number> {
    // Simplified implementation - returns 0 for now
    return 0;
  }

  // === WEBHOOK SYSTEM IMPLEMENTATIONS ===

  // Webhook configuration methods
  async createWebhookConfig(configData: InsertWebhookConfig): Promise<WebhookConfig> {
    const [config] = await db.insert(webhookConfigs).values(configData).returning();
    return config;
  }

  async getWebhookConfigs(): Promise<WebhookConfig[]> {
    return await db.select().from(webhookConfigs).orderBy(desc(webhookConfigs.createdAt));
  }

  async getActiveWebhookConfigs(): Promise<WebhookConfig[]> {
    return await db
      .select()
      .from(webhookConfigs)
      .where(eq(webhookConfigs.isActive, true))
      .orderBy(desc(webhookConfigs.createdAt));
  }

  async getWebhookConfig(id: string): Promise<WebhookConfig | undefined> {
    const [config] = await db.select().from(webhookConfigs).where(eq(webhookConfigs.id, id));
    return config;
  }

  async updateWebhookConfig(id: string, updates: Partial<InsertWebhookConfig>): Promise<WebhookConfig | undefined> {
    const [config] = await db
      .update(webhookConfigs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(webhookConfigs.id, id))
      .returning();
    return config;
  }

  async deleteWebhookConfig(id: string): Promise<boolean> {
    const result = await db.delete(webhookConfigs).where(eq(webhookConfigs.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Webhook event methods
  async createWebhookEvent(eventData: InsertWebhookEvent): Promise<WebhookEvent> {
    const [event] = await db.insert(webhookEvents).values(eventData).returning();
    return event;
  }

  async getWebhookEvents(webhookConfigId?: string, limit?: number): Promise<WebhookEvent[]> {
    let query = db.select().from(webhookEvents);
    
    if (webhookConfigId) {
      query = query.where(eq(webhookEvents.webhookConfigId, webhookConfigId)) as any;
    }
    
    query = query.orderBy(desc(webhookEvents.createdAt)) as any;
    
    if (limit) {
      query = query.limit(limit) as any;
    }
    
    return await query;
  }

  async getWebhookEvent(id: string): Promise<WebhookEvent | undefined> {
    const [event] = await db.select().from(webhookEvents).where(eq(webhookEvents.id, id));
    return event;
  }

  async updateWebhookEventStatus(
    id: string, 
    status: string, 
    httpStatus?: number, 
    response?: string, 
    errorMessage?: string
  ): Promise<WebhookEvent | undefined> {
    const updateData: any = { 
      status,
      ...(httpStatus && { httpStatus }),
      ...(response && { response }),
      ...(errorMessage && { errorMessage }),
      ...(status === 'sent' && { sentAt: new Date() }),
      ...(status === 'retry' && { lastRetryAt: new Date() })
    };

    const [event] = await db
      .update(webhookEvents)
      .set(updateData)
      .where(eq(webhookEvents.id, id))
      .returning();
    return event;
  }

  async getPendingWebhookEvents(): Promise<WebhookEvent[]> {
    return await db
      .select()
      .from(webhookEvents)
      .where(or(
        eq(webhookEvents.status, 'pending'),
        eq(webhookEvents.status, 'retry')
      ))
      .orderBy(webhookEvents.createdAt);
  }

  async getFailedWebhookEvents(): Promise<WebhookEvent[]> {
    return await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.status, 'failed'))
      .orderBy(desc(webhookEvents.createdAt));
  }

  async retryWebhookEvent(id: string): Promise<WebhookEvent | undefined> {
    const [event] = await db
      .update(webhookEvents)
      .set({ 
        status: 'retry', 
        lastRetryAt: new Date(),
        retryCount: sql`${webhookEvents.retryCount} + 1`
      })
      .where(eq(webhookEvents.id, id))
      .returning();
    return event;
  }

  // Webhook notification methods
  async notifyWebhookChange(
    tableName: string, 
    operationType: string, 
    recordId: string, 
    oldData?: any, 
    newData?: any
  ): Promise<void> {
    // Get active webhook configurations for this table
    const configs = await db
      .select()
      .from(webhookConfigs)
      .where(and(
        eq(webhookConfigs.isActive, true),
        // Check if the specific table is being watched
        or(
          and(eq(sql`${tableName}`, 'products'), eq(webhookConfigs.watchProducts, true)),
          and(eq(sql`${tableName}`, 'ingredients'), eq(webhookConfigs.watchIngredients, true)),
          and(eq(sql`${tableName}`, 'categories'), eq(webhookConfigs.watchCategories, true))
        ),
        // Check if the specific operation type is being watched
        or(
          and(eq(sql`${operationType}`, 'INSERT'), eq(webhookConfigs.watchInserts, true)),
          and(eq(sql`${operationType}`, 'UPDATE'), eq(webhookConfigs.watchUpdates, true)),
          and(eq(sql`${operationType}`, 'DELETE'), eq(webhookConfigs.watchDeletes, true))
        )
      ));

    // Create webhook events for each matching configuration
    for (const config of configs) {
      await this.createWebhookEvent({
        webhookConfigId: config.id,
        tableName,
        operationType,
        recordId,
        oldData,
        newData,
        status: 'pending',
        retryCount: 0
      });
    }
  }
}

export const storage = new DatabaseStorage();
