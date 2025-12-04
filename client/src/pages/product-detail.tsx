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
  Minus,
  Plus,
  Truck,
  Shield,
  CreditCard,
  CheckCircle,
  Package,
} from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import type { Product, Category } from "@shared/schema";

type ProductWithCategory = Product & { category?: Category | null };

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = parseInt(params.id || "0");
  const [quantity, setQuantity] = useState(1);
  const { t } = useI18n();

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
              <Skeleton className="aspect-square rounded-2xl" />
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
            <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>المنتج غير موجود</h1>
            <p className="text-muted-foreground mb-6">
              المنتج الذي تبحث عنه غير موجود أو تم حذفه.
            </p>
            <Link href="/products">
              <Button className="rounded-full">{t("nav.products")}</Button>
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
                  <Link href="/">{t("nav.home")}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/products">{t("nav.products")}</Link>
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
                    <Badge variant="secondary" className="mb-3 rounded-full">
                      {product.category.name}
                    </Badge>
                  </Link>
                )}
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)' }} data-testid="text-product-title">
                  {product.title}
                </h1>
                {product.sku && (
                  <p className="text-sm text-muted-foreground mt-1" dir="ltr">
                    SKU: {product.sku}
                  </p>
                )}
              </div>

              <div className="flex items-baseline gap-4 flex-wrap">
                <span className="text-4xl font-bold text-primary" data-testid="text-product-price">
                  {price.toFixed(2)} {t("common.dh")}
                </span>
                {inStock ? (
                  <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>{t("products.inStock")} ({product.stock})</span>
                  </div>
                ) : (
                  <Badge variant="destructive" className="rounded-full">{t("products.outOfStock")}</Badge>
                )}
              </div>

              {product.description && (
                <div className="prose prose-sm dark:prose-invert">
                  <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                </div>
              )}

              <Separator />

              {inStock && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{t("product.quantity")}:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full"
                        onClick={decrementQuantity}
                        disabled={quantity <= 1}
                        data-testid="button-quantity-minus"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-medium text-lg" data-testid="text-quantity">
                        {quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full"
                        onClick={incrementQuantity}
                        disabled={quantity >= product.stock}
                        data-testid="button-quantity-plus"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center text-center p-4 rounded-xl bg-card border">
                      <Truck className="h-6 w-6 mb-2 text-primary" />
                      <span className="text-xs text-muted-foreground">{t("hero.fastDeliveryDesc")}</span>
                    </div>
                    <div className="flex flex-col items-center text-center p-4 rounded-xl bg-card border">
                      <CreditCard className="h-6 w-6 mb-2 text-primary" />
                      <span className="text-xs text-muted-foreground">{t("hero.codPaymentDesc")}</span>
                    </div>
                    <div className="flex flex-col items-center text-center p-4 rounded-xl bg-card border">
                      <Shield className="h-6 w-6 mb-2 text-primary" />
                      <span className="text-xs text-muted-foreground">{t("hero.qualityGuaranteeDesc")}</span>
                    </div>
                  </div>

                  <OrderForm product={product} quantity={quantity} />
                </div>
              )}

              {!inStock && (
                <div className="p-8 rounded-2xl bg-muted/50 text-center">
                  <Package className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>المنتج غير متوفر مؤقتاً</h3>
                  <p className="text-sm text-muted-foreground">
                    هذا المنتج غير متوفر حالياً. عد قريباً!
                  </p>
                </div>
              )}
            </div>
          </div>

          {relatedProducts && relatedProducts.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-heading)' }}>{t("product.related")}</h2>
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
