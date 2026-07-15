# Modèle de Données et Base de Données - SantéPlus CI

Ce document présente la structure de la base de données, les schémas des collections Appwrite et les mécanismes de stockage local pour **SantéPlus CI**.

---

## 1. Moteur de Base de Données

SantéPlus CI s'appuie sur **Appwrite Database**, une base de données NoSQL orientée documents, pour stocker de manière sécurisée et centralisée toutes les informations cliniques.

Pour le fonctionnement hors-ligne, un miroir local de chaque collection est maintenu dans le **LocalStorage** du navigateur client, synchronisé automatiquement à chaque mise à jour en ligne.

---

## 2. Schémas des Collections Appwrite

### A. Collection `users` (Membres du personnel)

Stocke les fiches des professionnels de santé et des administrateurs autorisés à accéder au système.

| Attribut   | Type    | Taille / Précision | Requis | Description                                                                            |
| :--------- | :------ | :----------------- | :----- | :------------------------------------------------------------------------------------- |
| `email`    | String  | 100                | Oui    | Adresse email unique de connexion                                                      |
| `fullName` | String  | 100                | Oui    | Nom complet du membre du personnel                                                     |
| `role`     | String  | 30                 | Oui    | Rôle affecté (`administrateur`, `directeur`, `medecin`, `infirmier`, `receptionniste`) |
| `active`   | Boolean | -                  | Non    | Statut d'activation du compte (par défaut `true`)                                      |

---

### B. Collection `patients` (Dossiers Médicaux)

Contient les informations civiles et médicales de base de chaque patient suivi à la clinique.

| Attribut              | Type    | Taille / Précision | Requis | Description                                                 |
| :-------------------- | :------ | :----------------- | :----- | :---------------------------------------------------------- |
| `firstName`           | String  | 50                 | Oui    | Prénom du patient                                           |
| `lastName`            | String  | 50                 | Oui    | Nom de famille du patient                                   |
| `dateOfBirth`         | String  | 10                 | Oui    | Date de naissance au format `AAAA-MM-JJ`                    |
| `gender`              | String  | 10                 | Oui    | Genre (`M` ou `F`)                                          |
| `phone`               | String  | 20                 | Oui    | Numéro de téléphone de contact                              |
| `email`               | String  | 100                | Non    | Adresse email optionnelle                                   |
| `bloodGroup`          | String  | 5                  | Non    | Groupe sanguin (ex: `A+`, `O-`)                             |
| `allergyInfo`         | String  | 500                | Non    | Liste des allergies connues                                 |
| `sensitiveDataSigned` | Boolean | -                  | Oui    | Consentement signé pour le traitement des données sensibles |
| `medicalHistory`      | String  | LongText           | Non    | Historique médical au format JSON stringifié                |

---

### C. Collection `appointments` (Gestion des Rendez-vous)

Gère le calendrier des consultations et rendez-vous médicaux de la clinique.

| Attribut      | Type   | Taille / Précision | Requis | Description                                                   |
| :------------ | :----- | :----------------- | :----- | :------------------------------------------------------------ |
| `patientId`   | String | 50                 | Oui    | Identifiant unique du patient concerné                        |
| `patientName` | String | 100                | Oui    | Nom d'affichage du patient                                    |
| `date`        | String | 10                 | Oui    | Date du rendez-vous (`AAAA-MM-JJ`)                            |
| `time`        | String | 5                  | Oui    | Heure du rendez-vous (`HH:MM`)                                |
| `doctorName`  | String | 100                | Oui    | Nom du médecin assigné                                        |
| `status`      | String | 20                 | Oui    | Statut actuel (`En attente`, `Confirmé`, `Annulé`, `Terminé`) |
| `notes`       | String | 1000               | Non    | Notes de consultation ou remarques                            |

---

### D. Collection `audit_logs` (Journaux de Traçabilité Securisés)

Enregistre de manière immuable et obligatoire toutes les actions sensibles réalisées sur la plateforme.

| Attribut    | Type   | Taille / Précision | Requis | Description                                                                                     |
| :---------- | :----- | :----------------- | :----- | :---------------------------------------------------------------------------------------------- |
| `timestamp` | String | 50                 | Oui    | Horodatage exact de l'événement (`ISO 8601`)                                                    |
| `userEmail` | String | 100                | Oui    | Email de l'utilisateur ayant exécuté l'action                                                   |
| `userName`  | String | 100                | Oui    | Nom complet de l'opérateur                                                                      |
| `userRole`  | String | 50                 | Oui    | Rôle de l'utilisateur au moment de l'action                                                     |
| `action`    | String | 100                | Oui    | Type d'action (`Consultation Dossier`, `Modification Ordonnance`, `Suppression Document`, etc.) |
| `details`   | String | 2000               | Oui    | Détails textuels complets et valeurs modifiées                                                  |
| `ipAddress` | String | 50                 | Oui    | Adresse IP du client d'origine capturée par le serveur                                          |
| `status`    | String | 20                 | Oui    | Statut d'exécution (`Succès` ou `Échec`)                                                        |

_Index configurés sur `audit_logs` :_

- `idx_audit_logs_timestamp` : Tri et requêtes chronologiques rapides (Date décroissante).
- `idx_audit_logs_action` : Recherche optimisée par nature d'événement.

---

## 3. Stratégie de Résilience Locale (Miroir)

En l'absence de réseau, SantéPlus CI continue d'exécuter des requêtes et de stocker des données :

- Chaque écriture met à jour l'index du `LocalStorage` correspondant : `csp_patients`, `csp_appointments`, `csp_audit_logs`.
- Au rétablissement de la connectivité réseau, un pont asynchrone synchronise les files de données locales avec le serveur distant.
