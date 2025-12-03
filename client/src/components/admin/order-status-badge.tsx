import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@shared/schema";

const statusConfig: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  NOUVELLE: { label: "Nouvelle", variant: "default" },
  EN_ATTENTE: { label: "En attente", variant: "secondary" },
  CONFIRMEE: { label: "Confirmée", variant: "default" },
  ANNULEE: { label: "Annulée", variant: "destructive" },
  INJOIGNABLE: { label: "Injoignable", variant: "outline" },
  ENVOYEE: { label: "Envoyée", variant: "default" },
  LIVREE: { label: "Livrée", variant: "default" },
};

const statusColors: Record<OrderStatus, string> = {
  NOUVELLE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900",
  EN_ATTENTE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900",
  CONFIRMEE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900",
  ANNULEE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900",
  INJOIGNABLE: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 hover:bg-orange-100 dark:hover:bg-orange-900",
  ENVOYEE: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900",
  LIVREE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900",
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: "secondary" as const };
  const colorClass = statusColors[status] || "";

  return (
    <Badge 
      variant={config.variant}
      className={`${colorClass} no-default-hover-elevate no-default-active-elevate`}
      data-testid={`badge-status-${status.toLowerCase()}`}
    >
      {config.label}
    </Badge>
  );
}
