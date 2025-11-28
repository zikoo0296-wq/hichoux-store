/**
 * =============================================
 * HICHOUX STORE - Supabase Client
 * =============================================
 * Client Supabase partagé entre frontend et admin
 * =============================================
 */

class SupabaseClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    /**
     * Initialize Supabase client
     */
    init() {
        if (!CONFIG.isSupabaseConfigured()) {
            console.warn('Supabase not configured. Running in demo mode.');
            return false;
        }

        try {
            this.client = supabase.createClient(
                CONFIG.SUPABASE_URL,
                CONFIG.SUPABASE_ANON_KEY
            );
            this.isConnected = true;
            console.log('✅ Supabase connected');
            return true;
        } catch (error) {
            console.error('❌ Supabase connection error:', error);
            return false;
        }
    }

    /**
     * Check if connected
     */
    isReady() {
        return this.isConnected && this.client !== null;
    }

    // =========================================
    // PRODUCTS
    // =========================================

    async getProducts(options = {}) {
        if (!this.isReady()) return { data: [], error: 'Not connected' };

        let query = this.client
            .from('products')
            .select('*, category:categories(id, name, slug)')
            .eq('is_active', true);

        if (options.featured) {
            query = query.eq('is_featured', true);
        }

        if (options.category) {
            query = query.eq('category_id', options.category);
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        query = query.order('created_at', { ascending: false });

        return await query;
    }

    async getProductBySlug(slug) {
        if (!this.isReady()) return { data: null, error: 'Not connected' };

        return await this.client
            .from('products')
            .select('*, category:categories(id, name, slug)')
            .eq('slug', slug)
            .single();
    }

    async getProductById(id) {
        if (!this.isReady()) return { data: null, error: 'Not connected' };

        return await this.client
            .from('products')
            .select('*, category:categories(id, name, slug)')
            .eq('id', id)
            .single();
    }

    async createProduct(product) {
        if (!this.isReady()) return { data: null, error: 'Not connected' };

        return await this.client
            .from('products')
            .insert(product)
            .select()
            .single();
    }

    async updateProduct(id, updates) {
        if (!this.isReady()) return { data: null, error: 'Not connected' };

        return await this.client
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
    }

    async deleteProduct(id) {
        if (!this.isReady()) return { data: null, error: 'Not connected' };

        return await this.client
            .from('products')
            .update({ is_active: false })
            .eq('id', id);
    }

    // =========================================
    // CATEGORIES
    // =========================================

    async getCategories() {
        if (!this.isReady()) return { data: [], error: 'Not connected' };

        return await this.client
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order');
    }

    // =========================================
    // ORDERS
    // =========================================

    async getOrders(options = {}) {
        if (!this.isReady()) return { data: [], error: 'Not connected' };

        let query = this.client
            .from('orders')
            .select('*, order_items(*), shipments(*)');

        if (options.status) {
            query = query.eq('status', options.status);
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        query = query.order('created_at', { ascending: false });

        return await query;
    }

    async getOrderById(id) {
        if (!this.isReady()) return { data: null, error: 'Not connected' };

        return await this.client
            .from('orders')
            .select('*, order_items(*), shipments(*), order_history(*)')
            .eq('id', id)
            .single();
    }

    async getOrderByNumber(orderNumber) {
        if (!this.isReady()) return { data: null, error: 'Not connected' };

        return await this.client
            .from('orders')
            .select('*, order_items(*), shipments(*)')
            .eq('order_number', orderNumber)
            .single();
    }

    async getOrderByPhone(phone) {
        if (!this.isReady()) return { data: [], error: 'Not connected' };

        return await this.client
            .from('orders')
            .select('*, order_items(*), shipments(*)')
            .eq('customer_phone', phone)
            .order('created_at', { ascending: false });
    }

    async createOrder(orderData, items) {
        if (!this.isReady()) return { data: null, error: 'Not connected' };

        // First create or update customer
        const { data: customer } = await this.client
            .from('customers')
            .upsert({
                phone: orderData.customer_phone,
                name: orderData.customer_name,
                email: orderData.customer_email,
                address: orderData.shipping_address,
                city: orderData.shipping_city
            }, { onConflict: 'phone' })
            .select()
            .single();

        // Create order
        const { data: order, error: orderError } = await this.client
            .from('orders')
            .insert({
                ...orderData,
                customer_id: customer?.id
            })
            .select()
            .single();

        if (orderError) return { data: null, error: orderError };

        // Create order items
        const orderItems = items.map(item => ({
            order_id: order.id,
            product_id: item.product_id,
            product_sku: item.product_sku,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
        }));

        await this.client.from('order_items').insert(orderItems);

        // Add to order history
        await this.addOrderHistory(order.id, 'new', 'Commande créée');

        return { data: order, error: null };
    }

    async updateOrderStatus(id, status, note = '', userId = null) {
        if (!this.isReady()) return { data: null, error: 'Not connected' };

        const updates = { status };

        if (status === 'confirmed') {
            updates.confirmed_at = new Date().toISOString();
            updates.confirmed_by = userId;
        } else if (status === 'shipped') {
            updates.shipped_at = new Date().toISOString();
        } else if (status === 'delivered') {
            updates.delivered_at = new Date().toISOString();
        } else if (status === 'cancelled') {
            updates.cancelled_at = new Date().toISOString();
            updates.cancelled_reason = note;
        }

        const { data, error } = await this.client
            .from('orders')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (!error) {
            await this.addOrderHistory(id, status, note);
        }

        return { data, error };
    }

    async addOrderHistory(orderId, status, note = '', userName = 'System') {
        if (!this.isReady()) return;

        return await this.client
            .from('order_history')
            .insert({
                order_id: orderId,
                status: status,
                note: note,
                changed_by_name: userName
            });
    }

    // =========================================
    // SHIPMENTS
    // =========================================

    async createShipment(shipmentData) {
        if (!this.isReady()) return { data: null, error: 'Not connected' };

        return await this.client
            .from('shipments')
            .insert(shipmentData)
            .select()
            .single();
    }

    async updateShipment(id, updates) {
        if (!this.isReady()) return { data: null, error: 'Not connected' };

        return await this.client
            .from('shipments')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
    }

    // =========================================
    // SHIPPING LABELS
    // =========================================

    async getShippingLabels() {
        if (!this.isReady()) return { data: [], error: 'Not connected' };

        return await this.client
            .from('shipping_labels')
            .select('*, shipping_label_items(*, order:orders(*))')
            .order('created_at', { ascending: false });
    }

    async createShippingLabel(labelData, orderIds) {
        if (!this.isReady()) return { data: null, error: 'Not connected' };

        const { data: label, error } = await this.client
            .from('shipping_labels')
            .insert(labelData)
            .select()
            .single();

        if (error) return { data: null, error };

        // Add label items
        const items = orderIds.map(orderId => ({
            label_id: label.id,
            order_id: orderId
        }));

        await this.client.from('shipping_label_items').insert(items);

        return { data: label, error: null };
    }

    // =========================================
    // CUSTOMERS
    // =========================================

    async getCustomers() {
        if (!this.isReady()) return { data: [], error: 'Not connected' };

        return await this.client
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });
    }

    async getCustomerByPhone(phone) {
        if (!this.isReady()) return { data: null, error: 'Not connected' };

        return await this.client
            .from('customers')
            .select('*')
            .eq('phone', phone)
            .single();
    }

    // =========================================
    // SETTINGS
    // =========================================

    async getSettings() {
        if (!this.isReady()) return { data: [], error: 'Not connected' };

        return await this.client
            .from('settings')
            .select('*');
    }

    async updateSetting(key, value) {
        if (!this.isReady()) return { data: null, error: 'Not connected' };

        return await this.client
            .from('settings')
            .upsert({ key, value }, { onConflict: 'key' })
            .select()
            .single();
    }

    // =========================================
    // STATS
    // =========================================

    async getDashboardStats() {
        if (!this.isReady()) {
            return {
                new: 0,
                confirmed: 0,
                shipped: 0,
                delivered: 0,
                cancelled: 0,
                revenue: 0,
                todayOrders: 0,
                todayRevenue: 0
            };
        }

        const { data: orders } = await this.client
            .from('orders')
            .select('status, total, created_at');

        const today = new Date().toISOString().split('T')[0];

        return {
            new: orders?.filter(o => o.status === 'new').length || 0,
            confirmed: orders?.filter(o => o.status === 'confirmed').length || 0,
            shipped: orders?.filter(o => o.status === 'shipped').length || 0,
            delivered: orders?.filter(o => o.status === 'delivered').length || 0,
            cancelled: orders?.filter(o => o.status === 'cancelled').length || 0,
            revenue: orders?.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.total || 0), 0) || 0,
            todayOrders: orders?.filter(o => o.created_at?.startsWith(today)).length || 0,
            todayRevenue: orders?.filter(o => o.created_at?.startsWith(today) && o.status === 'delivered').reduce((s, o) => s + (o.total || 0), 0) || 0
        };
    }

    // =========================================
    // REALTIME
    // =========================================

    subscribeToOrders(callback) {
        if (!this.isReady()) return null;

        return this.client
            .channel('orders-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders'
            }, payload => {
                callback(payload);
            })
            .subscribe();
    }

    unsubscribe(subscription) {
        if (subscription) {
            this.client.removeChannel(subscription);
        }
    }
}

// Create global instance
const db = new SupabaseClient();
