-- =============================================
-- HICHOUX STORE - Database Schema (Supabase)
-- =============================================
-- 1. Va sur https://supabase.com et crée un projet
-- 2. Va dans SQL Editor
-- 3. Colle ce code et exécute-le
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Categories table
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    compare_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    stock INTEGER DEFAULT 0,
    low_stock_alert INTEGER DEFAULT 10,
    category_id UUID REFERENCES categories(id),
    images TEXT[], -- Array of image URLs
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    weight DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    is_blacklisted BOOLEAN DEFAULT false,
    blacklist_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on phone
CREATE UNIQUE INDEX idx_customers_phone ON customers(phone);

-- Orders table
CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100) NOT NULL,
    shipping_postal_code VARCHAR(20),
    status VARCHAR(50) DEFAULT 'new',
    subtotal DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cod',
    payment_status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    internal_notes TEXT,
    source VARCHAR(50) DEFAULT 'website',
    ip_address VARCHAR(50),
    user_agent TEXT,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    confirmed_by UUID,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_sku VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order history (status changes)
CREATE TABLE order_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    note TEXT,
    changed_by UUID,
    changed_by_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Confirmation attempts
CREATE TABLE confirmation_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID,
    user_name VARCHAR(255),
    attempt_type VARCHAR(50) NOT NULL, -- 'call', 'whatsapp', 'sms'
    result VARCHAR(50), -- 'answered', 'no_answer', 'busy', 'invalid'
    duration INTEGER, -- in seconds
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipments table
CREATE TABLE shipments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    carrier VARCHAR(50) NOT NULL, -- 'digylog', 'ozone', 'sendit'
    tracking_number VARCHAR(100),
    label_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    status_details TEXT,
    shipping_cost DECIMAL(10,2),
    weight DECIMAL(10,2),
    error_message TEXT,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipping labels (bordereaux)
CREATE TABLE shipping_labels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    label_number VARCHAR(50) UNIQUE NOT NULL,
    carrier VARCHAR(50) NOT NULL,
    orders_count INTEGER DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
    payment_status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'paid'
    paid_at TIMESTAMP WITH TIME ZONE,
    paid_amount DECIMAL(10,2),
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipping label items
CREATE TABLE shipping_label_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    label_id UUID REFERENCES shipping_labels(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    shipment_id UUID REFERENCES shipments(id),
    tracking_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members (users)
CREATE TABLE team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    auth_user_id UUID UNIQUE, -- Link to Supabase Auth
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'viewer', -- 'admin', 'manager', 'confirmator', 'viewer'
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table
CREATE TABLE settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    group_name VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Carrier settings
CREATE TABLE carrier_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    carrier_name VARCHAR(50) UNIQUE NOT NULL,
    api_key TEXT,
    api_secret TEXT,
    api_url TEXT,
    is_active BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipping rates
CREATE TABLE shipping_rates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    carrier VARCHAR(50) NOT NULL,
    city VARCHAR(100) NOT NULL,
    zone VARCHAR(50),
    rate DECIMAL(10,2) NOT NULL,
    delivery_days INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity log
CREATE TABLE activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID,
    user_name VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_tracking ON shipments(tracking_number);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'HCX' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(NEXTVAL('order_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_seq START 1;

-- Trigger for order number
CREATE TRIGGER set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_order_number();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_shipping_labels_updated_at BEFORE UPDATE ON shipping_labels FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_carrier_settings_updated_at BEFORE UPDATE ON carrier_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update customer stats after order
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE customers 
        SET total_orders = total_orders + 1,
            total_spent = total_spent + NEW.total
        WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_stats_trigger
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_stats();

-- Update product stock after order
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products 
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stock_trigger
    AFTER INSERT ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_product_stock();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE confirmation_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_label_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrier_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Public read access for products and categories (for frontend)
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public read products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Public read shipping_rates" ON shipping_rates FOR SELECT USING (is_active = true);

-- Public insert for orders (customers can place orders)
CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert customers" ON customers FOR INSERT WITH CHECK (true);

-- Authenticated users (admin) can do everything
CREATE POLICY "Admin full access categories" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access products" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access customers" ON customers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access orders" ON orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access order_items" ON order_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access order_history" ON order_history FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access confirmation_attempts" ON confirmation_attempts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access shipments" ON shipments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access shipping_labels" ON shipping_labels FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access shipping_label_items" ON shipping_label_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access team_members" ON team_members FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access settings" ON settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access carrier_settings" ON carrier_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access shipping_rates" ON shipping_rates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access activity_log" ON activity_log FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert categories
INSERT INTO categories (name, slug, description, sort_order) VALUES
('Homme', 'homme', 'Parfums pour homme', 1),
('Femme', 'femme', 'Parfums pour femme', 2),
('Unisexe', 'unisexe', 'Parfums unisexes', 3),
('Cosmétique', 'cosmetique', 'Produits cosmétiques', 4);

-- Insert products
INSERT INTO products (sku, name, slug, description, price, compare_price, stock, category_id, is_featured) VALUES
('PARFUM-001', 'Parfum Royal Oud', 'parfum-royal-oud', 'Un parfum oriental riche et envoûtant avec des notes de oud et de rose.', 150, 199, 45, (SELECT id FROM categories WHERE slug = 'homme'), true),
('PARFUM-002', 'Essence de Rose', 'essence-de-rose', 'Un parfum floral délicat avec des notes de rose fraîche et de jasmin.', 200, 250, 32, (SELECT id FROM categories WHERE slug = 'femme'), true),
('PARFUM-003', 'Amber Nights', 'amber-nights', 'Un parfum chaud et sensuel avec des notes d''ambre et de vanille.', 120, 150, 28, (SELECT id FROM categories WHERE slug = 'unisexe'), true),
('PARFUM-004', 'Musk Premium', 'musk-premium', 'Un parfum musqué élégant et raffiné pour homme.', 180, 220, 15, (SELECT id FROM categories WHERE slug = 'homme'), false),
('COSM-001', 'Crème Hydratante', 'creme-hydratante', 'Crème hydratante pour le visage à l''huile d''argan.', 89, 120, 60, (SELECT id FROM categories WHERE slug = 'cosmetique'), false),
('COSM-002', 'Sérum Anti-âge', 'serum-anti-age', 'Sérum anti-âge à l''acide hyaluronique.', 250, 300, 25, (SELECT id FROM categories WHERE slug = 'cosmetique'), true);

-- Insert default settings
INSERT INTO settings (key, value, group_name) VALUES
('store_name', 'Hichoux Store', 'general'),
('store_phone', '0600000000', 'general'),
('store_email', 'contact@hichouxstore.ma', 'general'),
('store_address', 'Casablanca, Maroc', 'general'),
('currency', 'MAD', 'general'),
('default_shipping_cost', '30', 'shipping'),
('free_shipping_threshold', '500', 'shipping'),
('google_sheet_id', '1qKkOSPisPkqUQEkH-stKoUaEo1d9e63pVcV1iU9yvHw', 'integrations'),
('whatsapp_number', '212600000000', 'general');

-- Insert carrier settings
INSERT INTO carrier_settings (carrier_name, api_url, is_active) VALUES
('digylog', 'https://api.digylog.com/v2', true),
('ozone', 'https://api.ozonexpress.ma', false),
('sendit', 'https://api.sendit.ma', false);

-- Insert shipping rates (sample)
INSERT INTO shipping_rates (carrier, city, zone, rate, delivery_days) VALUES
('digylog', 'Casablanca', 'Zone 1', 25, 1),
('digylog', 'Rabat', 'Zone 1', 30, 1),
('digylog', 'Marrakech', 'Zone 2', 35, 2),
('digylog', 'Agadir', 'Zone 2', 35, 2),
('digylog', 'Fès', 'Zone 2', 35, 2),
('digylog', 'Tanger', 'Zone 2', 35, 2),
('digylog', 'Autres', 'Zone 3', 45, 3);

-- Insert default admin user
INSERT INTO team_members (email, name, role) VALUES
('admin@hichouxstore.ma', 'Admin', 'admin');

-- =============================================
-- VIEWS
-- =============================================

-- Orders with details view
CREATE OR REPLACE VIEW orders_view AS
SELECT 
    o.*,
    c.name as category_name,
    (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count,
    (SELECT string_agg(product_name || ' x' || quantity, ', ') FROM order_items WHERE order_id = o.id) as items_summary
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id;

-- Dashboard stats view
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM orders WHERE status = 'new') as new_orders,
    (SELECT COUNT(*) FROM orders WHERE status = 'confirmed') as confirmed_orders,
    (SELECT COUNT(*) FROM orders WHERE status = 'shipped') as shipped_orders,
    (SELECT COUNT(*) FROM orders WHERE status = 'delivered') as delivered_orders,
    (SELECT COUNT(*) FROM orders WHERE status = 'cancelled') as cancelled_orders,
    (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status = 'delivered') as total_revenue,
    (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE) as today_orders,
    (SELECT COALESCE(SUM(total), 0) FROM orders WHERE DATE(created_at) = CURRENT_DATE) as today_revenue;

-- =============================================
-- DONE!
-- =============================================
-- Maintenant tu peux copier l'URL et les clés API de Supabase
-- et les utiliser dans le frontend et backend
