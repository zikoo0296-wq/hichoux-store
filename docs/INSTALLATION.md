# 📦 Guide d'Installation - Hichoux Store

Ce guide vous accompagne pas à pas dans l'installation complète du système Hichoux Store.

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir :

- ✅ Un compte [Supabase](https://supabase.com) (gratuit)
- ✅ Un compte [Google](https://google.com) (pour Google Sheets)
- ✅ Un navigateur web moderne (Chrome, Firefox, Safari)
- ✅ (Optionnel) Un compte [Digylog](https://digylog.com) pour la livraison
- ✅ (Optionnel) Un éditeur de code (VS Code recommandé)

---

## 🚀 Étape 1 : Configurer Supabase

### 1.1 Créer un projet

1. Allez sur [supabase.com](https://supabase.com) et connectez-vous
2. Cliquez sur **"New Project"**
3. Remplissez les informations :
   - **Name**: `hichoux-store`
   - **Database Password**: Choisissez un mot de passe sécurisé (notez-le!)
   - **Region**: Choisissez la plus proche (ex: Frankfurt)
4. Cliquez sur **"Create new project"**
5. Attendez ~2 minutes que le projet soit créé

### 1.2 Récupérer les credentials

1. Dans votre projet, allez dans **Settings** (icône engrenage) → **API**
2. Notez ces informations :
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIs...`

### 1.3 Créer la base de données

1. Allez dans **SQL Editor** (icône code)
2. Cliquez sur **"New Query"**
3. Ouvrez le fichier `database/schema.sql` et copiez tout le contenu
4. Collez dans l'éditeur SQL
5. Cliquez sur **"Run"** (ou Ctrl+Enter)
6. Attendez le message de succès

### 1.4 Ajouter les données d'exemple (optionnel)

1. Créez une nouvelle query
2. Copiez le contenu de `database/seed.sql`
3. Exécutez

---

## 📊 Étape 2 : Configurer Google Sheets

### 2.1 Créer le spreadsheet

1. Allez sur [Google Sheets](https://sheets.google.com)
2. Créez un nouveau spreadsheet
3. Renommez-le "Hichoux Store - Orders"
4. Notez l'ID du spreadsheet (dans l'URL : `https://docs.google.com/spreadsheets/d/`**ID_ICI**`/edit`)

### 2.2 Déployer le script

1. Dans Google Sheets, allez dans **Extensions** → **Apps Script**
2. Supprimez le code existant
3. Copiez le contenu de `scripts/google-apps-script.js`
4. Collez dans l'éditeur
5. Cliquez sur **"Enregistrer"** (Ctrl+S)
6. Nommez le projet : "Hichoux Store API"

### 2.3 Déployer comme Web App

1. Cliquez sur **"Déployer"** → **"Nouveau déploiement"**
2. Cliquez sur l'icône ⚙️ à côté de "Sélectionner le type"
3. Choisissez **"Application Web"**
4. Configurez :
   - **Description**: "Hichoux Store Sync API"
   - **Exécuter en tant que**: "Moi"
   - **Qui a accès**: "Tout le monde"
5. Cliquez sur **"Déployer"**
6. **Autorisez** l'accès quand demandé
7. Copiez l'**URL de l'application web** (elle ressemble à : `https://script.google.com/macros/s/xxx/exec`)

---

## ⚙️ Étape 3 : Configurer le projet

### 3.1 Modifier config.js

Ouvrez `config/config.js` et modifiez ces valeurs :

```javascript
const CONFIG = {
    // Supabase (de l'étape 1.2)
    SUPABASE_URL: 'https://votre-projet.supabase.co',
    SUPABASE_ANON_KEY: 'votre-anon-key-ici',
    
    // Google Sheets (de l'étape 2.3)
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/xxx/exec',
    
    // Vos informations
    STORE_NAME: 'Hichoux Store',
    STORE_PHONE: '0600000000',
    WHATSAPP_NUMBER: '212600000000',
    
    // ... autres paramètres
};
```

---

## 🖥️ Étape 4 : Lancer le projet

### Option A : Avec VS Code (Recommandé)

1. Installez l'extension **"Live Server"**
2. Ouvrez le dossier du projet dans VS Code
3. Clic droit sur `frontend/index.html`
4. Sélectionnez **"Open with Live Server"**
5. Le site s'ouvre automatiquement

### Option B : Avec Python

```bash
cd hichoux-store
python -m http.server 8000
```
Puis ouvrez `http://localhost:8000/frontend/`

### Option C : Avec Node.js

```bash
npx serve .
```
Puis ouvrez l'URL affichée

---

## 🔗 Étape 5 : Accéder au système

- **Frontend Client** : `http://localhost:8000/frontend/`
- **Backend Admin** : `http://localhost:8000/admin/`

### Première connexion Admin

1. Ouvrez le backend admin
2. La modal de configuration apparaît
3. Entrez vos credentials Supabase
4. Entrez l'URL Google Apps Script (optionnel)
5. Cliquez sur **"Connecter"**

---

## 🚚 Étape 6 : Configurer Digylog (Optionnel)

### 6.1 Obtenir le token API

1. Connectez-vous à votre compte [Digylog](https://digylog.com)
2. Allez dans **Paramètres** → **API**
3. Générez ou copiez votre **Bearer Token**

### 6.2 Configurer dans l'admin

1. Allez dans **Paramètres** dans le backend admin
2. Section "API Digylog"
3. Entrez votre Bearer Token
4. Cliquez sur "Tester la connexion"
5. Sauvegardez

---

## 🌐 Étape 7 : Déploiement (Production)

### Option A : Vercel (Gratuit)

1. Créez un compte sur [Vercel](https://vercel.com)
2. Connectez votre GitHub
3. Importez le repository
4. Déployez

### Option B : Netlify (Gratuit)

1. Créez un compte sur [Netlify](https://netlify.com)
2. Glissez-déposez le dossier du projet
3. Configurez le domaine

### Option C : Hébergement traditionnel

1. Uploadez les fichiers via FTP
2. Pointez le domaine vers le dossier

---

## ✅ Vérification

Après installation, vérifiez que :

- [ ] Le frontend affiche les produits
- [ ] Le panier fonctionne
- [ ] Les commandes se créent dans Supabase
- [ ] L'admin affiche les commandes
- [ ] La confirmation met à jour le statut
- [ ] Google Sheets se synchronise
- [ ] Le suivi de commande fonctionne

---

## 🔧 Dépannage

### "Supabase non connecté"
- Vérifiez l'URL et l'anon key dans config.js
- Vérifiez que le projet Supabase est actif

### "Google Sheets ne synchronise pas"
- Vérifiez que le script est déployé en "Application Web"
- Vérifiez que "Tout le monde" a accès
- Testez l'URL directement dans le navigateur

### "Erreurs CORS"
- Utilisez un serveur local (pas file://)
- Vérifiez les politiques RLS dans Supabase

### "Les produits ne s'affichent pas"
- Vérifiez que les données sont dans Supabase
- Exécutez seed.sql si besoin
- Vérifiez la console du navigateur (F12)

---

## 📞 Support

Si vous avez des questions :

- 📧 Email: contact@hichouxstore.ma
- 💬 WhatsApp: +212 600 000 000

---

**Bonne installation ! 🎉**
