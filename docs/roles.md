# Matrice des Rôles et Autorisations (RBAC) - SantéPlus CI

Ce document décrit le modèle de contrôle d'accès basé sur les rôles (RBAC) implémenté dans **SantéPlus CI** pour assurer la sécurité et la confidentialité des dossiers médicaux et des opérations de la clinique.

---

## 1. Philosophie de Sécurité

La gestion des rôles de SantéPlus CI respecte le **principe du moindre privilège**. Chaque membre du personnel n'accède qu'aux seules fonctionnalités et données nécessaires à l'exercice de ses fonctions cliniques ou administratives.

Les rôles disponibles sont :

1. **Administrateur** (`administrateur`)
2. **Directeur Clinique** (`directeur`)
3. **Médecin** (`medecin`)
4. **Infirmier / Personnel Clinique** (`infirmier`)
5. **Réceptionniste** (`receptionniste`)

---

## 2. Matrice des Droits d'Accès

Le tableau ci-dessous synthétise les permissions accordées à chaque rôle :

| Fonctionnalité                            |        Administrateur         |           Directeur           |       Médecin        |      Infirmier       |     Réceptionniste     |
| :---------------------------------------- | :---------------------------: | :---------------------------: | :------------------: | :------------------: | :--------------------: |
| **Consulter les Dossiers Médicaux**       |       ❌ (Sauf urgence)       |              ❌               | **Lecture/Écriture** |  **Lecture seule**   | ❌ (Civil uniquement)  |
| **Rédiger des Diagnostics / Ordonnances** |              ❌               |              ❌               |       **Oui**        |          ❌          |           ❌           |
| **Gérer les Rendez-vous**                 |         Lecture seule         |         Lecture seule         |    Lecture seule     |    Lecture seule     |  **Lecture/Écriture**  |
| **Gestion des Stocks / Pharmacie**        |         Lecture seule         |         Lecture seule         |    Lecture seule     | **Lecture/Écriture** |           ❌           |
| **Facturation & Encaissements**           |              ❌               | **Lecture seule (Financier)** |          ❌          |          ❌          | **Création de fiches** |
| **Accès aux Journaux d'Audit (Logs)**     |       **Oui (Complet)**       |       **Oui (Lecture)**       |          ❌          |          ❌          |           ❌           |
| **Configuration Système & Rôles**         | **Oui (Gestion des comptes)** |              ❌               |          ❌          |          ❌          |           ❌           |

---

## 3. Description des Responsabilités par Rôle

### 💼 Administrateur Système (`administrateur`)

- Responsable de la haute disponibilité de l'infrastructure et de la maintenance logicielle.
- Il est le seul habilité à créer de nouveaux comptes cliniques, à réinitialiser les mots de passe et à modifier les autorisations d'accès.
- **Audit et Conformité** : Il surveille en permanence le journal d'audit de sécurité (`audit_logs`) pour détecter d'éventuels accès illicites ou anomalies de traitement.

### 📈 Directeur Clinique (`directeur`)

- Supervise les opérations économiques, les flux de patients et la performance financière de la clinique.
- Accède au tableau de bord financier, aux indicateurs de stock critique et peut consulter l'activité générale de l'établissement sans jamais interférer avec le dossier médical intime des patients.

### 🩺 Médecin (`medecin`)

- Cœur clinique du système. Il détient le pouvoir légal de formuler des diagnostics, de prescrire des traitements pharmaceutiques (ordonnances), et de planifier les actes chirurgicaux ou d'examens spécialisés.
- Chaque accès médecin à un dossier de patient est enregistré en temps réel dans les logs d'audit pour des raisons légales et d'éthique médicale.

### 💉 Infirmier / Personnel de Soins (`infirmier`)

- Gère la logistique médicale, vérifie l'administration des traitements prescrits, saisit les paramètres vitaux élémentaires (tension, température, poids) dans le dossier de suivi.
- Responsable de la gestion des stocks de pharmacie, des consommables et de la déclaration de matériel défectueux.

### 🗓️ Réceptionniste / Secrétariat (`receptionniste`)

- Premier contact de la clinique. Gère le flux d'accueil physique et téléphonique.
- Crée les profils d'identité civile des nouveaux patients (sans pouvoir accéder à leurs données cliniques antérieures).
- Planifie, déplace ou annule les rendez-vous de consultation médicale.
- Émet les factures standard d'honoraires cliniques.
