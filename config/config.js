/**
 * =============================================
 * HICHOUX STORE - Configuration Centralisée
 * =============================================
 * Ce fichier contient toute la configuration du projet.
 * Modifier les valeurs ci-dessous avec vos propres credentials.
 * =============================================
 */

const CONFIG = {
    // =========================================
    // SUPABASE
    // =========================================
    // Obtenir depuis: https://app.supabase.com/project/_/settings/api
    SUPABASE_URL: 'https://mbvskiaqfpbbnxhgzpga.supabase.co',
    SUPABASE_ANON_KEY: 'sb_secret_inwuQRRulHoEd6ihMrojsA_p_fxEDqR',

    // =========================================
    // GOOGLE SHEETS
    // =========================================
    // URL du Google Apps Script déployé
    GOOGLE_SCRIPT_URL: '', // ex: https://script.google.com/macros/s/xxx/exec
    GOOGLE_SHEET_ID: '1qKkOSPisPkqUQEkH-stKoUaEo1d9e63pVcV1iU9yvHw',
    GOOGLE_SHEET_URL: 'https://docs.google.com/spreadsheets/d/1qKkOSPisPkqUQEkH-stKoUaEo1d9e63pVcV1iU9yvHw/edit',

    // =========================================
    // DIGYLOG API (Livraison)
    // =========================================
    DIGYLOG_API_URL: 'https://api.digylog.com/v2',
    DIGYLOG_TOKEN: '', // Votre Bearer Token Digylog

    // =========================================
    // STORE INFO
    // =========================================
    STORE_NAME: 'Hichoux Store',
    STORE_PHONE: '0600000000',
    STORE_EMAIL: 'contact@hichouxstore.ma',
    STORE_ADDRESS: 'Casablanca, Maroc',
    WHATSAPP_NUMBER: '212600000000',

    // =========================================
    // SHIPPING
    // =========================================
    DEFAULT_SHIPPING_COST: 30,
    FREE_SHIPPING_THRESHOLD: 500,
    FULFILLMENT_FEES: 5,

    // =========================================
    // CURRENCY
    // =========================================
    CURRENCY: 'DH',
    CURRENCY_CODE: 'MAD',

    // =========================================
    // CITIES (Morocco)
    // =========================================
    CITIES: [
        'Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger',
        'Agadir', 'Meknès', 'Oujda', 'Kénitra', 'Tétouan',
        'Safi', 'El Jadida', 'Nador', 'Beni Mellal', 'Mohammedia',
        'Khouribga', 'Settat', 'Taza', 'Berrechid', 'Khemisset',
        'Autre'
    ],

    // =========================================
    // ORDER STATUSES
    // =========================================
    ORDER_STATUSES: {
        new: { label: 'Nouvelle', color: 'yellow' },
        confirmed: { label: 'Confirmée', color: 'blue' },
        shipped: { label: 'Expédiée', color: 'purple' },
        delivered: { label: 'Livrée', color: 'green' },
        cancelled: { label: 'Annulée', color: 'red' },
        returned: { label: 'Retournée', color: 'orange' }
    },

    // =========================================
    // CARRIERS
    // =========================================
    CARRIERS: [
        { id: 'digylog', name: 'Digylog', tracking_url: 'https://www.digylog.com/suivi-de-colis/?tracking=' },
        { id: 'ozone', name: 'Ozone Express', tracking_url: 'https://client.ozoneexpress.ma/tracking/' },
        { id: 'sendit', name: 'Sendit', tracking_url: 'https://sendit.ma/tracking/' }
    ],

    // =========================================
    // USER ROLES
    // =========================================
    ROLES: {
        admin: { label: 'Admin', permissions: ['all'] },
        manager: { label: 'Manager', permissions: ['orders', 'products', 'shipping', 'team'] },
        confirmator: { label: 'Confirmateur', permissions: ['orders', 'confirmation'] },
        viewer: { label: 'Viewer', permissions: ['view'] }
    },

    // =========================================
    // API ENDPOINTS (relative to SUPABASE_URL)
    // =========================================
    ENDPOINTS: {
        products: '/rest/v1/products',
        categories: '/rest/v1/categories',
        orders: '/rest/v1/orders',
        order_items: '/rest/v1/order_items',
        customers: '/rest/v1/customers',
        shipments: '/rest/v1/shipments',
        shipping_labels: '/rest/v1/shipping_labels',
        team_members: '/rest/v1/team_members',
        settings: '/rest/v1/settings'
    },

    // =========================================
    // FEATURE FLAGS
    // =========================================
    FEATURES: {
        google_sheets_sync: true,
        digylog_integration: true,
        whatsapp_notifications: true,
        email_notifications: false,
        sms_notifications: false,
        realtime_updates: true
    },

    // =========================================
    // DEBUG MODE
    // =========================================
    DEBUG: false
};

// =========================================
// HELPER FUNCTIONS
// =========================================

/**
 * Check if Supabase is configured
 */
CONFIG.isSupabaseConfigured = function() {
    return this.SUPABASE_URL && 
           this.SUPABASE_URL !== 'YOUR_SUPABASE_URL' && 
           this.SUPABASE_ANON_KEY && 
           this.SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
};

/**
 * Check if Google Sheets is configured
 */
CONFIG.isGoogleSheetsConfigured = function() {
    return this.GOOGLE_SCRIPT_URL && this.GOOGLE_SCRIPT_URL.length > 0;
};

/**
 * Check if Digylog is configured
 */
CONFIG.isDigylogConfigured = function() {
    return this.DIGYLOG_TOKEN && this.DIGYLOG_TOKEN.length > 0;
};

/**
 * Get status badge HTML
 */
CONFIG.getStatusBadge = function(status) {
    const config = this.ORDER_STATUSES[status] || { label: status, color: 'gray' };
    const colors = {
        yellow: 'bg-yellow-100 text-yellow-800',
        blue: 'bg-blue-100 text-blue-800',
        purple: 'bg-purple-100 text-purple-800',
        green: 'bg-green-100 text-green-800',
        red: 'bg-red-100 text-red-800',
        orange: 'bg-orange-100 text-orange-800',
        gray: 'bg-gray-100 text-gray-800'
    };
    return `<span class="px-3 py-1 rounded-full text-xs font-semibold ${colors[config.color]}">${config.label}</span>`;
};

/**
 * Format price
 */
CONFIG.formatPrice = function(amount) {
    return `${amount} ${this.CURRENCY}`;
};

/**
 * Get WhatsApp link
 */
CONFIG.getWhatsAppLink = function(phone, message = '') {
    const cleanPhone = phone.replace(/\D/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '212' + cleanPhone.slice(1) : cleanPhone;
    return `https://wa.me/${intlPhone}${message ? '?text=' + encodeURIComponent(message) : ''}`;
};

/**
 * Get tracking URL
 */
CONFIG.getTrackingUrl = function(carrier, trackingNumber) {
    const carrierConfig = this.CARRIERS.find(c => c.id === carrier);
    if (carrierConfig && trackingNumber) {
        return carrierConfig.tracking_url + trackingNumber;
    }
    return null;
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
