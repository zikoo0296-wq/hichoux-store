import { Link } from "wouter";
import { Phone, Mail, MapPin, Clock, Truck } from "lucide-react";
import { SiWhatsapp, SiFacebook, SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";
import { useI18n } from "@/lib/i18n";
import { useStoreConfig } from "@/lib/store-config";
import zhLogo from "@assets/generated_images/z&h_fashion_brand_logo.png";

export function PublicFooter() {
  const { t } = useI18n();
  const { config } = useStoreConfig();

  return (
    <footer className="bg-card border-t mt-auto">
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand column */}
          <div>
            <Link href="/" className="flex items-center gap-3 mb-4">
              <img 
                src={config?.storeLogo || zhLogo} 
                alt={config?.storeName || "Z&H"} 
                className="h-10 w-auto object-contain"
              />
              <span className="font-bold text-xl" style={{ fontFamily: 'var(--font-heading)' }}>
                {config?.storeName || "Z&H"}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">{t("footer.description")}</p>
            <div className="flex gap-2 flex-wrap">
              <a
                href={`https://wa.me/${config?.whatsappNumber || "212600000000"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-muted hover-elevate transition-colors"
                data-testid="link-whatsapp"
              >
                <SiWhatsapp className="h-5 w-5" />
              </a>
              {config?.facebookUrl && (
                <a
                  href={config.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-muted hover-elevate transition-colors"
                  data-testid="link-facebook"
                >
                  <SiFacebook className="h-5 w-5" />
                </a>
              )}
              {config?.instagramUrl && (
                <a
                  href={config.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-muted hover-elevate transition-colors"
                  data-testid="link-instagram"
                >
                  <SiInstagram className="h-5 w-5" />
                </a>
              )}
              {config?.tiktokUrl && (
                <a
                  href={config.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-muted hover-elevate transition-colors"
                  data-testid="link-tiktok"
                >
                  <SiTiktok className="h-5 w-5" />
                </a>
              )}
              {config?.youtubeUrl && (
                <a
                  href={config.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-muted hover-elevate transition-colors"
                  data-testid="link-youtube"
                >
                  <SiYoutube className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>{t("footer.navigation")}</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("nav.products")}
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("nav.categories")}
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("nav.cart")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>{t("footer.contact")}</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 text-muted-foreground">
                <Phone className="h-4 w-4 mt-0.5 shrink-0" />
                <span dir="ltr">{config?.storePhone || "+212 6 00 00 00 00"}</span>
              </li>
              {config?.storeEmail && (
                <li className="flex items-start gap-3 text-muted-foreground">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                  <a href={`mailto:${config.storeEmail}`} className="hover:text-foreground transition-colors">
                    {config.storeEmail}
                  </a>
                </li>
              )}
              {config?.storeAddress && (
                <li className="flex items-start gap-3 text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{config.storeAddress}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Hours & Delivery */}
          <div>
            <h3 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>{t("footer.deliveryInfo")}</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-3">
                <Clock className="h-4 w-4 shrink-0" />
                <span>{t("footer.weekdayHours")}</span>
              </li>
              <li className="pe-7">
                {t("footer.weekendHours")}
              </li>
            </ul>
            <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
              <div className="flex items-center gap-2 text-primary">
                <Truck className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">{t("footer.delivery")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {config?.storeName || "Z&H"}. {t("footer.rights")}</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-foreground transition-colors">{t("footer.privacy")}</Link>
            <Link href="#" className="hover:text-foreground transition-colors">{t("footer.terms")}</Link>
            <Link href="#" className="hover:text-foreground transition-colors">{t("footer.return")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
