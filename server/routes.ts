import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertOrderSchema, insertOrderItemSchema, insertProductSchema, insertDeliveryZoneSchema, insertCategorySchema, insertExpenseSchema } from "@shared/schema";
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
      const { category } = req.query;
      let products;
      
      if (category && typeof category === 'string') {
        products = await storage.getProductsByCategory(category);
      } else {
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
      const products = await storage.getFeaturedProducts();
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
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.updateProduct(req.params.id, productData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid product data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update product" });
      }
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
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

  const httpServer = createServer(app);
  return httpServer;
}
