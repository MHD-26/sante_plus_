# 🏥 Clinique Santé Plus CI — Système de Gestion Hospitalière Sécurisé

**Clinique Santé Plus CI** est une application full-stack hautement sécurisée, performante et résiliente, conçue pour la gestion complète d'une infrastructure hospitalière. Elle intègre un contrôle d'accès strict basé sur les rôles (RBAC), une résilience réseau avancée avec fonctionnement hors-ligne (Offline-First) et une intégration native et sécurisée avec le service BaaS **Appwrite**.

L'application est développée avec **React 19**, **Vite**, **Tailwind CSS**, **Framer Motion**, **Express** et **Node-Appwrite (SDK Server-Side)**.

---

## 🛡️ Architecture & Fonctionnalités de Sécurité Avancées

Ce projet a été conçu selon les standards professionnels de protection des données médicales de santé :

### 1. Authentification & Sessions (Appwrite Native)
*   **Intégration d'Appwrite Auth** : Gestion sécurisée des authentifications directement via le système natif d'Appwrite. Les mots de passe ne sont jamais transmis en clair et bénéficient du chiffrement par hachage d'Appwrite.
*   **Politique de premier changement de mot de passe** : Détection des connexions initiales pour contraindre l'utilisateur à personnaliser son mot de passe pour des raisons de sécurité.
*   **Récupération Sécurisée (Forgot Password)** : Formulaire de demande de réinitialisation sécurisé générant un lien à usage unique expirable sous 1 heure via Appwrite.

### 2. Contrôle d'Accès Strict (RBAC)
L'accès aux données cliniques et aux fonctionnalités est filtré par un système rigoureux de rôle utilisateur. Les 8 rôles pris en charge sont :
*   **Directeur** : Accès global à la supervision de la clinique (audits, rapports financiers, statistiques).
*   **Administrateur** : Gestion du personnel, maintenance de la base de données, sauvegardes cliniques.
*   **Médecin** : Consultation et modification des fiches patients et dossiers médicaux.
*   **Secrétaire** : Enregistrement des admissions, accueil des patients, planification des rendez-vous.
*   **Pharmacien** : Suivi des stocks de médicaments, ordonnances et approvisionnements.
*   **Laboratoire** : Enregistrement et gestion des examens médicaux, résultats de laboratoire.
*   **Comptable** : Gestion de la facturation, édition des factures, paiements des patients.
*   **Patient** : Accès restreint strictement limité à son **propre dossier médical** (aucune possibilité de consulter d'autres dossiers).

### 3. Protection Active contre les Cyberattaques
*   **Anti-Force Brute (Lockout temporaire)** : Surveillance des adresses IP sur le serveur d'API. Le système verrouille temporairement l'IP après 5 tentatives de connexion erronées pour une durée de 15 minutes.
*   **Protection contre les Injections & XSS** : Middleware Express de désinfection systématique des données entrantes (req.body et req.query) nettoyant les balises scripts, événements JS et balises HTML malveillantes.
*   **Principe du Moindre Privilège** : Clés API sensibles et clés de service stockées exclusivement côté serveur (Express), invisibles pour le navigateur client.

### 4. Journal d'Audit & de Traçabilité Clinique
Un module complet de traçabilité enregistre en temps réel toutes les transactions et actions cruciales au sein de l'établissement :
*   Connexions / Déconnexions réussies et échouées.
*   Créations de comptes patients ou d'utilisateurs.
*   Modifications importantes des antécédents médicaux ou prescriptions.
*   Suppressions d'éléments critiques.
*   Le journal d'audit est consultable sous forme de tableau filtrable par la direction et l'administration dans le panneau de configuration.

### 5. Résilience Hors-ligne & Cache Local (Offline-First)
*   **Fonctionnement continu** : L'application détecte automatiquement les coupures réseau de l'établissement. En cas de perte de connexion, l'intégralité des fonctionnalités reste disponible localement.
*   **File de synchronisation (Sync Queue)** : Toutes les actions d'enregistrement de fiches ou ordonnances effectuées hors-ligne sont mémorisées dans une file d'attente cryptée dans le `localStorage`.
*   **Reconnexion Automatique** : Dès la détection du retour d'Internet, les transactions locales en attente sont automatiquement sérialisées et répercutées sur la base de données Cloud Appwrite sans perte d'effort utilisateur.

---

## 📂 Structure du Projet

```text
├── server.ts              # Serveur Express d'API avec sanitization & anti-force brute
├── src/
│   ├── App.tsx            # Point d'entrée de l'application React
│   ├── main.tsx           # Initialisation React et liaison DOM
│   ├── index.css          # Importation Tailwind CSS & Déclaration typographique (Inter)
│   ├── types.ts           # Types TypeScript, Enums, et interfaces du journal d'audit
│   ├── useAppState.ts     # Hook d'état global, gestion hors-ligne et synchronisation local-cloud
│   ├── data.ts            # Données de démo de base de la clinique
│   ├── services/
│   │   ├── appwrite.ts    # Client Appwrite Web SDK
│   │   └── auth.ts        # Client et simulation des services d'authentification Appwrite
│   └── components/
│       ├── AuthView.tsx     # Écrans de connexion, d'inscription, de reset et de mot de passe obligatoire
│       ├── SettingsView.tsx # Configuration clinique, export/import JSON et Journal d'Audit
│       ├── Navigation.tsx   # Barre d'outils, navigation responsive et contrôle réseau
│       └── ...              # Autres vues cliniques (Patients, Rendez-vous, Pharmacie, Labo...)
├── .gitignore             # Règles d'exclusion Git pour préserver les secrets
├── .env.example           # Gabarit de configuration des variables d'environnement
├── tsconfig.json          # Configuration du compilateur TypeScript
└── package.json           # Scripts de build, démarrage et dépendances du projet
```

---

## 🛠️ Installation et Démarrage Local

### Prérequis
*   **Node.js** (v18+)
*   **npm** ou **yarn**
*   Un projet sur la console [Appwrite Cloud](https://cloud.appwrite.io/) (facultatif si vous souhaitez utiliser l'application en mode Démo résilient autonome).

### Étape 1 : Cloner le dépôt
```bash
git clone <URL_DE_VOTRE_DEPOT_GITHUB>
cd <NOM_DU_DOSSIER>
```

### Étape 2 : Configurer les variables d'environnement
Copiez le modèle `.env.example` pour créer votre fichier `.env` local :
```bash
cp .env.example .env
```
Éditez le fichier `.env` et renseignez vos identifiants d'API Appwrite :
```env
GEMINI_API_KEY="votre_cle_gemini_api"
APP_URL="http://localhost:3000"

APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
APPWRITE_PROJECT_ID="votre_id_projet_appwrite"
APPWRITE_API_KEY="votre_cle_api_securisee_appwrite"
APPWRITE_DATABASE_ID="votre_id_base_de_donnees"
```

*Note : Le fichier `.env` est déjà listé dans `.gitignore` et ne sera jamais envoyé sur GitHub.*

### Étape 3 : Installer les dépendances
```bash
npm install
```

### Étape 4 : Initialiser la base de données Appwrite
Pour pré-créer automatiquement les collections (`users`, `patients`, `appointments`, `inventory`, `invoices`, `complaints`) sur votre serveur Appwrite, lancez le script automatisé fourni :
```bash
npm run init-db
```

### Étape 5 : Lancer le serveur de développement
```bash
npm run dev
```
L'application démarre alors sur `http://localhost:3000`.

---

## 📦 Compilation pour la Production

Pour générer un livrable optimisé et sécurisé pour un conteneur ou un serveur cloud :

```bash
npm run build
```
Ce script réalise deux opérations :
1.  Compile les fichiers statiques de l'application React avec **Vite** dans `/dist`.
2.  Compile le fichier backend `server.ts` avec **esbuild** sous forme de module CommonJS autonome (`dist/server.cjs`) pour éliminer tout problème d'importation Node ESM.

Pour démarrer l'application compilée :
```bash
npm run start
```

---

## 🚀 Publication professionnelle sur votre dépôt GitHub existant

Si vous devez lier ce projet local à un dépôt distant existant de manière sécurisée, suivez ces instructions dans votre terminal :

1.  **Initialiser Git localement** (si non fait) :
    ```bash
    git init
    ```

2.  **Vérifier le statut des fichiers** (s'assurer que le fichier `.env` est bien exclu) :
    ```bash
    git status
    ```
    *Vérifiez qu'aucun fichier `.env` n'apparaît dans la liste des fichiers à indexer.*

3.  **Ajouter tous les fichiers sûrs** :
    ```bash
    git add .
    ```

4.  **Enregistrer le premier commit de version** :
    ```bash
    git commit -m "feat: initial commit - systeme hospitalier securise avec Appwrite, RBAC et Offline-First"
    ```

5.  **Lier votre dépôt GitHub distant** :
    ```bash
    git remote add origin <URL_DE_VOTRE_DEPOT_GITHUB_EXISTANT>
    ```

6.  **Définir la branche principale et envoyer le code** :
    ```bash
    git branch -M main
    ```
    ```bash
    git push -u origin main
    ```

---

## 💾 Sauvegarde & Restauration clinique
*   **Sauvegardes manuelles** : Depuis l'onglet **Base de Données** de la vue Paramètres, les administrateurs peuvent télécharger d'un clic un fichier JSON crypté de secours.
*   **Restauration rapide** : En cas de sinistre ou de réinitialisation d'usine, l'importation de ce fichier JSON restaure l'intégralité de l'état clinique en quelques millisecondes, avec traçabilité complète dans le journal d'audit.
