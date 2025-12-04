import { Link } from "wouter";
import { ShoppingBag, Phone, Mail, MapPin, Clock, Truck } from "lucide-react";
import { SiWhatsapp, SiFacebook, SiInstagram } from "react-icons/si";
import { useI18n } from "@/lib/i18n";

export function PublicFooter() {
  const { t, isRTL } = useI18n();

  return (
    <footer className="bg-card border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <ShoppingBag className="h-7 w-7 text-primary" />
              <span className="font-bold text-xl">E-Shop</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {isRTL
                ? "متجرك الإلكتروني الموثوق مع التوصيل لجميع أنحاء المغرب. الدفع عند الاستلام."
                : "Votre destination shopping en ligne avec livraison partout au Maroc. Paiement à la livraison."}
            </p>
            <div className="flex gap-3 mt-4">
              <a
                href="https://wa.me/212600000000"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md bg-muted hover-elevate transition-colors"
                data-testid="link-whatsapp"
              >
                <SiWhatsapp className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-md bg-muted hover-elevate transition-colors"
                data-testid="link-facebook"
              >
                <SiFacebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-md bg-muted hover-elevate transition-colors"
                data-testid="link-instagram"
              >
                <SiInstagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">
              {isRTL ? "التنقل" : "Navigation"}
            </h3>
            <ul className="space-y-2 text-sm">
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

          <div>
            <h3 className="font-semibold mb-4">
              {isRTL ? "اتصل بنا" : "Contact"}
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 mt-0.5 shrink-0" />
                <span>+212 6 00 00 00 00</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                <span>contact@e-shop.ma</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{isRTL ? "الدار البيضاء، المغرب" : "Casablanca, Maroc"}</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">
              {isRTL ? "التوصيل" : "Livraison"}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0" />
                <span>{isRTL ? "الإثنين - السبت: 9ص - 8م" : "Lun - Sam: 9h - 20h"}</span>
              </li>
              <li className={`${isRTL ? "pe-6" : "ps-6"}`}>
                {isRTL ? "الأحد: 10ص - 6م" : "Dim: 10h - 18h"}
              </li>
            </ul>
            <div className="mt-4 p-3 bg-muted rounded-lg flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                {isRTL
                  ? "توصيل مجاني للطلبات أكثر من 300 درهم"
                  : "Livraison gratuite à partir de 300 DH"}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} E-Shop. {t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
}
