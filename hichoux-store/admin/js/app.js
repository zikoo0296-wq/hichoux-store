/**
 * =============================================
 * HICHOUX STORE - Admin Application
 * =============================================
 */

// =============================================
// STATE
// =============================================
let orders = [];
let products = [];
let shippingLabels = [];
let realtimeSubscription = null;

// Demo data
const demoOrders = [
    { id: '1', order_number: 'HCX001234', customer_name: 'Ahmed Benali', customer_phone: '0661234567', shipping_address: 'Rue Hassan II, N°45', shipping_city: 'Casablanca', total: 300, status: 'new', created_at: '2025-11-27T10:00:00', order_items: [{ product_name: 'Parfum Royal Oud', quantity: 2, unit_price: 150 }] },
    { id: '2', order_number: 'HCX001235', customer_name: 'Fatima Zahra', customer_phone: '0677889900', shipping_address: 'Avenue Mohammed V, Appt 12', shipping_city: 'Rabat', total: 200, status: 'new', created_at: '2025-11-27T11:00:00', order_items: [{ product_name: 'Essence de Rose', quantity: 1, unit_price: 200 }] },
    { id: '3', order_number: 'HCX001236', customer_name: 'Youssef Alami', customer_phone: '0655443322', shipping_address: 'Quartier Gueliz', shipping_city: 'Marrakech', total: 360, status: 'new', notes: 'Client VIP', created_at: '2025-11-27T09:00:00', order_items: [{ product_name: 'Amber Nights', quantity: 3, unit_price: 120 }] },
    { id: '4', order_number: 'HCX001237', customer_name: 'Khadija Mansouri', customer_phone: '0688776655', shipping_address: 'Hay Mohammadi', shipping_city: 'Agadir', total: 150, status: 'confirmed', created_at: '2025-11-26T14:00:00', order_items: [{ product_name: 'Parfum Royal Oud', quantity: 1, unit_price: 150 }] },
    { id: '5', order_number: 'HCX001238', customer_name: 'Omar Tazi', customer_phone: '0699887766', shipping_address: 'Centre ville', shipping_city: 'Fès', total: 360, status: 'confirmed', created_at: '2025-11-26T10:00:00', order_items: [{ product_name: 'Musk Premium', quantity: 2, unit_price: 180 }] },
    { id: '6', order_number: 'HCX001239', customer_name: 'Sara Bennani', customer_phone: '0612345678', shipping_address: 'Hay Riad', shipping_city: 'Rabat', total: 200, status: 'shipped', tracking_number: 'S2AD5795M', created_at: '2025-11-25T10:00:00', order_items: [{ product_name: 'Essence de Rose', quantity: 1, unit_price: 200 }] },
    { id: '7', order_number: 'HCX001240', customer_name: 'Mohammed Idrissi', customer_phone: '0633221100', shipping_address: 'Zone Industrielle', shipping_city: 'Tanger', total: 240, status: 'delivered', tracking_number: 'S6AA79F4A', created_at: '2025-11-24T10:00:00', order_items: [{ product_name: 'Amber Nights', quantity: 2, unit_price: 120 }] },
];

const demoProducts = [
    { id: '1', sku: 'PARFUM-001', name: 'Parfum Royal Oud', price: 150, stock: 45, category: { name: 'Homme' } },
    { id: '2', sku: 'PARFUM-002', name: 'Essence de Rose', price: 200, stock: 32, category: { name: 'Femme' } },
    { id: '3', sku: 'PARFUM-003', name: 'Amber Nights', price: 120, stock: 28, category: { name: 'Unisexe' } },
    { id: '4', sku: 'PARFUM-004', name: 'Musk Premium', price: 180, stock: 15, category: { name: 'Homme' } },
    { id: '5', sku: 'COSM-001', name: 'Crème Hydratante', price: 89, stock: 60, category: { name: 'Cosmétique' } },
    { id: '6', sku: 'COSM-002', name: 'Sérum Anti-âge', price: 250, stock: 25, category: { name: 'Cosmétique' } },
];

const demoLabels = [
    { id: '1', label_number: 'BL682045', carrier: 'digylog', orders_count: 4, total_amount: 1200, status: 'completed', payment_status: 'unpaid' },
    { id: '2', label_number: 'BL682007', carrier: 'digylog', orders_count: 6, total_amount: 1800, status: 'completed', payment_status: 'paid' },
];

// Navigation items
const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'orders', icon: '📦', label: 'Commandes', badge: () => orders.filter(o => o.status === 'new').length },
    { id: 'confirmation', icon: '📞', label: 'Confirmation', badge: () => orders.filter(o => o.status === 'new').length },
    { id: 'shipping', icon: '🏷️', label: 'Shipping Labels' },
    { id: 'products', icon: '🛍️', label: 'Produits' },
    { id: 'settings', icon: '⚙️', label: 'Paramètres' }
];

// =============================================
// INITIALIZATION
// =============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Hichoux Store Admin starting...');
    
    // Load saved config
    loadSavedConfig();
    
    // Check if config exists
    if (CONFIG.isSupabaseConfigured()) {
        document.getElementById('config-modal').classList.add('hidden');
        await initializeApp();
    }
});

async function initializeApp() {
    // Initialize Supabase
    const connected = db.init();
    
    if (connected) {
        document.getElementById('connection-status').innerHTML = '<span class="status-connected">● Connecté</span>';
        
        // Setup realtime
        setupRealtime();
    } else {
        document.getElementById('connection-status').innerHTML = '<span class="status-disconnected">● Mode Demo</span>';
    }
    
    // Render navigation
    renderNav();
    
    // Load data
    await loadData();
    
    // Update date
    updateDate();
    
    // Update UI
    updateUI();
    
    // Populate settings
    populateSettings();
    
    console.log('✅ Admin ready!');
}

function loadSavedConfig() {
    const savedUrl = localStorage.getItem('hichoux_supabase_url');
    const savedKey = localStorage.getItem('hichoux_supabase_key');
    const savedGas = localStorage.getItem('hichoux_gas_url');
    const savedToken = localStorage.getItem('hichoux_digylog_token');
    
    if (savedUrl) CONFIG.SUPABASE_URL = savedUrl;
    if (savedKey) CONFIG.SUPABASE_ANON_KEY = savedKey;
    if (savedGas) CONFIG.GOOGLE_SCRIPT_URL = savedGas;
    if (savedToken) CONFIG.DIGYLOG_TOKEN = savedToken;
    
    // Populate config form
    document.getElementById('config-url').value = savedUrl || '';
    document.getElementById('config-key').value = savedKey || '';
    document.getElementById('config-gas').value = savedGas || '';
}

function saveConfig() {
    const url = document.getElementById('config-url').value.trim();
    const key = document.getElementById('config-key').value.trim();
    const gas = document.getElementById('config-gas').value.trim();
    
    if (!url || !key) {
        showToast('URL et Anon Key sont requis', 'error');
        return;
    }
    
    // Save to localStorage
    localStorage.setItem('hichoux_supabase_url', url);
    localStorage.setItem('hichoux_supabase_key', key);
    if (gas) localStorage.setItem('hichoux_gas_url', gas);
    
    // Update CONFIG
    CONFIG.SUPABASE_URL = url;
    CONFIG.SUPABASE_ANON_KEY = key;
    CONFIG.GOOGLE_SCRIPT_URL = gas;
    
    // Hide modal and initialize
    document.getElementById('config-modal').classList.add('hidden');
    initializeApp();
    
    showToast('Configuration sauvegardée!');
}

function skipConfig() {
    document.getElementById('config-modal').classList.add('hidden');
    useDemoMode();
}

function useDemoMode() {
    document.getElementById('connection-status').innerHTML = '<span class="status-disconnected">● Mode Demo</span>';
    orders = [...demoOrders];
    products = [...demoProducts];
    shippingLabels = [...demoLabels];
    
    renderNav();
    updateDate();
    updateUI();
    populateSettings();
    
    showToast('Mode Demo activé', 'info');
}

function showConfigModal() {
    document.getElementById('config-modal').classList.remove('hidden');
}

// =============================================
// DATA LOADING
// =============================================
async function loadData() {
    if (db.isReady()) {
        showLoading('Chargement des données...');
        try {
            const [ordersRes, productsRes, labelsRes] = await Promise.all([
                db.getOrders(),
                db.getProducts(),
                db.getShippingLabels()
            ]);
            
            orders = ordersRes.data || [];
            products = productsRes.data || [];
            shippingLabels = labelsRes.data || [];
            
        } catch (error) {
            console.error('Load error:', error);
            showToast('Erreur de chargement', 'error');
        }
        hideLoading();
    } else {
        // Use demo data
        orders = [...demoOrders];
        products = [...demoProducts];
        shippingLabels = [...demoLabels];
    }
}

async function refreshOrders() {
    await loadData();
    updateUI();
    showToast('Données actualisées');
}

function setupRealtime() {
    if (!db.isReady() || !CONFIG.FEATURES.realtime_updates) return;
    
    realtimeSubscription = db.subscribeToOrders((payload) => {
        console.log('Realtime update:', payload);
        
        if (payload.eventType === 'INSERT') {
            orders.unshift(payload.new);
            showToast('Nouvelle commande reçue!', 'info');
        } else if (payload.eventType === 'UPDATE') {
            const index = orders.findIndex(o => o.id === payload.new.id);
            if (index !== -1) orders[index] = payload.new;
        } else if (payload.eventType === 'DELETE') {
            orders = orders.filter(o => o.id !== payload.old.id);
        }
        
        updateUI();
    });
}

// =============================================
// UI HELPERS
// =============================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const colors = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500', warning: 'bg-yellow-500' };
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    
    const toast = document.createElement('div');
    toast.className = `toast ${colors[type]} text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2`;
    toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showLoading(text = 'Chargement...') {
    document.getElementById('loading-text').textContent = text;
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

function updateDate() {
    const el = document.getElementById('current-date');
    if (el) {
        el.textContent = new Date().toLocaleDateString('fr-FR', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });
    }
}

function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// =============================================
// NAVIGATION
// =============================================
function renderNav() {
    const container = document.getElementById('nav-menu');
    if (!container) return;
    
    container.innerHTML = navItems.map(item => `
        <button onclick="showPage('${item.id}')" class="sidebar-item ${item.id === 'dashboard' ? 'active' : ''} w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium" data-page="${item.id}">
            <span class="flex items-center space-x-3"><span>${item.icon}</span><span>${item.label}</span></span>
            ${item.badge ? `<span class="nav-badge bg-red-500 text-white text-xs px-2 py-0.5 rounded-full" data-badge="${item.id}"></span>` : ''}
        </button>
    `).join('');
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sidebar-item').forEach(s => s.classList.remove('active'));
    
    const page = document.getElementById('page-' + pageId);
    const navBtn = document.querySelector(`[data-page="${pageId}"]`);
    
    if (page) page.classList.add('active');
    if (navBtn) navBtn.classList.add('active');

    // Page-specific rendering
    if (pageId === 'confirmation') renderConfirmation();
    if (pageId === 'orders') renderOrders();
    if (pageId === 'products') renderProducts();
    if (pageId === 'shipping') renderShipping();
    if (pageId === 'settings') populateSettings();
}

// =============================================
// UPDATE UI
// =============================================
function updateUI() {
    updateStats();
    renderRecentOrders();
    updateBadges();
}

function updateStats() {
    const stats = {
        new: orders.filter(o => o.status === 'new').length,
        confirmed: orders.filter(o => o.status === 'confirmed').length,
        shipped: orders.filter(o => o.status === 'shipped').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        revenue: orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.total || 0), 0)
    };

    const container = document.getElementById('stats-cards');
    if (!container) return;
    
    container.innerHTML = [
        { label: 'Nouvelles', value: stats.new, icon: '📥', color: 'bg-yellow-100 text-yellow-600', sub: 'En attente' },
        { label: 'Confirmées', value: stats.confirmed, icon: '✓', color: 'bg-blue-100 text-blue-600', sub: 'Prêtes' },
        { label: 'Expédiées', value: stats.shipped, icon: '🚚', color: 'bg-purple-100 text-purple-600', sub: 'En transit' },
        { label: 'Livrées', value: stats.delivered, icon: '✅', color: 'bg-green-100 text-green-600', sub: `${stats.revenue} ${CONFIG.CURRENCY}` }
    ].map(s => `
        <div class="stat-card bg-white rounded-2xl p-6 shadow-sm border">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-gray-500 text-sm">${s.label}</p>
                    <p class="text-3xl font-bold mt-1">${s.value}</p>
                    <p class="text-xs text-gray-400 mt-1">${s.sub}</p>
                </div>
                <div class="w-12 h-12 ${s.color} rounded-xl flex items-center justify-center text-xl">${s.icon}</div>
            </div>
        </div>
    `).join('');
}

function updateBadges() {
    navItems.forEach(item => {
        if (item.badge) {
            const count = item.badge();
            const el = document.querySelector(`[data-badge="${item.id}"]`);
            if (el) {
                el.textContent = count;
                el.style.display = count > 0 ? 'inline' : 'none';
            }
        }
    });
}

// =============================================
// ORDERS
// =============================================
function renderRecentOrders() {
    const container = document.getElementById('recent-orders-table');
    if (!container) return;
    
    container.innerHTML = orders.slice(0, 5).map(o => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">
                <p class="font-medium">${o.order_number || o.id}</p>
                <p class="text-xs text-gray-500">${formatDate(o.created_at)}</p>
            </td>
            <td class="px-6 py-4">${o.customer_name}</td>
            <td class="px-6 py-4">${o.shipping_city}</td>
            <td class="px-6 py-4 font-semibold">${o.total} ${CONFIG.CURRENCY}</td>
            <td class="px-6 py-4">${CONFIG.getStatusBadge(o.status)}</td>
            <td class="px-6 py-4">
                <button onclick="openOrderModal('${o.id}')" class="text-blue-600 hover:underline text-sm">Voir</button>
            </td>
        </tr>
    `).join('');
}

function renderOrders() {
    const search = document.getElementById('search-orders')?.value.toLowerCase() || '';
    const status = document.getElementById('filter-status')?.value || 'all';
    
    const filtered = orders.filter(o => {
        const matchSearch = !search || 
            o.customer_name?.toLowerCase().includes(search) || 
            o.customer_phone?.includes(search) || 
            o.order_number?.toLowerCase().includes(search);
        const matchStatus = status === 'all' || o.status === status;
        return matchSearch && matchStatus;
    });

    const container = document.getElementById('orders-table');
    if (!container) return;
    
    container.innerHTML = filtered.map(o => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">
                <p class="font-medium">${o.order_number || o.id}</p>
                <p class="text-xs text-gray-500">${formatDate(o.created_at)}</p>
            </td>
            <td class="px-6 py-4">${o.customer_name}</td>
            <td class="px-6 py-4">${o.customer_phone}</td>
            <td class="px-6 py-4">${o.shipping_city}</td>
            <td class="px-6 py-4 font-semibold">${o.total} ${CONFIG.CURRENCY}</td>
            <td class="px-6 py-4">${CONFIG.getStatusBadge(o.status)}</td>
            <td class="px-6 py-4 font-mono text-sm ${o.tracking_number ? 'text-blue-600' : 'text-gray-400'}">${o.tracking_number || '-'}</td>
            <td class="px-6 py-4">
                <button onclick="openOrderModal('${o.id}')" class="text-blue-600 hover:underline text-sm">Voir</button>
            </td>
        </tr>
    `).join('');
}

function filterOrders() {
    renderOrders();
}

// =============================================
// CONFIRMATION
// =============================================
function renderConfirmation() {
    const pending = orders.filter(o => o.status === 'new');
    updateElement('pending-count', `${pending.length} commandes en attente`);

    const listContainer = document.getElementById('confirmation-list');
    const emptyContainer = document.getElementById('all-confirmed');
    
    if (!listContainer || !emptyContainer) return;

    if (pending.length === 0) {
        listContainer.innerHTML = '';
        emptyContainer.classList.remove('hidden');
    } else {
        emptyContainer.classList.add('hidden');
        listContainer.innerHTML = pending.map(o => `
            <div class="order-card bg-white rounded-2xl p-6 shadow-sm border">
                <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div class="flex-1">
                        <div class="flex flex-wrap items-center gap-3 mb-4">
                            <span class="text-lg font-bold">${o.order_number || o.id}</span>
                            ${CONFIG.getStatusBadge(o.status)}
                            ${o.notes ? `<span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">${o.notes}</span>` : ''}
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                                <p class="text-xs text-gray-500">Client</p>
                                <p class="font-medium">${o.customer_name}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500">Téléphone</p>
                                <p class="font-medium">${o.customer_phone}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500">Ville</p>
                                <p class="font-medium">${o.shipping_city}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500">Total</p>
                                <p class="font-bold text-blue-600 text-lg">${o.total} ${CONFIG.CURRENCY}</p>
                            </div>
                        </div>
                        <p class="text-sm text-gray-600 mb-3">${o.shipping_address}</p>
                        <div class="flex flex-wrap gap-2">
                            ${(o.order_items || []).map(item => `
                                <span class="px-2 py-1 bg-gray-100 rounded text-xs">${item.product_name} x${item.quantity}</span>
                            `).join('')}
                        </div>
                    </div>
                    <div class="flex flex-row lg:flex-col gap-2">
                        <a href="tel:${o.customer_phone}" class="action-btn btn-call flex-1 lg:flex-none">
                            <span class="mr-2">📞</span> Appeler
                        </a>
                        <a href="${CONFIG.getWhatsAppLink(o.customer_phone, `Bonjour ${o.customer_name}, concernant votre commande ${o.order_number || o.id}`)}" target="_blank" class="action-btn btn-whatsapp flex-1 lg:flex-none">
                            <span class="mr-2">💬</span> WhatsApp
                        </a>
                        <button onclick="confirmOrder('${o.id}')" class="action-btn btn-confirm flex-1 lg:flex-none">
                            <span class="mr-2">✓</span> Confirmer
                        </button>
                        <button onclick="cancelOrder('${o.id}')" class="action-btn btn-cancel flex-1 lg:flex-none">
                            <span class="mr-2">✕</span> Annuler
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

async function confirmOrder(id) {
    showLoading('Confirmation en cours...');
    
    const order = orders.find(o => o.id === id);
    if (!order) {
        hideLoading();
        return;
    }

    // Update in Supabase
    if (db.isReady()) {
        const { error } = await db.updateOrderStatus(id, 'confirmed', 'Confirmé par admin');
        if (error) {
            hideLoading();
            showToast('Erreur: ' + error.message, 'error');
            return;
        }
    }

    // Update local
    order.status = 'confirmed';
    order.confirmed_at = new Date().toISOString();

    // Sync to Google Sheet
    await syncOrderToSheet(order);

    hideLoading();
    showToast(`Commande ${order.order_number || id} confirmée!`);
    updateUI();
    renderConfirmation();
}

async function cancelOrder(id) {
    const reason = prompt('Raison de l\'annulation (optionnel):');
    
    showLoading('Annulation...');
    
    if (db.isReady()) {
        await db.updateOrderStatus(id, 'cancelled', reason || 'Annulé par admin');
    }
    
    const order = orders.find(o => o.id === id);
    if (order) {
        order.status = 'cancelled';
        order.cancelled_at = new Date().toISOString();
        order.cancelled_reason = reason;
    }
    
    hideLoading();
    showToast('Commande annulée', 'warning');
    updateUI();
    renderConfirmation();
}

// =============================================
// ORDER MODAL
// =============================================
function openOrderModal(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    updateElement('modal-order-id', order.order_number || order.id);
    
    const contentEl = document.getElementById('modal-content');
    if (contentEl) {
        contentEl.innerHTML = `
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <p class="text-xs text-gray-500">Client</p>
                    <p class="font-semibold">${order.customer_name}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500">Téléphone</p>
                    <p class="font-semibold">${order.customer_phone}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500">Ville</p>
                    <p class="font-semibold">${order.shipping_city}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500">Total</p>
                    <p class="font-bold text-blue-600 text-xl">${order.total} ${CONFIG.CURRENCY}</p>
                </div>
            </div>
            <div class="mb-6">
                <p class="text-xs text-gray-500 mb-1">Adresse</p>
                <p class="bg-gray-50 p-3 rounded-lg">${order.shipping_address}</p>
            </div>
            <div class="mb-6">
                <p class="text-xs text-gray-500 mb-1">Statut</p>
                ${CONFIG.getStatusBadge(order.status)}
            </div>
            ${order.tracking_number ? `
                <div class="mb-6">
                    <p class="text-xs text-gray-500 mb-1">Tracking</p>
                    <a href="${CONFIG.getTrackingUrl('digylog', order.tracking_number)}" target="_blank" class="font-mono text-blue-600 hover:underline">${order.tracking_number}</a>
                </div>
            ` : ''}
            <div>
                <p class="text-xs text-gray-500 mb-2">Produits</p>
                <div class="space-y-2">
                    ${(order.order_items || []).map(item => `
                        <div class="flex justify-between bg-gray-50 p-3 rounded-lg">
                            <span>${item.product_name} x${item.quantity}</span>
                            <span class="font-semibold">${item.unit_price * item.quantity} ${CONFIG.CURRENCY}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    const actionsEl = document.getElementById('modal-actions');
    if (actionsEl) {
        let actions = `
            <a href="tel:${order.customer_phone}" class="action-btn btn-call">📞 Appeler</a>
            <a href="${CONFIG.getWhatsAppLink(order.customer_phone)}" target="_blank" class="action-btn btn-whatsapp">💬 WhatsApp</a>
        `;
        
        if (order.status === 'new') {
            actions += `
                <button onclick="confirmOrder('${order.id}'); closeOrderModal();" class="action-btn btn-confirm">✓ Confirmer</button>
                <button onclick="cancelOrder('${order.id}'); closeOrderModal();" class="action-btn btn-cancel">✕ Annuler</button>
            `;
        }
        
        actionsEl.innerHTML = actions;
    }
    
    document.getElementById('order-modal').classList.remove('hidden');
}

function closeOrderModal() {
    document.getElementById('order-modal').classList.add('hidden');
}

// =============================================
// SHIPPING
// =============================================
function renderShipping() {
    const container = document.getElementById('shipping-table');
    if (!container) return;
    
    container.innerHTML = shippingLabels.map(l => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 font-medium">${l.label_number}</td>
            <td class="px-6 py-4"><span class="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs capitalize">${l.carrier}</span></td>
            <td class="px-6 py-4">${l.orders_count}</td>
            <td class="px-6 py-4 font-semibold">${l.total_amount} ${CONFIG.CURRENCY}</td>
            <td class="px-6 py-4">${CONFIG.getStatusBadge(l.status)}</td>
            <td class="px-6 py-4">${CONFIG.getStatusBadge(l.payment_status)}</td>
            <td class="px-6 py-4">
                <button class="p-2 hover:bg-gray-100 rounded-lg transition" title="Télécharger">⬇️</button>
            </td>
        </tr>
    `).join('');
}

async function createShippingLabel() {
    const confirmed = orders.filter(o => o.status === 'confirmed');
    
    if (confirmed.length === 0) {
        showToast('Aucune commande confirmée à expédier', 'warning');
        return;
    }

    showLoading('Création du bordereau...');

    // Simulate API call delay
    await new Promise(r => setTimeout(r, 1500));

    // Generate tracking numbers and update orders
    for (const order of confirmed) {
        order.status = 'shipped';
        order.shipped_at = new Date().toISOString();
        order.tracking_number = 'S' + Math.random().toString(36).substr(2, 8).toUpperCase();
        
        if (db.isReady()) {
            await db.updateOrderStatus(order.id, 'shipped');
            await db.createShipment({
                order_id: order.id,
                carrier: 'digylog',
                tracking_number: order.tracking_number,
                status: 'pending'
            });
        }
    }

    // Create label
    const newLabel = {
        id: Date.now().toString(),
        label_number: 'BL' + Date.now().toString().slice(-6),
        carrier: 'digylog',
        orders_count: confirmed.length,
        total_amount: confirmed.reduce((s, o) => s + o.total, 0),
        status: 'completed',
        payment_status: 'unpaid'
    };
    
    shippingLabels.unshift(newLabel);

    if (db.isReady()) {
        await db.createShippingLabel(newLabel, confirmed.map(o => o.id));
    }

    hideLoading();
    showToast(`Bordereau créé: ${newLabel.label_number} (${confirmed.length} commandes)`);
    updateUI();
    renderShipping();
}

// =============================================
// PRODUCTS
// =============================================
function renderProducts() {
    updateElement('products-count', `${products.length} produits`);
    
    const container = document.getElementById('products-table');
    if (!container) return;
    
    container.innerHTML = products.map(p => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 font-medium">${p.name}</td>
            <td class="px-6 py-4 text-gray-600 font-mono text-sm">${p.sku}</td>
            <td class="px-6 py-4"><span class="px-2 py-1 bg-gray-100 rounded-full text-xs">${p.category?.name || '-'}</span></td>
            <td class="px-6 py-4 font-semibold">${p.price} ${CONFIG.CURRENCY}</td>
            <td class="px-6 py-4 ${p.stock < 20 ? 'text-red-600 font-semibold' : 'text-green-600'}">${p.stock}</td>
            <td class="px-6 py-4">
                <button class="text-blue-600 hover:underline text-sm">Modifier</button>
            </td>
        </tr>
    `).join('');
}

function showProductForm() {
    showToast('Fonctionnalité à venir', 'info');
}

// =============================================
// SETTINGS
// =============================================
function populateSettings() {
    document.getElementById('settings-supabase-url').value = CONFIG.SUPABASE_URL || 'Non configuré';
    
    const statusEl = document.getElementById('settings-supabase-status');
    if (statusEl) {
        if (db.isReady()) {
            statusEl.textContent = '✓ Connecté';
            statusEl.className = 'px-4 py-2.5 bg-green-100 text-green-700 rounded-xl';
        } else {
            statusEl.textContent = '✕ Non connecté';
            statusEl.className = 'px-4 py-2.5 bg-red-100 text-red-700 rounded-xl';
        }
    }
    
    document.getElementById('digylog-token').value = CONFIG.DIGYLOG_TOKEN || '';
    document.getElementById('store-name').value = CONFIG.STORE_NAME;
    document.getElementById('store-phone').value = CONFIG.STORE_PHONE;
    document.getElementById('store-whatsapp').value = CONFIG.WHATSAPP_NUMBER;
    document.getElementById('shipping-cost').value = CONFIG.DEFAULT_SHIPPING_COST;
}

function saveSettings() {
    const token = document.getElementById('digylog-token').value;
    CONFIG.DIGYLOG_TOKEN = token;
    localStorage.setItem('hichoux_digylog_token', token);
    
    CONFIG.STORE_NAME = document.getElementById('store-name').value;
    CONFIG.STORE_PHONE = document.getElementById('store-phone').value;
    CONFIG.WHATSAPP_NUMBER = document.getElementById('store-whatsapp').value;
    CONFIG.DEFAULT_SHIPPING_COST = parseInt(document.getElementById('shipping-cost').value) || 30;
    
    showToast('Paramètres sauvegardés');
}

function toggleTokenVisibility() {
    const input = document.getElementById('digylog-token');
    input.type = input.type === 'password' ? 'text' : 'password';
}

function testDigylogAPI() {
    showToast('Test de connexion...', 'info');
    setTimeout(() => {
        if (CONFIG.DIGYLOG_TOKEN) {
            showToast('Connexion réussie!', 'success');
        } else {
            showToast('Token non configuré', 'warning');
        }
    }, 1000);
}

// =============================================
// GOOGLE SHEETS SYNC
// =============================================
async function syncOrderToSheet(order) {
    if (!CONFIG.GOOGLE_SCRIPT_URL) return;

    try {
        await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'addOrder',
                order: {
                    orderRef: order.order_number,
                    name: order.customer_name,
                    phone: order.customer_phone,
                    address: order.shipping_address,
                    city: order.shipping_city,
                    codAmount: order.total,
                    productSku: (order.order_items || []).map(i => i.product_name).join(', '),
                    quantity: (order.order_items || []).reduce((s, i) => s + i.quantity, 0),
                    notes: order.notes || '',
                    status: 'Confirmed'
                }
            })
        });
    } catch (error) {
        console.error('Google Sheets sync error:', error);
    }
}

async function syncToGoogleSheet() {
    if (!CONFIG.GOOGLE_SCRIPT_URL) {
        showToast('URL Google Apps Script non configurée', 'warning');
        return;
    }

    const btn = document.getElementById('sync-btn');
    const text = document.getElementById('sync-text');
    const result = document.getElementById('sync-result');
    
    btn.disabled = true;
    text.textContent = 'Syncing...';

    const confirmed = orders.filter(o => o.status === 'confirmed');
    
    if (confirmed.length === 0) {
        btn.disabled = false;
        text.textContent = 'Sync Now';
        showToast('Aucune commande confirmée à synchroniser', 'info');
        return;
    }

    try {
        await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({
                action: 'addOrders',
                orders: confirmed.map(o => ({
                    orderRef: o.order_number,
                    name: o.customer_name,
                    phone: o.customer_phone,
                    address: o.shipping_address,
                    city: o.shipping_city,
                    codAmount: o.total,
                    status: 'Confirmed'
                }))
            })
        });
        
        updateElement('last-sync', 'Last sync: ' + new Date().toLocaleString('fr-FR') + ' - Success');
        
        result.classList.remove('hidden');
        result.innerHTML = `<p class="text-sm text-green-600">✓ ${confirmed.length} commandes synchronisées</p>`;
        
        showToast(`${confirmed.length} commandes synchronisées`);
        
    } catch (error) {
        result.classList.remove('hidden');
        result.innerHTML = `<p class="text-sm text-red-600">✕ Erreur: ${error.message}</p>`;
        showToast('Erreur de synchronisation', 'error');
    }
    
    btn.disabled = false;
    text.textContent = 'Sync Now';
}

// =============================================
// HELPERS
// =============================================
function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Close modal on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeOrderModal();
    }
});

// Close modal on outside click
document.getElementById('order-modal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeOrderModal();
    }
});
