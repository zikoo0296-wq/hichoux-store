import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import createMemoryStore from "memorystore";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { syncOrderToGoogleSheets, syncAllUnSyncedOrders, ensureSheetExists, updateOrderStatusInSheet, syncOrderFromSheet, syncAllErrorOrdersFromSheet } from "./google-sheets";
import { sendOrderToCarrier, syncCarrierStatuses, sendAllConfirmedToCarrier, handleCarrierWebhook } from "./carrier";
import { sendSMS, sendWhatsApp } from "./twilio";
import { insertOrderSchema, insertCategorySchema, insertProductSchema, orderFormSchema, UserRole, USER_ROLES } from "@shared/schema";
import bcrypt from "bcrypt";

const MemoryStore = createMemoryStore(session);

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

declare module "express-session" {
  interface SessionData {
    userId?: number;
    userRole?: UserRole;
  }
}

interface AuthRequest extends Request {
  userId?: number;
  userRole?: UserRole;
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.userId = req.session.userId;
  req.userRole = req.session.userRole;
  next();
}

function requireRole(...allowedRoles: UserRole[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "User not found" });
    }
    
    if (!user.isActive) {
      req.session.destroy(() => {});
      return res.status(403).json({ error: "Account is deactivated" });
    }
    
    const userRole = user.role as UserRole;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: "Forbidden - Insufficient permissions" });
    }
    
    req.session.userRole = userRole;
    req.userId = req.session.userId;
    req.userRole = userRole;
    next();
  };
}

const requireSuperAdmin = requireRole("super_admin");
const requireAdminOrAbove = requireRole("super_admin", "admin");
const requireOperatorOrAbove = requireRole("super_admin", "admin", "operator");
const requireAnyRole = requireRole("super_admin", "admin", "operator", "support");

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Trust proxy for Render/Vercel
  app.set('trust proxy', 1);
  
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret && process.env.NODE_ENV === "production") {
    throw new Error("FATAL: SESSION_SECRET environment variable is required in production");
  }
  
  app.use(
    session({
      store: new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      secret: sessionSecret || "dev-session-secret-not-for-production",
      resave: false,
      saveUninitialized: false,
      proxy: true,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === "production" ? "none" as const : "lax" as const,
      },
    })
  );
  await seedAdminUser();

  // Public API routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/store-config", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      const settingsMap = new Map(settings.map((s) => [s.key, s.value || ""]));
      
      res.json({
        deliveryCost: parseFloat(settingsMap.get("delivery_cost") || "35"),
        freeDeliveryThreshold: parseFloat(settingsMap.get("free_delivery_threshold") || "300"),
        storeName: settingsMap.get("store_name") || "متجرنا",
        storePhone: settingsMap.get("store_phone") || "+212 6 00 00 00 00",
        storeEmail: settingsMap.get("store_email") || "",
        storeAddress: settingsMap.get("store_address") || "",
        storeDescription: settingsMap.get("store_description") || "",
        whatsappNumber: settingsMap.get("whatsapp_number") || "212600000000",
        defaultCarrier: settingsMap.get("default_carrier") || "digylog",
        storeLogo: settingsMap.get("store_logo") || null,
        storeIcon: settingsMap.get("store_icon") || null,
        facebookUrl: settingsMap.get("facebook_url") || "",
        instagramUrl: settingsMap.get("instagram_url") || "",
        tiktokUrl: settingsMap.get("tiktok_url") || "",
        youtubeUrl: settingsMap.get("youtube_url") || "",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Public webhook endpoint for carrier status updates (DIGYLOG, etc.)
  // This endpoint is called automatically by the carrier when delivery status changes
  app.post("/api/webhooks/carrier/:carrierName", async (req, res) => {
    try {
      const { carrierName } = req.params;
      const payload = req.body;
      
      console.log(`Webhook received from ${carrierName}:`, JSON.stringify(payload));
      
      const result = await handleCarrierWebhook(carrierName.toUpperCase() as any, payload);
      
      if (result.success) {
        res.json({ status: 'ok', message: result.message });
      } else {
        res.status(400).json({ status: 'error', message: result.message });
      }
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const result = orderFormSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }

      const { items, ...orderData } = result.data;

      let totalPrice = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ error: `Product ${item.productId} not found` });
        }
        if (product.stock < item.quantity) {
          return res.status(400).json({ error: `Not enough stock for ${product.title}` });
        }

        const unitPrice = parseFloat(product.price);
        const unitCost = parseFloat(product.costPrice);
        totalPrice += unitPrice * item.quantity;

        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: unitPrice.toString(),
          unitCost: unitCost.toString(),
        });
      }

      const order = await storage.createOrder(
        {
          ...orderData,
          totalPrice: totalPrice.toString(),
          deliveryCost: orderData.deliveryCost?.toString() || "35",
        },
        orderItems as any
      );

      res.status(201).json(order);
    } catch (error: any) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: "Account is deactivated. Please contact an administrator." });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.regenerate((err) => {
        if (err) {
          return res.status(500).json({ error: "Session error" });
        }
        
        req.session.userId = user.id;
        req.session.userRole = user.role as UserRole;
        
        storage.updateUser(user.id, { lastLoginAt: new Date() }).catch(() => {});
        
        res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "User not found" });
    }

    if (!user.isActive) {
      req.session.destroy(() => {});
      return res.status(403).json({ error: "Account is deactivated" });
    }

    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  });

  // Admin API routes
  app.get("/api/admin/dashboard", requireAnyRole, async (req, res) => {
    try {
      const { from, to } = req.query;
      let dateFrom: Date | undefined;
      let dateTo: Date | undefined;
      
      if (from) {
        dateFrom = new Date(from as string);
        dateFrom.setUTCHours(0, 0, 0, 0);
      }
      if (to) {
        dateTo = new Date(to as string);
        dateTo.setUTCHours(23, 59, 59, 999);
      }
      
      const stats = await storage.getDashboardStats(dateFrom, dateTo);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/orders", requireAnyRole, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      
      const { search, status, startDate, endDate, city, productId } = req.query;
      let filtered = orders;

      if (search) {
        const q = (search as string).toLowerCase();
        filtered = filtered.filter(o => 
          o.customerName.toLowerCase().includes(q) ||
          o.phone.includes(q) ||
          o.id.toString().includes(q)
        );
      }

      if (status && status !== "all") {
        filtered = filtered.filter(o => o.status === status);
      }

      if (city) {
        filtered = filtered.filter(o => 
          o.city.toLowerCase().includes((city as string).toLowerCase())
        );
      }

      if (startDate) {
        const start = new Date(startDate as string);
        filtered = filtered.filter(o => new Date(o.createdAt) >= start);
      }

      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter(o => new Date(o.createdAt) <= end);
      }

      res.json(filtered);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/orders/recent", requireAnyRole, async (req, res) => {
    try {
      const { from, to } = req.query;
      let dateFrom: Date | undefined;
      let dateTo: Date | undefined;
      
      if (from) {
        dateFrom = new Date(from as string);
        dateFrom.setUTCHours(0, 0, 0, 0);
      }
      if (to) {
        dateTo = new Date(to as string);
        dateTo.setUTCHours(23, 59, 59, 999);
      }
      
      const orders = await storage.getRecentOrders(10, dateFrom, dateTo);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/orders/:id", requireAnyRole, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/orders/:id/confirm", requireOperatorOrAbove, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.updateOrderStatus(id, "CONFIRMEE");
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const fullOrder = await storage.getOrder(id);
      if (fullOrder) {
        // Sync to Google Sheets only - carrier sync is done manually via shipping labels page
        await syncOrderToGoogleSheets(fullOrder, fullOrder.items || []).catch(err => 
          console.log("Auto Google Sheets sync attempt:", err.message)
        );

        // Send customer notification
        const customerMessage = `Bonjour ${order.customerName},\n\nVotre commande #${id} a été confirmée.\nMontant: ${parseFloat(order.totalPrice).toFixed(2)} DH\nVous recevrez votre colis très bientôt.\n\nMerci de votre achat!`;
        
        if (process.env.ENABLE_SMS === "true") {
          await sendSMS(order.phone, customerMessage).catch(err => 
            console.log("SMS notification failed:", err.message)
          );
        }
        
        if (process.env.ENABLE_WHATSAPP === "true") {
          await sendWhatsApp(order.phone, customerMessage).catch(err => 
            console.log("WhatsApp notification failed:", err.message)
          );
        }
      }
      
      // Return updated order with latest status
      const updatedOrder = await storage.getOrder(id);
      res.json(updatedOrder || order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/orders/:id/cancel", requireOperatorOrAbove, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.updateOrderStatus(id, "ANNULEE");
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/orders/:id/mark-unreachable", requireOperatorOrAbove, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.updateOrderStatus(id, "INJOIGNABLE");
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/orders/:id/send-to-carrier", requireOperatorOrAbove, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const result = await sendOrderToCarrier(order);
      if (!result.success) {
        // Update Google Sheet with error
        await updateOrderStatusInSheet(id, '', result.error || 'Unknown error').catch(err =>
          console.log(`Failed to update Google Sheet error for order ${id}:`, err.message)
        );
        return res.status(400).json({ error: result.error });
      }

      // Update Google Sheet status to "Sent"
      await updateOrderStatusInSheet(id, 'Sent').catch(err =>
        console.log(`Failed to update Google Sheet status for order ${id}:`, err.message)
      );

      const updatedOrder = await storage.updateOrderStatus(id, "ENVOYEE");
      res.json({ ...updatedOrder, shippingLabel: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/orders/:id/mark-delivered", requireOperatorOrAbove, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.updateOrderStatus(id, "LIVREE");
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/orders/:id/sync-sheets", requireAdminOrAbove, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      await ensureSheetExists();
      const success = await syncOrderToGoogleSheets(order, order.items);
      if (!success) {
        return res.status(400).json({ error: "Failed to sync to Google Sheets" });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Products admin routes
  app.get("/api/admin/products", requireAdminOrAbove, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/products/:id", requireAdminOrAbove, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/products", requireAdminOrAbove, async (req, res) => {
    try {
      const productData = {
        ...req.body,
        price: req.body.price?.toString(),
        costPrice: req.body.costPrice?.toString(),
      };

      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/products/:id", requireAdminOrAbove, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productData = {
        ...req.body,
        price: req.body.price?.toString(),
        costPrice: req.body.costPrice?.toString(),
      };

      const product = await storage.updateProduct(id, productData);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/products/:id", requireAdminOrAbove, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if product has associated orders
      const hasOrders = await storage.productHasOrders(id);
      
      if (hasOrders) {
        // Cannot delete products with orders - inform the user
        return res.status(400).json({ 
          error: "Ce produit ne peut pas être supprimé car il est lié à des commandes existantes. Vous pouvez modifier le stock à 0 pour le rendre indisponible." 
        });
      }
      
      // Hard delete - no associated orders
      await storage.deleteProduct(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Categories admin routes
  app.get("/api/admin/categories", requireAdminOrAbove, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/categories", requireAdminOrAbove, async (req, res) => {
    try {
      const category = await storage.createCategory(req.body);
      res.status(201).json(category);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/categories/:id", requireAdminOrAbove, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.updateCategory(id, req.body);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/categories/:id", requireAdminOrAbove, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Shipping labels
  app.get("/api/admin/shipping-labels", requireOperatorOrAbove, async (req, res) => {
    try {
      const labels = await storage.getShippingLabels();
      res.json(labels);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Sync all confirmed orders to carrier
  app.post("/api/admin/carrier/sync-confirmed", requireOperatorOrAbove, async (req, res) => {
    try {
      const result = await sendAllConfirmedToCarrier();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Sync carrier statuses for all shipped orders
  app.post("/api/admin/carrier/sync-statuses", requireOperatorOrAbove, async (req, res) => {
    try {
      const result = await syncCarrierStatuses();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/shipping-labels/:id/download", requireOperatorOrAbove, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const label = await storage.getShippingLabel(id);
      if (!label) {
        return res.status(404).json({ error: "Label not found" });
      }

      // If label already has PDF content, return it
      if (label.pdfBase64) {
        const buffer = Buffer.from(label.pdfBase64, "base64");
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=etiquette-${label.orderId}.pdf`);
        return res.send(buffer);
      }

      // For DIGYLOG labels with tracking number, fetch from API
      if (label.providerName === 'DIGYLOG' && label.trackingNumber) {
        const { downloadDigylogLabels } = await import('./carrier');
        const result = await downloadDigylogLabels([label.trackingNumber]);
        if (result.success && result.pdfBase64) {
          // Save the PDF to the label for future use
          await storage.updateShippingLabelPdf(label.id, result.pdfBase64);
          
          const buffer = Buffer.from(result.pdfBase64, "base64");
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename=etiquette-${label.trackingNumber}.pdf`);
          return res.send(buffer);
        }
        return res.status(500).json({ error: result.error || "Failed to download label from DIGYLOG" });
      }

      // If there's a label URL, redirect to it
      if (label.labelUrl) {
        return res.redirect(label.labelUrl);
      }

      res.status(404).json({ error: "No label content available" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Download multiple labels at once (for batch printing)
  app.post("/api/admin/shipping-labels/download-batch", requireOperatorOrAbove, async (req, res) => {
    try {
      const { trackingNumbers } = req.body;
      if (!trackingNumbers || !Array.isArray(trackingNumbers) || trackingNumbers.length === 0) {
        return res.status(400).json({ error: "trackingNumbers array is required" });
      }

      const { downloadDigylogLabels } = await import('./carrier');
      const result = await downloadDigylogLabels(trackingNumbers);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      const buffer = Buffer.from(result.pdfBase64!, "base64");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=etiquettes-${Date.now()}.pdf`);
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Analytics
  app.get("/api/admin/analytics", requireAdminOrAbove, async (req, res) => {
    try {
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(new Date().setDate(1));
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      endDate.setHours(23, 59, 59, 999);

      const analytics = await storage.getAnalytics(startDate, endDate);
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/analytics/export", requireAdminOrAbove, async (req, res) => {
    try {
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(new Date().setDate(1));
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      endDate.setHours(23, 59, 59, 999);

      const analytics = await storage.getAnalytics(startDate, endDate);

      const csv = [
        "Métrique,Valeur",
        `Revenu total,${analytics.revenue.toFixed(2)} DH`,
        `Coût produits,${analytics.productCosts.toFixed(2)} DH`,
        `Coût livraison,${analytics.deliveryCosts.toFixed(2)} DH`,
        `Coût publicité,${analytics.adCosts.toFixed(2)} DH`,
        `Profit net,${analytics.profit.toFixed(2)} DH`,
        `Nombre de commandes,${analytics.ordersCount}`,
        "",
        "Top Produits",
        "Produit,Quantité,Revenu",
        ...analytics.topProducts.map((p) => `${p.title},${p.quantity},${p.revenue.toFixed(2)} DH`),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=rapport-${startDate.toISOString().split("T")[0]}-${endDate.toISOString().split("T")[0]}.csv`);
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Ad costs
  app.post("/api/admin/ad-costs", requireAdminOrAbove, async (req, res) => {
    try {
      const adCost = await storage.createAdCost({
        amount: req.body.amount,
        description: req.body.description,
        date: new Date(req.body.date),
      });
      res.status(201).json(adCost);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Settings
  app.get("/api/admin/settings", requireSuperAdmin, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/settings", requireSuperAdmin, async (req, res) => {
    try {
      const settingsData = req.body;
      for (const [key, value] of Object.entries(settingsData)) {
        let processedValue = value as string;
        
        // Extract Google Sheets ID from full URL if provided
        if (key === 'google_sheets_id' && processedValue) {
          const urlMatch = processedValue.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
          if (urlMatch) {
            processedValue = urlMatch[1];
          }
        }
        
        await storage.setSetting(key, processedValue);
      }
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Google Sheets sync
  app.post("/api/admin/google-sheets/sync", requireAdminOrAbove, async (req, res) => {
    try {
      const spreadsheetIdSetting = await storage.getSetting('google_sheets_id');
      if (!spreadsheetIdSetting?.value) {
        return res.status(400).json({ error: "Google Sheets ID not configured. Please add the Spreadsheet ID in settings." });
      }

      try {
        await ensureSheetExists();
      } catch (sheetError: any) {
        return res.status(400).json({ error: sheetError.message || "Failed to connect to Google Sheets" });
      }

      const result = await syncAllUnSyncedOrders();
      if (result.error) {
        return res.status(400).json({ error: result.error, synced: result.synced, failed: result.failed });
      }
      res.json(result);
    } catch (error: any) {
      console.error("Google Sheets sync error:", error);
      res.status(500).json({ error: error.message || "Failed to sync with Google Sheets" });
    }
  });

  // Sync corrected order from Google Sheets back to database
  app.post("/api/admin/google-sheets/sync-from/:id", requireOperatorOrAbove, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await syncOrderFromSheet(id);
      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Sync all orders with errors from Google Sheets
  app.post("/api/admin/google-sheets/sync-errors", requireOperatorOrAbove, async (req, res) => {
    try {
      const result = await syncAllErrorOrdersFromSheet();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // CSV Export - Orders
  app.get("/api/admin/orders/export/csv", requireAdminOrAbove, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const csv = [
        ["ID", "Client", "Téléphone", "Adresse", "Ville", "Total", "Statut", "Date"].join(","),
        ...orders.map(o => [
          o.id,
          `"${o.customerName}"`,
          o.phone,
          `"${o.address}"`,
          `"${o.city}"`,
          parseFloat(o.totalPrice).toFixed(2),
          o.status,
          new Date(o.createdAt).toLocaleDateString("fr-FR"),
        ].join(",")),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=commandes-${new Date().toISOString().split("T")[0]}.csv`);
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // CSV Export - Products
  app.get("/api/admin/products/export/csv", requireAdminOrAbove, async (req, res) => {
    try {
      const products = await storage.getProducts();
      const csv = [
        ["ID", "Titre", "SKU", "Prix", "Coût", "Stock", "Catégorie"].join(","),
        ...products.map(p => [
          p.id,
          `"${p.title}"`,
          p.sku || "",
          parseFloat(p.price).toFixed(2),
          parseFloat(p.costPrice).toFixed(2),
          p.stock,
          p.category?.name || "",
        ].join(",")),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=produits-${new Date().toISOString().split("T")[0]}.csv`);
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Inventory alerts - Get low stock products
  app.get("/api/admin/inventory/low-stock", requireAdminOrAbove, async (req, res) => {
    try {
      const products = await storage.getProducts();
      const lowStockProducts = products.filter(p => {
        const threshold = p.lowStockThreshold || 5;
        return p.stock <= threshold;
      });
      res.json(lowStockProducts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // CSV Import - Products
  app.post("/api/admin/products/import/csv", requireAdminOrAbove, async (req, res) => {
    try {
      const { csvContent } = req.body;
      if (!csvContent) {
        return res.status(400).json({ error: "CSV content required" });
      }

      const lines = csvContent.trim().split("\n");
      if (lines.length < 2) {
        return res.status(400).json({ error: "CSV must have headers and data" });
      }

      const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase());
      const imported: any[] = [];
      let skipped = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v: string) => v.trim().replace(/^"|"$/g, ""));
        if (values.length < 2) continue;

        try {
          const productName = values[headers.indexOf("titre")] || values[headers.indexOf("name")] || values[0];
          const productSlug = productName.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .substring(0, 50);

          const product = {
            name: productName,
            title: productName,
            slug: `${productSlug}-${Date.now()}-${i}`,
            description: values[headers.indexOf("description")] || "",
            price: (parseFloat(values[headers.indexOf("prix")] || values[2]) || 0).toString(),
            costPrice: (parseFloat(values[headers.indexOf("coût")] || values[3]) || 0).toString(),
            stock: parseInt(values[headers.indexOf("stock")] || values[4]) || 0,
            sku: values[headers.indexOf("sku")] || null,
            categoryId: parseInt(values[headers.indexOf("categorieid")] || "1") || 1,
            images: [] as string[],
            isActive: true,
            isFeatured: false,
          };

          if (product.price && product.name) {
            const created = await storage.createProduct(product);
            imported.push(created);
          } else {
            skipped++;
          }
        } catch (e) {
          skipped++;
        }
      }

      res.json({ imported: imported.length, skipped, products: imported });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send SMS/WhatsApp notification
  app.post("/api/admin/notifications/send", requireAdminOrAbove, async (req, res) => {
    try {
      const { phone, message, channel } = req.body;
      
      if (!phone || !message || !channel) {
        return res.status(400).json({ error: "Phone, message, and channel required" });
      }

      if (channel === "sms") {
        const result = await sendSMS(phone, message);
        res.json(result);
      } else if (channel === "whatsapp") {
        const result = await sendWhatsApp(phone, message);
        res.json(result);
      } else {
        res.status(400).json({ error: "Invalid channel. Use 'sms' or 'whatsapp'" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Upload endpoint (placeholder - would need Cloudinary/S3 integration)
  app.post("/api/upload", requireAdminOrAbove, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
      const filepath = path.join(uploadsDir, filename);

      await sharp(req.file.buffer)
        .resize(800, 800, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(filepath);

      const url = `/uploads/${filename}`;
      res.json({ url });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const express = await import("express");
  app.use("/uploads", express.default.static(uploadsDir));
  
  // Serve attached_assets (stock images for categories)
  const assetsDir = path.join(process.cwd(), "attached_assets");
  app.use("/attached_assets", express.default.static(assetsDir));

  // User Management Routes (Super Admin only)
  app.get("/api/admin/users", requireSuperAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users.map(u => ({ ...u, password: undefined })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/users/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/users", requireSuperAdmin, async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required" });
      }

      if (role && !USER_ROLES.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        name,
        email,
        password: hashedPassword,
        role: role || "operator",
      });

      res.status(201).json({ ...user, password: undefined });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/users/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, email, role, isActive, password } = req.body;

      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }

      if (role && !USER_ROLES.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const wouldRemoveSuperAdmin = existingUser.role === "super_admin" && (
        (role && role !== "super_admin") || 
        (typeof isActive === "boolean" && !isActive)
      );
      
      if (wouldRemoveSuperAdmin) {
        const users = await storage.getUsers();
        const superAdminCount = users.filter(u => u.role === "super_admin" && u.isActive).length;
        if (superAdminCount <= 1) {
          return res.status(400).json({ error: "Cannot demote or deactivate the last super admin" });
        }
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      if (typeof isActive === "boolean") updateData.isActive = isActive;
      if (password) updateData.password = await bcrypt.hash(password, 10);

      const user = await storage.updateUser(id, updateData);
      res.json({ ...user, password: undefined });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/users/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const authReq = req as AuthRequest;
      
      if (authReq.userId === id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      const userToDelete = await storage.getUser(id);
      if (!userToDelete) {
        return res.status(404).json({ error: "User not found" });
      }

      if (userToDelete.role === "super_admin") {
        const users = await storage.getUsers();
        const superAdminCount = users.filter(u => u.role === "super_admin" && u.isActive).length;
        if (superAdminCount <= 1) {
          return res.status(400).json({ error: "Cannot delete the last super admin" });
        }
      }

      await storage.deleteUser(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}

async function seedAdminUser() {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (isProduction && (!adminEmail || !adminPassword)) {
      console.log("Skipping admin seed in production - set ADMIN_EMAIL and ADMIN_PASSWORD to seed");
      return;
    }
    
    const email = adminEmail || "admin@eshop.ma";
    const password = adminPassword || "admin123";
    
    const existingAdmin = await storage.getUserByEmail(email);
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await storage.createUser({
        name: "Super Admin",
        email: email,
        password: hashedPassword,
        role: "super_admin",
      });
      console.log(`Super Admin user created: ${email}`);
    }
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
}
