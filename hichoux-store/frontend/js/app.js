/**
 * =============================================
 * HICHOUX STORE - Frontend Application
 * =============================================
 */

// =============================================
// STATE
// =============================================
let products = [];
let categories = [];
let cart = [];
let currentCategory = 'all';
let currentProduct = null;

// Demo data (used when Supabase not configured)
const demoProducts = [
    { id: '1', sku: 'PARFUM-001', name: 'Parfum Royal Oud', slug: 'parfum-royal-oud', description: 'Un parfum oriental riche et envoûtant avec des notes de oud et de rose.', price: 150, compare_price: 199, stock: 45, category: { name: 'Homme' }, is_featured: true, images: ['https://via.placeholder.com/400x400/1a1a1a/D4AF37?text=Royal+Oud'] },
    { id: '2', sku: 'PARFUM-002', name: 'Essence de Rose', slug: 'essence-de-rose', description: 'Un parfum floral délicat avec des notes de rose fraîche et de jasmin.', price: 200, compare_price: 250, stock: 32, category: { name: 'Femme' }, is_featured: true, images: ['https://via.placeholder.com/400x400/1a1a1a/D4AF37?text=Essence+Rose'] },
    { id: '3', sku: 'PARFUM-003', name: 'Amber Nights', slug: 'amber-nights', description: 'Un parfum chaud et sensuel avec des notes d\'ambre et de vanille.', price: 120, compare_price: 150, stock: 28, category: { name: 'Unisexe' }, is_featured: true, images: ['https://via.placeholder.com/400x400/1a1a1a/D4AF37?text=Amber+Nights'] },
    { id: '4', sku: 'PARFUM-004', name: 'Musk Premium', slug: 'musk-premium', description: 'Un parfum musqué élégant et raffiné.', price: 180, compare_price: 220, stock: 15, category: { name: 'Homme' }, is_featured: false, images: ['https://via.placeholder.com/400x400/1a1a1a/D4AF37?text=Musk+Premium'] },
    { id: '5', sku: 'COSM-001', name: 'Crème Hydratante', slug: 'creme-hydratante', description: 'Crème hydratante à l\'huile d\'argan.', price: 89, compare_price: 120, stock: 60, category: { name: 'Cosmétique' }, is_featured: false, images: ['https://via.placeholder.com/400x400/1a1a1a/D4AF37?text=Creme'] },
    { id: '6', sku: 'COSM-002', name: 'Sérum Anti-âge', slug: 'serum-anti-age', description: 'Sérum anti-âge à l\'acide hyaluronique.', price: 250, compare_price: 300, stock: 25, category: { name: 'Cosmétique' }, is_featured: true, images: ['https://via.placeholder.com/400x400/1a1a1a/D4AF37?text=Serum'] },
];

const demoCategories = [
    { id: '1', name: 'Homme', slug: 'homme' },
    { id: '2', name: 'Femme', slug: 'femme' },
    { id: '3', name: 'Unisexe', slug: 'unisexe' },
    { id: '4', name: 'Cosmétique', slug: 'cosmetique' }
];

// =============================================
// INITIALIZATION
// =============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Hichoux Store Frontend starting...');
    
    // Initialize Supabase
    const connected = db.init();
    
    // Load data
    await loadData();
    
    // Setup UI
    setupUI();
    
    // Load cart from localStorage
    loadCart();
    
    console.log('✅ Frontend ready!');
});

async function loadData() {
    if (db.isReady()) {
        // Load from Supabase
        const [productsRes, categoriesRes] = await Promise.all([
            db.getProducts(),
            db.getCategories()
        ]);
        products = productsRes.data || demoProducts;
        categories = categoriesRes.data || demoCategories;
    } else {
        // Use demo data
        products = demoProducts;
        categories = demoCategories;
    }
    
    // Render
    renderFeaturedProducts();
    renderCatalog();
}

function setupUI() {
    // Update store info from CONFIG
    updateElement('header-phone', CONFIG.STORE_PHONE);
    updateElement('header-email', CONFIG.STORE_EMAIL);
    updateElement('header-free-shipping', CONFIG.FREE_SHIPPING_THRESHOLD);
    updateElement('header-store-name', CONFIG.STORE_NAME);
    updateElement('footer-store-name', CONFIG.STORE_NAME);
    updateElement('footer-store-name-2', CONFIG.STORE_NAME);
    updateElement('footer-phone', CONFIG.STORE_PHONE);
    updateElement('footer-email', CONFIG.STORE_EMAIL);
    updateElement('footer-address', CONFIG.STORE_ADDRESS);
    updateElement('contact-phone', CONFIG.STORE_PHONE);
    
    // Update links
    const phoneLink = document.getElementById('contact-phone-link');
    if (phoneLink) phoneLink.href = `tel:${CONFIG.STORE_PHONE}`;
    
    const whatsappLink = document.getElementById('contact-whatsapp-link');
    if (whatsappLink) whatsappLink.href = CONFIG.getWhatsAppLink(CONFIG.WHATSAPP_NUMBER);
    
    const whatsappFloat = document.getElementById('whatsapp-float');
    if (whatsappFloat) whatsappFloat.href = CONFIG.getWhatsAppLink(CONFIG.WHATSAPP_NUMBER, 'Bonjour, je vous contacte depuis votre site web.');
    
    // Populate cities in checkout
    const citySelect = document.getElementById('checkout-city');
    if (citySelect) {
        CONFIG.CITIES.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
    }
}

function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// =============================================
// TOAST NOTIFICATIONS
// =============================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
        warning: 'bg-yellow-500'
    };
    toast.className = `toast ${colors[type]} text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2`;
    toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// =============================================
// PAGE NAVIGATION
// =============================================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById('page-' + pageId);
    if (page) {
        page.classList.add('active');
        window.scrollTo(0, 0);
    }
    
    // Page-specific actions
    if (pageId === 'cart') renderCart();
    if (pageId === 'checkout') renderCheckout();
    if (pageId === 'catalog') renderCatalog();
}

function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('hidden');
}

// =============================================
// PRODUCTS
// =============================================
function renderProductCard(product) {
    const discount = product.compare_price > product.price 
        ? Math.round((1 - product.price / product.compare_price) * 100) 
        : 0;
    
    return `
        <div class="product-card bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer" onclick="viewProduct('${product.id}')">
            <div class="relative aspect-square bg-gray-100 img-zoom">
                <img src="${product.images?.[0] || 'https://via.placeholder.com/400x400/1a1a1a/D4AF37?text=Product'}" alt="${product.name}" class="w-full h-full object-cover" loading="lazy">
                ${discount > 0 ? `<span class="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full">-${discount}%</span>` : ''}
                ${product.stock < 10 ? `<span class="absolute top-3 right-3 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">Stock limité</span>` : ''}
            </div>
            <div class="p-4">
                <p class="text-xs text-gray-500 uppercase mb-1">${product.category?.name || ''}</p>
                <h3 class="font-semibold text-lg mb-2 line-clamp-1">${product.name}</h3>
                <div class="flex items-center justify-between">
                    <div>
                        <span class="text-xl font-bold text-gold">${product.price} ${CONFIG.CURRENCY}</span>
                        ${product.compare_price > product.price ? `<span class="text-sm text-gray-400 line-through ml-2">${product.compare_price} ${CONFIG.CURRENCY}</span>` : ''}
                    </div>
                    <button onclick="event.stopPropagation(); addToCart('${product.id}')" class="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white hover:bg-gold transition" title="Ajouter au panier">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderFeaturedProducts() {
    const featured = products.filter(p => p.is_featured);
    const container = document.getElementById('featured-products');
    if (container) {
        container.innerHTML = featured.length > 0 
            ? featured.map(renderProductCard).join('')
            : '<p class="col-span-3 text-center text-gray-500">Aucun produit vedette</p>';
    }
}

function renderCatalog() {
    // Render categories
    const categoryContainer = document.getElementById('category-filters');
    if (categoryContainer) {
        categoryContainer.innerHTML = `
            <label class="flex items-center cursor-pointer">
                <input type="radio" name="category" value="all" ${currentCategory === 'all' ? 'checked' : ''} onchange="filterByCategory('all')" class="mr-2 accent-yellow-500">
                <span>Tous</span>
            </label>
            ${categories.map(cat => `
                <label class="flex items-center cursor-pointer">
                    <input type="radio" name="category" value="${cat.slug}" ${currentCategory === cat.slug ? 'checked' : ''} onchange="filterByCategory('${cat.slug}')" class="mr-2 accent-yellow-500">
                    <span>${cat.name}</span>
                </label>
            `).join('')}
        `;
    }

    // Filter and render products
    let filtered = products;
    if (currentCategory !== 'all') {
        filtered = products.filter(p => p.category?.name?.toLowerCase() === currentCategory || p.category?.slug === currentCategory);
    }

    const grid = document.getElementById('products-grid');
    if (grid) {
        grid.innerHTML = filtered.length > 0
            ? filtered.map(renderProductCard).join('')
            : '<p class="col-span-3 text-center text-gray-500 py-12">Aucun produit trouvé</p>';
    }
}

function filterByCategory(category) {
    currentCategory = category;
    renderCatalog();
}

function filterProducts() {
    const priceFilter = document.querySelector('input[name="price"]:checked')?.value || 'all';
    
    let filtered = currentCategory === 'all' 
        ? products 
        : products.filter(p => p.category?.name?.toLowerCase() === currentCategory || p.category?.slug === currentCategory);
    
    if (priceFilter !== 'all') {
        if (priceFilter === '0-100') filtered = filtered.filter(p => p.price < 100);
        else if (priceFilter === '100-200') filtered = filtered.filter(p => p.price >= 100 && p.price <= 200);
        else if (priceFilter === '200+') filtered = filtered.filter(p => p.price > 200);
    }
    
    const grid = document.getElementById('products-grid');
    if (grid) {
        grid.innerHTML = filtered.length > 0
            ? filtered.map(renderProductCard).join('')
            : '<p class="col-span-3 text-center text-gray-500 py-12">Aucun produit trouvé</p>';
    }
}

function sortProducts(sortBy) {
    let sorted = [...products];
    if (sortBy === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    else if (sortBy === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    
    const grid = document.getElementById('products-grid');
    if (grid) {
        grid.innerHTML = sorted.map(renderProductCard).join('');
    }
}

function viewProduct(id) {
    currentProduct = products.find(p => p.id === id);
    if (!currentProduct) return;
    
    const container = document.getElementById('product-detail');
    if (container) {
        container.innerHTML = `
            <div class="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
                <img src="${currentProduct.images?.[0] || 'https://via.placeholder.com/600x600'}" alt="${currentProduct.name}" class="w-full h-full object-cover">
            </div>
            <div>
                <p class="text-sm text-gray-500 uppercase mb-2">${currentProduct.category?.name || ''}</p>
                <h1 class="font-display text-3xl font-bold mb-4">${currentProduct.name}</h1>
                <div class="flex items-center space-x-4 mb-6">
                    <span class="text-3xl font-bold text-gold">${currentProduct.price} ${CONFIG.CURRENCY}</span>
                    ${currentProduct.compare_price > currentProduct.price ? `<span class="text-xl text-gray-400 line-through">${currentProduct.compare_price} ${CONFIG.CURRENCY}</span>` : ''}
                </div>
                <p class="text-gray-600 mb-8">${currentProduct.description || ''}</p>
                
                <div class="flex items-center space-x-4 mb-6">
                    <div class="flex items-center border rounded-xl">
                        <button onclick="updateProductQty(-1)" class="qty-btn rounded-l-xl">-</button>
                        <span id="product-qty" class="px-6 py-3 font-semibold">1</span>
                        <button onclick="updateProductQty(1)" class="qty-btn rounded-r-xl">+</button>
                    </div>
                    <button onclick="addToCart('${currentProduct.id}', getProductQty())" class="flex-1 btn-gold py-4 rounded-xl font-semibold text-lg">
                        Ajouter au Panier
                    </button>
                </div>
                
                <div class="space-y-3 text-sm border-t pt-6">
                    <div class="flex items-center text-gray-600"><span class="mr-3">🚚</span> Livraison rapide 24-48h</div>
                    <div class="flex items-center text-gray-600"><span class="mr-3">💰</span> Paiement à la livraison</div>
                    <div class="flex items-center text-gray-600"><span class="mr-3">✓</span> Produit authentique garanti</div>
                </div>
                
                <button onclick="showPage('catalog')" class="mt-6 text-blue-600 hover:underline">← Retour au catalogue</button>
            </div>
        `;
    }
    showPage('product');
}

let productQty = 1;

function updateProductQty(delta) {
    productQty = Math.max(1, productQty + delta);
    updateElement('product-qty', productQty);
}

function getProductQty() {
    return productQty;
}

// =============================================
// CART
// =============================================
function loadCart() {
    cart = JSON.parse(localStorage.getItem('hichoux_cart')) || [];
    updateCartBadge();
}

function saveCart() {
    localStorage.setItem('hichoux_cart', JSON.stringify(cart));
}

function addToCart(productId, qty = 1) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({
            id: productId,
            sku: product.sku,
            name: product.name,
            price: product.price,
            qty: qty,
            image: product.images?.[0]
        });
    }
    
    saveCart();
    updateCartBadge();
    showToast(`${product.name} ajouté au panier`);
    productQty = 1; // Reset
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartBadge();
    renderCart();
}

function updateCartQty(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.qty = Math.max(1, item.qty + delta);
        saveCart();
        renderCart();
    }
}

function updateCartBadge() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const badge = document.getElementById('cart-count');
    if (badge) {
        badge.textContent = count;
        badge.classList.toggle('hidden', count === 0);
    }
}

function getCartTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const shipping = subtotal >= CONFIG.FREE_SHIPPING_THRESHOLD ? 0 : CONFIG.DEFAULT_SHIPPING_COST;
    const total = subtotal + shipping;
    return { subtotal, shipping, total };
}

function renderCart() {
    const isEmpty = cart.length === 0;
    const emptyEl = document.getElementById('cart-empty');
    const contentEl = document.getElementById('cart-content');
    
    if (emptyEl) emptyEl.classList.toggle('hidden', !isEmpty);
    if (contentEl) contentEl.classList.toggle('hidden', isEmpty);

    if (!isEmpty) {
        const itemsContainer = document.getElementById('cart-items');
        if (itemsContainer) {
            itemsContainer.innerHTML = cart.map(item => `
                <div class="bg-white rounded-xl p-4 shadow-sm flex items-center space-x-4">
                    <img src="${item.image || 'https://via.placeholder.com/80'}" alt="${item.name}" class="w-20 h-20 rounded-lg object-cover">
                    <div class="flex-1">
                        <h4 class="font-semibold">${item.name}</h4>
                        <p class="text-gold font-bold">${item.price} ${CONFIG.CURRENCY}</p>
                    </div>
                    <div class="flex items-center border rounded-lg">
                        <button onclick="updateCartQty('${item.id}', -1)" class="px-3 py-1 hover:bg-gray-100">-</button>
                        <span class="px-3">${item.qty}</span>
                        <button onclick="updateCartQty('${item.id}', 1)" class="px-3 py-1 hover:bg-gray-100">+</button>
                    </div>
                    <button onclick="removeFromCart('${item.id}')" class="text-red-500 hover:text-red-700 p-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </div>
            `).join('');
        }

        const totals = getCartTotals();
        updateElement('cart-subtotal', `${totals.subtotal} ${CONFIG.CURRENCY}`);
        updateElement('cart-shipping', totals.shipping === 0 ? 'Gratuite' : `${totals.shipping} ${CONFIG.CURRENCY}`);
        updateElement('cart-total', `${totals.total} ${CONFIG.CURRENCY}`);
    }
}

// =============================================
// CHECKOUT
// =============================================
function renderCheckout() {
    const itemsContainer = document.getElementById('checkout-items');
    if (itemsContainer) {
        itemsContainer.innerHTML = cart.map(item => `
            <div class="flex justify-between items-center">
                <span>${item.name} x${item.qty}</span>
                <span class="font-semibold">${item.price * item.qty} ${CONFIG.CURRENCY}</span>
            </div>
        `).join('');
    }

    const totals = getCartTotals();
    updateElement('checkout-subtotal', `${totals.subtotal} ${CONFIG.CURRENCY}`);
    updateElement('checkout-shipping', totals.shipping === 0 ? 'Gratuite' : `${totals.shipping} ${CONFIG.CURRENCY}`);
    updateElement('checkout-total', `${totals.total} ${CONFIG.CURRENCY}`);
}

async function submitOrder(event) {
    event.preventDefault();
    
    if (cart.length === 0) {
        showToast('Votre panier est vide', 'error');
        return;
    }
    
    const form = event.target;
    const btn = document.getElementById('submit-btn');
    
    btn.disabled = true;
    btn.textContent = 'Traitement en cours...';

    const totals = getCartTotals();
    
    const orderData = {
        customer_name: form.name.value,
        customer_phone: form.phone.value,
        shipping_city: form.city.value,
        shipping_address: form.address.value,
        notes: form.notes.value,
        subtotal: totals.subtotal,
        shipping_cost: totals.shipping,
        total: totals.total,
        status: 'new',
        payment_method: 'cod',
        source: 'website'
    };

    const orderItems = cart.map(item => ({
        product_id: item.id,
        product_sku: item.sku,
        product_name: item.name,
        quantity: item.qty,
        unit_price: item.price,
        total_price: item.price * item.qty
    }));

    try {
        let orderNumber;
        
        if (db.isReady()) {
            const { data: order, error } = await db.createOrder(orderData, orderItems);
            if (error) throw error;
            orderNumber = order.order_number;
        } else {
            // Demo mode
            orderNumber = 'HCX' + Date.now().toString().slice(-8);
        }

        // Clear cart
        cart = [];
        saveCart();
        updateCartBadge();
        form.reset();

        // Show success
        updateElement('success-order-number', orderNumber);
        showPage('success');
        showToast('Commande passée avec succès!');

    } catch (error) {
        console.error('Order error:', error);
        showToast('Erreur lors de la commande. Réessayez.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '✓ Confirmer la Commande';
    }
}

// =============================================
// TRACKING
// =============================================
async function trackOrder() {
    const input = document.getElementById('tracking-input');
    const resultDiv = document.getElementById('tracking-result');
    const query = input.value.trim();
    
    if (!query) {
        showToast('Entrez un numéro de commande ou téléphone', 'warning');
        return;
    }

    resultDiv.innerHTML = '<p class="text-center py-8">Recherche en cours...</p>';
    resultDiv.classList.remove('hidden');

    try {
        let order = null;

        if (db.isReady()) {
            if (query.startsWith('HCX') || query.startsWith('hcx')) {
                const { data } = await db.getOrderByNumber(query.toUpperCase());
                order = data;
            } else {
                const { data } = await db.getOrderByPhone(query);
                order = data?.[0];
            }
        }

        if (order) {
            const statusSteps = ['new', 'confirmed', 'shipped', 'delivered'];
            const statusLabels = CONFIG.ORDER_STATUSES;
            const currentStep = statusSteps.indexOf(order.status);

            resultDiv.innerHTML = `
                <div class="bg-white rounded-2xl p-6 shadow-sm animate-fadeIn">
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <p class="text-sm text-gray-500">Commande</p>
                            <p class="text-xl font-bold">${order.order_number}</p>
                        </div>
                        ${CONFIG.getStatusBadge(order.status)}
                    </div>
                    
                    <div class="flex justify-between mb-8">
                        ${statusSteps.map((step, i) => `
                            <div class="tracking-step ${i <= currentStep ? 'active' : ''}">
                                <div class="step-circle">${i <= currentStep ? '✓' : i + 1}</div>
                                <p class="text-xs mt-2">${statusLabels[step]?.label || step}</p>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="space-y-3 text-sm">
                        <div class="flex justify-between"><span class="text-gray-500">Client</span><span>${order.customer_name}</span></div>
                        <div class="flex justify-between"><span class="text-gray-500">Ville</span><span>${order.shipping_city}</span></div>
                        <div class="flex justify-between"><span class="text-gray-500">Total</span><span class="font-bold">${order.total} ${CONFIG.CURRENCY}</span></div>
                        ${order.shipments?.[0]?.tracking_number ? `
                            <div class="flex justify-between">
                                <span class="text-gray-500">Tracking</span>
                                <a href="${CONFIG.getTrackingUrl('digylog', order.shipments[0].tracking_number)}" target="_blank" class="text-blue-600 hover:underline">${order.shipments[0].tracking_number}</a>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div class="bg-white rounded-2xl p-6 shadow-sm text-center">
                    <p class="text-gray-500">Aucune commande trouvée pour "${query}"</p>
                    <p class="text-sm text-gray-400 mt-2">Vérifiez le numéro et réessayez</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Tracking error:', error);
        resultDiv.innerHTML = '<p class="text-center text-red-500">Erreur lors de la recherche</p>';
    }
}

// Allow Enter key to search
document.addEventListener('keyup', function(e) {
    if (e.target.id === 'tracking-input' && e.key === 'Enter') {
        trackOrder();
    }
});
