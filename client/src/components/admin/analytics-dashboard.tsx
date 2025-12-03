import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "./stats-card";
import {
  DollarSign,
  TrendingUp,
  Package,
  Truck,
  Download,
  Calendar,
  Plus,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface AnalyticsData {
  revenue: number;
  productCosts: number;
  deliveryCosts: number;
  adCosts: number;
  profit: number;
  ordersCount: number;
  topProducts: Array<{
    id: number;
    title: string;
    image: string | null;
    quantity: number;
    revenue: number;
  }>;
  ordersByDay: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
}

export function AnalyticsDashboard() {
  const { toast } = useToast();
  const today = new Date();
  const [startDate, setStartDate] = useState(format(startOfMonth(today), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(today), "yyyy-MM-dd"));
  const [adCostDialogOpen, setAdCostDialogOpen] = useState(false);
  const [newAdCost, setNewAdCost] = useState({ amount: "", description: "", date: format(today, "yyyy-MM-dd") });

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics", startDate, endDate],
  });

  const addAdCostMutation = useMutation({
    mutationFn: async (data: { amount: string; description: string; date: string }) => {
      const response = await apiRequest("POST", "/api/admin/ad-costs", {
        amount: data.amount,
        description: data.description || null,
        date: data.date,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      toast({
        title: "Coût publicitaire ajouté",
        description: "Le coût a été ajouté avec succès.",
      });
      setAdCostDialogOpen(false);
      setNewAdCost({ amount: "", description: "", date: format(today, "yyyy-MM-dd") });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter le coût.",
        variant: "destructive",
      });
    },
  });

  const handleExport = async () => {
    try {
      const response = await fetch(
        `/api/admin/analytics/export?startDate=${startDate}&endDate=${endDate}`,
        { credentials: "include" }
      );
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rapport-${startDate}-${endDate}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter le rapport.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Période d'analyse</CardTitle>
            <CardDescription>
              Sélectionnez une période pour voir les statistiques
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="startDate" className="sr-only">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto"
                data-testid="input-start-date"
              />
              <span className="text-muted-foreground">à</span>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto"
                data-testid="input-end-date"
              />
            </div>
            <Button variant="outline" onClick={handleExport} className="gap-2" data-testid="button-export">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Revenu total"
          value={`${(analytics?.revenue || 0).toFixed(2)} DH`}
          icon={DollarSign}
          description={`${analytics?.ordersCount || 0} commandes`}
        />
        <StatsCard
          title="Coût produits"
          value={`${(analytics?.productCosts || 0).toFixed(2)} DH`}
          icon={Package}
        />
        <StatsCard
          title="Coût livraison"
          value={`${(analytics?.deliveryCosts || 0).toFixed(2)} DH`}
          icon={Truck}
        />
        <StatsCard
          title="Coût publicité"
          value={`${(analytics?.adCosts || 0).toFixed(2)} DH`}
          icon={TrendingUp}
        />
        <Card className={`${(analytics?.profit || 0) >= 0 ? "border-green-200 dark:border-green-900" : "border-red-200 dark:border-red-900"}`}>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Profit net
            </CardTitle>
            <div className={`p-2 rounded-lg ${(analytics?.profit || 0) >= 0 ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}>
              <TrendingUp className={`h-4 w-4 ${(analytics?.profit || 0) >= 0 ? "text-green-600" : "text-red-600"}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(analytics?.profit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
              {(analytics?.profit || 0).toFixed(2)} DH
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commandes par jour</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.ordersByDay && analytics.ordersByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.ordersByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), "dd/MM", { locale: fr })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    labelFormatter={(value) => format(new Date(value), "dd MMMM yyyy", { locale: fr })}
                    formatter={(value: number, name: string) => [
                      name === "count" ? `${value} commandes` : `${value.toFixed(2)} DH`,
                      name === "count" ? "Commandes" : "Revenu",
                    ]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée pour cette période
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenu par jour</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.ordersByDay && analytics.ordersByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.ordersByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), "dd/MM", { locale: fr })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    labelFormatter={(value) => format(new Date(value), "dd MMMM yyyy", { locale: fr })}
                    formatter={(value: number) => [`${value.toFixed(2)} DH`, "Revenu"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-2))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée pour cette période
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top 10 Produits</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.topProducts && analytics.topProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-right">Qté</TableHead>
                    <TableHead className="text-right">Revenu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topProducts.map((product, index) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-muted overflow-hidden shrink-0">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <span className="truncate">{product.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{product.quantity}</TableCell>
                      <TableCell className="text-right font-medium">
                        {product.revenue.toFixed(2)} DH
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Aucune vente pour cette période
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Coûts publicitaires</CardTitle>
            <Dialog open={adCostDialogOpen} onOpenChange={setAdCostDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2" data-testid="button-add-ad-cost">
                  <Plus className="h-4 w-4" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  addAdCostMutation.mutate(newAdCost);
                }}>
                  <DialogHeader>
                    <DialogTitle>Ajouter un coût publicitaire</DialogTitle>
                    <DialogDescription>
                      Enregistrez vos dépenses publicitaires pour le suivi des profits
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="adAmount">Montant (DH) *</Label>
                      <Input
                        id="adAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newAdCost.amount}
                        onChange={(e) => setNewAdCost({ ...newAdCost, amount: e.target.value })}
                        placeholder="0.00"
                        required
                        data-testid="input-ad-amount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adDescription">Description</Label>
                      <Input
                        id="adDescription"
                        value={newAdCost.description}
                        onChange={(e) => setNewAdCost({ ...newAdCost, description: e.target.value })}
                        placeholder="Facebook Ads, Google Ads..."
                        data-testid="input-ad-description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adDate">Date *</Label>
                      <Input
                        id="adDate"
                        type="date"
                        value={newAdCost.date}
                        onChange={(e) => setNewAdCost({ ...newAdCost, date: e.target.value })}
                        required
                        data-testid="input-ad-date"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setAdCostDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={addAdCostMutation.isPending}>
                      {addAdCostMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Ajouter
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total période</p>
                    <p className="text-2xl font-bold">{(analytics?.adCosts || 0).toFixed(2)} DH</p>
                  </div>
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Ajoutez vos dépenses publicitaires (Facebook Ads, Google Ads, etc.)
                pour un suivi précis de vos profits.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
