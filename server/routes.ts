import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertOrderSchema, insertOrderItemSchema, insertProductSchema } from "@shared/schema";
import { z } from "zod";

const createOrderRequestSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerPhoneInternational: z.string().optional(),
  customerEmail: z.string().optional().refine((val) => !val || z.string().email().safeParse(val).success, {
    message: "Invalid email"
  }),
  streetName: z.string().min(1),
  houseNumber: z.string().min(1),
  neighborhood: z.string().min(1),
  referencePoint: z.string().optional(),
  paymentMethod: z.string().min(1),
  specialInstructions: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.string(),
  })),
});

// Função para enviar dados para n8n
async function sendToN8n(orderData: any, orderItems: any[]) {
  try {
    const n8nPayload = {
      order: orderData,
      items: orderItems,
      timestamp: new Date().toISOString(),
      total: orderData.total,
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee
    };

    const response = await fetch('https://n8n-curso-n8n.yao8ay.easypanel.host/webhook-test/hamburgueria', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload),
    });

    if (!response.ok) {
      console.error('Failed to send to n8n:', response.status, response.statusText);
    } else {
      console.log('Successfully sent order to n8n');
    }
  } catch (error) {
    console.error('Error sending to n8n:', error);
  }
}

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
        deliveryAreas: []
      });
    } catch (error) {
      console.error("Error fetching store settings:", error);
      res.status(500).json({ message: "Failed to fetch store settings" });
    }
  });

  // Orders
  app.post("/api/orders", async (req, res) => {
    try {
      const requestData = createOrderRequestSchema.parse(req.body);
      
      // Calculate totals
      let subtotal = 0;
      const orderItems = requestData.items.map(item => {
        const totalPrice = parseFloat(item.unitPrice) * item.quantity;
        subtotal += totalPrice;
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: totalPrice.toFixed(2),
        };
      });

      const deliveryFee = 5.90; // Fixed delivery fee for now
      const total = subtotal + deliveryFee;

      const orderData = {
        customerName: requestData.customerName,
        customerPhone: requestData.customerPhone,
        customerPhoneInternational: requestData.customerPhoneInternational,
        customerEmail: requestData.customerEmail,
        streetName: requestData.streetName,
        houseNumber: requestData.houseNumber,
        neighborhood: requestData.neighborhood,
        referencePoint: requestData.referencePoint,
        paymentMethod: requestData.paymentMethod,
        specialInstructions: requestData.specialInstructions,
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        total: total.toFixed(2),
        estimatedDeliveryTime: 45, // 45 minutes default
      };

      const order = await storage.createOrder(orderData);
      
      // Add order items
      const orderItemsWithOrderId = orderItems.map(item => ({
        ...item,
        orderId: order.id,
      }));
      
      await storage.addOrderItems(orderItemsWithOrderId);

      // Enviar dados para n8n
      await sendToN8n(order, orderItemsWithOrderId);

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

  const httpServer = createServer(app);
  return httpServer;
}
