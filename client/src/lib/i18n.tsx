import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "ar" | "fr" | "en";

interface TranslationRecord {
  [key: string]: string;
}

// Arabic translations for the public storefront
const translations: Record<Language, TranslationRecord> = {
  ar: {
    // Store info
    "store.name": "متجرنا",
    "store.tagline": "جودة عالية - توصيل سريع",
    // Additional footer
    "footer.privacy": "سياسة الخصوصية",
    "footer.terms": "شروط الاستخدام",
    "footer.return": "سياسة الإرجاع",
    "footer.faq": "الأسئلة الشائعة",
    // Product details
    "product.quantity": "الكمية",
    "product.addToCart": "أضف للسلة",
    "product.buyNow": "اشترِ الآن",
    "product.description": "وصف المنتج",
    "product.specifications": "المواصفات",
    "product.related": "منتجات ذات صلة",
    "nav.home": "الرئيسية",
    "nav.products": "المنتجات",
    "nav.categories": "التصنيفات",
    "nav.cart": "السلة",
    "hero.title": "اكتشف مجموعتنا الحصرية",
    "hero.subtitle": "منتجات عالية الجودة تُوصل إلى باب منزلك. الدفع عند الاستلام، بدون التزام. راضٍ أو مسترد.",
    "hero.cta": "عرض المنتجات",
    "hero.deliveryBadge": "توصيل لجميع أنحاء المغرب",
    "hero.browseCategories": "تصفح التصنيفات",
    "hero.fastDelivery": "توصيل سريع",
    "hero.fastDeliveryDesc": "خلال 24-48 ساعة في جميع أنحاء المغرب",
    "hero.codPayment": "الدفع عند الاستلام",
    "hero.codPaymentDesc": "دفع نقدي عند التوصيل آمن",
    "hero.qualityGuarantee": "ضمان الجودة",
    "hero.qualityGuaranteeDesc": "راضٍ أو مسترد",
    "products.title": "المنتجات",
    "products.featured": "المنتجات الشائعة",
    "products.featuredDesc": "اكتشف أفضل مبيعاتنا",
    "products.all": "جميع المنتجات",
    "products.addToCart": "أضف",
    "products.addedToCart": "تمت الإضافة إلى السلة",
    "products.outOfStock": "نفذ من المخزون",
    "products.inStock": "في المخزون",
    "products.lowStock": "مخزون محدود",
    "products.noProducts": "لا توجد منتجات متاحة",
    "products.comingSoon": "ستظهر المنتجات هنا قريبًا",
    "categories.title": "التصنيفات",
    "categories.titleDesc": "تصفح تصنيفاتنا المختلفة",
    "categories.browse": "تصفح تصنيفاتنا",
    "categories.noCategories": "لا توجد تصنيفات متاحة",
    "cart.title": "سلة التسوق",
    "cart.empty": "السلة فارغة",
    "cart.emptySubtitle": "أضف منتجات لبدء التسوق",
    "cart.continue": "متابعة التسوق",
    "cart.checkout": "إتمام الطلب",
    "cart.total": "المجموع",
    "cart.subtotal": "المجموع الفرعي",
    "cart.delivery": "التوصيل",
    "cart.deliveryFree": "مجاني",
    "cart.freeDeliveryNote": "التوصيل مجاني للطلبات أكثر من 300 درهم",
    "cart.remove": "حذف",
    "cart.clear": "إفراغ السلة",
    "checkout.title": "إتمام الطلب",
    "checkout.customerInfo": "معلومات العميل",
    "checkout.name": "الاسم الكامل",
    "checkout.namePlaceholder": "أدخل اسمك الكامل",
    "checkout.phone": "رقم الهاتف",
    "checkout.address": "العنوان",
    "checkout.addressPlaceholder": "العنوان الكامل",
    "checkout.city": "المدينة",
    "checkout.cityPlaceholder": "المدينة",
    "checkout.notes": "ملاحظات",
    "checkout.notesPlaceholder": "ملاحظات إضافية (اختياري)",
    "checkout.submit": "تأكيد الطلب",
    "checkout.submitting": "جاري الإرسال...",
    "checkout.cod": "الدفع عند الاستلام",
    "checkout.codDesc": "ادفع عند استلام طلبك",
    "checkout.orderSummary": "ملخص الطلب",
    "checkout.fieldRequired": "هذا الحقل مطلوب",
    "checkout.error": "خطأ",
    "checkout.errorMessage": "فشل في إرسال الطلب",
    "confirmation.title": "تم تأكيد طلبك",
    "confirmation.orderNumber": "رقم الطلب",
    "confirmation.message": "شكراً لك! سيتم التواصل معك قريباً لتأكيد الطلب.",
    "confirmation.tracking": "رقم التتبع",
    "confirmation.backHome": "العودة للرئيسية",
    "confirmation.orderNotFound": "الطلب غير موجود",
    "confirmation.products": "المنتجات",
    "footer.rights": "جميع الحقوق محفوظة",
    "footer.delivery": "توصيل لجميع مدن المغرب",
    "footer.description": "متجرك الإلكتروني الموثوق مع التوصيل لجميع أنحاء المغرب. الدفع عند الاستلام.",
    "footer.navigation": "التنقل",
    "footer.contact": "اتصل بنا",
    "footer.deliveryInfo": "التوصيل",
    "footer.location": "الدار البيضاء، المغرب",
    "footer.weekdayHours": "الإثنين - السبت: 9ص - 8م",
    "footer.weekendHours": "الأحد: 10ص - 6م",
    "footer.freeDeliveryBanner": "توصيل مجاني للطلبات أكثر من 300 درهم",
    "checkout.phonePlaceholder": "06XXXXXXXX",
    "lang.ar": "العربية",
    "lang.fr": "Français",
    "lang.en": "English",
    "home.deliverySection": "توصيل لجميع أنحاء المغرب",
    "home.deliverySectionDesc": "اطلب بثقة. الدفع عند الاستلام بدون التزام. توصيل سريع خلال 24-48 ساعة لجميع مدن المغرب.",
    "home.startShopping": "ابدأ التسوق",
    "common.dh": "درهم",
    "common.viewAll": "عرض الكل",
    "common.loading": "جاري التحميل...",
    "common.error": "حدث خطأ",
    "common.search": "بحث",
    "common.filter": "تصفية",
    "common.sort": "ترتيب",
    "order.placeOrder": "اطلب هذا المنتج",
    "order.confirmed": "تم تأكيد طلبك!",
    "order.orderNumber": "رقم الطلب",
    "order.error": "حدث خطأ أثناء إرسال الطلب",
    "order.fullName": "الاسم الكامل",
    "order.phone": "رقم الهاتف",
    "order.address": "عنوان التوصيل",
    "order.city": "المدينة",
    "order.notes": "ملاحظات التوصيل (اختياري)",
    "order.confirm": "تأكيد الطلب",
  },
  fr: {
    "nav.home": "Accueil",
    "nav.products": "Produits",
    "nav.categories": "Catégories",
    "nav.cart": "Panier",
    "hero.title": "Découvrez notre collection exclusive",
    "hero.subtitle": "Des produits de qualité livrés chez vous. Paiement à la livraison, sans engagement. Satisfait ou remboursé.",
    "hero.cta": "Voir les produits",
    "hero.deliveryBadge": "Livraison dans tout le Maroc",
    "hero.browseCategories": "Parcourir les catégories",
    "hero.fastDelivery": "Livraison rapide",
    "hero.fastDeliveryDesc": "Sous 24-48h partout au Maroc",
    "hero.codPayment": "Paiement à la livraison",
    "hero.codPaymentDesc": "Cash on Delivery sécurisé",
    "hero.qualityGuarantee": "Garantie qualité",
    "hero.qualityGuaranteeDesc": "Satisfait ou remboursé",
    "products.title": "Produits",
    "products.featured": "Produits populaires",
    "products.featuredDesc": "Découvrez nos meilleures ventes",
    "products.all": "Tous les produits",
    "products.addToCart": "Ajouter",
    "products.addedToCart": "Ajouté au panier",
    "products.outOfStock": "Rupture de stock",
    "products.inStock": "en stock",
    "products.lowStock": "Stock limité",
    "products.noProducts": "Aucun produit disponible",
    "products.comingSoon": "Les produits apparaîtront ici bientôt",
    "categories.title": "Catégories",
    "categories.titleDesc": "Parcourez nos différentes catégories",
    "categories.browse": "Parcourez nos catégories",
    "categories.noCategories": "Aucune catégorie disponible",
    "cart.title": "Panier",
    "cart.empty": "Votre panier est vide",
    "cart.emptySubtitle": "Ajoutez des produits pour commencer",
    "cart.continue": "Continuer les achats",
    "cart.checkout": "Commander",
    "cart.total": "Total",
    "cart.subtotal": "Sous-total",
    "cart.delivery": "Livraison",
    "cart.deliveryFree": "Gratuit",
    "cart.freeDeliveryNote": "Livraison gratuite pour les commandes de plus de 300 DH",
    "cart.remove": "Supprimer",
    "cart.clear": "Vider le panier",
    "checkout.title": "Passer la commande",
    "checkout.customerInfo": "Informations client",
    "checkout.name": "Nom complet",
    "checkout.namePlaceholder": "Votre nom complet",
    "checkout.phone": "Téléphone",
    "checkout.address": "Adresse",
    "checkout.addressPlaceholder": "Adresse complète",
    "checkout.city": "Ville",
    "checkout.cityPlaceholder": "Casablanca, Rabat, Marrakech...",
    "checkout.notes": "Notes",
    "checkout.notesPlaceholder": "Notes supplémentaires (optionnel)",
    "checkout.submit": "Confirmer la commande",
    "checkout.submitting": "Envoi en cours...",
    "checkout.cod": "Paiement à la livraison",
    "checkout.codDesc": "Payez à la réception de votre commande",
    "checkout.orderSummary": "Résumé de la commande",
    "checkout.fieldRequired": "Ce champ est requis",
    "checkout.error": "Erreur",
    "checkout.errorMessage": "Échec de la commande",
    "confirmation.title": "Commande confirmée",
    "confirmation.orderNumber": "Numéro de commande",
    "confirmation.message": "Merci! Nous vous contacterons bientôt pour confirmer votre commande.",
    "confirmation.tracking": "Numéro de suivi",
    "confirmation.backHome": "Retour à l'accueil",
    "confirmation.orderNotFound": "Commande non trouvée",
    "confirmation.products": "Produits",
    "footer.rights": "Tous droits réservés",
    "footer.delivery": "Livraison dans tout le Maroc",
    "footer.description": "Votre destination shopping en ligne avec livraison partout au Maroc. Paiement à la livraison.",
    "footer.navigation": "Navigation",
    "footer.contact": "Contact",
    "footer.deliveryInfo": "Livraison",
    "footer.location": "Casablanca, Maroc",
    "footer.weekdayHours": "Lun - Sam: 9h - 20h",
    "footer.weekendHours": "Dim: 10h - 18h",
    "footer.freeDeliveryBanner": "Livraison gratuite à partir de 300 DH",
    "checkout.phonePlaceholder": "06XXXXXXXX",
    "lang.ar": "العربية",
    "lang.fr": "Français",
    "lang.en": "English",
    "home.deliverySection": "Livraison partout au Maroc",
    "home.deliverySectionDesc": "Commandez en toute confiance. Paiement à la livraison (COD) sans engagement. Livraison rapide sous 24-48h dans toutes les villes du Maroc.",
    "home.startShopping": "Commencer vos achats",
    "common.dh": "DH",
    "common.viewAll": "Voir tout",
    "common.loading": "Chargement...",
    "common.error": "Une erreur s'est produite",
    "common.search": "Rechercher",
    "common.filter": "Filtrer",
    "common.sort": "Trier",
    "order.placeOrder": "Commander ce produit",
    "order.confirmed": "Commande confirmée!",
    "order.orderNumber": "Numéro de commande",
    "order.error": "Erreur lors de la commande",
    "order.fullName": "Nom complet",
    "order.phone": "Téléphone",
    "order.address": "Adresse de livraison",
    "order.city": "Ville",
    "order.notes": "Notes de livraison (optionnel)",
    "order.confirm": "Confirmer la commande",
  },
  en: {
    "nav.home": "Home",
    "nav.products": "Products",
    "nav.categories": "Categories",
    "nav.cart": "Cart",
    "hero.title": "Discover our exclusive collection",
    "hero.subtitle": "Quality products delivered to your door. Cash on Delivery, no commitment. Satisfied or refunded.",
    "hero.cta": "View Products",
    "hero.deliveryBadge": "Delivery across Morocco",
    "hero.browseCategories": "Browse Categories",
    "hero.fastDelivery": "Fast Delivery",
    "hero.fastDeliveryDesc": "24-48h across Morocco",
    "hero.codPayment": "Cash on Delivery",
    "hero.codPaymentDesc": "Secure COD payment",
    "hero.qualityGuarantee": "Quality Guarantee",
    "hero.qualityGuaranteeDesc": "Satisfied or refunded",
    "products.title": "Products",
    "products.featured": "Popular Products",
    "products.featuredDesc": "Discover our best sellers",
    "products.all": "All Products",
    "products.addToCart": "Add",
    "products.addedToCart": "Added to cart",
    "products.outOfStock": "Out of Stock",
    "products.inStock": "in stock",
    "products.lowStock": "Limited Stock",
    "products.noProducts": "No products available",
    "products.comingSoon": "Products will appear here soon",
    "categories.title": "Categories",
    "categories.titleDesc": "Browse our different categories",
    "categories.browse": "Browse our categories",
    "categories.noCategories": "No categories available",
    "cart.title": "Shopping Cart",
    "cart.empty": "Your cart is empty",
    "cart.emptySubtitle": "Add products to start shopping",
    "cart.continue": "Continue Shopping",
    "cart.checkout": "Checkout",
    "cart.total": "Total",
    "cart.subtotal": "Subtotal",
    "cart.delivery": "Delivery",
    "cart.deliveryFree": "Free",
    "cart.freeDeliveryNote": "Free delivery for orders over 300 MAD",
    "cart.remove": "Remove",
    "cart.clear": "Clear cart",
    "checkout.title": "Checkout",
    "checkout.customerInfo": "Customer Information",
    "checkout.name": "Full Name",
    "checkout.namePlaceholder": "Your full name",
    "checkout.phone": "Phone",
    "checkout.address": "Address",
    "checkout.addressPlaceholder": "Complete address",
    "checkout.city": "City",
    "checkout.cityPlaceholder": "Casablanca, Rabat, Marrakech...",
    "checkout.notes": "Notes",
    "checkout.notesPlaceholder": "Additional notes (optional)",
    "checkout.submit": "Confirm Order",
    "checkout.submitting": "Sending...",
    "checkout.cod": "Cash on Delivery",
    "checkout.codDesc": "Pay when you receive your order",
    "checkout.orderSummary": "Order Summary",
    "checkout.fieldRequired": "This field is required",
    "checkout.error": "Error",
    "checkout.errorMessage": "Order failed",
    "confirmation.title": "Order Confirmed",
    "confirmation.orderNumber": "Order Number",
    "confirmation.message": "Thank you! We will contact you soon to confirm your order.",
    "confirmation.tracking": "Tracking Number",
    "confirmation.backHome": "Back to Home",
    "confirmation.orderNotFound": "Order not found",
    "confirmation.products": "Products",
    "footer.rights": "All rights reserved",
    "footer.delivery": "Delivery across Morocco",
    "footer.description": "Your trusted online store with delivery across Morocco. Cash on Delivery.",
    "footer.navigation": "Navigation",
    "footer.contact": "Contact",
    "footer.deliveryInfo": "Delivery",
    "footer.location": "Casablanca, Morocco",
    "footer.weekdayHours": "Mon - Sat: 9am - 8pm",
    "footer.weekendHours": "Sun: 10am - 6pm",
    "footer.freeDeliveryBanner": "Free delivery for orders over 300 MAD",
    "checkout.phonePlaceholder": "06XXXXXXXX",
    "lang.ar": "العربية",
    "lang.fr": "Français",
    "lang.en": "English",
    "home.deliverySection": "Delivery across Morocco",
    "home.deliverySectionDesc": "Order with confidence. Cash on Delivery, no commitment. Fast delivery within 24-48h to all cities in Morocco.",
    "home.startShopping": "Start Shopping",
    "common.dh": "MAD",
    "common.viewAll": "View All",
    "common.loading": "Loading...",
    "common.error": "An error occurred",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.sort": "Sort",
    "order.placeOrder": "Order this product",
    "order.confirmed": "Order confirmed!",
    "order.orderNumber": "Order number",
    "order.error": "Error placing order",
    "order.fullName": "Full name",
    "order.phone": "Phone",
    "order.address": "Delivery address",
    "order.city": "City",
    "order.notes": "Delivery notes (optional)",
    "order.confirm": "Confirm order",
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const PUBLIC_LANGUAGE_KEY = "eshop_language";
const ADMIN_LANGUAGE_KEY = "eshop_admin_language";

// Check if we're in admin area
function isAdminRoute(): boolean {
  return typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ar");

  useEffect(() => {
    if (isAdminRoute()) {
      // Admin area: allow language choice, default French
      const stored = localStorage.getItem(ADMIN_LANGUAGE_KEY) as Language | null;
      if (stored && ["ar", "fr", "en"].includes(stored)) {
        setLanguageState(stored);
      } else {
        setLanguageState("fr");
      }
    } else {
      // Public storefront: allow language choice, default Arabic
      const stored = localStorage.getItem(PUBLIC_LANGUAGE_KEY) as Language | null;
      if (stored && ["ar", "fr", "en"].includes(stored)) {
        setLanguageState(stored);
      } else {
        setLanguageState("ar");
      }
    }
  }, []);

  useEffect(() => {
    if (isAdminRoute()) {
      localStorage.setItem(ADMIN_LANGUAGE_KEY, language);
    } else {
      localStorage.setItem(PUBLIC_LANGUAGE_KEY, language);
    }
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
