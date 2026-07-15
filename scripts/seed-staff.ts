import { Client, Users, Databases, ID, Query } from "node-appwrite";
import dotenv from "dotenv";

dotenv.config();

const endpoint = process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID;

console.log("================================================================");
console.log("🏥 CREATION DES IDENTIFIANTS DU PERSONNEL HOSPITALIER (APPWRITE)");
console.log("================================================================");

if (!projectId || !apiKey || !databaseId || projectId === "remplir_ici_votre_project_id") {
  console.error("❌ Erreur: Configuration Appwrite manquante dans le fichier .env.");
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

const users = new Users(client);
const databases = new Databases(client);

const STAFF_MEMBERS = [
  {
    fullName: "M. Seydou Touré",
    email: "seydou.toure@santeplus.ci",
    phone: "+2250707070701",
    role: "directeur",
    password: "SantePlus@2026",
  },
  {
    fullName: "M. Charles Konan",
    email: "charles.konan@santeplus.ci",
    phone: "+2250707070702",
    role: "administrateur",
    password: "SantePlus@2026",
  },
  {
    fullName: "Dr. Koné Mamadou",
    email: "kone.mamadou@santeplus.ci",
    phone: "+2250707070703",
    role: "medecin",
    password: "SantePlus@2026",
  },
  {
    fullName: "Dr. Fatou Diop",
    email: "fatou.diop@santeplus.ci",
    phone: "+2250707070704",
    role: "medecin",
    password: "SantePlus@2026",
  },
  {
    fullName: "Mme. Marie-Laure Yao",
    email: "marielaure.yao@santeplus.ci",
    phone: "+2250707070705",
    role: "pharmacien",
    password: "SantePlus@2026",
  },
  {
    fullName: "M. Koffi N'Guessan",
    email: "koffi.nguessan@santeplus.ci",
    phone: "+2250707070706",
    role: "comptable",
    password: "SantePlus@2026",
  },
  {
    fullName: "Mme. Aminata Coulibaly",
    email: "aminata.coulibaly@santeplus.ci",
    phone: "+2250707070707",
    role: "secretaire",
    password: "SantePlus@2026",
  },
  {
    fullName: "M. Jean-Pierre Bamba",
    email: "jp.bamba@santeplus.ci",
    phone: "+2250707070708",
    role: "laboratoire",
    password: "SantePlus@2026",
  },
];

// Helper pour robustesse
async function createDocumentRobust(
  collectionId: string,
  documentId: string,
  data: any,
  maxRetries = 10
): Promise<any> {
  let currentData = { ...data };
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await databases.createDocument(databaseId, collectionId, documentId, currentData);
    } catch (error: any) {
      const errMsg = error.message || "";
      if (errMsg.includes("Unknown attribute")) {
        const match = errMsg.match(/Unknown attribute:\s*"?([^"\s]+)"?/i);
        if (match && match[1]) {
          const unknownAttr = match[1];
          console.warn(
            `[Appwrite Schema Fallback] L'attribut "${unknownAttr}" est absent de la collection "${collectionId}". Retrait et nouvel essai.`
          );
          delete currentData[unknownAttr];
          continue;
        }
      }
      throw error;
    }
  }
  throw new Error("Échec de la création du document après suppression des attributs inconnus.");
}

async function runSeed() {
  try {
    for (const staff of STAFF_MEMBERS) {
      console.log(`\n👤 Traitement du membre : ${staff.fullName} (${staff.role})`);
      let userId = "";

      // 1. Essayer de créer dans Appwrite Auth ou récupérer l'ID existant
      try {
        const authRes = await users.create(
          ID.unique(),
          staff.email,
          undefined,
          undefined,
          staff.fullName
        );
        userId = authRes.$id;
        console.log(`   + Compte Auth créé avec succès. ID : ${userId}`);

        // Mettre à jour le mot de passe
        await users.updatePassword(userId, staff.password);
        console.log(`   + Mot de passe défini.`);
      } catch (authErr: any) {
        if (authErr.message?.includes("already exists") || authErr.code === 409) {
          console.log(
            `   ~ Le compte Auth existe déjà pour l'e-mail ${staff.email}. Recherche de l'utilisateur existant...`
          );
          // Rechercher l'utilisateur par e-mail
          const listRes = await users.list([Query.equal("email", [staff.email])]);
          if (listRes.users.length > 0) {
            userId = listRes.users[0].$id;
            console.log(`   ~ Utilisateur existant trouvé. ID : ${userId}`);

            // Forcer la mise à jour du mot de passe pour assurer qu'ils puissent se connecter avec la démo
            await users.updatePassword(userId, staff.password);
            console.log(`   + Mot de passe réinitialisé à la valeur par défaut pour la démo.`);
          } else {
            console.error(`   ❌ Impossible de trouver l'utilisateur existant.`);
            continue;
          }
        } else {
          console.error(
            `   ❌ Erreur d'authentification pour ${staff.fullName} : ${authErr.message}`
          );
          continue;
        }
      }

      // 2. Créer ou mettre à jour le document de profil dans la collection "users"
      if (userId) {
        try {
          // Vérifier si le document existe déjà
          let userDocExists = false;
          try {
            await databases.getDocument(databaseId, "users", userId);
            userDocExists = true;
          } catch (err) {}

          const profileData = {
            fullName: staff.fullName,
            email: staff.email,
            phone: staff.phone,
            role: staff.role,
            status: "actif",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          if (userDocExists) {
            console.log(
              `   ~ Document de profil utilisateur existant trouvé dans la collection 'users'.`
            );
            // Mettre à jour pour s'assurer que le rôle est correct
            await databases.updateDocument(databaseId, "users", userId, profileData);
            console.log(`   + Document de profil utilisateur mis à jour.`);
          } else {
            // Créer le document de profil
            await createDocumentRobust("users", userId, profileData);
            console.log(`   + Nouveau document de profil créé dans la collection 'users'.`);
          }
        } catch (dbErr: any) {
          console.error(
            `   ❌ Erreur lors de l'enregistrement de la base de données : ${dbErr.message}`
          );
        }
      }
    }

    console.log("\n================================================================");
    console.log("🎉 TOUS LES COMPTES HOSPITALIERS ONT ÉTÉ CRÉÉS AVEC SUCCÈS !");
    console.log("================================================================");
    console.log("Informations de connexion générées :");
    STAFF_MEMBERS.forEach((s) => {
      console.log(`- ${s.fullName} (${s.role.toUpperCase()})`);
      console.log(`  📧 E-mail : ${s.email}`);
      console.log(`  🔑 Mot de passe : ${s.password}`);
    });
    console.log("================================================================");
  } catch (error: any) {
    console.error("\n❌ Erreur générale lors de l'exécution du script :", error.message);
  }
}

runSeed();
