# 📸 Screenshots

Ce dossier contient les captures d'écran pour la documentation.

## Images requises

| Fichier | Description | Dimensions |
|---------|-------------|------------|
| `frontend.png` | Page d'accueil frontend | 1200x800 |
| `admin.png` | Dashboard admin | 1200x800 |
| `catalog.png` | Page catalogue | 1200x800 |
| `checkout.png` | Page checkout | 800x600 |
| `confirmation.png` | Module confirmation | 1200x600 |
| `mobile.png` | Vue mobile | 375x812 |

## Comment prendre des captures

### Option 1 : Extension Chrome
1. Installer "Full Page Screen Capture"
2. Ouvrir la page à capturer
3. Cliquer sur l'extension
4. Télécharger l'image

### Option 2 : DevTools Chrome
1. Ouvrir DevTools (F12)
2. Cmd/Ctrl + Shift + P
3. Taper "screenshot"
4. Choisir "Capture full size screenshot"

### Option 3 : macOS
```bash
# Screenshot region
Cmd + Shift + 4
```

## Optimisation

Avant d'ajouter au repo, optimiser les images :

```bash
# Avec ImageOptim (macOS)
open -a ImageOptim *.png

# Avec optipng (Linux)
optipng -o7 *.png

# Avec squoosh.app (Web)
# https://squoosh.app
```

## Placeholder

En attendant les vraies captures :
```
![Frontend](https://via.placeholder.com/1200x800/1a1a1a/D4AF37?text=Frontend+Screenshot)
![Admin](https://via.placeholder.com/1200x800/2563eb/ffffff?text=Admin+Dashboard)
```
