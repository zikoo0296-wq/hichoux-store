import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Search,
  Eye,
  CheckCircle,
  AlertCircle,
  Phone,
} from "lucide-react";
import type { Order } from "@shared/schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ConfirmationPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
  });

  const confirmMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/admin/orders/${id}/confirm`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Commande confirmée",
        description: "La commande a été confirmée avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    },
  });

  const markUnreachableMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/admin/orders/${id}/mark-unreachable`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Marquée comme injoignable",
        description: "La commande a été marquée comme injoignable.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    },
  });

  // Filter for NOUVELLE status only
  const newOrders = orders?.filter((order) => order.status === "NOUVELLE") || [];

  const filteredOrders = newOrders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone.includes(searchQuery) ||
      order.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toString().includes(searchQuery);
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Confirmation des Commandes</h1>
          <p className="text-muted-foreground mt-1">
            Confirmez les nouvelles commandes avec les clients
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Nouvelles Commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Confirmation des Commandes</h1>
        <p className="text-muted-foreground mt-1">
          Confirmez les nouvelles commandes avec les clients
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Nouvelles Commandes à Confirmer</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredOrders.length} commande{filteredOrders.length !== 1 ? "s" : ""} en attente de confirmation
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold text-lg">{filteredOrders.length}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Chercher par nom, téléphone, ville ou numéro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-confirmation"
            />
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3 opacity-50" />
              <p className="text-muted-foreground font-medium">
                Aucune commande en attente
              </p>
              <p className="text-sm text-muted-foreground">
                Tous les clients ont confirmé leur commande
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{order.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a href={`tel:${order.phone}`} className="text-primary hover:underline">
                          {order.phone}
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{order.address}</p>
                          <p className="text-muted-foreground">{order.city}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {order.totalAmount} DH
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.createdAt), "dd MMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            data-testid={`button-view-${order.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          onClick={() => confirmMutation.mutate(order.id)}
                          disabled={confirmMutation.isPending}
                          data-testid={`button-confirm-${order.id}`}
                          className="gap-1"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Confirmer
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => markUnreachableMutation.mutate(order.id)}
                          disabled={markUnreachableMutation.isPending}
                          data-testid={`button-unreachable-${order.id}`}
                          className="gap-1"
                        >
                          <Phone className="h-4 w-4" />
                          Injoignable
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
