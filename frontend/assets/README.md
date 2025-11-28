# 📁 Assets

Ce dossier contient les ressources statiques du frontend.

## Structure

```
assets/
├── images/
│   ├── logo.png           # Logo du store
│   ├── favicon.png        # Favicon 32x32
│   ├── hero-bg.jpg        # Image hero section
│   └── products/          # Images produits
│       ├── parfum-001.jpg
│       ├── parfum-002.jpg
│       └── ...
└── README.md
```

## Images Produits

Les images produits doivent être :
- **Format** : JPG ou PNG
- **Dimensions** : 400x400 px minimum (carré)
- **Taille** : < 500 KB optimisé

## Placeholder

En attendant les vraies images, les placeholders sont générés via :
```
https://via.placeholder.com/400x400/1a1a1a/D4AF37?text=Product+Name
```

## Logo

Le logo doit être fourni en plusieurs formats :
- `logo.png` - 200x200 px (header)
- `logo-large.png` - 500x500 px (autres usages)
- `favicon.png` - 32x32 px
- `favicon.ico` - 16x16 px

## Upload vers Supabase Storage

Pour stocker les images dans Supabase :

1. Aller dans **Storage** dans le dashboard Supabase
2. Créer un bucket `products` (public)
3. Upload les images
4. Utiliser les URLs publiques dans les produits

URL format :
```
https://[PROJECT_ID].supabase.co/storage/v1/object/public/products/[filename]
```
