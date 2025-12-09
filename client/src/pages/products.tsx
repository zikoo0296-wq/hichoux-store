import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { ProductCard } from "@/components/public/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Package, SlidersHorizontal } from "lucide-react";
import { useState, useMemo } from "react";
import type { Product, Category } from "@shared/schema";

type ProductWithCategory = Product & { category?: Category | null };

export default function ProductsPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const categorySlug = params.get("category");

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedCategory, setSelectedCategory] = useState<string>(categorySlug || "all");

  const { data: products, isLoading: productsLoading } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let filtered = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory && selectedCategory !== "all") {
      const category = categories?.find((c) => c.slug === selectedCategory);
      if (category) {
        filtered = filtered.filter((p) => p.categoryId === category.id);
      }
    }

    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case "price-desc":
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case "name":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "newest":
      default:
        filtered.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, sortBy, categories]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSortBy("newest");
  };

  const hasActiveFilters =
    searchQuery || selectedCategory !== "all" || sortBy !== "newest";

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        <div className="bg-muted/30 border-b">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Nos Produits</h1>
            <p className="text-muted-foreground">
              Découvrez notre sélection de produits de qualité
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            <aside className="lg:w-64 shrink-0">
              <div className="sticky top-24 space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Rechercher</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-products"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Catégorie</label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger data-testid="select-category-filter">
                      <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.slug}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Trier par</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger data-testid="select-sort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Plus récents</SelectItem>
                      <SelectItem value="price-asc">Prix croissant</SelectItem>
                      <SelectItem value="price-desc">Prix décroissant</SelectItem>
                      <SelectItem value="name">Alphabétique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full gap-2"
                    data-testid="button-clear-filters"
                  >
                    <X className="h-4 w-4" />
                    Effacer les filtres
                  </Button>
                )}
              </div>
            </aside>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {filteredProducts.length} produit(s)
                  </span>
                  {selectedCategory !== "all" && (
                    <Badge variant="secondary">
                      {categories?.find((c) => c.slug === selectedCategory)?.name}
                    </Badge>
                  )}
                </div>
              </div>

              {productsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
                  ))}
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-muted/30 rounded-xl">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium">Aucun produit trouvé</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Essayez de modifier vos filtres
                  </p>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="mt-4"
                    >
                      Effacer les filtres
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
