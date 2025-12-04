import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Truck, Shield, CreditCard, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden">
      {/* Subtle geometric pattern background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-background" />
      
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Delivery badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
            <Truck className="h-4 w-4" />
            {t("hero.deliveryBadge")}
          </div>
          
          {/* Main heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            {t("hero.title")}
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("hero.subtitle")}
          </p>
          
          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/products">
              <Button size="lg" className="w-full sm:w-auto gap-2 rounded-full text-base px-8" data-testid="button-shop-now">
                {t("hero.cta")}
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/categories">
              <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full text-base px-8" data-testid="button-categories">
                {t("hero.browseCategories")}
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16">
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-card border hover-elevate transition-all">
            <div className="p-3 rounded-xl bg-primary/10 shrink-0">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{t("hero.fastDelivery")}</h3>
              <p className="text-sm text-muted-foreground">{t("hero.fastDeliveryDesc")}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-card border hover-elevate transition-all">
            <div className="p-3 rounded-xl bg-primary/10 shrink-0">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{t("hero.codPayment")}</h3>
              <p className="text-sm text-muted-foreground">{t("hero.codPaymentDesc")}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-card border hover-elevate transition-all">
            <div className="p-3 rounded-xl bg-primary/10 shrink-0">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{t("hero.qualityGuarantee")}</h3>
              <p className="text-sm text-muted-foreground">{t("hero.qualityGuaranteeDesc")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
