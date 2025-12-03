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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "./order-status-badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  PhoneOff,
  Truck,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import type { Order, OrderStatus, ORDER_STATUSES } from "@shared/schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function OrdersTable() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: string }) => {
      const response = await apiRequest("POST", `/api/admin/orders/${id}/${action}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la commande a été modifié avec succès.",
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

  const syncToSheetsMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/admin/orders/${id}/sync-sheets`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Synchronisation réussie",
        description: "La commande a été ajoutée à Google Sheets.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de synchronisation",
        description: error.message || "Impossible de synchroniser avec Google Sheets.",
        variant: "destructive",
      });
    },
  });

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone.includes(searchQuery) ||
      order.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toString().includes(searchQuery);

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getOrderActions = (order: Order) => {
    const actions = [];

    if (order.status === "NOUVELLE" || order.status === "EN_ATTENTE") {
      actions.push({
        label: "Confirmer",
        icon: CheckCircle,
        action: "confirm",
        variant: "default" as const,
      });
    }

    if (order.status !== "ANNULEE" && order.status !== "LIVREE") {
      actions.push({
        label: "Annuler",
        icon: XCircle,
        action: "cancel",
        variant: "destructive" as const,
      });
    }

    if (order.status === "NOUVELLE" || order.status === "EN_ATTENTE") {
      actions.push({
        label: "Injoignable",
        icon: PhoneOff,
        action: "mark-unreachable",
        variant: "secondary" as const,
      });
    }

    if (order.status === "CONFIRMEE") {
      actions.push({
        label: "Envoyer au transporteur",
        icon: Truck,
        action: "send-to-carrier",
        variant: "default" as const,
      });
    }

    if (order.status === "ENVOYEE") {
      actions.push({
        label: "Marquer livrée",
        icon: CheckCircle,
        action: "mark-delivered",
        variant: "default" as const,
      });
    }

    return actions;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Commandes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle>Commandes ({filteredOrders?.length || 0})</CardTitle>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-[200px]"
              data-testid="input-search-orders"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]" data-testid="select-status-filter">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="NOUVELLE">Nouvelle</SelectItem>
              <SelectItem value="EN_ATTENTE">En attente</SelectItem>
              <SelectItem value="CONFIRMEE">Confirmée</SelectItem>
              <SelectItem value="ANNULEE">Annulée</SelectItem>
              <SelectItem value="INJOIGNABLE">Injoignable</SelectItem>
              <SelectItem value="ENVOYEE">Envoyée</SelectItem>
              <SelectItem value="LIVREE">Livrée</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredOrders && filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                  <TableHead className="hidden lg:table-cell">Ville</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{order.customerName}</span>
                        <span className="text-xs text-muted-foreground md:hidden">
                          {order.phone}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{order.phone}</TableCell>
                    <TableCell className="hidden lg:table-cell">{order.city}</TableCell>
                    <TableCell className="font-medium">
                      {parseFloat(order.totalPrice).toFixed(2)} DH
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status as OrderStatus} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {format(new Date(order.createdAt), "dd MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!order.syncedToSheets && order.status === "CONFIRMEE" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => syncToSheetsMutation.mutate(order.id)}
                            disabled={syncToSheetsMutation.isPending}
                            title="Sync to Google Sheets"
                            data-testid={`button-sync-${order.id}`}
                          >
                            <FileSpreadsheet className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button variant="ghost" size="icon" data-testid={`button-view-${order.id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-actions-${order.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/orders/${order.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir les détails
                              </Link>
                            </DropdownMenuItem>
                            {getOrderActions(order).map((action) => (
                              <DropdownMenuItem
                                key={action.action}
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: order.id,
                                    action: action.action,
                                  })
                                }
                                disabled={updateStatusMutation.isPending}
                                className={action.variant === "destructive" ? "text-destructive" : ""}
                              >
                                <action.icon className="h-4 w-4 mr-2" />
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium">Aucune commande trouvée</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery || statusFilter !== "all"
                ? "Essayez de modifier vos filtres"
                : "Les nouvelles commandes apparaîtront ici"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
