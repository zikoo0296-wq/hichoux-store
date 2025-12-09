import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Truck, Shield, CreditCard, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Hero() {
  const { t, isRTL } = useI18n();

  // Compact horizontal hero for all devices - more space for products
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
        {/* Main banner row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            <Sparkles className="h-4 w-4 shrink-0" />
            <p className="text-sm md:text-base font-medium truncate">{t("hero.deliveryBadge")}</p>
          </div>
          <Link href="/products">
            <Button size="sm" variant="secondary" className="shrink-0 gap-1 rounded-full" data-testid="button-shop-now">
              {t("hero.cta")}
              {isRTL ? <ArrowLeft className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
            </Button>
          </Link>
        </div>
        
        {/* Features row - horizontal scroll on mobile */}
        <div className="flex items-center gap-4 md:gap-6 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          <div className="flex items-center gap-2 text-primary-foreground/90 whitespace-nowrap">
            <Truck className="h-4 w-4 shrink-0" />
            <span className="text-xs md:text-sm">{t("hero.fastDelivery")}</span>
          </div>
          <div className="flex items-center gap-2 text-primary-foreground/90 whitespace-nowrap">
            <CreditCard className="h-4 w-4 shrink-0" />
            <span className="text-xs md:text-sm">{t("hero.codPayment")}</span>
          </div>
          <div className="flex items-center gap-2 text-primary-foreground/90 whitespace-nowrap">
            <Shield className="h-4 w-4 shrink-0" />
            <span className="text-xs md:text-sm">{t("hero.qualityGuarantee")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
