import { OrdersTable } from "@/components/admin/orders-table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function AdminOrdersPage() {
  const handleExportCSV = () => {
    window.location.href = "/api/admin/orders/export/csv";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Commandes</h1>
          <p className="text-muted-foreground mt-1">
            Gérez et suivez toutes vos commandes
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      <OrdersTable />
    </div>
  );
}
