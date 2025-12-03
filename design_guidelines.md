# Design Guidelines — E-Commerce Platform COD + Admin Dashboard

## Design Approach

This project requires **two distinct design approaches** for its dual interfaces:

**Public Storefront**: Reference-based approach inspired by **Shopify** and **Etsy** - clean, product-focused e-commerce that builds trust and makes purchasing effortless.

**Admin Dashboard**: Design system approach using **Material Design** principles for data-dense, productivity-focused interface with clear information hierarchy.

---

## Public Storefront Design (Client-Facing)

### Typography
- **Headings**: Nunito Sans (Google Fonts) - 700 weight for product titles, 600 for section headers
- **Body**: Inter (Google Fonts) - 400 regular, 500 medium for emphasis
- **Hierarchy**: Hero h1 at text-5xl, product titles text-2xl, descriptions text-base, price displays text-3xl font-bold

### Layout System
Primary spacing units: **4, 6, 8, 12, 16** (as in p-4, gap-6, mt-8, py-12, px-16)
- Container: max-w-7xl mx-auto px-4 for main content
- Product grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- Section padding: py-12 mobile, py-20 desktop

### Component Library

**Hero Section**:
- Full-width background image showing products in lifestyle context
- Centered overlay with store tagline + primary CTA button with backdrop-blur-md
- Height: min-h-[60vh] on mobile, min-h-[75vh] on desktop

**Product Cards**:
- Clean white background with subtle shadow on hover (hover:shadow-xl transition)
- Image ratio 4:3, object-cover
- Product title, price prominent, quick "Commander" button
- Badge for stock status (En stock / Stock limité)

**Product Detail Page**:
- Two-column layout: Left - image gallery (main image + thumbnail strip below), Right - product info, quantity selector, order form
- Gallery uses Swiper.js or similar for smooth image browsing
- Price displayed prominently with text-3xl font-bold
- Stock indicator with color coding (green dot = in stock)

**Order Form (COD)**:
- Single-column form with clear field labels
- Input fields with border-2 border-gray-300 focus:border-blue-500
- Large, confident submit button: "Confirmer la commande" in px-8 py-4
- WhatsApp quick order option as secondary button with icon

**Category Navigation**:
- Horizontal scrollable pill buttons on mobile
- Grid layout on desktop with category images
- Active category highlighted with bg-blue-600 text-white

### Images
**Hero**: High-quality lifestyle image of products being used/delivered (1920x1080)
**Product Images**: Professional product photography on white background, minimum 800x800px, support up to 5 images per product in gallery format
**Category Cards**: Representative product from each category, 600x600px

---

## Admin Dashboard Design

### Typography
- **Headings**: Roboto (Google Fonts) - 500 medium for titles
- **Body**: Roboto - 400 regular for data tables and forms
- **Hierarchy**: Page titles text-3xl, section headers text-xl, table headers text-sm font-medium uppercase tracking-wide

### Layout System
Spacing units: **2, 4, 6, 8** (tighter spacing for data density)
- Sidebar: w-64 fixed left navigation
- Main content: ml-64 with max-w-full px-6 py-8
- Cards and panels: p-6 with rounded-lg shadow

### Component Library

**Sidebar Navigation**:
- Fixed left sidebar with logo at top
- Menu items with icons (Heroicons) + labels
- Active state: bg-blue-50 border-l-4 border-blue-600
- Sections: Dashboard, Produits, Commandes, Catégories, Shipping Labels, Analytics

**Dashboard Cards**:
- Grid of metric cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4
- Each card: white background, p-6, metric value text-3xl font-bold, label text-sm text-gray-600
- Icons in top right corner with circular bg-blue-100 p-3

**Orders Table**:
- Full-width table with sticky header
- Row height: h-16 for comfortable scanning
- Status badges: rounded-full px-3 py-1 text-xs font-medium with color coding (green=LIVRÉE, blue=CONFIRMÉE, yellow=EN ATTENTE, red=ANNULÉE, orange=INJOIGNABLE)
- Action buttons in rightmost column: icon buttons (px-2 py-1) for Confirm, Cancel, Send to Carrier
- Filters above table: date range picker + status dropdown + city search

**Order Detail View**:
- Three-column layout: Customer info (left), Product items (center), Actions & Status (right)
- Timeline view for status history with vertical line connecting status dots
- Large action buttons: "Confirmer et Sync Google Sheets", "Envoyer au transporteur"
- Shipping label preview with download button when available

**Product Management**:
- Form with clear sections separated by borders
- Multi-image upload zone: dashed border, drag-drop area showing thumbnails after upload
- Two-column form: left side for basic info (title, SKU, description), right side for pricing (prix de vente, prix coûtant) and stock
- Category selector as dropdown with search

**Analytics Dashboard**:
- Date range selector at top (from/to date pickers)
- Summary cards showing: Revenu total, Coût produits, Coût livraison, Profit net
- Bar chart for commandes par jour (Chart.js or Recharts)
- Top 10 products table with product image thumbnail, name, quantity sold, revenue

---

## Shared Design Principles

**Responsive Strategy**:
- Mobile-first breakpoints: base (mobile), md: 768px (tablet), lg: 1024px (desktop)
- Storefront collapses to single column on mobile with hamburger menu
- Admin sidebar becomes slide-out drawer on mobile (activated by hamburger icon)

**Form Validation**:
- Inline validation with red border + error message text-sm text-red-600 below field
- Success states with green border + checkmark icon
- Disabled states with opacity-50 cursor-not-allowed

**Buttons**:
- Primary: bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium
- Secondary: border-2 border-gray-300 hover:border-gray-400 px-6 py-3 rounded-lg
- Danger: bg-red-600 hover:bg-red-700 (for cancel/delete actions)

**Icons**: Heroicons (outline for inactive, solid for active states)

**Loading States**: Spinner with "Chargement..." text for async operations

**Animations**: Minimal - only transitions on hover (transition-all duration-200) and fade-ins for modals (animate-fadeIn)

---

## Critical Implementation Notes

- All text in French for UI labels
- WhatsApp integration uses wa.me links with pre-filled message
- Print-friendly CSS for shipping labels (remove sidebar/nav, optimize for A4/letter)
- Stock indicators update in real-time after order confirmation
- Cloudinary transformations for image optimization (f_auto, q_auto)