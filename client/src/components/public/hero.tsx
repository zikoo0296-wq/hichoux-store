import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Truck, Shield, CreditCard, Sparkles, Star } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useIsMobile } from "@/hooks/use-mobile";
import zhLogo from "@assets/generated_images/z&h_fashion_brand_logo.png";

export function Hero() {
  const { t, isRTL } = useI18n();
  const isMobile = useIsMobile();

  // Compact mobile hero - just a small banner to show products faster
  if (isMobile) {
    return (
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Sparkles className="h-4 w-4 shrink-0" />
              <p className="text-sm font-medium truncate">{t("hero.deliveryBadge")}</p>
            </div>
            <Link href="/products">
              <Button size="sm" variant="secondary" className="shrink-0 gap-1 rounded-full" data-testid="button-shop-now">
                {t("hero.cta")}
                {isRTL ? <ArrowLeft className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // Full desktop hero
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Decorative elements */}
      <div className="absolute top-20 start-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 end-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2.5L25 17l-5 3.5zM0 20h20v2.5L25 19l-5-3.5V18H0v2z' fill='%23000' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`
      }} />
      
      <div className="max-w-7xl mx-auto px-4 py-16 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div className="space-y-5 text-center lg:text-start">
            {/* Brand badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              <Sparkles className="h-4 w-4" />
              <span>{t("hero.deliveryBadge")}</span>
            </div>
            
            {/* Main heading with brand */}
            <div className="space-y-3">
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                <span className="text-primary">Z&H</span>
                <br />
                {t("hero.title")}
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                {t("hero.subtitle")}
              </p>
            </div>
            
            {/* CTA buttons */}
            <div className="flex flex-row gap-4 justify-center lg:justify-start">
              <Link href="/products">
                <Button size="lg" className="gap-2 rounded-full px-8 shadow-lg shadow-primary/20" data-testid="button-shop-now">
                  {t("hero.cta")}
                  {isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                </Button>
              </Link>
              <Link href="/categories">
                <Button variant="outline" size="lg" className="rounded-full px-8" data-testid="button-categories">
                  {t("hero.browseCategories")}
                </Button>
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <span>4.9/5</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                <span>{t("hero.fastDelivery")}</span>
              </div>
            </div>
          </div>
          
          {/* Logo/Visual */}
          <div className="hidden lg:flex justify-center items-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl scale-75" />
            <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl p-8 border shadow-xl">
              <img 
                src={zhLogo} 
                alt="Z&H" 
                className="w-48 h-48 object-contain drop-shadow-lg"
              />
            </div>
          </div>
        </div>
        
        {/* Features grid */}
        <div className="grid grid-cols-3 gap-3 mt-8">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card/80 backdrop-blur-sm border hover-elevate transition-all">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>{t("hero.fastDelivery")}</h3>
              <p className="text-xs text-muted-foreground">{t("hero.fastDeliveryDesc")}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card/80 backdrop-blur-sm border hover-elevate transition-all">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>{t("hero.codPayment")}</h3>
              <p className="text-xs text-muted-foreground">{t("hero.codPaymentDesc")}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card/80 backdrop-blur-sm border hover-elevate transition-all">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>{t("hero.qualityGuarantee")}</h3>
              <p className="text-xs text-muted-foreground">{t("hero.qualityGuaranteeDesc")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
