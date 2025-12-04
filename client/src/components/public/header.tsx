import { Link, useLocation } from "wouter";
import { Menu, X, Phone, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";

export function PublicHeader() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getItemCount } = useCart();
  const { t } = useI18n();
  const itemCount = getItemCount();

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/products", label: t("nav.products") },
    { href: "/categories", label: t("nav.categories") },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg" style={{ fontFamily: 'var(--font-heading)' }}>م</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg block" style={{ fontFamily: 'var(--font-heading)' }}>{t("store.name")}</span>
              <span className="text-xs text-muted-foreground">{t("store.tagline")}</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover-elevate px-4 py-2 rounded-full ${
                  location === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`link-nav-${link.href.replace("/", "") || "home"}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="tel:+212600000000"
              className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-full hover-elevate"
            >
              <Phone className="h-4 w-4" />
              <span dir="ltr">+212 6 00 00 00 00</span>
            </a>

            <ThemeToggle />

            <Link href="/cart">
              <Button variant="default" size="default" className="relative gap-2 rounded-full" data-testid="button-cart">
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">{t("nav.cart")}</span>
                {itemCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {itemCount > 9 ? "9+" : itemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${
                    location === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  data-testid={`link-mobile-${link.href.replace("/", "") || "home"}`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium px-3 py-2 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2"
                data-testid="link-mobile-cart"
              >
                <ShoppingCart className="h-4 w-4" />
                {t("nav.cart")}
                {itemCount > 0 && (
                  <Badge variant="secondary" className="ms-auto">
                    {itemCount}
                  </Badge>
                )}
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
