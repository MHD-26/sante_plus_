import { Client, Account, Databases, ID } from "appwrite";

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || "";
const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || "";

// Vérification de la configuration d'Appwrite
export const isAppwriteConfigured =
  projectId !== "" && projectId !== "remplir_ici_votre_project_id" && databaseId !== "";

const client = new Client();

if (isAppwriteConfigured) {
  client.setEndpoint(endpoint).setProject(projectId);
} else {
  console.warn(
    "⚠️ Appwrite n'est pas complètement configuré dans le fichier .env (PROJECT_ID ou DATABASE_ID manquant)."
  );
}

export const account = new Account(client);
export const databases = new Databases(client);
export const APPWRITE_DB_ID = databaseId;
export { ID };
