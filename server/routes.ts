import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { syncOrderToGoogleSheets, syncAllUnSyncedOrders, ensureSheetExists } from "./google-sheets";
import { sendOrderToCarrier } from "./carrier";
import { sendSMS, sendWhatsApp } from "./twilio";
import { insertOrderSchema, insertCategorySchema, insertProductSchema, orderFormSchema } from "@shared/schema";
import bcrypt from "bcrypt";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.set('trust proxy', 1);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "eshop-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      proxy: true,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
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

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.userId = user.id;
      res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
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
      return res.status(401).json({ error: "User not found" });
    }

    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  });

  // Admin API routes
  app.get("/api/admin/dashboard", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/orders", requireAuth, async (req, res) => {
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

  app.get("/api/admin/orders/recent", requireAuth, async (req, res) => {
    try {
      const orders = await storage.getRecentOrders(10);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/orders/:id", requireAuth, async (req, res) => {
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

  app.post("/api/admin/orders/:id/confirm", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.updateOrderStatus(id, "CONFIRMEE");
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const fullOrder = await storage.getOrder(id);
      if (fullOrder) {
        await sendOrderToCarrier(fullOrder).catch(err => 
          console.log("Auto carrier sync attempt:", err.message)
        );

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
      
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/orders/:id/cancel", requireAuth, async (req, res) => {
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

  app.post("/api/admin/orders/:id/mark-unreachable", requireAuth, async (req, res) => {
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

  app.post("/api/admin/orders/:id/send-to-carrier", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const result = await sendOrderToCarrier(order);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      const updatedOrder = await storage.updateOrderStatus(id, "ENVOYEE");
      res.json({ ...updatedOrder, shippingLabel: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/orders/:id/mark-delivered", requireAuth, async (req, res) => {
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

  app.post("/api/admin/orders/:id/sync-sheets", requireAuth, async (req, res) => {
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
  app.get("/api/admin/products", requireAuth, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/products/:id", requireAuth, async (req, res) => {
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

  app.post("/api/admin/products", requireAuth, async (req, res) => {
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

  app.patch("/api/admin/products/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/admin/products/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Categories admin routes
  app.get("/api/admin/categories", requireAuth, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/categories", requireAuth, async (req, res) => {
    try {
      const category = await storage.createCategory(req.body);
      res.status(201).json(category);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/categories/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/admin/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Shipping labels
  app.get("/api/admin/shipping-labels", requireAuth, async (req, res) => {
    try {
      const labels = await storage.getShippingLabels();
      res.json(labels);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/shipping-labels/:id/download", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const label = await storage.getShippingLabel(id);
      if (!label) {
        return res.status(404).json({ error: "Label not found" });
      }

      if (label.labelUrl) {
        return res.redirect(label.labelUrl);
      }

      if (label.pdfBase64) {
        const buffer = Buffer.from(label.pdfBase64, "base64");
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=etiquette-${label.orderId}.pdf`);
        return res.send(buffer);
      }

      res.status(404).json({ error: "No label content available" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Analytics
  app.get("/api/admin/analytics", requireAuth, async (req, res) => {
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

  app.get("/api/admin/analytics/export", requireAuth, async (req, res) => {
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
  app.post("/api/admin/ad-costs", requireAuth, async (req, res) => {
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
  app.get("/api/admin/settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/settings", requireAuth, async (req, res) => {
    try {
      const settingsData = req.body;
      for (const [key, value] of Object.entries(settingsData)) {
        await storage.setSetting(key, value as string);
      }
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Google Sheets sync
  app.post("/api/admin/google-sheets/sync", requireAuth, async (req, res) => {
    try {
      await ensureSheetExists();
      const result = await syncAllUnSyncedOrders();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // CSV Export - Orders
  app.get("/api/admin/orders/export/csv", requireAuth, async (req, res) => {
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
  app.get("/api/admin/products/export/csv", requireAuth, async (req, res) => {
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
  app.get("/api/admin/inventory/low-stock", requireAuth, async (req, res) => {
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
  app.post("/api/admin/products/import/csv", requireAuth, async (req, res) => {
    try {
      const { csvContent } = req.body;
      if (!csvContent) {
        return res.status(400).json({ error: "CSV content required" });
      }

      const lines = csvContent.trim().split("\n");
      if (lines.length < 2) {
        return res.status(400).json({ error: "CSV must have headers and data" });
      }

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const imported: any[] = [];
      let skipped = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
        if (values.length < 2) continue;

        try {
          const product = {
            title: values[headers.indexOf("titre")] || values[0],
            description: values[headers.indexOf("description")] || "",
            price: parseFloat(values[headers.indexOf("prix")] || values[2]),
            costPrice: parseFloat(values[headers.indexOf("coût")] || values[3]),
            stock: parseInt(values[headers.indexOf("stock")] || values[4]) || 0,
            sku: values[headers.indexOf("sku")] || null,
            categoryId: parseInt(values[headers.indexOf("categorieid")] || "1") || 1,
            images: [],
          };

          if (product.price && product.costPrice && product.title) {
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
  app.post("/api/admin/notifications/send", requireAuth, async (req, res) => {
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
  app.post("/api/upload", requireAuth, async (req, res) => {
    try {
      const placeholderUrl = `https://picsum.photos/seed/${Date.now()}/800/800`;
      res.json({ url: placeholderUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}

async function seedAdminUser() {
  try {
    const existingAdmin = await storage.getUserByEmail("admin@eshop.ma");
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await storage.createUser({
        name: "Admin",
        email: "admin@eshop.ma",
        password: hashedPassword,
        role: "admin",
      });
      console.log("Admin user created: admin@eshop.ma / admin123");
    }
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
}
