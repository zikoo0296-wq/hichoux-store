import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Folder } from "lucide-react";
import type { Category } from "@shared/schema";

interface CategoryCardProps {
  category: Category;
  productCount?: number;
}

export function CategoryCard({ category, productCount = 0 }: CategoryCardProps) {
  return (
    <Link href={`/products?category=${category.slug}`}>
      <Card 
        className="group overflow-hidden hover-elevate transition-all duration-300 cursor-pointer"
        data-testid={`card-category-${category.id}`}
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          {category.image ? (
            <img
              src={category.image}
              alt={category.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Folder className="h-16 w-16 text-primary/40" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          <CardContent className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="font-semibold text-lg" data-testid={`text-category-name-${category.id}`}>
                  {category.name}
                </h3>
                <p className="text-sm text-white/80">
                  {productCount} {productCount === 1 ? "produit" : "produits"}
                </p>
              </div>
              <div className="p-2 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}
