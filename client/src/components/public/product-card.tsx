import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Package, Plus } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import type { Product, Category } from "@shared/schema";

interface ProductCardProps {
  product: Product & { category?: Category | null };
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isRTL } = useI18n();
  const { toast } = useToast();

  const price = parseFloat(product.price);
  const images = product.images || [];
  const mainImage = images[0];
  const inStock = product.stock > 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast({
      title: isRTL ? "تمت الإضافة إلى السلة" : "Ajouté au panier",
      description: product.title,
    });
  };

  return (
    <Card className="group overflow-hidden hover-elevate transition-all duration-300" data-testid={`card-product-${product.id}`}>
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {mainImage ? (
            <img
              src={mainImage}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          
          {!inStock && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Badge variant="secondary" className="text-sm">
                {isRTL ? "نفذ من المخزون" : "Rupture de stock"}
              </Badge>
            </div>
          )}
          
          {lowStock && inStock && (
            <Badge 
              variant="destructive" 
              className={`absolute top-2 ${isRTL ? "left-2" : "right-2"} text-xs`}
            >
              {isRTL ? "مخزون محدود" : "Stock limité"}
            </Badge>
          )}
          
          {product.category && (
            <Badge 
              variant="secondary" 
              className={`absolute top-2 ${isRTL ? "right-2" : "left-2"} text-xs`}
            >
              {product.category.name}
            </Badge>
          )}

          {inStock && (
            <Button
              size="icon"
              variant="secondary"
              className={`absolute bottom-2 ${isRTL ? "left-2" : "right-2"} opacity-0 group-hover:opacity-100 transition-opacity`}
              onClick={handleAddToCart}
              data-testid={`button-quick-add-${product.id}`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Link>
      
      <CardContent className="p-4 space-y-3">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-base line-clamp-2 hover:text-primary transition-colors" data-testid={`text-product-title-${product.id}`}>
            {product.title}
          </h3>
        </Link>
        
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}
        
        <div className="flex items-center justify-between gap-2 pt-2">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-primary" data-testid={`text-product-price-${product.id}`}>
              {price.toFixed(2)} DH
            </span>
            {inStock && (
              <span className="text-xs text-muted-foreground">
                {product.stock} {isRTL ? "في المخزون" : "en stock"}
              </span>
            )}
          </div>
          
          <Button 
            size="sm" 
            disabled={!inStock}
            className="gap-1"
            onClick={handleAddToCart}
            data-testid={`button-order-${product.id}`}
          >
            <ShoppingCart className="h-4 w-4" />
            {isRTL ? "أضف" : "Ajouter"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
