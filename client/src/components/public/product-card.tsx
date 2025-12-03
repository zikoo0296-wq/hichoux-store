import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Package } from "lucide-react";
import type { Product, Category } from "@shared/schema";

interface ProductCardProps {
  product: Product & { category?: Category | null };
}

export function ProductCard({ product }: ProductCardProps) {
  const price = parseFloat(product.price);
  const images = product.images || [];
  const mainImage = images[0];
  const inStock = product.stock > 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

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
                Rupture de stock
              </Badge>
            </div>
          )}
          
          {lowStock && inStock && (
            <Badge 
              variant="destructive" 
              className="absolute top-2 right-2 text-xs"
            >
              Stock limité
            </Badge>
          )}
          
          {product.category && (
            <Badge 
              variant="secondary" 
              className="absolute top-2 left-2 text-xs"
            >
              {product.category.name}
            </Badge>
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
                {product.stock} en stock
              </span>
            )}
          </div>
          
          <Link href={`/products/${product.id}`}>
            <Button 
              size="sm" 
              disabled={!inStock}
              className="gap-1"
              data-testid={`button-order-${product.id}`}
            >
              <ShoppingCart className="h-4 w-4" />
              Commander
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
