import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ShippingLabelsTable } from "@/components/admin/shipping-labels-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RefreshCw, Truck, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface SyncResult {
  sent?: number;
  synced?: number;
  errors: number;
  details: string[];
}

export default function AdminShippingLabelsPage() {
  const { toast } = useToast();
  const [syncDetails, setSyncDetails] = useState<string[]>([]);

  const syncConfirmedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/carrier/sync-confirmed");
      return res.json();
    },
    onSuccess: (data: SyncResult) => {
      setSyncDetails(data.details);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shipping-labels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Synchronisation terminée",
        description: `${data.sent || 0} commandes envoyées, ${data.errors} erreurs`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de synchronisation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncStatusesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/carrier/sync-statuses");
      return res.json();
    },
    onSuccess: (data: SyncResult) => {
      setSyncDetails(data.details);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shipping-labels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Statuts synchronisés",
        description: `${data.synced || 0} mises à jour, ${data.errors} erreurs`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de synchronisation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: pendingOrders } = useQuery<any[]>({
    queryKey: ["/api/admin/orders"],
    select: (orders) => orders?.filter((o: any) => o.status === "CONFIRMEE") || [],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Étiquettes d'expédition</h1>
          <p className="text-muted-foreground mt-1">
            Gérez et imprimez vos étiquettes de livraison
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => syncStatusesMutation.mutate()}
            disabled={syncStatusesMutation.isPending}
            className="gap-2"
            data-testid="button-sync-statuses"
          >
            {syncStatusesMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Synchroniser statuts
          </Button>

          <Button
            onClick={() => syncConfirmedMutation.mutate()}
            disabled={syncConfirmedMutation.isPending || (pendingOrders?.length ?? 0) === 0}
            className="gap-2"
            data-testid="button-sync-confirmed"
          >
            {syncConfirmedMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Envoyer au transporteur
            {(pendingOrders?.length ?? 0) > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingOrders?.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {pendingOrders && pendingOrders.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-lg">Commandes en attente d'envoi</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              {pendingOrders.length} commande(s) confirmée(s) prête(s) à être envoyée(s) au transporteur.
            </p>
            <div className="flex flex-wrap gap-2">
              {pendingOrders.slice(0, 5).map((order: any) => (
                <Badge key={order.id} variant="outline">
                  #{order.id} - {order.customerName}
                </Badge>
              ))}
              {pendingOrders.length > 5 && (
                <Badge variant="secondary">+{pendingOrders.length - 5} autres</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {syncDetails.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Résultat de la synchronisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {syncDetails.map((detail, index) => (
                <div
                  key={index}
                  className={`text-sm flex items-center gap-2 ${
                    detail.includes("Error") || detail.includes("Failed")
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {detail.includes("Error") || detail.includes("Failed") ? (
                    <AlertCircle className="h-3 w-3 shrink-0" />
                  ) : (
                    <CheckCircle className="h-3 w-3 shrink-0 text-green-600" />
                  )}
                  {detail}
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setSyncDetails([])}
            >
              Fermer
            </Button>
          </CardContent>
        </Card>
      )}

      <ShippingLabelsTable />
    </div>
  );
}
