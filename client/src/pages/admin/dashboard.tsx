import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StatsCard } from "@/components/admin/stats-card";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import {
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Eye,
  CalendarIcon,
  X,
} from "lucide-react";
import { format, startOfDay, endOfDay, subDays, startOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@shared/schema";
import type { DateRange } from "react-day-picker";

interface DashboardStats {
  ordersToday: number;
  ordersTotal: number;
  revenueToday: number;
  revenueTotal: number;
  productsCount: number;
  pendingOrders: number;
  ordersInPeriod?: number;
  revenueInPeriod?: number;
}

const DATE_PRESETS = [
  { label: "Aujourd'hui", getValue: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: "Hier", getValue: () => ({ from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) }) },
  { label: "7 derniers jours", getValue: () => ({ from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) }) },
  { label: "30 derniers jours", getValue: () => ({ from: startOfDay(subDays(new Date(), 29)), to: endOfDay(new Date()) }) },
  { label: "Ce mois", getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Mois dernier", getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
];

export default function AdminDashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const dateParams = dateRange?.from && dateRange?.to
    ? `?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`
    : "";

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard", dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async () => {
      const res = await fetch(`/api/admin/dashboard${dateParams}`);
      if (!res.ok) throw new Error("Erreur lors du chargement des statistiques");
      return res.json();
    },
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders/recent", dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders/recent${dateParams}`);
      if (!res.ok) throw new Error("Erreur lors du chargement des commandes");
      return res.json();
    },
  });

  const handlePresetClick = (preset: typeof DATE_PRESETS[0]) => {
    setDateRange(preset.getValue());
    setIsCalendarOpen(false);
  };

  const clearDateFilter = () => {
    setDateRange(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble de votre activité
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal gap-2",
                  !dateRange && "text-muted-foreground"
                )}
                data-testid="button-date-filter"
              >
                <CalendarIcon className="h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd MMM", { locale: fr })} -{" "}
                      {format(dateRange.to, "dd MMM yyyy", { locale: fr })}
                    </>
                  ) : (
                    format(dateRange.from, "dd MMM yyyy", { locale: fr })
                  )
                ) : (
                  "Filtrer par date"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex">
                <div className="border-r p-2 space-y-1">
                  {DATE_PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-sm"
                      onClick={() => handlePresetClick(preset)}
                      data-testid={`preset-${preset.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <div className="p-3">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                    locale={fr}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {dateRange && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearDateFilter}
              data-testid="button-clear-date-filter"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
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
            title={dateRange ? "Commandes (période)" : "Commandes aujourd'hui"}
            value={dateRange ? (stats?.ordersInPeriod ?? stats?.ordersToday ?? 0) : (stats?.ordersToday || 0)}
            description={`${stats?.ordersTotal || 0} au total`}
            icon={ShoppingCart}
          />
          <StatsCard
            title={dateRange ? "Revenu (période)" : "Revenu aujourd'hui"}
            value={`${(dateRange ? (stats?.revenueInPeriod ?? stats?.revenueToday ?? 0) : (stats?.revenueToday || 0)).toFixed(2)} DH`}
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
