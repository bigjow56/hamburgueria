import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").unique(),
  phone: text("phone").notNull(),
  address: text("address"),
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

export type StoreSettings = typeof storeSettings.$inferSelect;
