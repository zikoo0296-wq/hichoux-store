# E-Commerce Platform with Admin Dashboard

## Overview

This is a full-stack e-commerce platform designed for Cash on Delivery (COD) sales in Morocco. The application features a public-facing storefront for customers to browse products and place orders, alongside a comprehensive admin dashboard for managing inventory, orders, analytics, and integrations.

The platform is built as a monolithic Express.js application with React frontend, designed for deployment on Vercel (frontend) and Render (backend), using PostgreSQL for data persistence.

## Recent Changes (December 2025)

### Multi-Language Support (i18n)
- Added Arabic (RTL) and French language support
- Language toggle in header with automatic RTL layout switching
- Translations for navigation, forms, and common UI elements
- Context-based i18n implementation in `client/src/lib/i18n.tsx`

### Shopping Cart System
- Cart context with localStorage persistence (`client/src/lib/cart.tsx`)
- Cart page with quantity management
- Checkout flow with COD payment
- Order confirmation page with tracking

### Multi-Carrier Integration
- Support for 4 Moroccan carriers: DIGYLOG, OZON, CATHEDIS, SENDIT
- Configurable carrier settings per order
- Webhook handling for delivery status updates
- Shipping quote comparison feature

### User Roles System
- Super Admin: Full access
- Admin: Products, orders, categories management
- Operator: Order status updates
- Support: Read-only access

### Database Schema Updates
- Added `is_active`, `last_login_at` to users table
- Added `name`, `slug`, `is_active`, `is_featured` to products
- Added `delivery_cost`, `carrier`, `tracking_number`, `carrier_status` to orders
- Updated sync_logs with `action`, `result`, `details` fields

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component System**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling

**Design Approach**: 
- Public storefront follows Shopify/Etsy-inspired e-commerce patterns with clean, product-focused design
- Admin dashboard uses Material Design principles for data-dense, productivity-focused interfaces
- Typography: Nunito Sans for headings, Inter for body text
- Responsive-first design with mobile breakpoint at 768px

**State Management**: 
- TanStack Query (React Query) for server state management and caching
- React Context API for authentication state
- Local component state with React hooks

**Routing**: Wouter for lightweight client-side routing

**Form Handling**: React Hook Form with Zod schema validation

**Theme System**: Custom theme provider supporting light/dark modes with CSS variables

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js

**API Design**: RESTful API with separate public and admin endpoints
- Public routes: `/api/products`, `/api/categories`, `/api/orders` (POST only)
- Admin routes: `/api/admin/*` with authentication middleware

**Authentication**: 
- Session-based authentication using express-session
- BCrypt for password hashing
- Session middleware protecting all admin routes

**Database Layer**: 
- Drizzle ORM for type-safe database queries
- Neon serverless PostgreSQL driver with WebSocket support
- Schema-first approach with migrations in `migrations/` directory

**Data Model**:
- Users (admin accounts)
- Categories (product organization)
- Products (with images array, pricing, stock management)
- Orders (with status workflow: NOUVELLE → EN_ATTENTE → CONFIRMEE → ENVOYEE → LIVREE)
- OrderItems (line items per order)
- ShippingLabels (carrier integration data)
- SyncLogs (external system synchronization tracking)
- AdCosts (marketing spend tracking for profit calculations)
- Settings (key-value configuration storage)

**Business Logic Patterns**:
- Storage abstraction layer (`server/storage.ts`) provides clean interface to data operations
- Order workflow includes stock reservation on creation
- Automatic profit calculations (revenue - cost - delivery - ad spend)

### Data Storage

**Primary Database**: PostgreSQL (Supabase)
- Connection via pg driver with Session Pooler
- Host: aws-1-eu-west-1.pooler.supabase.com:5432
- SSL enabled with rejectUnauthorized: false
- Schema defined in `shared/schema.ts`
- Migrations managed by Drizzle Kit

**Environment Variables**:
- DATABASE_URL: Supabase PostgreSQL connection string (Session Pooler mode)
- SESSION_SECRET: Express session secret

**Session Store**: In-memory sessions (development) with option for connect-pg-simple (production)

**File Storage**: Images stored as URL strings in database, with design expecting Cloudinary or AWS S3 integration

### External Dependencies

**Google Sheets Integration**:
- Purpose: Sync order data to spreadsheet for external processing/reporting
- Implementation: Uses Google Sheets API v4 with OAuth2 credentials
- Connection via Replit Connectors system
- Functions: `syncOrderToGoogleSheets()`, `syncAllUnSyncedOrders()`, `ensureSheetExists()`
- Settings: `google_sheets_id` stored in settings table

**Carrier/Shipping API**:
- Purpose: Generate shipping labels and tracking numbers
- Configurable endpoint and API key via settings table
- Falls back to mock label generation if not configured
- Response includes tracking number, label PDF (base64 or URL)
- Settings: `carrier_api_url`, `carrier_api_key`

**WhatsApp Integration**:
- Purpose: Allow customers to complete orders via WhatsApp message
- Uses `wa.me/` URL scheme with pre-filled order details
- Setting: `whatsapp_number` for business contact

**Third-Party UI Libraries**:
- Radix UI (headless component primitives)
- Recharts (analytics charts)
- React Icons (icon library including brand icons)
- date-fns (date formatting and manipulation)
- cmdk (command palette component)

**Build & Development Tools**:
- Vite (frontend bundler with HMR)
- esbuild (server bundling for production)
- TypeScript (type safety across stack)
- Tailwind CSS (utility-first styling)

**Email/Notifications** (designed for, not yet implemented):
- Nodemailer package included for future email notifications
- Settings table ready for SMTP configuration