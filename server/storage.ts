import {
  users, categories, products, orders, orderItems, shippingLabels, syncLogs, adCosts, settings,
  type User, type InsertUser,
  type Category, type InsertCategory,
  type Product, type InsertProduct,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type ShippingLabel, type InsertShippingLabel,
  type SyncLog, type InsertSyncLog,
  type AdCost, type InsertAdCost,
  type Setting, type InsertSetting,
  type OrderWithItems, type ProductWithCategory,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, gte, lte, and, sql, count, sum, notInArray } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser> & { lastLoginAt?: Date | null; isActive?: boolean }): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Products
  getProducts(): Promise<ProductWithCategory[]>;
  getProduct(id: number): Promise<ProductWithCategory | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  productHasOrders(id: number): Promise<boolean>;
  updateProductStock(id: number, quantity: number): Promise<void>;

  // Orders
  getOrders(): Promise<Order[]>;
  getRecentOrders(limit?: number, dateFrom?: Date, dateTo?: Date): Promise<Order[]>;
  getOrder(id: number): Promise<OrderWithItems | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  markOrderSynced(id: number): Promise<void>;
  getUnSyncedOrders(): Promise<Order[]>;

  // Order Items
  getOrderItems(orderId: number): Promise<(OrderItem & { product: Product })[]>;

  // Shipping Labels
  getShippingLabels(): Promise<(ShippingLabel & { order: Order })[]>;
  getShippingLabel(id: number): Promise<ShippingLabel | undefined>;
  getShippingLabelByTracking(trackingNumber: string): Promise<ShippingLabel | undefined>;
  createShippingLabel(label: InsertShippingLabel): Promise<ShippingLabel>;
  updateShippingLabelPdf(id: number, pdfBase64: string): Promise<void>;

  // Sync Logs
  createSyncLog(log: InsertSyncLog): Promise<SyncLog>;

  // Ad Costs
  getAdCosts(startDate: Date, endDate: Date): Promise<AdCost[]>;
  createAdCost(cost: InsertAdCost): Promise<AdCost>;

  // Settings
  getSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(key: string, value: string | null): Promise<Setting>;

  // Analytics
  getDashboardStats(dateFrom?: Date, dateTo?: Date): Promise<{
    ordersToday: number;
    ordersTotal: number;
    revenueToday: number;
    revenueTotal: number;
    productsCount: number;
    pendingOrders: number;
    ordersInPeriod?: number;
    revenueInPeriod?: number;
  }>;
  getAnalytics(startDate: Date, endDate: Date): Promise<{
    revenue: number;
    productCosts: number;
    deliveryCosts: number;
    adCosts: number;
    profit: number;
    ordersCount: number;
    topProducts: Array<{
      id: number;
      title: string;
      image: string | null;
      quantity: number;
      revenue: number;
    }>;
    ordersByDay: Array<{
      date: string;
      count: number;
      revenue: number;
    }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: number, data: Partial<InsertUser> & { lastLoginAt?: Date | null; isActive?: boolean }): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    await db.delete(users).where(eq(users.id, id));
    return true;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(categories.name);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db.update(categories).set(category).where(eq(categories.id, id)).returning();
    return updated || undefined;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return true;
  }

  // Products
  async getProducts(): Promise<ProductWithCategory[]> {
    const result = await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(desc(products.createdAt));

    return result.map((row) => ({
      ...row.products,
      category: row.categories || null,
    }));
  }

  async getProduct(id: number): Promise<ProductWithCategory | undefined> {
    const [result] = await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id));

    if (!result) return undefined;

    return {
      ...result.products,
      category: result.categories || null,
    };
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products).set(product).where(eq(products.id, id)).returning();
    return updated || undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    await db.delete(products).where(eq(products.id, id));
    return true;
  }

  async productHasOrders(id: number): Promise<boolean> {
    const [result] = await db
      .select({ count: count() })
      .from(orderItems)
      .where(eq(orderItems.productId, id));
    return (result?.count || 0) > 0;
  }

  async updateProductStock(id: number, quantity: number): Promise<void> {
    await db
      .update(products)
      .set({ stock: sql`${products.stock} - ${quantity}` })
      .where(eq(products.id, id));
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getRecentOrders(limit = 10, dateFrom?: Date, dateTo?: Date): Promise<Order[]> {
    if (dateFrom && dateTo) {
      return db
        .select()
        .from(orders)
        .where(and(gte(orders.createdAt, dateFrom), lte(orders.createdAt, dateTo)))
        .orderBy(desc(orders.createdAt))
        .limit(limit);
    }
    return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
  }

  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    const items = await this.getOrderItems(id);

    const [label] = await db
      .select()
      .from(shippingLabels)
      .where(eq(shippingLabels.orderId, id));

    return {
      ...order,
      items,
      shippingLabel: label || null,
    };
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();

    for (const item of items) {
      await db.insert(orderItems).values({
        ...item,
        orderId: newOrder.id,
      });
      await this.updateProductStock(item.productId, item.quantity);
    }

    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updated] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updated || undefined;
  }

  async markOrderSynced(id: number): Promise<void> {
    await db
      .update(orders)
      .set({ syncedToSheets: true, updatedAt: new Date() })
      .where(eq(orders.id, id));
  }

  async getUnSyncedOrders(): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .where(and(eq(orders.status, "CONFIRMEE"), eq(orders.syncedToSheets, false)));
  }

  // Order Items
  async getOrderItems(orderId: number): Promise<(OrderItem & { product: Product })[]> {
    const result = await db
      .select()
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    return result.map((row) => ({
      ...row.order_items,
      product: row.products!,
    }));
  }

  // Shipping Labels
  async getShippingLabels(): Promise<(ShippingLabel & { order: Order })[]> {
    const result = await db
      .select()
      .from(shippingLabels)
      .leftJoin(orders, eq(shippingLabels.orderId, orders.id))
      .orderBy(desc(shippingLabels.createdAt));

    return result.map((row) => ({
      ...row.shipping_labels,
      order: row.orders!,
    }));
  }

  async getShippingLabel(id: number): Promise<ShippingLabel | undefined> {
    const [label] = await db.select().from(shippingLabels).where(eq(shippingLabels.id, id));
    return label || undefined;
  }

  async getShippingLabelByTracking(trackingNumber: string): Promise<ShippingLabel | undefined> {
    const [label] = await db.select().from(shippingLabels).where(eq(shippingLabels.trackingNumber, trackingNumber));
    return label || undefined;
  }

  async createShippingLabel(label: InsertShippingLabel): Promise<ShippingLabel> {
    const [newLabel] = await db.insert(shippingLabels).values(label).returning();
    return newLabel;
  }

  async updateShippingLabelPdf(id: number, pdfBase64: string): Promise<void> {
    await db.update(shippingLabels).set({ pdfBase64 }).where(eq(shippingLabels.id, id));
  }

  // Sync Logs
  async createSyncLog(log: InsertSyncLog): Promise<SyncLog> {
    const [newLog] = await db.insert(syncLogs).values(log).returning();
    return newLog;
  }

  // Ad Costs
  async getAdCosts(startDate: Date, endDate: Date): Promise<AdCost[]> {
    return db
      .select()
      .from(adCosts)
      .where(and(gte(adCosts.date, startDate), lte(adCosts.date, endDate)));
  }

  async createAdCost(cost: InsertAdCost): Promise<AdCost> {
    const [newCost] = await db.insert(adCosts).values(cost).returning();
    return newCost;
  }

  // Settings
  async getSettings(): Promise<Setting[]> {
    return db.select().from(settings);
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || undefined;
  }

  async setSetting(key: string, value: string | null): Promise<Setting> {
    const existing = await this.getSetting(key);
    if (existing) {
      const [updated] = await db
        .update(settings)
        .set({ value, updatedAt: new Date() })
        .where(eq(settings.key, key))
        .returning();
      return updated;
    }
    const [created] = await db.insert(settings).values({ key, value }).returning();
    return created;
  }

  // Analytics
  async getDashboardStats(dateFrom?: Date, dateTo?: Date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Excluded statuses from revenue calculations (no payment received)
    const excludedStatuses = ['ANNULEE', 'RETOURNEE', 'INJOIGNABLE'];

    // Orders count today (all orders)
    const [ordersCountToday] = await db
      .select({ count: count() })
      .from(orders)
      .where(gte(orders.createdAt, today));

    // Revenue today (excluding cancelled/returned orders)
    const [revenueToday] = await db
      .select({
        revenue: sql<number>`COALESCE(SUM(CAST(${orders.totalPrice} AS DECIMAL)), 0)`,
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, today),
          notInArray(orders.status, excludedStatuses)
        )
      );

    // Total orders count
    const [ordersCountTotal] = await db
      .select({ count: count() })
      .from(orders);

    // Total revenue (excluding cancelled/returned orders)
    const [revenueTotalResult] = await db
      .select({
        revenue: sql<number>`COALESCE(SUM(CAST(${orders.totalPrice} AS DECIMAL)), 0)`,
      })
      .from(orders)
      .where(notInArray(orders.status, excludedStatuses));

    const [productsStats] = await db.select({ count: count() }).from(products);

    const [pendingStats] = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, "NOUVELLE"));

    let ordersInPeriod: number | undefined;
    let revenueInPeriod: number | undefined;

    if (dateFrom && dateTo) {
      // Orders count in period
      const [ordersCountPeriod] = await db
        .select({ count: count() })
        .from(orders)
        .where(and(gte(orders.createdAt, dateFrom), lte(orders.createdAt, dateTo)));

      // Revenue in period (excluding cancelled/returned orders)
      const [revenuePeriod] = await db
        .select({
          revenue: sql<number>`COALESCE(SUM(CAST(${orders.totalPrice} AS DECIMAL)), 0)`,
        })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, dateFrom),
            lte(orders.createdAt, dateTo),
            notInArray(orders.status, excludedStatuses)
          )
        );
      
      ordersInPeriod = Number(ordersCountPeriod?.count || 0);
      revenueInPeriod = Number(revenuePeriod?.revenue || 0);
    }

    return {
      ordersToday: Number(ordersCountToday?.count || 0),
      ordersTotal: Number(ordersCountTotal?.count || 0),
      revenueToday: Number(revenueToday?.revenue || 0),
      revenueTotal: Number(revenueTotalResult?.revenue || 0),
      productsCount: Number(productsStats?.count || 0),
      pendingOrders: Number(pendingStats?.count || 0),
      ordersInPeriod,
      revenueInPeriod,
    };
  }

  async getAnalytics(startDate: Date, endDate: Date) {
    const ordersInRange = await db
      .select()
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate),
          eq(orders.status, "LIVREE")
        )
      );

    let revenue = 0;
    let productCosts = 0;

    for (const order of ordersInRange) {
      revenue += parseFloat(order.totalPrice);
      const items = await this.getOrderItems(order.id);
      for (const item of items) {
        productCosts += parseFloat(item.unitCost) * item.quantity;
      }
    }

    const deliveryCostSetting = await this.getSetting("delivery_cost");
    const deliveryCostPerOrder = parseFloat(deliveryCostSetting?.value || "0");
    const deliveryCosts = ordersInRange.length * deliveryCostPerOrder;

    const adCostsData = await this.getAdCosts(startDate, endDate);
    const adCostsTotal = adCostsData.reduce((sum, cost) => sum + parseFloat(cost.amount), 0);

    const profit = revenue - productCosts - deliveryCosts - adCostsTotal;

    // Top products
    const topProductsData = await db
      .select({
        productId: orderItems.productId,
        quantity: sql<number>`SUM(${orderItems.quantity})`.as("quantity"),
        revenue: sql<number>`SUM(CAST(${orderItems.unitPrice} AS DECIMAL) * ${orderItems.quantity})`.as("revenue"),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate),
          eq(orders.status, "LIVREE")
        )
      )
      .groupBy(orderItems.productId)
      .orderBy(sql`quantity DESC`)
      .limit(10);

    const topProducts = await Promise.all(
      topProductsData.map(async (tp) => {
        const product = await this.getProduct(tp.productId);
        return {
          id: tp.productId,
          title: product?.title || "Produit supprimé",
          image: product?.images?.[0] || null,
          quantity: Number(tp.quantity),
          revenue: Number(tp.revenue),
        };
      })
    );

    // Orders by day
    const ordersByDay = await db
      .select({
        date: sql<string>`DATE(${orders.createdAt})`.as("date"),
        count: count(),
        revenue: sql<number>`SUM(CAST(${orders.totalPrice} AS DECIMAL))`.as("revenue"),
      })
      .from(orders)
      .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)))
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`);

    return {
      revenue,
      productCosts,
      deliveryCosts,
      adCosts: adCostsTotal,
      profit,
      ordersCount: ordersInRange.length,
      topProducts,
      ordersByDay: ordersByDay.map((d) => ({
        date: d.date,
        count: Number(d.count),
        revenue: Number(d.revenue),
      })),
    };
  }
}

export const storage = new DatabaseStorage();
