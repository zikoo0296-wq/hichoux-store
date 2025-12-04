import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "ar" | "fr" | "en";

interface TranslationRecord {
  [key: string]: string;
}

const translations: Record<Language, TranslationRecord> = {
  ar: {
    "nav.home": "الرئيسية",
    "nav.products": "المنتجات",
    "nav.categories": "التصنيفات",
    "nav.cart": "السلة",
    "hero.title": "أفضل المنتجات بأسعار مميزة",
    "hero.subtitle": "تسوق بثقة مع خدمة الدفع عند الاستلام",
    "hero.cta": "تسوق الآن",
    "products.title": "المنتجات",
    "products.featured": "المنتجات المميزة",
    "products.all": "جميع المنتجات",
    "products.addToCart": "أضف للسلة",
    "products.outOfStock": "نفذت الكمية",
    "products.inStock": "متوفر",
    "categories.title": "التصنيفات",
    "categories.browse": "تصفح تصنيفاتنا",
    "cart.title": "سلة التسوق",
    "cart.empty": "السلة فارغة",
    "cart.continue": "متابعة التسوق",
    "cart.checkout": "إتمام الطلب",
    "cart.total": "المجموع",
    "cart.subtotal": "المجموع الفرعي",
    "cart.delivery": "التوصيل",
    "cart.remove": "حذف",
    "checkout.title": "إتمام الطلب",
    "checkout.customerInfo": "معلومات العميل",
    "checkout.name": "الاسم الكامل",
    "checkout.phone": "رقم الهاتف",
    "checkout.address": "العنوان",
    "checkout.city": "المدينة",
    "checkout.notes": "ملاحظات",
    "checkout.submit": "تأكيد الطلب",
    "checkout.cod": "الدفع عند الاستلام",
    "checkout.orderSummary": "ملخص الطلب",
    "confirmation.title": "تم تأكيد طلبك",
    "confirmation.orderNumber": "رقم الطلب",
    "confirmation.message": "شكراً لك! سيتم التواصل معك قريباً لتأكيد الطلب.",
    "confirmation.tracking": "رقم التتبع",
    "confirmation.backHome": "العودة للرئيسية",
    "footer.rights": "جميع الحقوق محفوظة",
    "footer.delivery": "توصيل لجميع مدن المغرب",
    "common.dh": "درهم",
    "common.viewAll": "عرض الكل",
    "common.loading": "جاري التحميل...",
    "common.error": "حدث خطأ",
    "common.search": "بحث",
    "common.filter": "تصفية",
    "common.sort": "ترتيب",
  },
  fr: {
    "nav.home": "Accueil",
    "nav.products": "Produits",
    "nav.categories": "Catégories",
    "nav.cart": "Panier",
    "hero.title": "Les meilleurs produits aux meilleurs prix",
    "hero.subtitle": "Achetez en toute confiance avec le paiement à la livraison",
    "hero.cta": "Commencer les achats",
    "products.title": "Produits",
    "products.featured": "Produits populaires",
    "products.all": "Tous les produits",
    "products.addToCart": "Ajouter au panier",
    "products.outOfStock": "Rupture de stock",
    "products.inStock": "En stock",
    "categories.title": "Catégories",
    "categories.browse": "Parcourez nos catégories",
    "cart.title": "Panier",
    "cart.empty": "Votre panier est vide",
    "cart.continue": "Continuer les achats",
    "cart.checkout": "Commander",
    "cart.total": "Total",
    "cart.subtotal": "Sous-total",
    "cart.delivery": "Livraison",
    "cart.remove": "Supprimer",
    "checkout.title": "Passer la commande",
    "checkout.customerInfo": "Informations client",
    "checkout.name": "Nom complet",
    "checkout.phone": "Téléphone",
    "checkout.address": "Adresse",
    "checkout.city": "Ville",
    "checkout.notes": "Notes",
    "checkout.submit": "Confirmer la commande",
    "checkout.cod": "Paiement à la livraison",
    "checkout.orderSummary": "Résumé de la commande",
    "confirmation.title": "Commande confirmée",
    "confirmation.orderNumber": "Numéro de commande",
    "confirmation.message": "Merci! Nous vous contacterons bientôt pour confirmer votre commande.",
    "confirmation.tracking": "Numéro de suivi",
    "confirmation.backHome": "Retour à l'accueil",
    "footer.rights": "Tous droits réservés",
    "footer.delivery": "Livraison dans tout le Maroc",
    "common.dh": "DH",
    "common.viewAll": "Voir tout",
    "common.loading": "Chargement...",
    "common.error": "Une erreur s'est produite",
    "common.search": "Rechercher",
    "common.filter": "Filtrer",
    "common.sort": "Trier",
  },
  en: {
    "nav.home": "Home",
    "nav.products": "Products",
    "nav.categories": "Categories",
    "nav.cart": "Cart",
    "hero.title": "Best Products at Best Prices",
    "hero.subtitle": "Shop with confidence with Cash on Delivery",
    "hero.cta": "Shop Now",
    "products.title": "Products",
    "products.featured": "Featured Products",
    "products.all": "All Products",
    "products.addToCart": "Add to Cart",
    "products.outOfStock": "Out of Stock",
    "products.inStock": "In Stock",
    "categories.title": "Categories",
    "categories.browse": "Browse our categories",
    "cart.title": "Shopping Cart",
    "cart.empty": "Your cart is empty",
    "cart.continue": "Continue Shopping",
    "cart.checkout": "Checkout",
    "cart.total": "Total",
    "cart.subtotal": "Subtotal",
    "cart.delivery": "Delivery",
    "cart.remove": "Remove",
    "checkout.title": "Checkout",
    "checkout.customerInfo": "Customer Information",
    "checkout.name": "Full Name",
    "checkout.phone": "Phone",
    "checkout.address": "Address",
    "checkout.city": "City",
    "checkout.notes": "Notes",
    "checkout.submit": "Confirm Order",
    "checkout.cod": "Cash on Delivery",
    "checkout.orderSummary": "Order Summary",
    "confirmation.title": "Order Confirmed",
    "confirmation.orderNumber": "Order Number",
    "confirmation.message": "Thank you! We will contact you soon to confirm your order.",
    "confirmation.tracking": "Tracking Number",
    "confirmation.backHome": "Back to Home",
    "footer.rights": "All rights reserved",
    "footer.delivery": "Delivery across Morocco",
    "common.dh": "MAD",
    "common.viewAll": "View All",
    "common.loading": "Loading...",
    "common.error": "An error occurred",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.sort": "Sort",
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "eshop_language";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ar");

  useEffect(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
    if (stored && ["ar", "fr", "en"].includes(stored)) {
      setLanguageState(stored);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const isRTL = language === "ar";

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
