import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { CityCombobox } from "@/components/ui/city-combobox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingBag, Truck, CreditCard, CheckCircle, ArrowLeft } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import type { Product } from "@shared/schema";
import { useState } from "react";

interface StoreConfig {
  deliveryCost: number;
  freeDeliveryThreshold: number;
  storeName: string;
  storePhone: string;
  whatsappNumber: string;
  defaultCarrier: string;
}

const orderFormSchema = z.object({
  customerName: z.string().min(2, "الاسم يجب أن يحتوي على حرفين على الأقل"),
  phone: z.string().min(8, "رقم الهاتف غير صالح"),
  address: z.string().min(5, "العنوان يجب أن يحتوي على 5 أحرف على الأقل"),
  city: z.string().min(2, "المدينة مطلوبة"),
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

interface OrderFormProps {
  product: Product;
  quantity: number;
}

export function OrderForm({ product, quantity }: OrderFormProps) {
  const { toast } = useToast();
  const { t } = useI18n();
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const { data: storeConfig, isLoading: configLoading } = useQuery<StoreConfig>({
    queryKey: ["/api/store-config"],
  });

  const deliveryCost = storeConfig?.deliveryCost ?? 35;
  const freeDeliveryThreshold = storeConfig?.freeDeliveryThreshold ?? 300;
  const whatsappNumber = storeConfig?.whatsappNumber ?? "212600000000";

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      address: "",
      city: "",
      notes: "",
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      const response = await apiRequest("POST", "/api/orders", {
        ...data,
        items: [{ productId: product.id, quantity }],
        deliveryCost: actualDeliveryCost,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setOrderSuccess(true);
      setOrderId(data.id);
      toast({
        title: t("order.confirmed"),
        description: `${t("order.orderNumber")} #${data.id}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("order.error"),
        variant: "destructive",
      });
    },
  });

  const price = parseFloat(product.price);
  const subtotal = price * quantity;
  const actualDeliveryCost = subtotal >= freeDeliveryThreshold ? 0 : deliveryCost;
  const total = subtotal + actualDeliveryCost;

  const generateWhatsAppMessage = () => {
    const values = form.getValues();
    const message = `مرحباً! أريد طلب:
    
المنتج: ${product.title}
الكمية: ${quantity}
المجموع: ${total.toFixed(2)} درهم

معلوماتي:
الاسم: ${values.customerName || "(يُملأ لاحقاً)"}
الهاتف: ${values.phone || "(يُملأ لاحقاً)"}
العنوان: ${values.address || "(يُملأ لاحقاً)"}
المدينة: ${values.city || "(يُملأ لاحقاً)"}
${values.notes ? `ملاحظات: ${values.notes}` : ""}`;

    return encodeURIComponent(message);
  };

  if (configLoading) {
    return (
      <Card className="rounded-2xl">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (orderSuccess) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 rounded-2xl">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-800 dark:text-green-200" style={{ fontFamily: 'var(--font-heading)' }}>
                {t("order.confirmed")}
              </h3>
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                {t("order.orderNumber")} #{orderId}
              </p>
            </div>
            <div className="text-sm text-muted-foreground space-y-2 bg-white/50 dark:bg-black/20 rounded-xl p-4">
              <p>سنتواصل معك قريباً لتأكيد التوصيل.</p>
              <p className="font-semibold text-base text-foreground">
                الدفع عند الاستلام: {total.toFixed(2)} {t("common.dh")}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = "/products"}
              className="rounded-full gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              متابعة التسوق
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
          <ShoppingBag className="h-5 w-5 text-primary" />
          {t("order.placeOrder")}
        </CardTitle>
        <CardDescription>
          أدخل معلوماتك لإتمام الطلب. الدفع عند الاستلام.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/50 rounded-xl p-4 mb-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{product.title}</span>
            <span>{price.toFixed(2)} {t("common.dh")}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>الكمية</span>
            <span>x{quantity}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">المجموع الفرعي</span>
            <span>{subtotal.toFixed(2)} {t("common.dh")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">التوصيل</span>
            <span className={actualDeliveryCost === 0 ? "text-green-600 font-medium" : ""}>
              {actualDeliveryCost === 0 ? "مجاني" : `${actualDeliveryCost} ${t("common.dh")}`}
            </span>
          </div>
          {subtotal < freeDeliveryThreshold && (
            <p className="text-xs text-muted-foreground bg-primary/10 rounded-lg p-2 text-center">
              أضف {(freeDeliveryThreshold - subtotal).toFixed(0)} {t("common.dh")} للحصول على توصيل مجاني
            </p>
          )}
          <div className="border-t pt-3 flex justify-between font-bold text-base">
            <span>المجموع</span>
            <span className="text-primary">{total.toFixed(2)} {t("common.dh")}</span>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => createOrderMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("order.fullName")} *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="الاسم الكامل" 
                        className="rounded-xl"
                        {...field}
                        data-testid="input-customer-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("order.phone")} *</FormLabel>
                    <FormControl>
                      <Input 
                        type="tel"
                        placeholder="06 XX XX XX XX" 
                        className="rounded-xl"
                        dir="ltr"
                        {...field}
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("order.address")} *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="عنوان التوصيل الكامل" 
                      className="rounded-xl"
                      {...field}
                      data-testid="input-address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("order.city")} *</FormLabel>
                  <FormControl>
                    <CityCombobox
                      value={field.value}
                      onValueChange={field.onChange}
                      className="rounded-xl"
                      data-testid="input-city"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("order.notes")}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="ملاحظات إضافية للتوصيل..." 
                      className="resize-none rounded-xl"
                      {...field}
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-center gap-4 py-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-primary" />
                <span>توصيل سريع</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-primary" />
                <span>الدفع عند الاستلام</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                size="lg"
                className="w-full rounded-full gap-2 text-base"
                disabled={createOrderMutation.isPending}
                data-testid="button-submit-order"
              >
                {createOrderMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    جاري المعالجة...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-5 w-5" />
                    {t("order.confirm")} ({total.toFixed(2)} {t("common.dh")})
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">أو</span>
                </div>
              </div>

              <a
                href={`https://wa.me/${whatsappNumber}?text=${generateWhatsAppMessage()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full gap-2 rounded-full border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                  data-testid="button-whatsapp-order"
                >
                  <SiWhatsapp className="h-5 w-5" />
                  اطلب عبر واتساب
                </Button>
              </a>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
