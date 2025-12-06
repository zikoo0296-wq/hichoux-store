import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Printer, Truck, Package, ExternalLink, Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "wouter";
import { OrderStatusBadge } from "./order-status-badge";
import { useToast } from "@/hooks/use-toast";
import type { ShippingLabel, Order, OrderStatus } from "@shared/schema";

type ShippingLabelWithOrder = ShippingLabel & { order: Order };

export function ShippingLabelsTable() {
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  
  const { data: labels, isLoading } = useQuery<ShippingLabelWithOrder[]>({
    queryKey: ["/api/admin/shipping-labels"],
  });

  const handleDownload = async (label: ShippingLabelWithOrder) => {
    // If we have local content, use it directly
    if (label.pdfBase64) {
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${label.pdfBase64}`;
      link.download = `etiquette-${label.trackingNumber || label.orderId}.pdf`;
      link.click();
      return;
    }
    
    // For DIGYLOG labels with tracking, fetch from API
    if (label.providerName === 'DIGYLOG' && label.trackingNumber) {
      try {
        setDownloadingId(label.id);
        const response = await fetch(`/api/admin/shipping-labels/${label.id}/download`);
        
        if (!response.ok) {
          let errorMsg = 'Erreur lors du téléchargement';
          try {
            const error = await response.json();
            errorMsg = error.error || errorMsg;
          } catch {
            errorMsg = await response.text() || errorMsg;
          }
          throw new Error(errorMsg);
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `etiquette-${label.trackingNumber}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: "Étiquette téléchargée",
          description: `Étiquette ${label.trackingNumber} prête`,
        });
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: error.message || "Impossible de télécharger l'étiquette",
          variant: "destructive",
        });
      } finally {
        setDownloadingId(null);
      }
      return;
    }
    
    // Fallback to label URL
    if (label.labelUrl) {
      window.open(label.labelUrl, "_blank");
    } else {
      toast({
        title: "Aucune étiquette",
        description: "Cette commande n'a pas encore d'étiquette disponible",
        variant: "destructive",
      });
    }
  };

  const handlePrint = async (label: ShippingLabelWithOrder) => {
    // If we have local content, use it directly
    if (label.pdfBase64) {
      const blob = new Blob(
        [Uint8Array.from(atob(label.pdfBase64), (c) => c.charCodeAt(0))],
        { type: "application/pdf" }
      );
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      return;
    }
    
    // For DIGYLOG labels, fetch and print
    if (label.providerName === 'DIGYLOG' && label.trackingNumber) {
      try {
        setDownloadingId(label.id);
        const response = await fetch(`/api/admin/shipping-labels/${label.id}/download`);
        
        if (!response.ok) {
          let errorMsg = 'Erreur lors du téléchargement';
          try {
            const error = await response.json();
            errorMsg = error.error || errorMsg;
          } catch {
            errorMsg = await response.text() || errorMsg;
          }
          throw new Error(errorMsg);
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url, "_blank");
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: error.message || "Impossible d'imprimer l'étiquette",
          variant: "destructive",
        });
      } finally {
        setDownloadingId(null);
      }
      return;
    }
    
    // Fallback to label URL
    if (label.labelUrl) {
      const printWindow = window.open(label.labelUrl, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Étiquettes d'expédition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Étiquettes d'expédition ({labels?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {labels && labels.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden md:table-cell">Transporteur</TableHead>
                  <TableHead className="hidden lg:table-cell">N° de suivi</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labels.map((label) => (
                  <TableRow key={label.id} data-testid={`row-label-${label.id}`}>
                    <TableCell className="font-medium">
                      #{label.orderId}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{label.order?.customerName}</span>
                        <span className="text-xs text-muted-foreground">
                          {label.order?.city}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {label.order?.status && (
                        <OrderStatusBadge status={label.order.status as OrderStatus} />
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary">
                        {label.providerName || "Standard"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-sm">
                      {label.trackingNumber || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {format(new Date(label.createdAt), "dd MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/orders/${label.orderId}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Voir la commande"
                            data-testid={`button-view-order-${label.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(label)}
                          disabled={downloadingId === label.id}
                          title="Télécharger l'étiquette 10x10"
                          data-testid={`button-download-${label.id}`}
                        >
                          {downloadingId === label.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePrint(label)}
                          disabled={downloadingId === label.id}
                          title="Imprimer l'étiquette"
                          data-testid={`button-print-${label.id}`}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
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
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium">Aucune étiquette</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Les étiquettes apparaîtront ici après l'envoi des commandes
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
