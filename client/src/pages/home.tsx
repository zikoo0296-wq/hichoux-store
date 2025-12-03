import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { Hero } from "@/components/public/hero";
import { ProductCard } from "@/components/public/product-card";
import { CategoryCard } from "@/components/public/category-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Package } from "lucide-react";
import type { Product, Category } from "@shared/schema";

type ProductWithCategory = Product & { category?: Category | null };

export default function HomePage() {
  const { data: products, isLoading: productsLoading } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const featuredProducts = products?.slice(0, 8);

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      
      <main className="flex-1">
        <Hero />

        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Catégories</h2>
              <p className="text-muted-foreground mt-1">
                Parcourez nos différentes catégories
              </p>
            </div>
            <Link href="/categories">
              <Button variant="ghost" className="gap-2" data-testid="link-all-categories">
                Voir tout
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {categoriesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.slice(0, 4).map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  productCount={products?.filter((p) => p.categoryId === category.id).length}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-xl">
              <p className="text-muted-foreground">Aucune catégorie disponible</p>
            </div>
          )}
        </section>

        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Produits populaires</h2>
              <p className="text-muted-foreground mt-1">
                Découvrez nos meilleures ventes
              </p>
            </div>
            <Link href="/products">
              <Button variant="ghost" className="gap-2" data-testid="link-all-products">
                Voir tout
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
              ))}
            </div>
          ) : featuredProducts && featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/30 rounded-xl">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium">Aucun produit disponible</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Les produits apparaîtront ici bientôt
              </p>
            </div>
          )}
        </section>

        <section className="bg-primary text-primary-foreground py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Livraison partout au Maroc
            </h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Commandez en toute confiance. Paiement à la livraison (COD) sans engagement.
              Livraison rapide sous 24-48h dans toutes les villes du Maroc.
            </p>
            <Link href="/products">
              <Button size="lg" variant="secondary" className="gap-2" data-testid="button-cta-shop">
                Commencer vos achats
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
