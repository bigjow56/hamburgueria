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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
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
  getOrder(id: string): Promise<Order | undefined>;
  getUserOrders(userId: string): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(id: string, status: string): Promise<boolean>;
  updateOrderPaymentStatus(id: string, paymentStatus: string): Promise<boolean>;
  
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
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

  // Calculate product price based on its ingredients
  async calculateProductPrice(productId: string): Promise<number> {
    const productIngredientsData = await db
      .select({
        ingredientPrice: ingredients.price,
        quantity: productIngredients.quantity
      })
      .from(productIngredients)
      .leftJoin(ingredients, eq(productIngredients.ingredientId, ingredients.id))
      .where(eq(productIngredients.productId, productId));
    
    const totalPrice = productIngredientsData.reduce((sum, item) => {
      const price = parseFloat(item.ingredientPrice || '0');
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
        ingredient: ingredients
      })
      .from(productIngredients)
      .leftJoin(ingredients, eq(productIngredients.ingredientId, ingredients.id))
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
    // Remove existing product ingredients
    await db.delete(productIngredients).where(eq(productIngredients.productId, productId));
    
    // Remove existing product additionals 
    await db.delete(productAdditionals).where(eq(productAdditionals.productId, productId));

    // Add new product ingredients and additionals
    for (const config of ingredientConfigs) {
      if (config.isIncludedByDefault) {
        // Add as product ingredient (base ingredient)
        await db.insert(productIngredients).values({
          productId,
          ingredientId: config.ingredientId,
          isIncludedByDefault: config.isIncludedByDefault,
          quantity: config.quantity || 1,
        });
      }

      // Also add as product additional (for customization)
      await db.insert(productAdditionals).values({
        productId,
        ingredientId: config.ingredientId,
        customPrice: config.customPrice || null,
        isActive: config.isActive,
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
}

export const storage = new DatabaseStorage();
