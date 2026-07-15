# Guide de Déploiement - SantéPlus CI

Ce guide détaille les procédures de compilation, de configuration de l'environnement et de déploiement de **SantéPlus CI** sur des conteneurs de production (comme Google Cloud Run).

---

## 1. Scripts de Build et Démarrage

L'application intègre un processus de compilation optimisé en deux étapes géré par `package.json` :

### A. Phase de Compilation (`npm run build`)

1. **Frontend** : Compile les fichiers statiques de l'application React vers le dossier `/dist` à l'aide de Vite.
2. **Backend** : Compile et assemble le serveur Express TypeScript (`server.ts`) dans un fichier unique auto-suffisant `dist/server.cjs` à l'aide de l'outil ultra-rapide **esbuild**.

```bash
npm run build
```

### B. Commande de Production (`npm run start`)

Démarre directement le serveur Express compilé en format CommonJS. Cette méthode évite le surcoût de transpilation à la volée en production et garantit un temps de démarrage à froid minimal pour les conteneurs.

```bash
npm run start
```

---

## 2. Variables d'Environnement Requises

Pour fonctionner en production, le conteneur doit être configuré avec les variables d'environnement suivantes :

| Variable              | Description                                                                        | Exigences                                               |
| :-------------------- | :--------------------------------------------------------------------------------- | :------------------------------------------------------ |
| `NODE_ENV`            | Mode d'exécution (`production` ou `development`)                                   | Facultatif (par défaut `production`)                    |
| `GEMINI_API_KEY`      | Clé d'API Google Gemini AI (traitement des résumés et diagnostics intelligents)    | **Secret hautement sécurisé** (uniquement côté serveur) |
| `APPWRITE_ENDPOINT`   | URL de l'API publique de votre instance Appwrite                                   | Requis pour la connexion distante                       |
| `APPWRITE_PROJECT_ID` | Identifiant unique du projet Appwrite                                              | Requis                                                  |
| `APPWRITE_API_KEY`    | Clé d'API secrète Appwrite (permet au serveur d'outrepasser les restrictions RBAC) | **Secret serveur**                                      |
| `APPWRITE_DB_ID`      | Identifiant de la base de données clinique dans Appwrite                           | Requis                                                  |

_Note de sécurité : Aucune clé d'API ne doit être exposée côté client dans le code source ou dans les variables publiques `VITE_*` si elles sont critiques._

---

## 3. Déploiement sur Google Cloud Run (ou Docker)

### A. Dockerfile Standardisé

Voici une configuration de Dockerfile optimisée pour SantéPlus CI (Multi-stage build) :

```dockerfile
# Étape 1 : Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Étape 2 : Production Run
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts

EXPOSE 3000
CMD ["npm", "run", "start"]
```

### B. Recommandations Cloud Run

- **Port d'écoute** : Configurez le conteneur pour écouter uniquement sur le port `3000`. Cloud Run mappe automatiquement le trafic externe HTTPS sur ce port.
- **Gestion des Secrets** : Utilisez Google Secret Manager pour injecter de manière sécurisée la variable `GEMINI_API_KEY` et la variable `APPWRITE_API_KEY` en tant que variables d'environnement au démarrage du conteneur Cloud Run.
- **Mémoire minimum recommandée** : 512 Mo à 1 Go de RAM pour un fonctionnement fluide avec les API de modèles d'IA.
