import { CategoriesTable } from "@/components/admin/categories-table";

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Catégories</h1>
        <p className="text-muted-foreground mt-1">
          Organisez vos produits par catégories
        </p>
      </div>

      <CategoriesTable />
    </div>
  );
}
