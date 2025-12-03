import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { ProductGallery } from "@/components/public/product-gallery";
import { OrderForm } from "@/components/public/order-form";
import { ProductCard } from "@/components/public/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ChevronLeft,
  Minus,
  Plus,
  Truck,
  Shield,
  CreditCard,
  CheckCircle,
  Package,
} from "lucide-react";
import { useState } from "react";
import type { Product, Category } from "@shared/schema";

type ProductWithCategory = Product & { category?: Category | null };

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = parseInt(params.id || "0");
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery<ProductWithCategory>({
    queryKey: ["/api/products", productId],
    enabled: !!productId,
  });

  const { data: allProducts } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const relatedProducts = allProducts
    ?.filter(
      (p) => p.id !== productId && p.categoryId === product?.categoryId
    )
    .slice(0, 4);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicHeader />
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid lg:grid-cols-2 gap-12">
              <Skeleton className="aspect-square rounded-xl" />
              <div className="space-y-6">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-[400px] w-full" />
              </div>
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Produit non trouvé</h1>
            <p className="text-muted-foreground mb-6">
              Le produit que vous recherchez n'existe pas ou a été supprimé.
            </p>
            <Link href="/products">
              <Button>Retour aux produits</Button>
            </Link>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const price = parseFloat(product.price);
  const images = product.images || [];
  const inStock = product.stock > 0;

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Accueil</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/products">Produits</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {product.category && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={`/products?category=${product.category.slug}`}>
                        {product.category.name}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{product.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-16">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <ProductGallery images={images} title={product.title} />
            </div>

            <div className="space-y-6">
              <div>
                {product.category && (
                  <Link href={`/products?category=${product.category.slug}`}>
                    <Badge variant="secondary" className="mb-3">
                      {product.category.name}
                    </Badge>
                  </Link>
                )}
                <h1 className="text-3xl font-bold" data-testid="text-product-title">
                  {product.title}
                </h1>
                {product.sku && (
                  <p className="text-sm text-muted-foreground mt-1">
                    SKU: {product.sku}
                  </p>
                )}
              </div>

              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-bold text-primary" data-testid="text-product-price">
                  {price.toFixed(2)} DH
                </span>
                {inStock ? (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>En stock ({product.stock} disponibles)</span>
                  </div>
                ) : (
                  <Badge variant="destructive">Rupture de stock</Badge>
                )}
              </div>

              {product.description && (
                <div className="prose prose-sm dark:prose-invert">
                  <p className="text-muted-foreground">{product.description}</p>
                </div>
              )}

              <Separator />

              {inStock && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Quantité:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={decrementQuantity}
                        disabled={quantity <= 1}
                        data-testid="button-quantity-minus"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-medium" data-testid="text-quantity">
                        {quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={incrementQuantity}
                        disabled={quantity >= product.stock}
                        data-testid="button-quantity-plus"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-4">
                    <div className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/50">
                      <Truck className="h-5 w-5 mb-2 text-primary" />
                      <span className="text-xs text-muted-foreground">Livraison 24-48h</span>
                    </div>
                    <div className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/50">
                      <CreditCard className="h-5 w-5 mb-2 text-primary" />
                      <span className="text-xs text-muted-foreground">Paiement COD</span>
                    </div>
                    <div className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/50">
                      <Shield className="h-5 w-5 mb-2 text-primary" />
                      <span className="text-xs text-muted-foreground">Garantie qualité</span>
                    </div>
                  </div>

                  <OrderForm product={product} quantity={quantity} />
                </div>
              )}

              {!inStock && (
                <div className="p-6 rounded-lg bg-muted/50 text-center">
                  <Package className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <h3 className="font-medium mb-1">Produit temporairement indisponible</h3>
                  <p className="text-sm text-muted-foreground">
                    Ce produit est actuellement en rupture de stock.
                    Revenez bientôt!
                  </p>
                </div>
              )}
            </div>
          </div>

          {relatedProducts && relatedProducts.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold mb-6">Produits similaires</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
