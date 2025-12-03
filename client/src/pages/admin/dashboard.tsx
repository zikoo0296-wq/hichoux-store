import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/admin/stats-card";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import {
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Order, OrderStatus } from "@shared/schema";

interface DashboardStats {
  ordersToday: number;
  ordersTotal: number;
  revenueToday: number;
  revenueTotal: number;
  productsCount: number;
  pendingOrders: number;
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard"],
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders/recent"],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">
          Vue d'ensemble de votre activité
        </p>
      </div>

      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Commandes aujourd'hui"
            value={stats?.ordersToday || 0}
            description={`${stats?.ordersTotal || 0} au total`}
            icon={ShoppingCart}
          />
          <StatsCard
            title="Revenu aujourd'hui"
            value={`${(stats?.revenueToday || 0).toFixed(2)} DH`}
            description={`${(stats?.revenueTotal || 0).toFixed(2)} DH au total`}
            icon={DollarSign}
          />
          <StatsCard
            title="Produits"
            value={stats?.productsCount || 0}
            description="Produits en catalogue"
            icon={Package}
          />
          <StatsCard
            title="En attente"
            value={stats?.pendingOrders || 0}
            description="Commandes à traiter"
            icon={TrendingUp}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Commandes récentes</CardTitle>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm" className="gap-2">
                Voir tout
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    data-testid={`recent-order-${order.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-medium text-primary">
                          #{order.id}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.createdAt), "dd MMM à HH:mm", { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-medium">
                          {parseFloat(order.totalPrice).toFixed(2)} DH
                        </p>
                        <OrderStatusBadge status={order.status as OrderStatus} />
                      </div>
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucune commande récente
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/products/new" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Ajouter un produit</p>
                  <p className="text-sm text-muted-foreground">
                    Créer un nouveau produit dans le catalogue
                  </p>
                </div>
              </Button>
            </Link>

            <Link href="/admin/orders" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Gérer les commandes</p>
                  <p className="text-sm text-muted-foreground">
                    Voir et traiter les commandes en cours
                  </p>
                </div>
              </Button>
            </Link>

            <Link href="/admin/analytics" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Voir les analytics</p>
                  <p className="text-sm text-muted-foreground">
                    Analyser les ventes et profits
                  </p>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
