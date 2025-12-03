# 🚀 Guide de déploiement

Ce projet peut être déployé sur GitHub et divers services d'hébergement. Voici comment faire fonctionner l'application sur GitHub.

## 📋 Prérequis

- Node.js 18+
- PostgreSQL 14+ (ou utiliser Neon Serverless)
- Git

## 🔧 Configuration pour GitHub

### 1. Cloner et installer les dépendances

```bash
git clone <your-repo-url>
cd <project-directory>
npm install
```

### 2. Variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables requises:

```bash
cp .env.example .env
```

Ensuite, modifiez `.env` avec vos valeurs réelles:

```
DATABASE_URL=postgresql://user:password@localhost:5432/eshop
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=password
PGDATABASE=eshop
SESSION_SECRET=your-secret-key-here
```

### 3. Configuration de la base de données

Pour PostgreSQL local:
```bash
createdb eshop
```

Pour utiliser Neon Serverless (recommandé pour GitHub):
1. Créez un compte sur [neon.tech](https://neon.tech)
2. Créez une nouvelle base de données
3. Copiez le `DATABASE_URL` et mettez-le dans `.env`

### 4. Lancer l'application

```bash
npm run dev
```

L'application démarre sur http://localhost:5000

### 5. Construire pour la production

```bash
npm run build
```

## 🌐 Déployer sur Vercel ou Render

### Pour Vercel (Frontend):
1. Push le projet sur GitHub
2. Connectez Vercel à votre repo GitHub
3. Configurez les variables d'environnement dans Vercel
4. Déployez

### Pour Render (Backend):
1. Créez un service Web sur Render.com
2. Connectez votre repo GitHub
3. Configurez les variables d'environnement
4. Configurer la commande de démarrage: `npm run build && npm start`

## 📝 Notes importantes

- **NE PAS** committer le fichier `.env` (il est dans `.gitignore`)
- Toujours utiliser `.env.example` pour documenter les variables requises
- Assurez-vous que `DATABASE_URL` pointe vers votre base de données en production
- Les secrets (SESSION_SECRET, clés API) doivent être configurés dans votre service d'hébergement

## 🐛 Dépannage

### "Database connection failed"
- Vérifiez que `DATABASE_URL` est correct dans `.env`
- Assurez-vous que PostgreSQL est en cours d'exécution
- Pour Neon, vérifiez que la base de données existe

### "Command not found: npm"
- Assurez-vous que Node.js est installé: `node -v`
- Réinstallez les dépendances: `npm install`

### "Port 5000 already in use"
- Changez le port dans `server/index.ts`
- Ou arrêtez le service qui utilise le port 5000

## 📚 Structure du projet

```
.
├── client/              # Frontend React
├── server/              # Backend Express
├── shared/              # Types et schémas partagés
├── package.json         # Dépendances
└── .env.example         # Template des variables d'environnement
```
