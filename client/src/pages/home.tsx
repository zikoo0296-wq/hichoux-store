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
import { useI18n } from "@/lib/i18n";
import type { Product, Category } from "@shared/schema";

type ProductWithCategory = Product & { category?: Category | null };

export default function HomePage() {
  const { t, isRTL } = useI18n();

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

        {/* Products Section FIRST */}
        <section className="max-w-7xl mx-auto px-4 py-6 sm:py-12">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">{t("products.featured")}</h2>
              <p className="text-muted-foreground text-sm mt-1">{t("products.featuredDesc")}</p>
            </div>
            <Link href="/products">
              <Button variant="ghost" className="gap-2" data-testid="link-all-products">
                {t("common.viewAll")}
                <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
              </Button>
            </Link>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
              ))}
            </div>
          ) : featuredProducts && featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-xl">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium">{t("products.noProducts")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t("products.comingSoon")}</p>
            </div>
          )}
        </section>

        {/* Categories Section SECOND */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">{t("categories.title")}</h2>
              <p className="text-muted-foreground text-sm mt-1">{t("categories.titleDesc")}</p>
            </div>
            <Link href="/categories">
              <Button variant="ghost" className="gap-2" data-testid="link-all-categories">
                {t("common.viewAll")}
                <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
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
              <p className="text-muted-foreground">{t("categories.noCategories")}</p>
            </div>
          )}
        </section>

        {/* CTA Section - simplified without free delivery mention */}
        <section className="bg-primary text-primary-foreground py-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-xl md:text-2xl font-bold mb-3">{t("home.deliverySection")}</h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-6 text-sm">{t("home.deliverySectionDesc")}</p>
            <Link href="/products">
              <Button size="lg" variant="secondary" className="gap-2" data-testid="button-cta-shop">
                {t("home.startShopping")}
                <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
