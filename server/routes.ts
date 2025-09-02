import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertOrderSchema, insertOrderItemSchema, insertProductSchema, insertDeliveryZoneSchema, insertCategorySchema, insertExpenseSchema, insertIngredientSchema, insertProductIngredientSchema, insertProductAdditionalSchema, insertBannerThemeSchema } from "@shared/schema";
import { z } from "zod";

const createOrderRequestSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerPhoneInternational: z.string().optional(),
  customerEmail: z.string().optional().refine((val) => !val || z.string().email().safeParse(val).success, {
    message: "Invalid email"
  }),
  deliveryType: z.enum(["delivery", "pickup"]).default("delivery"),
  streetName: z.string().optional(),
  houseNumber: z.string().optional(),
  neighborhood: z.string().optional(),
  referencePoint: z.string().optional(),
  paymentMethod: z.string().min(1),
  specialInstructions: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.string(),
  })),
}).refine((data) => {
  // If delivery type is "delivery", address fields are required
  if (data.deliveryType === "delivery") {
    return data.streetName && data.houseNumber && data.neighborhood;
  }
  return true; // For pickup, address fields are optional
}, {
  message: "Address fields are required for delivery orders"
});


export async function registerRoutes(app: Express): Promise<Server> {
  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const result = insertCategorySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid category data", errors: result.error.errors });
      }

      const category = await storage.createCategory(result.data);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if there are products using this category
      const productsInCategory = await storage.getProductsByCategory(id);
      if (productsInCategory.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete category with existing products",
          productsCount: productsInCategory.length 
        });
      }

      const success = await storage.deleteCategory(id);
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const { category, admin } = req.query;
      let products;
      
      if (category && typeof category === 'string') {
        products = await storage.getProductsByCategory(category);
      } else if (admin === 'true') {
        // Admin view - show all products including unavailable ones
        products = await storage.getAllProducts();
      } else {
        // Customer view - only show available products
        products = await storage.getProducts();
      }
      
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/featured", async (req, res) => {
    try {
      const { admin } = req.query;
      let products;
      
      if (admin === 'true') {
        // Get all featured products including unavailable ones (for customer view to show as "esgotado")
        products = await storage.getAllProducts().then(allProducts => 
          allProducts.filter(p => p.isFeatured === true)
        );
      } else {
        // Original behavior - only available featured products
        products = await storage.getFeaturedProducts();
      }
      
      res.json(products);
    } catch (error) {
      console.error("Error fetching featured products:", error);
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  // Store settings
  app.get("/api/store/settings", async (req, res) => {
    try {
      const settings = await storage.getStoreSettings();
      res.json(settings || {
        isOpen: true,
        closingTime: "23:00",
        minimumOrderAmount: "25.00",
        deliveryAreas: [],
        useNeighborhoodDelivery: false,
        defaultDeliveryFee: "5.90"
      });
    } catch (error) {
      console.error("Error fetching store settings:", error);
      res.status(500).json({ message: "Failed to fetch store settings" });
    }
  });

  app.put("/api/store/settings", async (req, res) => {
    try {
      const settings = await storage.updateStoreSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating store settings:", error);
      res.status(500).json({ message: "Failed to update store settings" });
    }
  });

  // Orders
  app.post("/api/orders", async (req, res) => {
    try {
      const requestData = createOrderRequestSchema.parse(req.body);
      
      // Calculate totals and get product names
      let subtotal = 0;
      const orderItems = await Promise.all(requestData.items.map(async item => {
        const product = await storage.getProduct(item.productId);
        const totalPrice = parseFloat(item.unitPrice) * item.quantity;
        subtotal += totalPrice;
        return {
          productId: item.productId,
          productName: product?.name || 'Produto não encontrado',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: totalPrice.toFixed(2),
        };
      }));

      // Calculate delivery fee based on delivery type and neighborhood
      const storeSettings = await storage.getStoreSettings();
      let deliveryFee = 0;
      
      if (requestData.deliveryType === "delivery") {
        deliveryFee = parseFloat(storeSettings?.defaultDeliveryFee || "5.90");
        
        if (storeSettings?.useNeighborhoodDelivery && requestData.neighborhood) {
          const zoneDeliveryFee = await storage.getDeliveryFeeByNeighborhood(requestData.neighborhood);
          if (zoneDeliveryFee !== null) {
            deliveryFee = zoneDeliveryFee;
          }
        }
      }
      
      const total = subtotal + deliveryFee;

      const orderData = {
        customerName: requestData.customerName,
        customerPhone: requestData.customerPhone,
        customerEmail: requestData.customerEmail,
        deliveryType: requestData.deliveryType,
        streetName: requestData.streetName || "",
        houseNumber: requestData.houseNumber || "",
        neighborhood: requestData.neighborhood || "",
        referencePoint: requestData.referencePoint,
        paymentMethod: requestData.paymentMethod,
        specialInstructions: requestData.specialInstructions,
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        total: total.toFixed(2),
        estimatedDeliveryTime: requestData.deliveryType === "pickup" ? 20 : 45, // 20 min for pickup, 45 for delivery
      };

      const order = await storage.createOrder(orderData);
      
      // Prepare items for database
      const orderItemsForDb = orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        orderId: order.id,
      }));
      
      await storage.addOrderItems(orderItemsForDb);

      res.status(201).json({ 
        success: true, 
        orderId: order.id,
        orderNumber: order.orderNumber,
        estimatedDeliveryTime: order.estimatedDeliveryTime 
      });
    } catch (error) {
      console.error("Error creating order:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid order data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create order" });
      }
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Product Management
  app.put("/api/products/:id", async (req, res) => {
    try {
      const { ingredients, ...productData } = req.body;
      const validatedProductData = insertProductSchema.parse(productData);
      
      console.log('Ingredientes recebidos:', ingredients);
      console.log('Produto ID:', req.params.id);
      
      const product = await storage.updateProduct(req.params.id, validatedProductData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Process ingredients if provided
      if (ingredients && Array.isArray(ingredients)) {
        console.log('Processando ingredientes...', ingredients.length);
        await storage.updateProductIngredients(req.params.id, ingredients);
      }

      // Return updated product with ingredients
      const updatedProductWithIngredients = await storage.getProductIngredients(req.params.id);
      
      res.json({
        ...product,
        ingredients: updatedProductWithIngredients
      });
    } catch (error) {
      console.error("Error updating product:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid product data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update product" });
      }
    }
  });

  // Recalculate product price based on ingredients
  app.post("/api/products/:id/recalculate-price", async (req, res) => {
    try {
      const productId = req.params.id;
      
      // Buscar ingredientes
      const ingredients = await storage.getProductIngredients(productId);
      
      // DEBUG COMPLETO
      console.log('=== RECÁLCULO PREÇO DEBUG ===');
      console.log('Product ID:', productId);
      console.log('Ingredientes encontrados:', ingredients?.length || 0);
      
      let totalPrice = 0;
      
      if (ingredients && ingredients.length > 0) {
        ingredients.forEach((ingredient, index) => {
          // Tentar diferentes campos possíveis
          const priceValue = ingredient.customPrice || ingredient.custom_price || ingredient.price || 0;
          const quantityValue = ingredient.quantity || 1;
          
          console.log(`Ingrediente ${index + 1}:`, {
            name: ingredient.ingredient?.name || 'Nome não encontrado',
            priceOriginal: priceValue,
            priceConverted: parseFloat(priceValue || '0'),
            quantity: quantityValue,
            subtotal: parseFloat(priceValue || '0') * quantityValue
          });
          
          const price = parseFloat(priceValue || '0');
          const qty = parseInt(quantityValue.toString());
          
          if (!isNaN(price) && !isNaN(qty)) {
            totalPrice += price * qty;
          }
        });
      }
      
      console.log('TOTAL FINAL:', totalPrice);
      console.log('=== FIM RECÁLCULO ===\n');
      
      // Atualizar preço no banco
      if (totalPrice > 0) {
        await storage.updateProduct(productId, { price: totalPrice.toString() } as any);
        console.log('💾 Preço atualizado no banco:', totalPrice);
      }
      
      const response = { 
        totalPrice: totalPrice,
        formattedPrice: `R$ ${totalPrice.toFixed(2)}`,
        ingredientsCount: ingredients?.length || 0,
        message: "Price recalculated successfully"
      };
      
      console.log('📤 RESPONSE ENVIADO:', response);
      res.json(response);
      
    } catch (error) {
      console.error('Erro no recálculo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });


  // Get product additional options
  app.get("/api/products/:id/additionals", async (req, res) => {
    try {
      const additionals = await storage.getProductAdditionals(req.params.id);
      res.json(additionals);
    } catch (error) {
      console.error("Error fetching product additionals:", error);
      res.status(500).json({ message: "Failed to fetch product additionals" });
    }
  });

  // Recalculate all product prices (admin function)
  app.post("/api/products/recalculate-all-prices", async (req, res) => {
    try {
      const allProducts = await storage.getAllProducts();
      const results = [];
      
      for (const product of allProducts) {
        try {
          const updatedProduct = await storage.recalculateProductPrice(product.id);
          results.push({
            productId: product.id,
            productName: product.name,
            oldPrice: product.price,
            newPrice: updatedProduct?.price || product.price,
            success: true
          });
        } catch (error) {
          results.push({
            productId: product.id,
            productName: product.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      res.json({ 
        message: "Price recalculation completed", 
        results: results,
        totalProcessed: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      });
    } catch (error) {
      console.error("Error recalculating all product prices:", error);
      res.status(500).json({ message: "Failed to recalculate product prices" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const { ingredients, ...productData } = req.body;
      const validatedProductData = insertProductSchema.parse(productData);
      
      const product = await storage.createProduct(validatedProductData);
      
      // Add product ingredients if provided and not empty
      if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
        await storage.updateProductIngredients(product.id, ingredients);
      }
      
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid product data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create product" });
      }
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Users
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid user data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create user" });
      }
    }
  });

  // Delivery Zones (Admin)
  app.get("/api/delivery-zones", async (req, res) => {
    try {
      const zones = await storage.getDeliveryZones();
      res.json(zones);
    } catch (error) {
      console.error("Error fetching delivery zones:", error);
      res.status(500).json({ message: "Failed to fetch delivery zones" });
    }
  });

  app.get("/api/delivery-zones/active", async (req, res) => {
    try {
      const zones = await storage.getActiveDeliveryZones();
      res.json(zones);
    } catch (error) {
      console.error("Error fetching active delivery zones:", error);
      res.status(500).json({ message: "Failed to fetch active delivery zones" });
    }
  });

  app.post("/api/delivery-zones", async (req, res) => {
    try {
      const zoneData = insertDeliveryZoneSchema.parse(req.body);
      const zone = await storage.createDeliveryZone(zoneData);
      res.status(201).json(zone);
    } catch (error) {
      console.error("Error creating delivery zone:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid delivery zone data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create delivery zone" });
      }
    }
  });

  app.put("/api/delivery-zones/:id", async (req, res) => {
    try {
      const zoneData = insertDeliveryZoneSchema.partial().parse(req.body);
      const zone = await storage.updateDeliveryZone(req.params.id, zoneData);
      if (!zone) {
        return res.status(404).json({ message: "Delivery zone not found" });
      }
      res.json(zone);
    } catch (error) {
      console.error("Error updating delivery zone:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid delivery zone data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update delivery zone" });
      }
    }
  });

  app.delete("/api/delivery-zones/:id", async (req, res) => {
    try {
      const success = await storage.deleteDeliveryZone(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Delivery zone not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting delivery zone:", error);
      res.status(500).json({ message: "Failed to delete delivery zone" });
    }
  });

  // Get all orders for admin
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Update order status
  app.put("/api/orders/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status || !["pendente", "preparando", "entregando", "entregue"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const success = await storage.updateOrderStatus(id, status);
      if (!success) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json({ message: "Order status updated successfully" });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Update order payment status
  app.put("/api/orders/:id/payment-status", async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentStatus } = req.body;
      
      if (!paymentStatus || !["pending", "paid", "failed"].includes(paymentStatus)) {
        return res.status(400).json({ message: "Invalid payment status" });
      }

      const success = await storage.updateOrderPaymentStatus(id, paymentStatus);
      if (!success) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json({ message: "Order payment status updated successfully" });
    } catch (error) {
      console.error("Error updating order payment status:", error);
      res.status(500).json({ message: "Failed to update order payment status" });
    }
  });

  // Expenses
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      // Transform date manually to avoid schema validation issues
      const expenseData = {
        ...req.body,
        date: new Date(req.body.date)
      };
      
      const result = insertExpenseSchema.safeParse(expenseData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid expense data", errors: result.error.errors });
      }

      const expense = await storage.createExpense(result.data);
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      // Transform date manually to avoid schema validation issues
      const expenseData = {
        ...req.body,
        date: new Date(req.body.date)
      };
      
      const result = insertExpenseSchema.safeParse(expenseData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid expense data", errors: result.error.errors });
      }

      const expense = await storage.updateExpense(id, result.data);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      res.json(expense);
    } catch (error) {
      console.error("Error updating expense:", error);
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteExpense(id);
      if (!success) {
        return res.status(404).json({ message: "Expense not found" });
      }

      res.json({ message: "Expense deleted successfully" });
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Ingredients Routes
  app.get("/api/ingredients", async (req, res) => {
    try {
      const { category } = req.query;
      let ingredients;
      
      if (category && typeof category === 'string') {
        ingredients = await storage.getIngredientsByCategory(category);
      } else {
        ingredients = await storage.getIngredients();
      }
      
      res.json(ingredients);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
      res.status(500).json({ message: "Failed to fetch ingredients" });
    }
  });

  app.post("/api/ingredients", async (req, res) => {
    try {
      const ingredientData = insertIngredientSchema.parse(req.body);
      const ingredient = await storage.createIngredient(ingredientData);
      res.status(201).json(ingredient);
    } catch (error) {
      console.error("Error creating ingredient:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid ingredient data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create ingredient" });
      }
    }
  });

  app.put("/api/ingredients/:id", async (req, res) => {
    try {
      const ingredientData = insertIngredientSchema.partial().parse(req.body);
      const ingredient = await storage.updateIngredient(req.params.id, ingredientData);
      if (!ingredient) {
        return res.status(404).json({ message: "Ingredient not found" });
      }
      res.json(ingredient);
    } catch (error) {
      console.error("Error updating ingredient:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid ingredient data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update ingredient" });
      }
    }
  });

  app.delete("/api/ingredients/:id", async (req, res) => {
    try {
      const success = await storage.deleteIngredient(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Ingredient not found" });
      }
      res.json({ message: "Ingredient deleted successfully" });
    } catch (error) {
      console.error("Error deleting ingredient:", error);
      res.status(500).json({ message: "Failed to delete ingredient" });
    }
  });

  app.get("/api/ingredients/:id", async (req, res) => {
    try {
      const ingredient = await storage.getIngredient(req.params.id);
      if (!ingredient) {
        return res.status(404).json({ message: "Ingredient not found" });
      }
      res.json(ingredient);
    } catch (error) {
      console.error("Error fetching ingredient:", error);
      res.status(500).json({ message: "Failed to fetch ingredient" });
    }
  });

  // Product Ingredients Routes - Returns additionals with REAL ingredient prices (not custom prices)
  app.get("/api/products/:id/ingredients", async (req, res) => {
    try {
      const additionals = await storage.getProductAdditionals(req.params.id);
      
      // Override customPrice with real ingredient price to ensure consistency
      const correctedAdditionals = additionals.map(additional => {
        const realPrice = additional.ingredient?.price || additional.customPrice;
        return {
          ...additional,
          customPrice: realPrice, // Force customPrice to use real ingredient price
          ingredient: additional.ingredient
        };
      });
      
      res.json(correctedAdditionals);
    } catch (error) {
      console.error("Error fetching product ingredients:", error);
      res.status(500).json({ message: "Failed to fetch product ingredients" });
    }
  });

  app.get("/api/products/:id/additionals", async (req, res) => {
    try {
      const additionals = await storage.getProductAdditionals(req.params.id);
      res.json(additionals);
    } catch (error) {
      console.error("Error fetching product additionals:", error);
      res.status(500).json({ message: "Failed to fetch product additionals" });
    }
  });

  app.post("/api/products/:id/ingredients", async (req, res) => {
    try {
      const data = insertProductIngredientSchema.parse({
        ...req.body,
        productId: req.params.id
      });
      const productIngredient = await storage.addProductIngredient(data);
      res.status(201).json(productIngredient);
    } catch (error) {
      console.error("Error adding product ingredient:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid product ingredient data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to add product ingredient" });
      }
    }
  });

  app.post("/api/products/:id/additionals", async (req, res) => {
    try {
      const data = insertProductAdditionalSchema.parse({
        ...req.body,
        productId: req.params.id
      });
      const productAdditional = await storage.addProductAdditional(data);
      res.status(201).json(productAdditional);
    } catch (error) {
      console.error("Error adding product additional:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid product additional data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to add product additional" });
      }
    }
  });

  // Banner themes routes
  // GET /api/active-banner - Public route to get active banner
  app.get("/api/active-banner", async (req, res) => {
    try {
      const banner = await storage.getActiveBanner();
      if (!banner) {
        return res.json(null); // No active banner
      }
      res.json(banner);
    } catch (error) {
      console.error("Error fetching active banner:", error);
      res.status(500).json({ message: "Failed to fetch active banner" });
    }
  });

  // GET /api/banners - Admin route to list all banners
  app.get("/api/banners", async (req, res) => {
    try {
      const banners = await storage.getBannerThemes();
      res.json(banners);
    } catch (error) {
      console.error("Error fetching banners:", error);
      res.status(500).json({ message: "Failed to fetch banners" });
    }
  });

  // POST /api/banners - Admin route to create new banner
  app.post("/api/banners", async (req, res) => {
    try {
      const data = insertBannerThemeSchema.parse(req.body);
      const banner = await storage.createBannerTheme(data);
      res.status(201).json(banner);
    } catch (error) {
      console.error("Error creating banner:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid banner data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create banner" });
      }
    }
  });

  // PUT /api/banners/:id - Admin route to update banner
  app.put("/api/banners/:id", async (req, res) => {
    try {
      const data = insertBannerThemeSchema.partial().parse(req.body);
      const banner = await storage.updateBannerTheme(req.params.id, data);
      if (!banner) {
        return res.status(404).json({ message: "Banner not found" });
      }
      res.json(banner);
    } catch (error) {
      console.error("Error updating banner:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid banner data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update banner" });
      }
    }
  });

  // PUT /api/banners/:id/activate - Admin route to activate banner (deactivates all others)
  app.put("/api/banners/:id/activate", async (req, res) => {
    try {
      const banner = await storage.activateBanner(req.params.id);
      if (!banner) {
        return res.status(404).json({ message: "Banner not found" });
      }
      res.json({ 
        message: "Banner activated successfully", 
        banner: banner 
      });
    } catch (error) {
      console.error("Error activating banner:", error);
      res.status(500).json({ message: "Failed to activate banner" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
