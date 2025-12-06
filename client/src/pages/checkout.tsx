import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CityCombobox } from "@/components/ui/city-combobox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ShoppingBag, Truck, CreditCard, Loader2 } from "lucide-react";
import { z } from "zod";

const checkoutSchema = z.object({
  customerName: z.string().min(2),
  phone: z.string().min(8),
  address: z.string().min(5),
  city: z.string().min(2),
  notes: z.string().optional(),
});

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCart();
  const { t, isRTL } = useI18n();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    address: "",
    city: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const total = getTotal();
  const deliveryCost = total >= 300 ? 0 : 35;
  const grandTotal = total + deliveryCost;

  const orderMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const orderData = {
        ...data,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      };
      const res = await apiRequest("POST", "/api/orders", orderData);
      return res.json();
    },
    onSuccess: (order: any) => {
      clearCart();
      setLocation(`/confirmation/${order.id}`);
    },
    onError: (error: any) => {
      toast({
        title: t("checkout.error"),
        description: error.message || t("checkout.errorMessage"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = checkoutSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0].toString()] = t("checkout.fieldRequired");
        }
      });
      setErrors(newErrors);
      return;
    }

    orderMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-4">{t("cart.empty")}</h1>
            <Button onClick={() => setLocation("/products")} data-testid="button-shop">
              {t("cart.continue")}
            </Button>
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
          <h1 className="text-2xl md:text-3xl font-bold mb-8">{t("checkout.title")}</h1>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      {t("checkout.customerInfo")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customerName">{t("checkout.name")} *</Label>
                        <Input
                          id="customerName"
                          value={formData.customerName}
                          onChange={(e) => handleChange("customerName", e.target.value)}
                          placeholder={t("checkout.namePlaceholder")}
                          className={errors.customerName ? "border-destructive" : ""}
                          data-testid="input-name"
                        />
                        {errors.customerName && (
                          <p className="text-sm text-destructive">{errors.customerName}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">{t("checkout.phone")} *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleChange("phone", e.target.value)}
                          placeholder={t("checkout.phonePlaceholder")}
                          className={errors.phone ? "border-destructive" : ""}
                          data-testid="input-phone"
                        />
                        {errors.phone && (
                          <p className="text-sm text-destructive">{errors.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">{t("checkout.city")} *</Label>
                      <CityCombobox
                        value={formData.city}
                        onValueChange={(value) => handleChange("city", value)}
                        className={errors.city ? "border-destructive" : ""}
                        data-testid="input-city"
                      />
                      {errors.city && (
                        <p className="text-sm text-destructive">{errors.city}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">{t("checkout.address")} *</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                        placeholder={t("checkout.addressPlaceholder")}
                        className={errors.address ? "border-destructive" : ""}
                        rows={3}
                        data-testid="input-address"
                      />
                      {errors.address && (
                        <p className="text-sm text-destructive">{errors.address}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">{t("checkout.notes")}</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => handleChange("notes", e.target.value)}
                        placeholder={t("checkout.notesPlaceholder")}
                        rows={2}
                        data-testid="input-notes"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      {t("checkout.cod")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Truck className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{t("checkout.cod")}</p>
                        <p className="text-sm text-muted-foreground">{t("checkout.codDesc")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>{t("checkout.orderSummary")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="max-h-64 overflow-y-auto space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex items-center gap-3"
                          data-testid={`checkout-item-${item.product.id}`}
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {item.product.images && item.product.images[0] ? (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.product.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} x {parseFloat(item.product.price).toFixed(2)} {t("common.dh")}
                            </p>
                          </div>
                          <p className="text-sm font-medium">
                            {(parseFloat(item.product.price) * item.quantity).toFixed(2)} {t("common.dh")}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                        <span>{total.toFixed(2)} {t("common.dh")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("cart.delivery")}</span>
                        <span>
                          {deliveryCost === 0 ? (
                            <span className="text-green-600">{t("cart.deliveryFree")}</span>
                          ) : (
                            `${deliveryCost.toFixed(2)} ${t("common.dh")}`
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>{t("cart.total")}</span>
                        <span>{grandTotal.toFixed(2)} {t("common.dh")}</span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={orderMutation.isPending}
                      data-testid="button-submit-order"
                    >
                      {orderMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin me-2" />
                          {t("checkout.submitting")}
                        </>
                      ) : (
                        t("checkout.submit")
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
