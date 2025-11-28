# 🚀 Guide de Déploiement - Hichoux Store

Ce guide explique comment déployer votre application en production.

---

## 📋 Options de Déploiement

| Plateforme | Coût | Difficulté | Recommandé |
|------------|------|------------|------------|
| Vercel | Gratuit | ⭐ Facile | ✅ |
| Netlify | Gratuit | ⭐ Facile | ✅ |
| GitHub Pages | Gratuit | ⭐⭐ Moyen | ⚠️ (static only) |
| Hébergement Maroc | ~300 DH/an | ⭐⭐ Moyen | ✅ |

---

## 🔷 Déploiement sur Vercel (Recommandé)

### Étape 1 : Préparer le projet

```bash
# S'assurer que le projet est sur GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/votre-username/hichoux-store.git
git push -u origin main
```

### Étape 2 : Connecter à Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Se connecter avec GitHub
3. Cliquer **"Add New Project"**
4. Sélectionner le repo `hichoux-store`
5. Configuration :
   - **Framework Preset** : Other
   - **Root Directory** : `.` (racine)
   - **Build Command** : (laisser vide)
   - **Output Directory** : `.`
6. Cliquer **"Deploy"**

### Étape 3 : Variables d'environnement (optionnel)

Dans Vercel > Settings > Environment Variables :

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
GOOGLE_SCRIPT_URL=https://script.google.com/...
```

### Étape 4 : Domaine personnalisé

1. Aller dans **Settings** → **Domains**
2. Ajouter `hichouxstore.ma`
3. Configurer les DNS chez votre registrar :
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### URLs finales

- Frontend : `https://hichouxstore.ma/frontend/`
- Admin : `https://hichouxstore.ma/admin/`

---

## 🔷 Déploiement sur Netlify

### Étape 1 : Connecter le repo

1. Aller sur [netlify.com](https://netlify.com)
2. Se connecter avec GitHub
3. Cliquer **"Add new site"** → **"Import an existing project"**
4. Sélectionner le repo

### Étape 2 : Configuration

```
Build command: (laisser vide)
Publish directory: .
```

### Étape 3 : Redirects (important!)

Créer un fichier `_redirects` à la racine :

```
/frontend/* /frontend/index.html 200
/admin/* /admin/index.html 200
```

Ou `netlify.toml` :

```toml
[[redirects]]
  from = "/frontend/*"
  to = "/frontend/index.html"
  status = 200

[[redirects]]
  from = "/admin/*"
  to = "/admin/index.html"
  status = 200
```

### Étape 4 : Domaine personnalisé

1. Aller dans **Domain settings**
2. Ajouter votre domaine
3. Configurer les DNS

---

## 🔷 Hébergement Maroc (cPanel)

### Providers recommandés

- [Genious](https://genious.ma) - ~300 DH/an
- [Moroccan Host](https://moroccanhost.ma) - ~250 DH/an
- [Weboo](https://weboo.ma) - ~200 DH/an

### Étape 1 : Acheter l'hébergement

1. Choisir un plan "Web Hosting" basique
2. Acheter un domaine `.ma` (~100 DH/an)

### Étape 2 : Upload via cPanel

1. Accéder à cPanel
2. Aller dans **File Manager**
3. Naviguer vers `public_html`
4. Upload le dossier du projet
5. Extraire si ZIP

### Étape 3 : Structure finale

```
public_html/
├── index.html          # Redirect vers /frontend/
├── frontend/
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/
├── admin/
│   ├── index.html
│   ├── css/
│   └── js/
└── config/
```

### Étape 4 : Créer index.html de redirection

```html
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0;url=/frontend/">
    <script>window.location.href = '/frontend/';</script>
</head>
<body>
    <a href="/frontend/">Cliquez ici</a>
</body>
</html>
```

---

## 🔒 Sécurité en Production

### 1. Protéger l'admin

Ajouter une authentification basique via `.htaccess` :

```apache
# Dans /admin/.htaccess
AuthType Basic
AuthName "Admin Access"
AuthUserFile /home/user/.htpasswd
Require valid-user
```

Créer le fichier `.htpasswd` :
```bash
htpasswd -c .htpasswd admin
```

### 2. HTTPS obligatoire

Dans `.htaccess` :
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### 3. Headers de sécurité

```apache
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"
```

---

## 📊 Monitoring

### Google Analytics

Ajouter dans `frontend/index.html` avant `</head>` :

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Facebook Pixel

```html
<!-- Facebook Pixel -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
```

---

## 🔄 CI/CD avec GitHub Actions

Créer `.github/workflows/deploy.yml` :

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## ✅ Checklist Pré-Déploiement

- [ ] Configuration Supabase mise à jour
- [ ] URL Google Apps Script correcte
- [ ] Images produits uploadées
- [ ] HTTPS configuré
- [ ] Domaine configuré
- [ ] Analytics installé
- [ ] Test checkout complet
- [ ] Test sur mobile
- [ ] Backup de la config

---

## 📞 Support

Si vous avez des problèmes de déploiement :
- 📧 Email : contact@hichouxstore.ma
- 📚 Docs Vercel : https://vercel.com/docs
- 📚 Docs Netlify : https://docs.netlify.com
