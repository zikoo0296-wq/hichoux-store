import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ShippingLabelsTable } from "@/components/admin/shipping-labels-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RefreshCw, Truck, Send, CheckCircle, AlertCircle, Loader2, XCircle, RotateCcw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SyncOrderResult {
  orderId: number;
  customerName: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  trackingNumber?: string;
}

interface SyncResult {
  sent?: number;
  synced?: number;
  errors: number;
  details: string[];
  results?: SyncOrderResult[];
}

export default function AdminShippingLabelsPage() {
  const { toast } = useToast();
  const [syncDetails, setSyncDetails] = useState<string[]>([]);
  const [syncResults, setSyncResults] = useState<SyncOrderResult[]>([]);

  const failedOrders = syncResults.filter(r => r.status === 'error');
  const successOrders = syncResults.filter(r => r.status === 'success');

  const syncConfirmedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/carrier/sync-confirmed");
      return res.json();
    },
    onSuccess: (data: SyncResult) => {
      setSyncDetails(data.details);
      setSyncResults(data.results || []);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shipping-labels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Synchronisation terminée",
        description: `${data.sent || 0} commandes envoyées, ${data.errors} erreurs`,
        variant: data.errors > 0 ? "destructive" : "default",
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

  const [retryingId, setRetryingId] = useState<number | null>(null);
  
  const retryOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      setRetryingId(orderId);
      const res = await apiRequest("POST", `/api/admin/orders/${orderId}/send-to-carrier`);
      return res.json();
    },
    onSuccess: (data, orderId) => {
      setRetryingId(null);
      // Remove from results by updating the status
      setSyncResults(prev => prev.filter(o => o.orderId !== orderId));
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shipping-labels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Commande envoyée",
        description: data.trackingNumber ? `Numéro de suivi: ${data.trackingNumber}` : "Envoyée avec succès",
      });
    },
    onError: (error: Error) => {
      setRetryingId(null);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
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

      {failedOrders.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-lg">Commandes non envoyées</CardTitle>
                <Badge variant="destructive">{failedOrders.length}</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSyncResults([]);
                  setSyncDetails([]);
                }}
              >
                Fermer
              </Button>
            </div>
            <CardDescription>
              Ces commandes ont échoué. Corrigez les erreurs et réessayez.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20"># Cmd</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Erreur</TableHead>
                  <TableHead className="w-24 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failedOrders.map((order) => (
                  <TableRow key={order.orderId}>
                    <TableCell className="font-medium">#{order.orderId}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell className="text-destructive text-sm">{order.message}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retryOrderMutation.mutate(order.orderId)}
                        disabled={retryingId === order.orderId}
                        data-testid={`button-retry-order-${order.orderId}`}
                      >
                        {retryingId === order.orderId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {successOrders.length > 0 && failedOrders.length === 0 && (
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Synchronisation réussie</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSyncResults([]);
                  setSyncDetails([]);
                }}
              >
                Fermer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {successOrders.length} commande(s) envoyée(s) au transporteur avec succès.
            </p>
          </CardContent>
        </Card>
      )}

      <ShippingLabelsTable />
    </div>
  );
}
