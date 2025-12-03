import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProvider } from "@/contexts/auth-context";
import ProtectedRoute from "@/components/protected-route";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminOrders from "@/pages/admin/orders";
import AdminProducts from "@/pages/admin/products";
import AdminCategories from "@/pages/admin/categories";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminShippingLabels from "@/pages/admin/shipping-labels";
import AdminSettings from "@/pages/admin/settings";
import AdminLogin from "@/pages/admin/login";

function AdminRouter() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={() => <ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/orders" component={() => <ProtectedRoute><AdminOrders /></ProtectedRoute>} />
      <Route path="/admin/products" component={() => <ProtectedRoute><AdminProducts /></ProtectedRoute>} />
      <Route path="/admin/categories" component={() => <ProtectedRoute><AdminCategories /></ProtectedRoute>} />
      <Route path="/admin/analytics" component={() => <ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
      <Route path="/admin/shipping-labels" component={() => <ProtectedRoute><AdminShippingLabels /></ProtectedRoute>} />
      <Route path="/admin/settings" component={() => <ProtectedRoute><AdminSettings /></ProtectedRoute>} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function AdminApp() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <SidebarProvider style={style as React.CSSProperties}>
              <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                  <header className="flex items-center justify-between p-4 border-b bg-background/95">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <ThemeToggle />
                  </header>
                  <main className="flex-1 overflow-auto">
                    <AdminRouter />
                  </main>
                </div>
              </div>
            </SidebarProvider>
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
