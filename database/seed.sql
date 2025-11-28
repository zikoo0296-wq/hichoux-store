-- =============================================
-- HICHOUX STORE - Seed Data
-- =============================================
-- Données d'exemple pour démarrer
-- Exécuter après schema.sql
-- =============================================

-- Categories
INSERT INTO categories (name, slug, description, sort_order) VALUES
('Homme', 'homme', 'Parfums pour homme', 1),
('Femme', 'femme', 'Parfums pour femme', 2),
('Unisexe', 'unisexe', 'Parfums unisexe', 3),
('Cosmétique', 'cosmetique', 'Produits cosmétiques', 4);

-- Products
INSERT INTO products (sku, name, slug, description, price, compare_price, cost_price, stock, category_id, is_featured, images) VALUES
('PARFUM-001', 'Parfum Royal Oud', 'parfum-royal-oud', 
 'Un parfum oriental riche et envoûtant avec des notes de oud et de rose. Idéal pour les occasions spéciales.',
 150, 199, 45, 45,
 (SELECT id FROM categories WHERE slug = 'homme'),
 true,
 ARRAY['https://via.placeholder.com/400x400/1a1a1a/D4AF37?text=Royal+Oud']),

('PARFUM-002', 'Essence de Rose', 'essence-de-rose',
 'Un parfum floral délicat avec des notes de rose fraîche et de jasmin. Parfait pour le quotidien.',
 200, 250, 60, 32,
 (SELECT id FROM categories WHERE slug = 'femme'),
 true,
 ARRAY['https://via.placeholder.com/400x400/1a1a1a/D4AF37?text=Essence+Rose']),

('PARFUM-003', 'Amber Nights', 'amber-nights',
 'Un parfum chaud et sensuel avec des notes d''ambre et de vanille. Longue tenue garantie.',
 120, 150, 35, 28,
 (SELECT id FROM categories WHERE slug = 'unisexe'),
 true,
 ARRAY['https://via.placeholder.com/400x400/1a1a1a/D4AF37?text=Amber+Nights']),

('PARFUM-004', 'Musk Premium', 'musk-premium',
 'Un parfum musqué élégant et raffiné. Notes de musc blanc et bois de santal.',
 180, 220, 55, 15,
 (SELECT id FROM categories WHERE slug = 'homme'),
 false,
 ARRAY['https://via.placeholder.com/400x400/1a1a1a/D4AF37?text=Musk+Premium']),

('PARFUM-005', 'Jasmin Oriental', 'jasmin-oriental',
 'Parfum floral oriental avec jasmin, tubéreuse et notes épicées.',
 160, 200, 48, 20,
 (SELECT id FROM categories WHERE slug = 'femme'),
 false,
 ARRAY['https://via.placeholder.com/400x400/1a1a1a/D4AF37?text=Jasmin+Oriental']),

('COSM-001', 'Crème Hydratante', 'creme-hydratante',
 'Crème hydratante à l''huile d''argan. Hydratation intense 24h.',
 89, 120, 25, 60,
 (SELECT id FROM categories WHERE slug = 'cosmetique'),
 false,
 ARRAY['https://via.placeholder.com/400x400/1a1a1a/D4AF37?text=Creme']),

('COSM-002', 'Sérum Anti-âge', 'serum-anti-age',
 'Sérum anti-âge à l''acide hyaluronique. Réduit les rides visiblement.',
 250, 300, 75, 25,
 (SELECT id FROM categories WHERE slug = 'cosmetique'),
 true,
 ARRAY['https://via.placeholder.com/400x400/1a1a1a/D4AF37?text=Serum']);

-- Settings
INSERT INTO settings (key, value, group_name) VALUES
('store_name', 'Hichoux Store', 'general'),
('store_phone', '0600000000', 'general'),
('store_email', 'contact@hichouxstore.ma', 'general'),
('store_address', 'Casablanca, Maroc', 'general'),
('currency', 'MAD', 'general'),
('currency_symbol', 'DH', 'general'),
('default_shipping_cost', '30', 'shipping'),
('free_shipping_threshold', '500', 'shipping'),
('fulfillment_fees', '5', 'shipping'),
('whatsapp_number', '212600000000', 'contact'),
('google_sheet_id', '1qKkOSPisPkqUQEkH-stKoUaEo1d9e63pVcV1iU9yvHw', 'integrations');

-- Carrier Settings
INSERT INTO carrier_settings (carrier_name, api_url, is_active, settings) VALUES
('digylog', 'https://api.digylog.com/v2', true, '{"tracking_url": "https://www.digylog.com/suivi-de-colis/?tracking="}'),
('ozone', 'https://api.ozoneexpress.ma', false, '{"tracking_url": "https://client.ozoneexpress.ma/tracking/"}'),
('sendit', 'https://api.sendit.ma', false, '{"tracking_url": "https://sendit.ma/tracking/"}');

-- Shipping Rates
INSERT INTO shipping_rates (carrier, city, zone, rate, delivery_days) VALUES
('digylog', 'Casablanca', 'zone1', 25, 1),
('digylog', 'Rabat', 'zone1', 30, 1),
('digylog', 'Mohammedia', 'zone1', 30, 1),
('digylog', 'Marrakech', 'zone2', 35, 2),
('digylog', 'Agadir', 'zone2', 35, 2),
('digylog', 'Fès', 'zone2', 35, 2),
('digylog', 'Tanger', 'zone2', 35, 2),
('digylog', 'Meknès', 'zone2', 35, 2),
('digylog', 'Oujda', 'zone3', 40, 3),
('digylog', 'Tétouan', 'zone3', 40, 2),
('digylog', 'Autres', 'zone3', 45, 3);

-- Sample Team Member (Admin)
INSERT INTO team_members (email, name, phone, role) VALUES
('admin@hichouxstore.ma', 'Admin', '0600000000', 'admin');

-- Sample Customers
INSERT INTO customers (name, phone, email, address, city) VALUES
('Ahmed Benali', '0661234567', 'ahmed@email.com', 'Rue Hassan II, N°45', 'Casablanca'),
('Fatima Zahra', '0677889900', 'fatima@email.com', 'Avenue Mohammed V, Appt 12', 'Rabat'),
('Youssef Alami', '0655443322', 'youssef@email.com', 'Quartier Gueliz', 'Marrakech');

-- Sample Orders (for testing)
INSERT INTO orders (order_number, customer_id, customer_name, customer_phone, shipping_address, shipping_city, status, subtotal, shipping_cost, total, payment_method, source) VALUES
('HCX2511270001', 
 (SELECT id FROM customers WHERE phone = '0661234567'),
 'Ahmed Benali', '0661234567', 'Rue Hassan II, N°45', 'Casablanca',
 'new', 300, 0, 300, 'cod', 'website'),
 
('HCX2511270002',
 (SELECT id FROM customers WHERE phone = '0677889900'),
 'Fatima Zahra', '0677889900', 'Avenue Mohammed V, Appt 12', 'Rabat',
 'new', 200, 30, 230, 'cod', 'website'),

('HCX2511270003',
 (SELECT id FROM customers WHERE phone = '0655443322'),
 'Youssef Alami', '0655443322', 'Quartier Gueliz', 'Marrakech',
 'confirmed', 360, 35, 395, 'cod', 'website');

-- Sample Order Items
INSERT INTO order_items (order_id, product_id, product_sku, product_name, quantity, unit_price, total_price)
SELECT 
    o.id,
    p.id,
    p.sku,
    p.name,
    2,
    p.price,
    p.price * 2
FROM orders o, products p
WHERE o.order_number = 'HCX2511270001' AND p.sku = 'PARFUM-001';

INSERT INTO order_items (order_id, product_id, product_sku, product_name, quantity, unit_price, total_price)
SELECT 
    o.id,
    p.id,
    p.sku,
    p.name,
    1,
    p.price,
    p.price
FROM orders o, products p
WHERE o.order_number = 'HCX2511270002' AND p.sku = 'PARFUM-002';

INSERT INTO order_items (order_id, product_id, product_sku, product_name, quantity, unit_price, total_price)
SELECT 
    o.id,
    p.id,
    p.sku,
    p.name,
    3,
    p.price,
    p.price * 3
FROM orders o, products p
WHERE o.order_number = 'HCX2511270003' AND p.sku = 'PARFUM-003';

-- Order History
INSERT INTO order_history (order_id, status, note, changed_by_name)
SELECT id, 'new', 'Commande créée', 'System'
FROM orders;

INSERT INTO order_history (order_id, status, note, changed_by_name)
SELECT id, 'confirmed', 'Confirmé par admin', 'Admin'
FROM orders WHERE status = 'confirmed';

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify data was inserted
-- SELECT 'Categories' as table_name, COUNT(*) as count FROM categories
-- UNION ALL SELECT 'Products', COUNT(*) FROM products
-- UNION ALL SELECT 'Customers', COUNT(*) FROM customers
-- UNION ALL SELECT 'Orders', COUNT(*) FROM orders
-- UNION ALL SELECT 'Order Items', COUNT(*) FROM order_items
-- UNION ALL SELECT 'Settings', COUNT(*) FROM settings;
