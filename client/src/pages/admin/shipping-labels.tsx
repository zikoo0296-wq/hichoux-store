import { ShippingLabelsTable } from "@/components/admin/shipping-labels-table";

export default function AdminShippingLabelsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Étiquettes d'expédition</h1>
        <p className="text-muted-foreground mt-1">
          Gérez et imprimez vos étiquettes de livraison
        </p>
      </div>

      <ShippingLabelsTable />
    </div>
  );
}
