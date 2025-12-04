import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Truck, Shield, CreditCard } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Hero() {
  const { t, isRTL } = useI18n();

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Truck className="h-4 w-4" />
              {t("hero.deliveryBadge")}
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              {t("hero.title")}
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-lg">
              {t("hero.subtitle")}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/products">
                <Button size="lg" className="w-full sm:w-auto gap-2" data-testid="button-shop-now">
                  {t("hero.cta")}
                  <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
                </Button>
              </Link>
              <Link href="/categories">
                <Button variant="outline" size="lg" className="w-full sm:w-auto" data-testid="button-categories">
                  {t("hero.browseCategories")}
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="relative hidden lg:block">
            <div className="absolute -top-10 -right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
            <div className="relative bg-gradient-to-br from-card to-background rounded-2xl p-8 border shadow-xl">
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl bg-muted animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-card border">
            <div className="p-3 rounded-lg bg-primary/10">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{t("hero.fastDelivery")}</h3>
              <p className="text-sm text-muted-foreground">{t("hero.fastDeliveryDesc")}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-xl bg-card border">
            <div className="p-3 rounded-lg bg-primary/10">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{t("hero.codPayment")}</h3>
              <p className="text-sm text-muted-foreground">{t("hero.codPaymentDesc")}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-xl bg-card border">
            <div className="p-3 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{t("hero.qualityGuarantee")}</h3>
              <p className="text-sm text-muted-foreground">{t("hero.qualityGuaranteeDesc")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
