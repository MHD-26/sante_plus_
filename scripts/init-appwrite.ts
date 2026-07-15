import { Client, Databases, ID } from "node-appwrite";
import dotenv from "dotenv";

// Chargement des variables d'environnement
dotenv.config();

const endpoint = process.env.VITE_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;

console.log("================================================================");
console.log("🏥 SCRIPT D'INITIALISATION DE LA BASE DE DONNÉES SANTE_PLUS");
console.log("================================================================");

// Validation des variables d'environnement
if (
  !endpoint ||
  endpoint.includes("YOUR_APPWRITE_ENDPOINT") ||
  !projectId ||
  projectId.includes("remplir_ici") ||
  !apiKey ||
  apiKey.includes("remplir_ici") ||
  !databaseId ||
  databaseId.includes("remplir_ici")
) {
  console.error(
    "❌ Erreur: Veuillez remplir correctement le fichier .env avant d'exécuter ce script."
  );
  console.log("\nVariables actuelles :");
  console.log(`- APPWRITE_ENDPOINT : ${endpoint}`);
  console.log(`- APPWRITE_PROJECT_ID : ${projectId}`);
  console.log(`- APPWRITE_API_KEY : ${apiKey ? "****** (Configurée)" : "Non configurée"}`);
  console.log(`- APPWRITE_DATABASE_ID : ${databaseId}`);
  console.log("================================================================");
  process.exit(1);
}

// Initialisation du client Appwrite
const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

const databases = new Databases(client);

// Helper pour attendre quelques secondes (évite les verrous de base de données d'Appwrite)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper de création de permissions
function buildPermissions(readRoles: string[], writeRoles: string[]): string[] {
  const perms: string[] = [];

  // Lecture
  for (const role of readRoles) {
    if (role === "any") {
      perms.push('read("any")');
    } else if (role === "users") {
      perms.push('read("users")');
    } else {
      perms.push(`read("team:${role}")`);
      perms.push(`read("label:${role}")`);
    }
  }

  // Écritures fines (Create, Update, Delete)
  for (const role of writeRoles) {
    if (role === "any") {
      perms.push('create("any")', 'update("any")', 'delete("any")');
    } else if (role === "users") {
      perms.push('create("users")', 'update("users")', 'delete("users")');
    } else {
      perms.push(`create("team:${role}")`, `update("team:${role}")`, `delete("team:${role}")`);
      perms.push(`create("label:${role}")`, `update("label:${role}")`, `delete("label:${role}")`);
    }
  }

  return perms;
}

// Interfaces pour la définition des attributs
interface AttributeDef {
  key: string;
  type: "string" | "integer" | "float" | "boolean" | "datetime" | "email" | "enum";
  required: boolean;
  size?: number; // pour type string
  defaultValue?: any;
  elements?: string[]; // pour type enum
}

// Interface pour les index
interface IndexDef {
  key: string;
  type: "key" | "unique" | "fulltext";
  attributes: string[];
  orders?: ("asc" | "desc")[];
}

// Interface pour les relations
interface RelationDef {
  key: string;
  relatedCollectionId: string;
  type: "oneToOne" | "oneToMany" | "manyToOne" | "manyToMany";
  twoWay: boolean;
  relatedKey?: string;
  onDelete?: "cascade" | "restrict" | "setNull";
}

// Définition de toutes les collections et de leur structure
interface CollectionSchema {
  id: string;
  name: string;
  readRoles: string[];
  writeRoles: string[];
  attributes: AttributeDef[];
  indexes?: IndexDef[];
  relations?: RelationDef[];
}

const COLLECTIONS_SCHEMAS: CollectionSchema[] = [
  {
    id: "users",
    name: "Utilisateurs",
    readRoles: ["users"],
    writeRoles: ["administrateur", "directeur"],
    attributes: [
      { key: "fullName", type: "string", size: 100, required: true },
      { key: "dateOfBirth", type: "string", size: 50, required: false },
      { key: "gender", type: "string", size: 10, required: false },
      { key: "phone", type: "string", size: 30, required: false },
      { key: "email", type: "email", required: true },
      { key: "address", type: "string", size: 255, required: false },
      { key: "profilePhoto", type: "string", size: 500, required: false },
      {
        key: "role",
        type: "enum",
        elements: [
          "patient",
          "medecin",
          "secretaire",
          "pharmacien",
          "laboratoire",
          "comptable",
          "administrateur",
          "directeur",
        ],
        required: true,
        defaultValue: "patient",
      },
      {
        key: "status",
        type: "enum",
        elements: ["actif", "inactif"],
        required: true,
        defaultValue: "actif",
      },
      { key: "createdAt", type: "string", size: 50, required: false },
      { key: "updatedAt", type: "string", size: 50, required: false },
    ],
    indexes: [
      { key: "idx_users_email", type: "unique", attributes: ["email"] },
      { key: "idx_users_role", type: "key", attributes: ["role"] },
    ],
  },
  {
    id: "patients",
    name: "Patients",
    readRoles: [
      "administrateur",
      "directeur",
      "medecin",
      "secretaire",
      "pharmacien",
      "laboratoire",
      "comptable",
    ],
    writeRoles: ["administrateur", "directeur", "secretaire", "medecin"],
    attributes: [
      { key: "dossierNumber", type: "string", size: 50, required: true },
      { key: "bloodGroup", type: "string", size: 5, required: false },
      { key: "allergies", type: "string", size: 1000, required: false },
      { key: "medicalHistory", type: "string", size: 2000, required: false },
      { key: "insurance", type: "string", size: 100, required: false },
      { key: "emergencyContact", type: "string", size: 255, required: false },
    ],
    indexes: [{ key: "idx_patients_dossier", type: "unique", attributes: ["dossierNumber"] }],
    relations: [
      {
        key: "user",
        relatedCollectionId: "users",
        type: "oneToOne",
        twoWay: false,
        onDelete: "setNull",
      },
    ],
  },
  {
    id: "appointments",
    name: "Rendez-vous",
    readRoles: ["administrateur", "directeur", "medecin", "secretaire", "patient"],
    writeRoles: ["administrateur", "directeur", "secretaire", "medecin", "patient"],
    attributes: [
      { key: "date", type: "string", size: 50, required: true },
      { key: "time", type: "string", size: 20, required: true },
      { key: "service", type: "string", size: 100, required: false },
      { key: "reason", type: "string", size: 255, required: true },
      {
        key: "status",
        type: "enum",
        elements: ["en_attente", "confirme", "annule", "termine"],
        required: true,
        defaultValue: "en_attente",
      },
      { key: "observations", type: "string", size: 1000, required: false },
    ],
    indexes: [{ key: "idx_appointments_date", type: "key", attributes: ["date"] }],
    relations: [
      {
        key: "patient",
        relatedCollectionId: "patients",
        type: "manyToOne",
        twoWay: false,
        onDelete: "cascade",
      },
      {
        key: "doctor",
        relatedCollectionId: "users",
        type: "manyToOne",
        twoWay: false,
        onDelete: "setNull",
      },
    ],
  },
  {
    id: "consultations",
    name: "Consultations",
    readRoles: ["administrateur", "directeur", "medecin", "patient"],
    writeRoles: ["administrateur", "directeur", "medecin"],
    attributes: [
      { key: "symptoms", type: "string", size: 2000, required: true },
      { key: "diagnosis", type: "string", size: 2000, required: true },
      { key: "treatment", type: "string", size: 2000, required: false },
      { key: "observations", type: "string", size: 2000, required: false },
      { key: "date", type: "string", size: 50, required: true },
    ],
    indexes: [{ key: "idx_consultations_date", type: "key", attributes: ["date"] }],
    relations: [
      {
        key: "patient",
        relatedCollectionId: "patients",
        type: "manyToOne",
        twoWay: false,
        onDelete: "cascade",
      },
      {
        key: "doctor",
        relatedCollectionId: "users",
        type: "manyToOne",
        twoWay: false,
        onDelete: "setNull",
      },
    ],
  },
  {
    id: "medical_records",
    name: "Dossiers Médicaux",
    readRoles: ["administrateur", "directeur", "medecin", "patient"],
    writeRoles: ["administrateur", "directeur", "medecin"],
    attributes: [
      { key: "medicalHistory", type: "string", size: 3000, required: false },
      { key: "exams", type: "string", size: 2000, required: false },
      { key: "medicalDocuments", type: "string", size: 3000, required: false },
      { key: "reports", type: "string", size: 3000, required: false },
      { key: "files", type: "string", size: 1000, required: false }, // liens de fichiers stockés
      { key: "images", type: "string", size: 1000, required: false },
    ],
    relations: [
      {
        key: "patient",
        relatedCollectionId: "patients",
        type: "oneToOne",
        twoWay: false,
        onDelete: "cascade",
      },
    ],
  },
  {
    id: "prescriptions",
    name: "Ordonnances",
    readRoles: ["administrateur", "directeur", "medecin", "pharmacien", "patient"],
    writeRoles: ["administrateur", "directeur", "medecin", "pharmacien"],
    attributes: [
      { key: "dosage", type: "string", size: 500, required: true },
      { key: "frequency", type: "string", size: 255, required: true },
      { key: "duration", type: "string", size: 100, required: true },
    ],
    relations: [
      {
        key: "consultation",
        relatedCollectionId: "consultations",
        type: "manyToOne",
        twoWay: false,
        onDelete: "cascade",
      },
      {
        key: "patient",
        relatedCollectionId: "patients",
        type: "manyToOne",
        twoWay: false,
        onDelete: "cascade",
      },
      {
        key: "doctor",
        relatedCollectionId: "users",
        type: "manyToOne",
        twoWay: false,
        onDelete: "setNull",
      },
    ],
  },
  {
    id: "medications",
    name: "Médicaments",
    readRoles: ["users"],
    writeRoles: ["administrateur", "directeur", "pharmacien"],
    attributes: [
      { key: "name", type: "string", size: 255, required: true },
      { key: "category", type: "string", size: 100, required: false },
      { key: "description", type: "string", size: 1000, required: false },
      { key: "manufacturer", type: "string", size: 100, required: false },
      { key: "price", type: "float", required: true },
      { key: "code", type: "string", size: 50, required: true },
      { key: "minQuantity", type: "integer", required: true, defaultValue: 10 },
    ],
    indexes: [{ key: "idx_medications_code", type: "unique", attributes: ["code"] }],
  },
  {
    id: "pharmacy_stock",
    name: "Stock Pharmacie",
    readRoles: ["administrateur", "directeur", "pharmacien"],
    writeRoles: ["administrateur", "directeur", "pharmacien"],
    attributes: [
      { key: "quantity", type: "integer", required: true, defaultValue: 0 },
      { key: "batchNumber", type: "string", size: 100, required: true },
      { key: "expirationDate", type: "string", size: 50, required: true },
      { key: "location", type: "string", size: 100, required: false },
    ],
    relations: [
      {
        key: "medication",
        relatedCollectionId: "medications",
        type: "manyToOne",
        twoWay: false,
        onDelete: "cascade",
      },
    ],
  },
  {
    id: "stock_movements",
    name: "Mouvements de Stock",
    readRoles: ["administrateur", "directeur", "pharmacien"],
    writeRoles: ["administrateur", "directeur", "pharmacien"],
    attributes: [
      {
        key: "movementType",
        type: "enum",
        elements: ["entree", "sortie", "ajustement"],
        required: true,
      },
      { key: "quantity", type: "integer", required: true },
      { key: "comment", type: "string", size: 255, required: false },
      { key: "date", type: "string", size: 50, required: true },
    ],
    relations: [
      {
        key: "medication",
        relatedCollectionId: "medications",
        type: "manyToOne",
        twoWay: false,
        onDelete: "cascade",
      },
      {
        key: "user",
        relatedCollectionId: "users",
        type: "manyToOne",
        twoWay: false,
        onDelete: "setNull",
      },
    ],
  },
  {
    id: "laboratory_tests",
    name: "Analyses Laboratoire",
    readRoles: ["administrateur", "directeur", "medecin", "laboratoire"],
    writeRoles: ["administrateur", "directeur", "medecin", "laboratoire"],
    attributes: [
      { key: "testType", type: "string", size: 150, required: true },
      {
        key: "status",
        type: "enum",
        elements: ["en_attente", "en_cours", "complete", "annule"],
        required: true,
        defaultValue: "en_attente",
      },
      { key: "date", type: "string", size: 50, required: true },
    ],
    relations: [
      {
        key: "patient",
        relatedCollectionId: "patients",
        type: "manyToOne",
        twoWay: false,
        onDelete: "cascade",
      },
      {
        key: "doctor",
        relatedCollectionId: "users",
        type: "manyToOne",
        twoWay: false,
        onDelete: "setNull",
      },
    ],
  },
  {
    id: "laboratory_results",
    name: "Résultats Laboratoire",
    readRoles: ["administrateur", "directeur", "medecin", "laboratoire", "patient"],
    writeRoles: ["administrateur", "directeur", "laboratoire"],
    attributes: [
      { key: "result", type: "string", size: 3000, required: true },
      { key: "comment", type: "string", size: 1000, required: false },
      { key: "file", type: "string", size: 500, required: false },
      { key: "date", type: "string", size: 50, required: true },
    ],
    relations: [
      {
        key: "test",
        relatedCollectionId: "laboratory_tests",
        type: "oneToOne",
        twoWay: false,
        onDelete: "cascade",
      },
      {
        key: "biologist",
        relatedCollectionId: "users",
        type: "manyToOne",
        twoWay: false,
        onDelete: "setNull",
      },
    ],
  },
  {
    id: "invoices",
    name: "Factures",
    readRoles: ["administrateur", "directeur", "comptable", "secretaire", "patient"],
    writeRoles: ["administrateur", "directeur", "comptable", "secretaire"],
    attributes: [
      { key: "invoiceNumber", type: "string", size: 50, required: true },
      { key: "amount", type: "float", required: true },
      {
        key: "status",
        type: "enum",
        elements: ["paye", "en_attente", "annule", "partiel"],
        required: true,
        defaultValue: "en_attente",
      },
      { key: "date", type: "string", size: 50, required: true },
    ],
    indexes: [{ key: "idx_invoices_number", type: "unique", attributes: ["invoiceNumber"] }],
    relations: [
      {
        key: "patient",
        relatedCollectionId: "patients",
        type: "manyToOne",
        twoWay: false,
        onDelete: "cascade",
      },
    ],
  },
  {
    id: "payments",
    name: "Paiements",
    readRoles: ["administrateur", "directeur", "comptable", "secretaire", "patient"],
    writeRoles: ["administrateur", "directeur", "comptable", "secretaire"],
    attributes: [
      { key: "amount", type: "float", required: true },
      {
        key: "paymentMethod",
        type: "enum",
        elements: ["especes", "carte", "assurance", "mobile_money"],
        required: true,
      },
      { key: "receipt", type: "string", size: 255, required: false },
      { key: "date", type: "string", size: 50, required: true },
    ],
    relations: [
      {
        key: "invoice",
        relatedCollectionId: "invoices",
        type: "manyToOne",
        twoWay: false,
        onDelete: "cascade",
      },
    ],
  },
  {
    id: "rooms",
    name: "Chambres",
    readRoles: ["administrateur", "directeur", "medecin", "secretaire"],
    writeRoles: ["administrateur", "directeur", "secretaire"],
    attributes: [
      { key: "number", type: "string", size: 30, required: true },
      {
        key: "type",
        type: "enum",
        elements: ["individuelle", "double", "intensive", "suite"],
        required: true,
        defaultValue: "individuelle",
      },
      { key: "capacity", type: "integer", required: true, defaultValue: 1 },
      {
        key: "status",
        type: "enum",
        elements: ["disponible", "occupe", "maintenance"],
        required: true,
        defaultValue: "disponible",
      },
    ],
    indexes: [{ key: "idx_rooms_number", type: "unique", attributes: ["number"] }],
  },
  {
    id: "hospitalizations",
    name: "Hospitalisations",
    readRoles: ["administrateur", "directeur", "medecin", "secretaire", "patient"],
    writeRoles: ["administrateur", "directeur", "medecin", "secretaire"],
    attributes: [
      { key: "admissionDate", type: "string", size: 50, required: true },
      { key: "dischargeDate", type: "string", size: 50, required: false },
      { key: "observations", type: "string", size: 2000, required: false },
    ],
    relations: [
      {
        key: "patient",
        relatedCollectionId: "patients",
        type: "manyToOne",
        twoWay: false,
        onDelete: "cascade",
      },
      {
        key: "room",
        relatedCollectionId: "rooms",
        type: "manyToOne",
        twoWay: false,
        onDelete: "restrict",
      },
      {
        key: "doctor",
        relatedCollectionId: "users",
        type: "manyToOne",
        twoWay: false,
        onDelete: "setNull",
      },
    ],
  },
  {
    id: "departments",
    name: "Services Clinique",
    readRoles: ["any"],
    writeRoles: ["administrateur", "directeur"],
    attributes: [
      { key: "name", type: "string", size: 100, required: true },
      { key: "description", type: "string", size: 500, required: false },
    ],
    relations: [
      {
        key: "head",
        relatedCollectionId: "users",
        type: "manyToOne",
        twoWay: false,
        onDelete: "setNull",
      },
    ],
  },
  {
    id: "notifications",
    name: "Notifications",
    readRoles: ["users"],
    writeRoles: ["administrateur", "directeur", "users"],
    attributes: [
      { key: "title", type: "string", size: 150, required: true },
      { key: "message", type: "string", size: 1000, required: true },
      { key: "type", type: "string", size: 50, required: false },
      {
        key: "status",
        type: "enum",
        elements: ["non_lu", "lu"],
        required: true,
        defaultValue: "non_lu",
      },
      { key: "date", type: "string", size: 50, required: true },
    ],
    relations: [
      {
        key: "recipient",
        relatedCollectionId: "users",
        type: "manyToOne",
        twoWay: false,
        onDelete: "cascade",
      },
    ],
  },
  {
    id: "announcements",
    name: "Annonces",
    readRoles: ["any"],
    writeRoles: ["administrateur", "directeur"],
    attributes: [
      { key: "title", type: "string", size: 200, required: true },
      { key: "content", type: "string", size: 3000, required: true },
      { key: "visibility", type: "string", size: 50, required: false, defaultValue: "tous" },
      { key: "date", type: "string", size: 50, required: true },
    ],
    relations: [
      {
        key: "author",
        relatedCollectionId: "users",
        type: "manyToOne",
        twoWay: false,
        onDelete: "setNull",
      },
    ],
  },
  {
    id: "audit_logs",
    name: "Journaux d'Audit",
    readRoles: ["administrateur", "directeur"],
    writeRoles: ["any"],
    attributes: [
      { key: "timestamp", type: "string", size: 50, required: true },
      { key: "userEmail", type: "string", size: 100, required: false },
      { key: "userName", type: "string", size: 100, required: false },
      { key: "userRole", type: "string", size: 50, required: false },
      { key: "action", type: "string", size: 100, required: true },
      { key: "details", type: "string", size: 2000, required: true },
      { key: "ipAddress", type: "string", size: 50, required: false },
      { key: "status", type: "string", size: 20, required: false, defaultValue: "Succès" },
    ],
    indexes: [
      { key: "idx_audit_logs_timestamp", type: "key", attributes: ["timestamp"] },
      { key: "idx_audit_logs_action", type: "key", attributes: ["action"] },
    ],
  },
];

// Fonction d'exécution principale
async function runSetup() {
  try {
    console.log(`📡 Connexion à l'instance Appwrite à l'adresse : ${endpoint}`);
    console.log(`🎯 ID de Projet : ${projectId}`);
    console.log(`🗄️ ID de la Base de Données : ${databaseId}`);

    // Étape 1 : Vérifier la base de données
    try {
      await databases.get(databaseId);
      console.log(`✅ Base de données "${databaseId}" vérifiée et accessible.`);
    } catch (dbErr: any) {
      console.error(`❌ Impossible d'accéder à la base de données "${databaseId}".`);
      console.error(`   Détails : ${dbErr.message}`);
      console.error("   Assurez-vous que la base de données est créée avant de lancer ce script.");
      process.exit(1);
    }

    // Étape 2 : Créer toutes les collections (sans attributs pour l'instant pour éviter les conflits de clés étrangères)
    console.log(
      "\n📦 Étape 2 : Création des collections et configuration des rôles & permissions..."
    );
    const createdCollections: Record<string, boolean> = {};

    for (const schema of COLLECTIONS_SCHEMAS) {
      const perms = buildPermissions(schema.readRoles, schema.writeRoles);

      try {
        await databases.getCollection(databaseId, schema.id);
        console.log(`   ~ Collection "${schema.name}" (${schema.id}) existe déjà.`);
        createdCollections[schema.id] = true;
      } catch (err: any) {
        if (err.code === 404) {
          try {
            await databases.createCollection(databaseId, schema.id, schema.name, perms);
            console.log(`   + Collection "${schema.name}" (${schema.id}) créée avec succès.`);
            createdCollections[schema.id] = true;
            await delay(1000); // temporiser pour éviter les verrous de transactions
          } catch (createErr: any) {
            console.error(
              `   ❌ Échec lors de la création de la collection "${schema.name}": ${createErr.message}`
            );
          }
        } else {
          console.error(`   ❌ Erreur d'accès à la collection "${schema.id}": ${err.message}`);
        }
      }
    }

    // Étape 3 : Ajouter les attributs de base de chaque collection
    console.log("\n📐 Étape 3 : Création des attributs de base (hors relations)...");
    for (const schema of COLLECTIONS_SCHEMAS) {
      if (!createdCollections[schema.id]) continue;

      console.log(`\n📂 Traitement des attributs pour "${schema.name}" (${schema.id}) :`);

      // Récupérer les attributs existants pour éviter d'ajouter des doublons
      let existingKeys: string[] = [];
      try {
        const currentColl = await databases.getCollection(databaseId, schema.id);
        existingKeys = (currentColl.attributes || []).map((a: any) => a.key);
      } catch (err) {
        // En cas de soucis, on procèdera de manière idempotente par try-catch individuel
      }

      for (const attr of schema.attributes) {
        if (existingKeys.includes(attr.key)) {
          console.log(`   ~ Attribut "${attr.key}" existe déjà.`);
          continue;
        }

        // Si l'attribut a une valeur par défaut, il doit être facultatif (required: false) dans Appwrite,
        // sinon Appwrite renvoie l'erreur "Cannot set default value for required attribute"
        const isRequired = attr.defaultValue !== undefined ? false : attr.required;

        try {
          switch (attr.type) {
            case "string":
              await databases.createStringAttribute(
                databaseId,
                schema.id,
                attr.key,
                attr.size || 255,
                isRequired,
                attr.defaultValue
              );
              break;
            case "integer":
              await databases.createIntegerAttribute(
                databaseId,
                schema.id,
                attr.key,
                isRequired,
                undefined, // min
                undefined, // max
                attr.defaultValue
              );
              break;
            case "float":
              await databases.createFloatAttribute(
                databaseId,
                schema.id,
                attr.key,
                isRequired,
                undefined,
                undefined,
                attr.defaultValue
              );
              break;
            case "boolean":
              await databases.createBooleanAttribute(
                databaseId,
                schema.id,
                attr.key,
                isRequired,
                attr.defaultValue
              );
              break;
            case "datetime":
              await databases.createDatetimeAttribute(
                databaseId,
                schema.id,
                attr.key,
                isRequired,
                attr.defaultValue
              );
              break;
            case "email":
              await databases.createEmailAttribute(
                databaseId,
                schema.id,
                attr.key,
                isRequired,
                attr.defaultValue
              );
              break;
            case "enum":
              await databases.createEnumAttribute(
                databaseId,
                schema.id,
                attr.key,
                attr.elements || [],
                isRequired,
                attr.defaultValue
              );
              break;
          }
          console.log(`   + Attribut "${attr.key}" (${attr.type}) créé.`);
          await delay(500); // Éviter de saturer l'API
        } catch (attrErr: any) {
          console.error(`   ❌ Erreur sur l'attribut "${attr.key}": ${attrErr.message}`);
        }
      }
    }

    // Étape 4 : Création des relations (clés étrangères)
    console.log("\n🔗 Étape 4 : Création des relations natives entre les collections...");
    for (const schema of COLLECTIONS_SCHEMAS) {
      if (!createdCollections[schema.id] || !schema.relations) continue;

      console.log(`\n📂 Traitement des relations pour "${schema.name}" (${schema.id}) :`);

      let existingKeys: string[] = [];
      try {
        const currentColl = await databases.getCollection(databaseId, schema.id);
        existingKeys = (currentColl.attributes || []).map((a: any) => a.key);
      } catch (err) {}

      for (const rel of schema.relations) {
        if (existingKeys.includes(rel.key)) {
          console.log(`   ~ Relation "${rel.key}" existe déjà.`);
          continue;
        }

        // S'assurer que la collection cible existe
        if (!createdCollections[rel.relatedCollectionId]) {
          console.warn(
            `   ⚠️ Impossible de créer la relation "${rel.key}": collection cible "${rel.relatedCollectionId}" absente.`
          );
          continue;
        }

        try {
          await databases.createRelationshipAttribute(
            databaseId,
            schema.id,
            rel.relatedCollectionId,
            rel.type as any,
            rel.twoWay,
            rel.key,
            rel.relatedKey,
            rel.onDelete as any
          );
          console.log(
            `   + Relation "${rel.key}" (${rel.type}) créée vers "${rel.relatedCollectionId}".`
          );
          await delay(1000); // Plus long délai pour les relations car elles s'appliquent aux deux collections
        } catch (relErr: any) {
          console.error(`   ❌ Erreur sur la relation "${rel.key}": ${relErr.message}`);
        }
      }
    }

    // Étape 5 : Création des index de recherche
    console.log("\n⚡ Étape 5 : Création des index d'optimisation des performances...");
    for (const schema of COLLECTIONS_SCHEMAS) {
      if (!createdCollections[schema.id] || !schema.indexes) continue;

      console.log(`\n📂 Traitement des index pour "${schema.name}" (${schema.id}) :`);

      let existingIndexes: string[] = [];
      try {
        const currentColl = await databases.getCollection(databaseId, schema.id);
        existingIndexes = (currentColl.indexes || []).map((idx: any) => idx.key);
      } catch (err) {}

      for (const indexDef of schema.indexes) {
        if (existingIndexes.includes(indexDef.key)) {
          console.log(`   ~ Index "${indexDef.key}" existe déjà.`);
          continue;
        }

        try {
          await databases.createIndex(
            databaseId,
            schema.id,
            indexDef.key,
            indexDef.type as any,
            indexDef.attributes,
            indexDef.orders as any
          );
          console.log(
            `   + Index "${indexDef.key}" (${indexDef.type}) créé sur [${indexDef.attributes.join(", ")}].`
          );
          await delay(1000);
        } catch (indexErr: any) {
          console.error(`   ❌ Erreur sur l'index "${indexDef.key}": ${indexErr.message}`);
        }
      }
    }

    console.log("\n================================================================");
    console.log("🎉 INITIALISATION DE LA BASE DE DONNÉES APWRITE COMPLÉTÉE AVEC SUCCÈS !");
    console.log("================================================================");
    console.log("Toutes vos collections, attributs, permissions, index et relations");
    console.log("ont été configurés de manière optimale et robuste pour Santé Plus CI.");
    console.log("================================================================");
  } catch (error: any) {
    console.error("\n❌ Erreur critique lors de l'exécution du script :");
    console.error(error.message);
    process.exit(1);
  }
}

runSetup();
