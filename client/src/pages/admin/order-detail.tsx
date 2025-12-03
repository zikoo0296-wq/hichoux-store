import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  PhoneOff,
  Truck,
  FileSpreadsheet,
  Phone,
  MapPin,
  User,
  Package,
  Download,
  Printer,
  Loader2,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { OrderWithItems, OrderStatus } from "@shared/schema";

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = parseInt(params.id || "0");
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: order, isLoading } = useQuery<OrderWithItems>({
    queryKey: ["/api/admin/orders", orderId],
    enabled: !!orderId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (action: string) => {
      const response = await apiRequest("POST", `/api/admin/orders/${orderId}/${action}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders", orderId] });
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
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/admin/orders/${orderId}/sync-sheets`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders", orderId] });
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

  const generateWhatsAppMessage = () => {
    if (!order) return "";
    const items = order.items
      ?.map((item) => `- ${item.product?.title || "Produit"} x${item.quantity}`)
      .join("\n");

    const message = `Bonjour ${order.customerName},

Votre commande #${order.id} a été confirmée!

${items}

Total: ${parseFloat(order.totalPrice).toFixed(2)} DH

Merci pour votre confiance!`;

    return encodeURIComponent(message);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[300px] lg:col-span-2" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Commande non trouvée</h2>
        <p className="text-muted-foreground mb-4">
          La commande que vous recherchez n'existe pas.
        </p>
        <Link href="/admin/orders">
          <Button>Retour aux commandes</Button>
        </Link>
      </div>
    );
  }

  const canConfirm = order.status === "NOUVELLE" || order.status === "EN_ATTENTE";
  const canCancel = order.status !== "ANNULEE" && order.status !== "LIVREE";
  const canMarkUnreachable = order.status === "NOUVELLE" || order.status === "EN_ATTENTE";
  const canSendToCarrier = order.status === "CONFIRMEE";
  const canSync = !order.syncedToSheets && order.status === "CONFIRMEE";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Commande #{order.id}</h1>
            <OrderStatusBadge status={order.status as OrderStatus} />
            {order.syncedToSheets && (
              <Badge variant="outline" className="gap-1">
                <FileSpreadsheet className="h-3 w-3" />
                Synchronisée
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Créée le {format(new Date(order.createdAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations client
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nom</p>
                  <p className="font-medium">{order.customerName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <a
                      href={`tel:${order.phone}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {order.phone}
                    </a>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Adresse</p>
                    <p className="font-medium">{order.address}</p>
                    <p className="font-medium">{order.city}</p>
                  </div>
                </div>
                {order.notes && (
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="font-medium">{order.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produits commandés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                      {item.product?.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product?.title || ""}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {item.product?.title || "Produit supprimé"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {parseFloat(item.unitPrice).toFixed(2)} DH × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {(parseFloat(item.unitPrice) * item.quantity).toFixed(2)} DH
                      </p>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-primary">
                    {parseFloat(order.totalPrice).toFixed(2)} DH
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {order.shippingLabel && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Étiquette d'expédition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">
                      {order.shippingLabel.providerName || "Transporteur standard"}
                    </p>
                    {order.shippingLabel.trackingNumber && (
                      <p className="text-sm text-muted-foreground">
                        N° de suivi: {order.shippingLabel.trackingNumber}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Télécharger
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Printer className="h-4 w-4" />
                      Imprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canConfirm && (
                <Button
                  className="w-full gap-2"
                  onClick={() => updateStatusMutation.mutate("confirm")}
                  disabled={updateStatusMutation.isPending}
                  data-testid="button-confirm-order"
                >
                  {updateStatusMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Confirmer la commande
                </Button>
              )}

              {canSync && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => syncToSheetsMutation.mutate()}
                  disabled={syncToSheetsMutation.isPending}
                  data-testid="button-sync-sheets"
                >
                  {syncToSheetsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4" />
                  )}
                  Sync Google Sheets
                </Button>
              )}

              {canSendToCarrier && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => updateStatusMutation.mutate("send-to-carrier")}
                  disabled={updateStatusMutation.isPending}
                  data-testid="button-send-carrier"
                >
                  {updateStatusMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Truck className="h-4 w-4" />
                  )}
                  Envoyer au transporteur
                </Button>
              )}

              {canMarkUnreachable && (
                <Button
                  variant="secondary"
                  className="w-full gap-2"
                  onClick={() => updateStatusMutation.mutate("mark-unreachable")}
                  disabled={updateStatusMutation.isPending}
                  data-testid="button-mark-unreachable"
                >
                  <PhoneOff className="h-4 w-4" />
                  Injoignable / Rappeler
                </Button>
              )}

              {canCancel && (
                <Button
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={() => updateStatusMutation.mutate("cancel")}
                  disabled={updateStatusMutation.isPending}
                  data-testid="button-cancel-order"
                >
                  <XCircle className="h-4 w-4" />
                  Annuler la commande
                </Button>
              )}

              <Separator />

              <a
                href={`https://wa.me/${order.phone.replace(/\D/g, "")}?text=${generateWhatsAppMessage()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full gap-2">
                  <SiWhatsapp className="h-4 w-4" />
                  Contacter via WhatsApp
                </Button>
              </a>

              <a href={`tel:${order.phone}`} className="block">
                <Button variant="outline" className="w-full gap-2">
                  <Phone className="h-4 w-4" />
                  Appeler le client
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Historique
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Commande créée</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
                {order.updatedAt !== order.createdAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Dernière mise à jour</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.updatedAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
