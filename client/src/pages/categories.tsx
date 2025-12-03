import { useQuery } from "@tanstack/react-query";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { CategoryCard } from "@/components/public/category-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Folder } from "lucide-react";
import type { Product, Category } from "@shared/schema";

export default function CategoriesPage() {
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const getProductCount = (categoryId: number) => {
    return products?.filter((p) => p.categoryId === categoryId).length || 0;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        <div className="bg-muted/30 border-b">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Catégories</h1>
            <p className="text-muted-foreground">
              Parcourez nos différentes catégories de produits
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12">
          {categoriesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  productCount={getProductCount(category.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/30 rounded-xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Folder className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Aucune catégorie</h2>
              <p className="text-muted-foreground">
                Les catégories apparaîtront ici bientôt
              </p>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
