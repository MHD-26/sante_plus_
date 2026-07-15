# Politiques de Sécurité et Conformité - SantéPlus CI

Ce document décrit les protocoles de sécurité, les mesures de confidentialité et la traçabilité mises en œuvre dans **SantéPlus CI** pour assurer la conformité avec les réglementations sur la protection des données de santé (comme le RGPD ou les recommandations de l'ARS / IPDCP).

---

## 1. Protection des Données et Consentement Patient

Conformément aux normes déontologiques et réglementations internationales de protection des informations médicales :

- **Consentement Éclairé** : L'accès et l'enregistrement de dossiers cliniques pour un patient requièrent obligatoirement la signature numérique d'une clause de consentement (`sensitiveDataSigned`). Le système refuse de traiter les données cliniques sensibles d'un patient sans ce consentement validé.
- **Ségrégation de l'Identité Civile et du Dossier Clinique** : Les données civiles d'un patient (nom, téléphone, adresse) et son historique clinique intime (diagnostics, ordonnances, comptes-rendus) sont cloisonnés de façon à ce que seuls les personnels soignants habilités puissent en faire l'association lors d'un acte médical actif.

---

## 2. Traçabilité Complète et Journaux d'Audit Immuables

Chaque action sensible effectuée sur l'application engendre un enregistrement automatique et immuable dans le journal d'audit de sécurité :

### Actions Auditées :

1. **Consultation de Dossier** (`Consultation Dossier`) : Déclenchée dès qu'un professionnel de santé clique sur la fiche d'un patient pour lire son historique médical ou ses ordonnances antérieures.
2. **Création de Compte / Dossier** (`Création de compte`) : Enregistre l'ajout d'un nouveau patient au registre.
3. **Modification d'Ordonnance** (`Modification Ordonnance`) : Journalise l'attribution de médicaments, posologies ou fiches de diagnostics rédigés par un médecin.
4. **Suppression de Document** (`Suppression Document`) : Enregistre toute suppression d'un enregistrement clinique (ex: annulation ou purge définitive d'un rendez-vous).
5. **Accès Refusé** (`Accès refusé`) : Journalise les tentatives d'accès non autorisées.

### Informations Capturées :

- **Utilisateur principal** : Nom, email et rôle de l'opérateur.
- **Horodatage universel (UTC)** : Heure exacte fournie par le serveur.
- **Adresse IP Client** : L'adresse IP de la machine cliente d'origine est capturée par le serveur Express de manière sécurisée (prenant en compte les proxies via `x-forwarded-for`).
- **Détails textuels précis** : Liste des modifications apportées ou identifiant du patient consulté.

---

## 3. Sécurisation des Communications (API Proxies)

Pour éviter toute fuite ou vol de jetons d'accès et d'identifiants sensibles :

- **Architecture de Proxy Inverse** : Le client React n'interagit jamais directement avec l'API sensible d'Appwrite ou de Google Gemini avec des jetons d'administration.
- **Masquage des Secrets** : Toutes les requêtes d'intelligence artificielle ou de journalisation d'audit transitent par les routes `/api/*` du serveur Express. Les clés de sécurité d'infrastructure (`GEMINI_API_KEY`, `APPWRITE_API_KEY`) demeurent confinées en toute sécurité dans l'environnement d'exécution du serveur et ne sont jamais visibles dans le code JavaScript du navigateur ou les outils de développement (F12).

---

## 4. Recommandations de Sécurité en Production

- **HTTPS Strict** : Activez la redirection HTTPS automatique sur votre hébergeur de conteneurs pour garantir le chiffrement de bout en bout des flux d'informations médicales.
- **Gestion des Sessions** : Déconnectez automatiquement les sessions utilisateur restées inactives plus de 15 minutes pour éviter l'exposition de données sur des ordinateurs de consultation partagés.
