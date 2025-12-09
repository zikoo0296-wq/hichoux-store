import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { z } from "zod";

// User roles enum
export const USER_ROLES = [
  "super_admin",  // Full access - can manage users, settings, everything
  "admin",        // Can manage products, orders, categories
  "operator",     // Can view and update order statuses
  "support",      // Read-only access
] as const;

export type UserRole = (typeof USER_ROLES)[number];

// Admin users table
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Categories table
export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  image: text("image"),
  parentId: integer("parent_id"),
});

// Products table
export const products = pgTable("products", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  sku: text("sku").unique(),
  images: text("images")
    .array()
    .default(sql`ARRAY[]::text[]`),
  categoryId: integer("category_id").references(() => categories.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Order status enum values
export const ORDER_STATUSES = [
  "NOUVELLE",
  "EN_ATTENTE",
  "CONFIRMEE",
  "ANNULEE",
  "INJOIGNABLE",
  "ENVOYEE",
  "LIVREE",
  "RETOURNEE",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Carrier enum
export const CARRIERS = [
  "DIGYLOG",
  "OZON",
  "CATHEDIS", 
  "SENDIT",
] as const;

export type Carrier = (typeof CARRIERS)[number];

// Orders table
export const orders = pgTable("orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  externalId: text("external_id"),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  notes: text("notes"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  deliveryCost: decimal("delivery_cost", { precision: 10, scale: 2 }).default("0"),
  status: text("status").notNull().default("NOUVELLE"),
  carrier: text("carrier"),
  trackingNumber: text("tracking_number"),
  carrierStatus: text("carrier_status"),
  syncedToSheets: boolean("synced_to_sheets").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
});

// Shipping labels table
export const shippingLabels = pgTable("shipping_labels", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  labelUrl: text("label_url"),
  pdfBase64: text("pdf_base64"),
  providerName: text("provider_name"),
  trackingNumber: text("tracking_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sync logs table
export const syncLogs = pgTable("sync_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").references(() => orders.id),
  action: text("action").notNull(),
  result: text("result").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Ad costs table for profit calculation
export const adCosts = pgTable("ad_costs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Settings table for carrier API and other configs
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({}) => ({}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  shippingLabel: one(shippingLabels, {
    fields: [orders.id],
    references: [shippingLabels.orderId],
  }),
  syncLogs: many(syncLogs),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const shippingLabelsRelations = relations(shippingLabels, ({ one }) => ({
  order: one(orders, {
    fields: [shippingLabels.orderId],
    references: [orders.id],
  }),
}));

export const syncLogsRelations = relations(syncLogs, ({ one }) => ({
  order: one(orders, {
    fields: [syncLogs.orderId],
    references: [orders.id],
  }),
}));

// Insert schemas - using pure Zod to avoid drizzle-zod type bugs
export const insertUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string().default("admin"),
});

export const insertCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  image: z.string().nullable().optional(),
});

export const insertProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable().optional(),
  price: z.string(),
  compareAtPrice: z.string().nullable().optional(),
  costPrice: z.string().nullable().optional(),
  images: z.array(z.string()).default([]),
  stock: z.number().int().default(0),
  categoryId: z.number().int().nullable().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export const insertOrderSchema = z.object({
  customerName: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  notes: z.string().nullable().optional(),
  totalPrice: z.string(),
  deliveryCost: z.string().default("0"),
});

export const insertOrderItemSchema = z.object({
  orderId: z.number().int(),
  productId: z.number().int(),
  quantity: z.number().int().min(1),
  unitPrice: z.string(),
  unitCost: z.string().nullable().optional(),
});

export const insertShippingLabelSchema = z.object({
  orderId: z.number().int(),
  trackingNumber: z.string().nullable().optional(),
  providerName: z.string().nullable().optional(),
  labelUrl: z.string().nullable().optional(),
  pdfBase64: z.string().nullable().optional(),
});

export const insertSyncLogSchema = z.object({
  orderId: z.number().int(),
  action: z.string(),
  result: z.string(),
  details: z.string().nullable().optional(),
});

export const insertAdCostSchema = z.object({
  date: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
  description: z.string().nullable().optional(),
  amount: z.string(),
});

export const insertSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  description: z.string().nullable().optional(),
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

export type ShippingLabel = typeof shippingLabels.$inferSelect;
export type InsertShippingLabel = z.infer<typeof insertShippingLabelSchema>;

export type SyncLog = typeof syncLogs.$inferSelect;
export type InsertSyncLog = z.infer<typeof insertSyncLogSchema>;

export type AdCost = typeof adCosts.$inferSelect;
export type InsertAdCost = z.infer<typeof insertAdCostSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

// Extended types with relations
export type OrderWithItems = Order & {
  items: (OrderItem & { product: Product })[];
  shippingLabel?: ShippingLabel | null;
};

export type ProductWithCategory = Product & {
  category?: Category | null;
};

// Form schemas for frontend validation
export const orderFormSchema = z.object({
  customerName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z.string().min(8, "Le numéro de téléphone est invalide"),
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  city: z.string().min(2, "La ville est requise"),
  notes: z.string().optional(),
  deliveryCost: z.number().optional(),
  items: z
    .array(
      z.object({
        productId: z.number(),
        quantity: z.number().min(1),
      }),
    )
    .min(1, "Au moins un produit est requis"),
});

export type OrderFormData = z.infer<typeof orderFormSchema>;

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export type LoginData = z.infer<typeof loginSchema>;
