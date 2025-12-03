import { ProductsTable } from "@/components/admin/products-table";

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Produits</h1>
        <p className="text-muted-foreground mt-1">
          Gérez votre catalogue de produits
        </p>
      </div>

      <ProductsTable />
    </div>
  );
}
