import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { useI18n } from "@/lib/i18n";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Package, Truck, Home, ArrowRight } from "lucide-react";
import type { OrderWithItems } from "@shared/schema";

export default function ConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const { t, isRTL } = useI18n();

  const { data: order, isLoading } = useQuery<OrderWithItems>({
    queryKey: ["/api/orders", id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicHeader />
        <main className="flex-1 py-16">
          <div className="max-w-2xl mx-auto px-4">
            <div className="text-center mb-8">
              <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
              <Skeleton className="h-8 w-64 mx-auto mb-2" />
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </CardContent>
            </Card>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center py-16 px-4">
            <h1 className="text-2xl font-bold mb-4">{t("confirmation.orderNotFound")}</h1>
            <Link href="/">
              <Button data-testid="button-go-home">
                {t("confirmation.backHome")}
              </Button>
            </Link>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 py-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{t("confirmation.title")}</h1>
            <p className="text-muted-foreground">{t("confirmation.message")}</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                {t("confirmation.orderNumber")}: #{order.id}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t("checkout.name")}</p>
                  <p className="font-medium">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("checkout.phone")}</p>
                  <p className="font-medium">{order.phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">{t("checkout.address")}</p>
                  <p className="font-medium">{order.address}, {order.city}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">{t("confirmation.products")}</h4>
                <div className="space-y-2">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.product?.title || `Product #${item.productId}`} x {item.quantity}
                      </span>
                      <span>{(parseFloat(item.unitPrice) * item.quantity).toFixed(2)} {t("common.dh")}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>{t("cart.total")}</span>
                  <span>{parseFloat(order.totalPrice).toFixed(2)} {t("common.dh")}</span>
                </div>
              </div>

              {order.trackingNumber && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Truck className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("confirmation.tracking")}</p>
                      <p className="font-medium">{order.trackingNumber}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto gap-2" data-testid="button-back-home">
                <Home className="h-4 w-4" />
                {t("confirmation.backHome")}
              </Button>
            </Link>
            <Link href="/products">
              <Button className="w-full sm:w-auto gap-2" data-testid="button-continue-shopping">
                {t("cart.continue")}
                <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
