# Plan de Continuité d'Activité et Récupération (DRP) - SantéPlus CI

Ce guide décrit le **Plan de Reprise d'Activité (PRA)** et les procédures d'urgence en cas de défaillance matérielle, d'interruption réseau prolongée, ou de corruption de base de données de l'application **SantéPlus CI**.

---

## 1. Résilience de l'Architecture (Offline-First)

Pour pallier l'instabilité fréquente de la connectivité réseau dans certains établissements de santé :

- **Sauvegarde d'urgence en LocalStorage** : Toutes les fiches patients, plannings de rendez-vous, prescriptions et historiques cliniques sont synchronisés en temps réel dans le stockage local persistant (`localStorage`) du navigateur de consultation.
- **File de synchronisation asynchrone** : Les modifications appliquées hors-ligne sont sérialisées dans la file de transactions `csp_sync_queue`.
- **Rapprochement automatique** : Dès le retour de la connectivité réseau, le moteur effectue une réconciliation automatique de type FIFO (First-In, First-Out) avec l'instance centrale d'Appwrite, prévenant toute perte d'efforts de saisie clinique.

---

## 2. Procédure de Restauration Complète de la Base de Données

En cas de sinistre majeur sur l'instance cloud d'Appwrite (corruption, perte de conteneur, ou suppression accidentelle), suivez pas-à-pas la procédure ci-dessous pour reconstruire l'infrastructure à l'identique en moins de 5 minutes.

### Étape 1 : Création d'un Nouveau Projet Appwrite
1. Connectez-vous à la console Appwrite (Cloud ou Self-hosted).
2. Créez un nouveau projet vide et nommez-le `SantePlus`.

### Étape 2 : Configuration des Clés d'Accès
1. Allez dans l'onglet **API Keys** du projet Appwrite et créez une nouvelle clé d'API d'administration nommée `AdminServerKey`.
2. Attribuez-lui les permissions de lecture/écriture minimales sur les bases de données (`databases.read`, `databases.write`, `collections.read`, `collections.write`, `documents.read`, `documents.write`, `users.read`, `users.write`).
3. Notez la clé d'API générée, l'identifiant du projet, et l'URL du endpoint.

### Étape 3 : Mise à Jour des Variables d'Environnement
Dans votre environnement de déploiement (Cloud Run, Docker Compose ou fichier `.env`), mettez à jour les variables d'accès avec les nouveaux identifiants :

```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=votre-nouveau-project-id
APPWRITE_API_KEY=votre-nouvelle-api-key-securisee
APPWRITE_DB_ID=santeplus_db
```

### Étape 4 : Exécution du Script d'Initialisation Automatisée
Exécutez la commande suivante depuis la racine du projet SantéPlus CI :

```bash
npm run init-db
```

Ce script effectue automatiquement les opérations suivantes sur votre nouveau projet :
- Création de la base de données `santeplus_db`.
- Déclaration et configuration de toutes les collections cliniques (`users`, `patients`, `appointments`, `audit_logs`).
- Configuration automatique des clés, indexes et types de données d'attributs.
- Insertion des jeux de données d'initialisation médicale et des profils d'accès de démonstration pré-configurés.

---

## 3. Restauration des Données Cliniques par Sauvegarde JSON

Pour restaurer l'activité de la clinique à partir d'une sauvegarde physique de sauvegarde :

1. Connectez-vous avec un compte possédant le rôle **Administrateur** (`admin@santeplus.ci` / `administrateur`).
2. Naviguez vers l'onglet **Paramètres** de l'application.
3. Sous la section **Administration des Sauvegardes**, cliquez sur **Importer une Sauvegarde**.
4. Sélectionnez votre fichier de sauvegarde JSON de secours (`csp_backup_XXXX.json`).
5. Cliquez sur **Valider**.

Le système chargera l'intégralité des dossiers médicaux, reconstitura les plannings et poussera automatiquement ces données de manière ordonnée vers l'instance Appwrite ré-initialisée.

---

## 4. Vérification et validation post-restauration

Une fois la restauration terminée, procédez aux vérifications rapides suivantes pour déclarer le système opérationnel :

1. **Test d'authentification** : Essayez de vous connecter avec un compte médecin.
2. **Test d'écriture** : Créez un rendez-vous fictif et vérifiez son apparition instantanée dans le calendrier.
3. **Journal d'audit** : Naviguez dans l'onglet des logs d'audit et assurez-vous que la restauration système a bien été consignée à l'horodatage UTC exact.
