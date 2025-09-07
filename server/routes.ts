import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertOrderSchema, insertOrderItemSchema, insertProductSchema, insertDeliveryZoneSchema, insertCategorySchema, insertExpenseSchema, insertIngredientSchema, insertProductIngredientSchema, insertProductAdditionalSchema, insertBannerThemeSchema, insertLoyaltyRewardSchema, insertLoyaltyRedemptionSchema } from "@shared/schema";
import { z } from "zod";
import { notifyProductChange } from "./webhook";

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
    modifications: z.array(z.object({
      ingredientId: z.string(),
      ingredientName: z.string(),
      modificationType: z.enum(['add', 'remove', 'extra']),
      quantity: z.number().default(1),
      unitPrice: z.number(),
    })).optional().default([]),
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
  // Delete order
  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const success = await storage.deleteOrder(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json({ message: "Order deleted successfully" });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

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
      console.log("🔥🔥🔥 BACKEND RECEBEU PEDIDO! 🔥🔥🔥");
      
      // Log dados brutos antes da validação
      console.log("DADOS BRUTOS - ITEMS:");
      req.body.items?.forEach((item: any, index: number) => {
        console.log(`BRUTO ${index + 1}:`, item.productId);
        console.log(`BRUTO MODIFICAÇÕES:`, item.modifications?.length || 0, item.modifications);
      });
      
      console.log("🚨 INICIANDO VALIDAÇÃO DO SCHEMA...");
      const requestData = createOrderRequestSchema.parse(req.body);
      console.log("✅ SCHEMA VALIDADO COM SUCESSO!");
      
      // Log dados após validação
      console.log("DADOS VALIDADOS - ITEMS:");
      requestData.items.forEach((item: any, index: number) => {
        console.log(`VALIDADO ${index + 1}:`, item.productId);
        console.log(`VALIDADO MODIFICAÇÕES:`, item.modifications?.length || 0, item.modifications);
      });
      console.log("🔥🔥🔥 FIM DOS LOGS DE DEBUG 🔥🔥🔥");
      
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
      
      const createdOrderItems = await storage.addOrderItems(orderItemsForDb);
      
      // Save modifications for each order item
      for (let i = 0; i < requestData.items.length; i++) {
        const requestItem = requestData.items[i];
        const orderItem = createdOrderItems[i];
        
        if (requestItem.modifications && requestItem.modifications.length > 0) {
          const modifications = requestItem.modifications.map(mod => {
            const totalPrice = mod.unitPrice * mod.quantity;
            return {
              orderItemId: orderItem.id,
              ingredientId: mod.ingredientId,
              modificationType: mod.modificationType,
              quantity: mod.quantity,
              unitPrice: mod.unitPrice.toString(),
              totalPrice: totalPrice.toString(),
            };
          });
          
          await storage.addOrderItemModifications(modifications);
        }
      }

      // 🚨 DEBUG: Log antes da criação do webhook
      console.log("🚨🚨🚨 CRIANDO WEBHOOK DATA 🚨🚨🚨");
      console.log("RequestData items:", requestData.items.map(item => ({ 
        productId: item.productId, 
        modifications: item.modifications?.length || 0 
      })));

      // Send order data to n8n webhook
      try {
        const webhookData = {
          pedido: {
            id: order.id,
            numero: order.orderNumber,
            status: "pending",
            data_criacao: order.createdAt,
            tempo_estimado: order.estimatedDeliveryTime
          },
          cliente: {
            nome: order.customerName,
            telefone: order.customerPhone,
            telefone_internacional: requestData.customerPhoneInternational || order.customerPhone,
            ddi: requestData.customerPhoneInternational ? requestData.customerPhoneInternational.substring(0, 2) : "55",
            email: order.customerEmail
          },
          entrega: {
            tipo: order.deliveryType,
            endereco: {
              rua: order.streetName,
              numero: order.houseNumber,
              bairro: order.neighborhood,
              ponto_referencia: order.referencePoint
            }
          },
          pagamento: {
            metodo: order.paymentMethod,
            status: "pending"
          },
          valores: {
            subtotal: parseFloat(order.subtotal),
            taxa_entrega: parseFloat(order.deliveryFee),
            total: parseFloat(order.total)
          },
          itens: await Promise.all(requestData.items.map(async (requestItem, index) => {
            const orderItem = orderItems[index];
            console.log(`🔍 ITEM ${index + 1} - MODIFICAÇÕES:`, requestItem.modifications);
            return {
              produto_id: orderItem.productId,
              produto_nome: orderItem.productName,
              quantidade: orderItem.quantity,
              preco_unitario: parseFloat(orderItem.unitPrice),
              preco_total: parseFloat(orderItem.totalPrice),
              personalizacoes: requestItem.modifications.map(mod => ({
                acao: mod.modificationType === 'remove' ? 'remover' : 'adicionar',
                ingrediente: mod.ingredientName,
                preco: mod.modificationType === 'remove' ? 0 : mod.unitPrice,
                quantidade: mod.quantity
              }))
            };
          })),
          observacoes: order.specialInstructions
        };
        
        console.log("📤 WEBHOOK DATA:", JSON.stringify(webhookData, null, 2));

        // Configuração do webhook - pode ser alterada via variável de ambiente
        const webhookUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n-curso-n8n.yao8ay.easypanel.host/webhook/hamburgueria';
        console.log(`🔗 Enviando para webhook: ${webhookUrl}`);

        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData)
        });

        if (webhookResponse.ok) {
          console.log(`✅ Pedido #${order.orderNumber} enviado para n8n com sucesso`);
        } else {
          console.error(`❌ Erro ao enviar pedido #${order.orderNumber} para n8n:`, webhookResponse.status);
        }
      } catch (webhookError) {
        console.error(`❌ Erro no webhook n8n para pedido #${order.orderNumber}:`, webhookError);
        // Não interrompe o processo se o webhook falhar
      }

      // Add loyalty points if user exists (try to find by phone)
      try {
        // First, try to find or create user based on phone
        let user = await storage.getUserByPhone(order.customerPhone);
        
        if (!user) {
          // Create new user for loyalty program (already includes welcome bonus in createUser method)
          user = await storage.createUser({
            name: order.customerName,
            email: order.customerEmail || '',
            phone: order.customerPhone,
            address: order.deliveryType === 'delivery' ? 
              `${order.streetName}, ${order.houseNumber}, ${order.neighborhood}` : undefined
          });
          
          // Create welcome bonus transaction record
          await storage.addLoyaltyPoints(user.id, {
            amount: 0, // No purchase amount for welcome bonus
            type: 'welcome',
            description: 'Bônus de boas-vindas - 100 pontos!'
          });
          
          console.log(`🎉 Novo usuário criado e recebeu bônus de boas-vindas: ${user.name}`);
        }

        // Add points for this purchase (1 point per R$1.00)
        const loyaltyResult = await storage.addLoyaltyPoints(user.id, {
          orderId: order.id,
          amount: parseFloat(order.total),
          type: 'purchase',
          description: `Compra - Pedido #${order.orderNumber}`
        });

        console.log(`💎 Pontos adicionados para ${user.name}: ${loyaltyResult.transaction.pointsChange} pontos (Tier: ${loyaltyResult.newTier})`);
        
      } catch (loyaltyError) {
        console.error(`⚠️ Erro ao processar pontos de fidelidade para pedido #${order.orderNumber}:`, loyaltyError);
        // Não interrompe o processo se a fidelidade falhar
      }

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
      
      const responseData = {
        ...product,
        ingredients: updatedProductWithIngredients
      };
      
      // Notify n8n about product update
      await notifyProductChange('update', req.params.id, responseData);
      
      res.json(responseData);
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
      
      // Usar a função de cálculo corrigida do storage
      const calculatedPrice = await storage.calculateProductPrice(productId);
      
      // Atualizar preço no banco
      if (calculatedPrice > 0) {
        await storage.updateProduct(productId, { price: calculatedPrice.toString() } as any);
      }
      
      const response = { 
        totalPrice: calculatedPrice,
        formattedPrice: `R$ ${calculatedPrice.toFixed(2)}`,
        message: "Price recalculated successfully"
      };
      
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
      
      // Notify n8n about product creation
      await notifyProductChange('create', product.id, product);
      
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
      // Get product data before deletion for webhook
      const productToDelete = await storage.getProduct(req.params.id);
      
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Notify n8n about product deletion
      await notifyProductChange('delete', req.params.id, productToDelete);
      
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

  // Product Ingredients Routes - Returns base ingredients included with the product
  app.get("/api/products/:id/ingredients", async (req, res) => {
    try {
      const ingredients = await storage.getProductIngredients(req.params.id);
      res.json(ingredients);
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

  // DELETE /api/banners/:id - Admin route to delete banner
  app.delete("/api/banners/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBannerTheme(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Banner not found" });
      }
      res.json({ message: "Banner deleted successfully" });
    } catch (error) {
      console.error("Error deleting banner:", error);
      res.status(500).json({ message: "Failed to delete banner" });
    }
  });

  // === LOYALTY SYSTEM ROUTES ===

  // POST /api/loyalty/register - Register new user for loyalty program
  app.post("/api/loyalty/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists by phone
      const existingUser = await storage.getUserByPhone(userData.phone);
      if (existingUser) {
        return res.status(409).json({ 
          message: "User already exists with this phone number",
          error: "USER_EXISTS" 
        });
      }

      // Create new user (includes welcome bonus)
      const newUser = await storage.createUser(userData);
      
      // Create welcome bonus transaction record
      await storage.addLoyaltyPoints(newUser.id, {
        amount: 0, // Welcome bonus already added in createUser
        type: 'welcome',
        description: 'Bônus de boas-vindas - 100 pontos!'
      });

      // Get the full user data with balance
      const userBalance = await storage.getUserLoyaltyBalance(newUser.id);
      
      res.status(201).json({
        success: true,
        user: userBalance || newUser,
        message: "Usuário cadastrado com sucesso! Você recebeu 100 pontos de bônus!"
      });
    } catch (error) {
      console.error("Error registering user:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid user data", 
          errors: error.errors,
          error: "VALIDATION_ERROR" 
        });
      } else {
        res.status(500).json({ 
          message: "Failed to register user",
          error: "INTERNAL_ERROR" 
        });
      }
    }
  });

  // GET /api/loyalty/:phone - Get user loyalty data by phone number
  app.get("/api/loyalty/:phone", async (req, res) => {
    try {
      const phone = decodeURIComponent(req.params.phone);
      const user = await storage.getUserByPhone(phone);
      
      if (!user) {
        return res.status(404).json({ 
          message: "User not found",
          error: "NO_USER_FOUND" 
        });
      }

      // Get user balance and tier
      const userBalance = await storage.getUserLoyaltyBalance(user.id);
      
      // Get transactions
      const transactions = await storage.getUserLoyaltyTransactions(user.id);
      
      // Get available rewards
      const availableRewards = await storage.getLoyaltyRewards();
      
      // Get user redemptions
      const redemptions = await storage.getUserLoyaltyRedemptions(user.id);

      res.json({
        user: userBalance || user,
        transactions: transactions || [],
        availableRewards: availableRewards.filter(r => r.isActive) || [],
        redemptions: redemptions || []
      });
    } catch (error) {
      console.error("Error fetching loyalty data by phone:", error);
      res.status(500).json({ 
        message: "Failed to fetch loyalty data",
        error: "INTERNAL_ERROR" 
      });
    }
  });

  // GET /api/loyalty/user/:userId/balance - Get user points balance and tier
  app.get("/api/loyalty/user/:userId/balance", async (req, res) => {
    try {
      const userBalance = await storage.getUserLoyaltyBalance(req.params.userId);
      if (!userBalance) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(userBalance);
    } catch (error) {
      console.error("Error fetching user loyalty balance:", error);
      res.status(500).json({ message: "Failed to fetch loyalty balance" });
    }
  });

  // GET /api/loyalty/user/:userId/transactions - Get user loyalty transaction history
  app.get("/api/loyalty/user/:userId/transactions", async (req, res) => {
    try {
      const transactions = await storage.getUserLoyaltyTransactions(req.params.userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching user loyalty transactions:", error);
      res.status(500).json({ message: "Failed to fetch loyalty transactions" });
    }
  });

  // POST /api/loyalty/user/:userId/points - Add points for purchase (automatic when order is completed)
  app.post("/api/loyalty/user/:userId/points", async (req, res) => {
    try {
      const { orderId, amount, type = "purchase", description } = req.body;
      const result = await storage.addLoyaltyPoints(req.params.userId, {
        orderId,
        amount: parseFloat(amount),
        type,
        description: description || `Pontos ganhos em compra`
      });
      res.json(result);
    } catch (error) {
      console.error("Error adding loyalty points:", error);
      res.status(500).json({ message: "Failed to add loyalty points" });
    }
  });

  // GET /api/loyalty/rewards - Get all available rewards
  app.get("/api/loyalty/rewards", async (req, res) => {
    try {
      const userTier = req.query.userTier as string || 'bronze';
      const rewards = await storage.getLoyaltyRewards(userTier);
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching loyalty rewards:", error);
      res.status(500).json({ message: "Failed to fetch loyalty rewards" });
    }
  });

  // POST /api/loyalty/rewards - Create new reward (admin only)
  app.post("/api/loyalty/rewards", async (req, res) => {
    try {
      const result = insertLoyaltyRewardSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid reward data", errors: result.error.errors });
      }
      const reward = await storage.createLoyaltyReward(result.data);
      res.status(201).json(reward);
    } catch (error) {
      console.error("Error creating loyalty reward:", error);
      res.status(500).json({ message: "Failed to create loyalty reward" });
    }
  });

  // PUT /api/loyalty/rewards/:id - Update reward (admin only)
  app.put("/api/loyalty/rewards/:id", async (req, res) => {
    try {
      const result = insertLoyaltyRewardSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid reward data", errors: result.error.errors });
      }
      const reward = await storage.updateLoyaltyReward(req.params.id, result.data);
      if (!reward) {
        return res.status(404).json({ message: "Reward not found" });
      }
      res.json(reward);
    } catch (error) {
      console.error("Error updating loyalty reward:", error);
      res.status(500).json({ message: "Failed to update loyalty reward" });
    }
  });

  // POST /api/loyalty/redeem - Redeem a reward
  app.post("/api/loyalty/redeem", async (req, res) => {
    try {
      const { userId, rewardId } = req.body;
      
      if (!userId || !rewardId) {
        return res.status(400).json({ message: "userId and rewardId are required" });
      }

      const result = await storage.redeemLoyaltyReward(userId, rewardId);
      res.json(result);
    } catch (error) {
      console.error("Error redeeming loyalty reward:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to redeem reward" });
      }
    }
  });

  // POST /api/loyalty/user/:userId/redeem/:rewardId - Redeem a reward
  app.post("/api/loyalty/user/:userId/redeem/:rewardId", async (req, res) => {
    try {
      const result = await storage.redeemLoyaltyReward(req.params.userId, req.params.rewardId);
      res.json(result);
    } catch (error) {
      console.error("Error redeeming loyalty reward:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to redeem reward"
      });
    }
  });

  // GET /api/loyalty/user/:userId/redemptions - Get user redemption history
  app.get("/api/loyalty/user/:userId/redemptions", async (req, res) => {
    try {
      const redemptions = await storage.getUserLoyaltyRedemptions(req.params.userId);
      res.json(redemptions);
    } catch (error) {
      console.error("Error fetching user redemptions:", error);
      res.status(500).json({ message: "Failed to fetch redemptions" });
    }
  });

  // GET /api/loyalty/admin/redemptions - Get all redemptions for admin
  app.get("/api/loyalty/admin/redemptions", async (req, res) => {
    try {
      const redemptions = await storage.getAllLoyaltyRedemptions();
      res.json(redemptions);
    } catch (error) {
      console.error("Error fetching all redemptions:", error);
      res.status(500).json({ message: "Failed to fetch redemptions" });
    }
  });

  // PUT /api/loyalty/admin/redemptions/:id/status - Update redemption status (admin only)
  app.put("/api/loyalty/admin/redemptions/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!['pending', 'approved', 'delivered', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const redemption = await storage.updateRedemptionStatus(req.params.id, status);
      if (!redemption) {
        return res.status(404).json({ message: "Redemption not found" });
      }
      res.json(redemption);
    } catch (error) {
      console.error("Error updating redemption status:", error);
      res.status(500).json({ message: "Failed to update redemption status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
