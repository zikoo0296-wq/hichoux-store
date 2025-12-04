import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { I18nProvider } from "@/lib/i18n";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import NotFound from "@/pages/not-found";
import ProtectedRoute from "@/components/protected-route";

import HomePage from "@/pages/home";
import ProductsPage from "@/pages/products";
import ProductDetailPage from "@/pages/product-detail";
import CategoriesPage from "@/pages/categories";
import CartPage from "@/pages/cart";
import CheckoutPage from "@/pages/checkout";
import ConfirmationPage from "@/pages/confirmation";

import AdminLoginPage from "@/pages/admin/login";
import AdminDashboardPage from "@/pages/admin/dashboard";
import AdminOrdersPage from "@/pages/admin/orders";
import AdminOrderDetailPage from "@/pages/admin/order-detail";
import AdminConfirmationPage from "@/pages/admin/confirmation";
import AdminProductsPage from "@/pages/admin/products";
import AdminProductFormPage from "@/pages/admin/product-form";
import AdminProductsImportPage from "@/pages/admin/products-import";
import AdminCategoriesPage from "@/pages/admin/categories";
import AdminShippingLabelsPage from "@/pages/admin/shipping-labels";
import AdminAnalyticsPage from "@/pages/admin/analytics";
import AdminSettingsPage from "@/pages/admin/settings";

function PublicRouter() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/products/:id" component={ProductDetailPage} />
      <Route path="/categories" component={CategoriesPage} />
      <Route path="/cart" component={CartPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/confirmation/:id" component={ConfirmationPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AdminRouter() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background/95">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/admin/login" component={AdminLoginPage} />
              <Route path="/admin" component={() => <ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
              <Route path="/admin/confirmation" component={() => <ProtectedRoute><AdminConfirmationPage /></ProtectedRoute>} />
              <Route path="/admin/orders" component={() => <ProtectedRoute><AdminOrdersPage /></ProtectedRoute>} />
              <Route path="/admin/orders/:id" component={() => <ProtectedRoute><AdminOrderDetailPage /></ProtectedRoute>} />
              <Route path="/admin/products" component={() => <ProtectedRoute><AdminProductsPage /></ProtectedRoute>} />
              <Route path="/admin/products/new" component={() => <ProtectedRoute><AdminProductFormPage /></ProtectedRoute>} />
              <Route path="/admin/products/:id/edit" component={() => <ProtectedRoute><AdminProductFormPage /></ProtectedRoute>} />
              <Route path="/admin/products/import" component={() => <ProtectedRoute><AdminProductsImportPage /></ProtectedRoute>} />
              <Route path="/admin/categories" component={() => <ProtectedRoute><AdminCategoriesPage /></ProtectedRoute>} />
              <Route path="/admin/shipping-labels" component={() => <ProtectedRoute><AdminShippingLabelsPage /></ProtectedRoute>} />
              <Route path="/admin/analytics" component={() => <ProtectedRoute><AdminAnalyticsPage /></ProtectedRoute>} />
              <Route path="/admin/settings" component={() => <ProtectedRoute><AdminSettingsPage /></ProtectedRoute>} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/admin/*?" component={AdminRouter} />
      <Route path="/*?" component={PublicRouter} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <CartProvider>
            <AuthProvider>
              <TooltipProvider>
                <Router />
                <Toaster />
              </TooltipProvider>
            </AuthProvider>
          </CartProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
