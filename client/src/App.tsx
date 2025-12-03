import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import NotFound from "@/pages/not-found";

import HomePage from "@/pages/home";
import ProductsPage from "@/pages/products";
import ProductDetailPage from "@/pages/product-detail";
import CategoriesPage from "@/pages/categories";

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
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">E-Shop</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/products" component={ProductsPage} />
          <Route path="/products/:id" component={ProductDetailPage} />
          <Route path="/categories" component={CategoriesPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <footer className="border-t bg-muted/50 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} E-Shop. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
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
              <Route path="/admin" component={AdminDashboardPage} />
              <Route path="/admin/confirmation" component={AdminConfirmationPage} />
              <Route path="/admin/orders" component={AdminOrdersPage} />
              <Route path="/admin/orders/:id" component={AdminOrderDetailPage} />
              <Route path="/admin/products" component={AdminProductsPage} />
              <Route path="/admin/products/new" component={AdminProductFormPage} />
              <Route path="/admin/products/:id/edit" component={AdminProductFormPage} />
              <Route path="/admin/products/import" component={AdminProductsImportPage} />
              <Route path="/admin/categories" component={AdminCategoriesPage} />
              <Route path="/admin/shipping-labels" component={AdminShippingLabelsPage} />
              <Route path="/admin/analytics" component={AdminAnalyticsPage} />
              <Route path="/admin/settings" component={AdminSettingsPage} />
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
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
