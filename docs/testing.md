# Guide des Tests et Scénarios d'Assurance Qualité (QA) - SantéPlus CI

Ce document décrit la stratégie de test de **SantéPlus CI**, incluant l'exécution des tests unitaires automatisés et les fiches de scénarios pour les tests d'acceptation manuels (UAT).

---

## 1. Tests Automatisés (Unitaires et Intégration)

L'application utilise le framework moderne **Vitest** couplé à **React Testing Library** et **JSDOM** pour exécuter les tests unitaires et s'assurer de l'intégrité du code.

### Commandes d'Exécution :

```bash
# Lancer les tests une seule fois (mode CI)
npm run test

# Lancer les tests en mode interactif (watch mode pour le développement)
npm run test:watch
```

### Couverture des Tests :

1. **Intégrité des Données Cliniques** (`src/__tests__/data.test.ts`) :
   - Vérification de la structure et du formatage des données d'initialisation des patients (IDs au format `PAT-XXX`).
   - Unicité absolue des identifiants patients pour éviter tout risque de collision de dossiers.
   - Présence obligatoire des clauses de consentement de données sensibles.

2. **Rendu et Composants UI** (`src/__tests__/Logo.test.tsx`) :
   - Vérification de la conformité visuelle et géométrique des composants de l'image de marque (ex: SVG Logo).
   - Application correcte des classes Tailwind réactives et des dimensions dynamiques.

3. **Sécurité et RBAC** (`src/__tests__/security.test.ts`) :
   - Test unitaire du middleware `enforceRBAC` pour isoler les droits.
   - Validation que les requêtes avec en-têtes valides d'un rôle autorisé (ex: `medecin` ou `administrateur`) sont autorisées et transmettent le contrôle au contrôleur suivant (`next()`).
   - Validation que les requêtes d'utilisateurs non autorisés (ex: un `patient` ou une `secretaire` tentant d'ajouter du personnel) sont immédiatement rejetées avec un statut **HTTP 403 (Forbidden)** et un message JSON structuré.
   - Vérification de la journalisation automatique et transparente d'un audit de type "Accès refusé" avec IP et détails dans la base de données.

---

## 2. Scénarios de Tests Manuels (UAT)

Pour valider l'étanchéité des rôles de l'application sur le terrain, exécutez la campagne de tests manuels suivante :

### 📋 Scénario 1 : Contrôle d'Étanchéité des Rôles (Secretariat vs Journal d'Audit)
*   **Objectif** : S'assurer qu'une secrétaire ne peut en aucun cas lire ou exporter les journaux d'audit système.
*   **Étapes de Test** :
    1. Connectez-vous avec un profil de type **Secrétaire** (`secretaire@santeplus.ci` ou via le sélecteur de rôle en mode démo).
    2. Essayez de naviguer vers l'onglet **Paramètres** ou de forcer l'accès à la route d'API `GET /api/audit/logs` via un outil réseau/navigateur.
*   **Résultats Attendus** :
    - L'interface masque automatiquement les onglets de sécurité.
    - Tout appel direct à `GET /api/audit/logs` renvoie une erreur **HTTP 403 (Accès Refusé)**.
    - Une entrée d'échec d'audit est créée avec la mention `Accès refusé` dans la base Appwrite.

### 📋 Scénario 2 : Consentement Patient Obligatoire
*   **Objectif** : Empêcher le traitement de données cliniques sans consentement signé.
*   **Étapes de Test** :
    1. Connectez-vous en tant que **Médecin** ou **Secrétaire**.
    2. Allez dans l'onglet **Patients** et cliquez sur "Ajouter un Patient".
    3. Remplissez toutes les coordonnées civiles (Nom, Prénom, Téléphone) mais **décochez** la case *"Consentement de traitement des données sensibles"*.
    4. Cliquez sur "Enregistrer".
*   **Résultats Attendus** :
    - Le système bloque la création du dossier patient.
    - Un message d'avertissement clair rappelle que le consentement est légalement requis pour le traitement des informations de santé de Côte d'Ivoire.

### 📋 Scénario 3 : Enregistrement et Rapprochement d'Actes Cliniques (Médecin)
*   **Objectif** : Vérifier que seul un Médecin peut consigner des informations de diagnostic intimes.
*   **Étapes de Test** :
    1. Connectez-vous en tant que **Médecin** (`medecin@santeplus.ci`).
    2. Ouvrez la fiche clinique d'un patient existant.
    3. Ajoutez une consultation avec diagnostic précis, posologie de traitement, et enregistrez.
*   **Résultats Attendus** :
    - La consultation est enregistrée dans l'historique du patient.
    - Un événement de type `Modification Ordonnance` ou `Consultation Dossier` contenant le nom du médecin prescripteur est généré dans les logs d'audit.
    - Connectez-vous ensuite avec un profil **Réceptionniste** : vérifiez que la consultation est masquée ou inaccessible pour ce profil.

### 📋 Scénario 4 : Résilience en Mode Hors-ligne (Offline Sync Queue)
*   **Objectif** : Valider la persistance locale et le rapprochement asynchrone des données en cas de panne de connexion.
*   **Étapes de Test** :
    1. Basculez l'application en mode **Hors-ligne** (utilisez l'indicateur réseau en haut à droite).
    2. Planifiez un nouveau rendez-vous pour un patient existant.
    3. Vérifiez que le rendez-vous apparaît bien localement avec un tag "En attente de synchronisation".
    4. Naviguez dans un autre onglet puis revenez : le rendez-vous doit persister (chargé depuis le cache local de secours).
    5. Rebranchez le réseau (mode **En ligne**).
*   **Résultats Attendus** :
    - Le système détecte le retour de la connexion.
    - La file d'attente synchronise silencieusement le rendez-vous en arrière-plan vers Appwrite.
    - L'indicateur de synchronisation repasse au vert avec l'heure exacte de la dernière mise à jour globale.
