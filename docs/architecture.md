# Architecture du Système - SantéPlus CI

Ce document décrit l'architecture globale, la structure et le flux de données de la plateforme **SantéPlus CI**, un système complet de gestion clinique et de traçabilité médicale.

---

## 1. Vue d'ensemble de l'architecture

SantéPlus CI utilise une architecture full-stack hybride conçue pour la résilience (capacités hors-ligne), la sécurité des données de santé et l'extensibilité :

```
┌────────────────────────────────────────────────────────┐
│                   Navigateur Client                    │
│  ┌───────────────────────┐   ┌──────────────────────┐  │
│  │    React 19 + Vite    │ ◄─┤  useAppState State   │  │
│  │   Composants Tailwind │   │   & LocalStorage     │  │
│  └───────────┬───────────┘   └───────────▲──────────┘  │
└──────────────┼───────────────────────────┼─────────────┘
               │                           │
               │ Requêtes HTTP (Port 3000) │ Synchronisation
               ▼                           │ hors-ligne
┌──────────────┴───────────────────────────┴─────────────┐
│                Serveur Express Backend                 │
│  ┌───────────────────────┐   ┌──────────────────────┐  │
│  │  Vite Dev Middleware  │   │  API Proxies (Auth,  │  │
│  │  / Production Assets  │   │  Audit Logs, Gemini) │  │
│  └───────────────────────┘   └───────────┬──────────┘  │
└──────────────────────────────────────────┼─────────────┘
                                           │
                                           ▼ Node-Appwrite SDK
┌────────────────────────────────────────────────────────┐
│                   Service Cloud / DB                   │
│         ┌─────────────────────────────────────┐        │
│         │        Appwrite Cloud Project       │        │
│         │  (Bases de données & Auth Users)    │        │
│         └─────────────────────────────────────┘        │
└────────────────────────────────────────────────────────┘
```

---

## 2. Composants Clés

### A. Frontend (Client-Side)

- **React 19 & Vite** : Utilisé pour un rendu réactif ultra-rapide et un développement moderne.
- **Tailwind CSS (v4)** : Framework utilitaire pour un design épuré, responsive et accessible.
- **`useAppState.ts`** : Le moteur d'état global du client. Il gère l'état de la connexion, les listes locales (patients, rendez-vous, stocks) et orchestre la synchronisation avec le localStorage pour le support hors-ligne, tout en effectuant les appels synchronisés vers le serveur Express.
- **Lucide React** : Utilisé pour l'ensemble du système d'icônes standardisées.

### B. Backend (Proxy & API)

- **Express (Node.js)** : Serveur d'applications centralisé qui écoute sur le port unique accessible `3000`.
- **Intégration Vite Middleware** : En mode développement (`development`), Express sert les fichiers via le middleware dynamique de Vite. En production, il sert les fichiers statiques optimisés depuis `/dist`.
- **Node-Appwrite SDK** : Utilisé de manière sécurisée côté serveur pour interagir avec le projet Appwrite (création de documents, listes de documents, gestion des utilisateurs).

---

## 3. Flux de Données et Résilience (Hors-ligne / En-ligne)

SantéPlus CI implémente un mécanisme robuste de résilience pour s'assurer que les cliniques et centres de santé continuent de fonctionner même en cas de coupure internet temporaire :

1. **Opérations en écriture** :
   - Lorsque l'utilisateur effectue une action (ex: ajouter un rendez-vous ou modifier une ordonnance), l'action est immédiatement enregistrée dans le state local de React et persistée dans le `localStorage`.
   - Si le client est en ligne (`isOnline: true`), l'action est envoyée au serveur Express qui la répercute de manière asynchrone et robuste sur les collections Appwrite.
   - En cas d'erreur réseau, les logs d'audit et les données restent sauvegardés localement.

2. **Opérations en lecture** :
   - Au chargement initial ou lors de la détection du retour en ligne, l'application tente de synchroniser ses listes locales en récupérant les documents les plus récents depuis les API du serveur Express.

---

## 4. Structure du Code

```
├── docs/                      # Documentation technique
├── scripts/                   # Scripts utilitaires et de migration (ex: init-appwrite.ts)
├── src/                       # Code source de l'application React
│   ├── __tests__/             # Suite de tests unitaires et d'intégration
│   ├── components/            # Composants de l'interface utilisateur par vue (Patients, Rdv, etc.)
│   ├── services/              # Logique de communication API (Auth)
│   ├── lib/                   # Configuration des SDK clients (Appwrite client-side)
│   ├── types.ts               # Définitions de types et d'interfaces TypeScript strictes
│   ├── useAppState.ts         # Hook d'état applicatif centralisé
│   ├── data.ts                # Données de démonstration et structures initiales
│   ├── App.tsx                # Point d'entrée principal des vues et du routage
│   └── main.tsx               # Point d'ancrage React DOM
├── server.ts                  # Serveur d'application Express full-stack
├── package.json               # Dépendances et scripts de build
└── vite.config.ts             # Configuration du bundler Vite
```
