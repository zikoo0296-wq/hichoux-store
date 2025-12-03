import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ProductForm } from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Package } from "lucide-react";
import type { Product } from "@shared/schema";

export default function AdminProductFormPage() {
  const params = useParams<{ id?: string }>();
  const isEditing = !!params.id && params.id !== "new";
  const productId = isEditing ? parseInt(params.id) : null;

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/admin/products", productId],
    enabled: isEditing && !!productId,
  });

  if (isEditing && isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (isEditing && !product) {
    return (
      <div className="text-center py-16">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Produit non trouvé</h2>
        <p className="text-muted-foreground mb-4">
          Le produit que vous recherchez n'existe pas.
        </p>
        <Link href="/admin/products">
          <Button>Retour aux produits</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Modifier le produit" : "Nouveau produit"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing
              ? "Modifiez les informations du produit"
              : "Ajoutez un nouveau produit à votre catalogue"}
          </p>
        </div>
      </div>

      <ProductForm product={product} isEditing={isEditing} />
    </div>
  );
}
