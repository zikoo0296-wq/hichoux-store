import { Link } from "wouter";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, getTotal, clearCart } = useCart();
  const { t, isRTL } = useI18n();

  const total = getTotal();
  const deliveryCost = total >= 300 ? 0 : 35;
  const grandTotal = total + deliveryCost;

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{t("cart.empty")}</h1>
            <p className="text-muted-foreground mb-6">{t("cart.emptySubtitle")}</p>
            <Link href="/products">
              <Button className="gap-2" data-testid="button-continue-shopping">
                {t("cart.continue")}
                <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
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
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-8">{t("cart.title")}</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.product.id} data-testid={`cart-item-${item.product.id}`}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {item.product.images && item.product.images[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{item.product.title}</h3>
                        <p className="text-lg font-bold text-primary mt-1">
                          {parseFloat(item.product.price).toFixed(2)} {t("common.dh")}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            data-testid={`button-decrease-${item.product.id}`}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-medium w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            data-testid={`button-increase-${item.product.id}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive ms-auto"
                            onClick={() => removeFromCart(item.product.id)}
                            data-testid={`button-remove-${item.product.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>{t("checkout.orderSummary")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                    <span>{total.toFixed(2)} {t("common.dh")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("cart.delivery")}</span>
                    <span>
                      {deliveryCost === 0 ? (
                        <span className="text-green-600 font-medium">{t("cart.deliveryFree")}</span>
                      ) : (
                        `${deliveryCost.toFixed(2)} ${t("common.dh")}`
                      )}
                    </span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>{t("cart.total")}</span>
                      <span>{grandTotal.toFixed(2)} {t("common.dh")}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-3">
                  <Link href="/checkout" className="w-full">
                    <Button className="w-full gap-2" size="lg" data-testid="button-checkout">
                      {t("cart.checkout")}
                      <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={clearCart}
                    data-testid="button-clear-cart"
                  >
                    {t("cart.clear")}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
