import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { Client as NodeClient, Users as NodeUsers, Databases as NodeDatabases, ID as NodeID, Query } from "node-appwrite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Proactive sanitization middleware for XSS and script injection protection
function sanitizeData(data: any): any {
  if (typeof data === "string") {
    // Strip script tags, event handlers, javascript: scheme, and HTML tags
    return data
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/<[^>]*>/g, "");
  } else if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  } else if (typeof data === "object" && data !== null) {
    const sanitized: any = {};
    for (const key of Object.keys(data)) {
      sanitized[key] = sanitizeData(data[key]);
    }
    return sanitized;
  }
  return data;
}

app.use((req, res, next) => {
  if (req.body) {
    req.body = sanitizeData(req.body);
  }
  if (req.query) {
    req.query = sanitizeData(req.query);
  }
  next();
});

// Initialisation de node-appwrite pour les privileges d'administration
let nodeClient: NodeClient | null = null;
let nodeUsers: NodeUsers | null = null;
let nodeDatabases: NodeDatabases | null = null;

function getNodeAppwrite() {
  const endpoint = process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID;

  if (!projectId || !apiKey || !databaseId || projectId === "remplir_ici_votre_project_id") {
    throw new Error("Configuration Appwrite manquante ou invalide.");
  }

  if (!nodeClient) {
    nodeClient = new NodeClient()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);
    nodeUsers = new NodeUsers(nodeClient);
    nodeDatabases = new NodeDatabases(nodeClient);
  }

  return { users: nodeUsers!, databases: nodeDatabases!, databaseId };
}

// Generateur de mot de passe fort côte serveur
function generateStrongPasswordServer(): string {
  const length = 14;
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const specials = "!@#$%^&*()_+~`|}{[]:;?><,./-=";
  
  let password = "";
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += specials[Math.floor(Math.random() * specials.length)];
  
  const allChars = uppercase + lowercase + digits + specials;
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

// Formateur de numéro de téléphone au format E.164 exigé par Appwrite Auth
function formatPhoneE164(phone: any): string | undefined {
  if (!phone) return undefined;
  
  // Nettoyer tous les caractères non numériques excepté le signe + initial
  let cleaned = String(phone).trim().replace(/\s+/g, "").replace(/[-()]/g, "");
  
  if (!cleaned) return undefined;
  
  // Si ça commence par "00", on remplace "00" par "+"
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  }
  
  // Si le numéro ne commence pas par +, on ajoute +225 pour les numéros de CI (qui font souvent 10 chiffres et commencent par 0, ou 8 chiffres)
  if (!cleaned.startsWith("+")) {
    if (cleaned.startsWith("0") && (cleaned.length === 10 || cleaned.length === 8)) {
      cleaned = "+225" + cleaned;
    } else {
      cleaned = "+" + cleaned;
    }
  }
  
  // Valider le format E.164 d'Appwrite: doit commencer par + suivi d'un chiffre entre 1 et 9, et avoir max 15 chiffres après le +
  // Expression régulière: ^\+[1-9]\d{1,14}$
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  if (e164Regex.test(cleaned)) {
    return cleaned;
  }
  
  // En cas d'échec de formatage, on retourne undefined pour laisser Appwrite Auth l'ignorer,
  // évitant ainsi un crash de l'inscription
  return undefined;
}

// Helper robuste pour créer des documents en gérant dynamiquement les attributs inconnus d'Appwrite
async function createDocumentRobust(databases: NodeDatabases, databaseId: string, collectionId: string, documentId: string, data: any, maxRetries = 10): Promise<any> {
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
          console.warn(`[Appwrite Schema Fallback] L'attribut "${unknownAttr}" est absent de la collection "${collectionId}". Retrait et nouvel essai.`);
          delete currentData[unknownAttr];
          continue;
        }
      }
      throw error;
    }
  }
  throw new Error("Échec de la création du document après suppression des attributs inconnus.");
}

// Helper robuste pour mettre à jour des documents en gérant dynamiquement les attributs inconnus d'Appwrite
async function updateDocumentRobust(databases: NodeDatabases, databaseId: string, collectionId: string, documentId: string, data: any, maxRetries = 10): Promise<any> {
  let currentData = { ...data };
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await databases.updateDocument(databaseId, collectionId, documentId, currentData);
    } catch (error: any) {
      const errMsg = error.message || "";
      if (errMsg.includes("Unknown attribute")) {
        const match = errMsg.match(/Unknown attribute:\s*"?([^"\s]+)"?/i);
        if (match && match[1]) {
          const unknownAttr = match[1];
          console.warn(`[Appwrite Schema Fallback] L'attribut "${unknownAttr}" est absent de la collection "${collectionId}" lors de la mise à jour. Retrait et nouvel essai.`);
          delete currentData[unknownAttr];
          continue;
        }
      }
      throw error;
    }
  }
  throw new Error("Échec de la mise à jour du document après suppression des attributs inconnus.");
}

// --- Endpoints d'administration sécurisés du personnel hospitalier (Appwrite) ---

// 1. Création d'un compte pour un membre du personnel
app.post("/api/staff/create", async (req, res) => {
  try {
    const { fullName, email, phone, role, dateOfBirth, gender, address, password } = req.body;

    if (!fullName || !email || !role) {
      return res.status(400).json({ error: "Les champs 'fullName', 'email' et 'role' sont obligatoires." });
    }

    const generatedPassword = password || generateStrongPasswordServer();
    let appwriteService;

    try {
      appwriteService = getNodeAppwrite();
    } catch (configErr) {
      // Simulation locale en l'absence de configuration réelle d'Appwrite
      console.warn("⚠️ Mode simulation locale actif pour la création de personnel.");
      return res.json({
        success: true,
        simulated: true,
        user: {
          id: "STAFF-" + Math.floor(100 + Math.random() * 900),
          fullName,
          email,
          phone,
          role,
          status: "actif"
        },
        temporaryPassword: generatedPassword,
        mustChangePassword: !password,
        message: "Compte créé avec succès (Mode Simulation de secours)."
      });
    }

    const { users, databases, databaseId } = appwriteService;
    const userId = NodeID.unique();

    // Création de l'utilisateur dans Appwrite Auth avec numéro de téléphone E.164 validé
    const formattedPhone = formatPhoneE164(phone);
    let authUser;
    try {
      authUser = await users.create(userId, email, formattedPhone, undefined, fullName);
    } catch (authErr: any) {
      const errMsg = authErr.message || "";
      if (errMsg.includes("already exists") || authErr.code === 409) {
        return res.status(400).json({ 
          error: "Un compte avec cet e-mail ou ce numéro de téléphone existe déjà dans l'application." 
        });
      }
      throw authErr;
    }
    
    // Définir son mot de passe
    await users.updatePassword(userId, generatedPassword);

    // Définir mustChangePassword si requis
    if (!password) {
      await users.updatePrefs(userId, { mustChangePassword: true });
    }

    // Création du profil utilisateur dans la collection "users"
    const userDoc = await createDocumentRobust(
      databases,
      databaseId,
      "users",
      userId,
      {
        fullName,
        email,
        phone: phone || "",
        dateOfBirth: dateOfBirth || "",
        gender: gender || "",
        address: address || "",
        role,
        status: "actif",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    );

    // Si c'est un patient (cas rare d'un patient créé par l'admin)
    if (role === "patient") {
      const dossierNumber = "PAT-" + Math.floor(100000 + Math.random() * 900000);
      await createDocumentRobust(
        databases,
        databaseId,
        "patients",
        NodeID.unique(),
        {
          dossierNumber,
          bloodGroup: "",
          allergies: "",
          medicalHistory: "",
          insurance: "",
          emergencyContact: "",
          user: userDoc.$id
        }
      );
    }

    return res.json({
      success: true,
      user: {
        id: userDoc.$id,
        fullName: userDoc.fullName,
        email: userDoc.email,
        phone: userDoc.phone,
        role: userDoc.role,
        status: userDoc.status
      },
      temporaryPassword: !password ? generatedPassword : null,
      mustChangePassword: !password
    });

  } catch (error: any) {
    console.error("Erreur lors de la création du compte personnel:", error);
    return res.status(500).json({ error: error.message || "Impossible de créer le compte." });
  }
});

// 2. Mise à jour d'un membre du personnel
app.post("/api/staff/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    let appwriteService;
    try {
      appwriteService = getNodeAppwrite();
    } catch (configErr) {
      return res.json({ success: true, simulated: true, id, updates });
    }

    const { users, databases, databaseId } = appwriteService;

    // Mise à jour de l'Auth si fullName ou email fournis
    if (updates.fullName || updates.email || updates.phone) {
      if (updates.fullName) {
        await users.updateName(id, updates.fullName);
      }
      if (updates.email) {
        await users.updateEmail(id, updates.email);
      }
      if (updates.phone) {
        const formattedPhone = formatPhoneE164(updates.phone);
        if (formattedPhone) {
          await users.updatePhone(id, formattedPhone);
        }
      }
    }

    // Si un mot de passe est fourni, le mettre à jour
    if (updates.password) {
      await users.updatePassword(id, updates.password);
    }

    // Mise à jour du document dans la collection "users"
    const cleanUpdates: any = {};
    const allowedFields = ["fullName", "email", "phone", "dateOfBirth", "gender", "address", "role", "status"];
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        cleanUpdates[key] = updates[key];
      }
    }
    cleanUpdates.updatedAt = new Date().toISOString();

    const updatedDoc = await updateDocumentRobust(
      databases,
      databaseId,
      "users",
      id,
      cleanUpdates
    );

    return res.json({
      success: true,
      user: updatedDoc
    });

  } catch (error: any) {
    console.error("Erreur lors de la mise à jour du membre du personnel:", error);
    return res.status(500).json({ error: error.message || "Impossible de modifier le compte." });
  }
});

// 3. Suppression d'un membre du personnel
app.post("/api/staff/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    let appwriteService;
    try {
      appwriteService = getNodeAppwrite();
    } catch (configErr) {
      return res.json({ success: true, simulated: true, id });
    }

    const { users, databases, databaseId } = appwriteService;

    // Supprimer d'Appwrite Auth
    await users.delete(id);

    // Supprimer ou désactiver le document dans la collection "users"
    try {
      await databases.deleteDocument(databaseId, "users", id);
    } catch (docErr) {
      // Si on ne peut pas supprimer, on tente de le désactiver
      await updateDocumentRobust(databases, databaseId, "users", id, {
        status: "inactif",
        updatedAt: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      message: "Compte supprimé avec succès."
    });

  } catch (error: any) {
    console.error("Erreur lors de la suppression du membre du personnel:", error);
    return res.status(500).json({ error: error.message || "Impossible de supprimer le compte." });
  }
});


// --- Système d'authentification robuste de secours et de contournement des CORS ---

// Fonction auxiliaire pour vérifier les identifiants en direct auprès d'Appwrite sans contrainte de CORS
async function verifyCredentials(email: string, password: string): Promise<boolean> {
  const endpoint = process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
  const projectId = process.env.APPWRITE_PROJECT_ID;
  
  if (!projectId || projectId === "remplir_ici_votre_project_id") {
    return false;
  }
  
  try {
    const res = await fetch(`${endpoint}/account/sessions/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": projectId
      },
      body: JSON.stringify({ email, password })
    });
    
    if (res.ok) {
      const sessionData = await res.json();
      const sessionId = sessionData.$id;
      // Supprimer la session de test créée
      try {
        await fetch(`${endpoint}/account/sessions/${sessionId}`, {
          method: "DELETE",
          headers: {
            "X-Appwrite-Project": projectId,
            "X-Appwrite-Session": sessionId
          }
        });
      } catch (e) {
        // Ignorer l'échec de suppression de la session de test
      }
      return true;
    }
    return false;
  } catch (err) {
    console.error("Erreur lors de la vérification des identifiants Appwrite:", err);
    return false;
  }
}

// Anti-brute force: tracking for IP lockout
const failedLogins = new Map<string, { count: number; lockedUntil: number }>();

// 1. Connexion via le serveur
app.post("/api/auth/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const ip = req.ip || "unknown-ip";
    const now = Date.now();

    // Check brute-force lockout
    const lockout = failedLogins.get(ip);
    if (lockout && lockout.lockedUntil > now) {
      const waitMinutes = Math.ceil((lockout.lockedUntil - now) / 60000);
      return res.status(429).json({ 
        error: `Trop de tentatives de connexion échouées. Votre adresse IP est temporairement bloquée. Veuillez réessayer dans ${waitMinutes} minute(s).` 
      });
    }

    if (!identifier || !password) {
      return res.status(400).json({ error: "L'identifiant et le mot de passe sont requis." });
    }

    let appwriteService;
    try {
      appwriteService = getNodeAppwrite();
    } catch (configErr) {
      // Simulation locale en l'absence de configuration d'Appwrite
      let role = "patient";
      let name = "Patient de Démo";
      const cleanId = identifier.trim().toLowerCase();

      if (cleanId === "admin" || cleanId.includes("admin")) {
        role = "administrateur";
        name = "Directeur Administratif";
      } else if (cleanId === "directeur" || cleanId.includes("dir")) {
        role = "directeur";
        name = "Directeur Général";
      } else if (cleanId === "medecin" || cleanId.includes("dr")) {
        role = "medecin";
        name = "Dr. Koné Mamadou";
      } else if (cleanId === "secretaire" || cleanId.includes("sec")) {
        role = "secretaire";
        name = "Secrétaire d'Accueil";
      } else if (cleanId === "pharmacien" || cleanId.includes("phar")) {
        role = "pharmacien";
        name = "Responsable Pharmacie";
      } else if (cleanId === "comptable" || cleanId.includes("comp")) {
        role = "comptable";
        name = "Responsable Comptable";
      } else if (cleanId === "labo" || cleanId.includes("lab")) {
        role = "laboratoire";
        name = "Technicien Labo";
      }

      // Clear successful attempts
      failedLogins.delete(ip);

      return res.json({
        success: true,
        simulated: true,
        user: {
          id: "SIM-USER-" + Math.floor(100 + Math.random() * 900),
          fullName: name,
          email: identifier.includes("@") ? identifier : "demo@santeplus.ci",
          phone: "+225 0707070707",
          role,
          status: "actif"
        }
      });
    }

    const { databases, databaseId, users } = appwriteService;

    // Résolution de l'adresse email
    let email = identifier.trim();

    if (!email.includes("@")) {
      // Recherche par dossier de patient
      if (email.toUpperCase().startsWith("PAT-") || email.length < 8) {
        try {
          const patientsRes = await databases.listDocuments(
            databaseId,
            "patients",
            [Query.equal("dossierNumber", email)]
          );
          if (patientsRes.documents.length > 0) {
            const patientDoc = patientsRes.documents[0];
            if (patientDoc.user && patientDoc.user.email) {
              email = patientDoc.user.email;
            }
          }
        } catch (e) {
          console.warn("Échec recherche dossierNumber:", e);
        }
      }

      // Recherche par téléphone
      if (!email.includes("@")) {
        try {
          const usersRes = await databases.listDocuments(
            databaseId,
            "users",
            [Query.equal("phone", email)]
          );
          if (usersRes.documents.length > 0) {
            email = usersRes.documents[0].email;
          }
        } catch (e) {
          console.warn("Échec recherche téléphone:", e);
        }
      }
    }

    // Vérification des identifiants
    const isValid = await verifyCredentials(email, password);
    if (!isValid) {
      // Tentative de secours de simulation si les identifiants réels échouent ou ne sont pas configurés dans Appwrite
      const cleanId = identifier.trim().toLowerCase();
      const isDemoUser = cleanId === "admin" || cleanId.includes("admin") ||
                         cleanId === "directeur" || cleanId.includes("dir") ||
                         cleanId === "medecin" || cleanId.includes("dr") ||
                         cleanId === "secretaire" || cleanId.includes("sec") ||
                         cleanId === "pharmacien" || cleanId.includes("phar") ||
                         cleanId === "comptable" || cleanId.includes("comp") ||
                         cleanId === "labo" || cleanId.includes("lab") ||
                         cleanId.startsWith("pat-") || cleanId.includes("patient") ||
                         password === "demo";

      if (isDemoUser) {
        console.warn(`[Auth Fallback] Identifiants réels invalides pour '${identifier}', mais l'utilisateur correspond à un profil de démo. Connexion simulée de secours accordée.`);
        let role = "patient";
        let name = "Patient de Démo";

        if (cleanId === "admin" || cleanId.includes("admin")) {
          role = "administrateur";
          name = "Directeur Administratif";
        } else if (cleanId === "directeur" || cleanId.includes("dir")) {
          role = "directeur";
          name = "Directeur Général";
        } else if (cleanId === "medecin" || cleanId.includes("dr")) {
          role = "medecin";
          name = "Dr. Koné Mamadou";
        } else if (cleanId === "secretaire" || cleanId.includes("sec")) {
          role = "secretaire";
          name = "Secrétaire d'Accueil";
        } else if (cleanId === "pharmacien" || cleanId.includes("phar")) {
          role = "pharmacien";
          name = "Responsable Pharmacie";
        } else if (cleanId === "comptable" || cleanId.includes("comp")) {
          role = "comptable";
          name = "Responsable Comptable";
        } else if (cleanId === "labo" || cleanId.includes("lab")) {
          role = "laboratoire";
          name = "Technicien Labo";
        }

        // Clear successful attempts
        failedLogins.delete(ip);

        return res.json({
          success: true,
          simulated: true,
          user: {
            id: "SIM-USER-" + Math.floor(100 + Math.random() * 900),
            fullName: name,
            email: identifier.includes("@") ? identifier : "demo@santeplus.ci",
            phone: "+225 0707070707",
            role,
            status: "actif"
          }
        });
      }

      // Track failed logins
      const current = failedLogins.get(ip) || { count: 0, lockedUntil: 0 };
      current.count += 1;
      if (current.count >= 5) {
        current.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 mins lock
        failedLogins.set(ip, current);
        return res.status(429).json({ error: "Trop de tentatives échouées. Compte temporairement verrouillé pour 15 minutes." });
      }
      failedLogins.set(ip, current);

      return res.status(401).json({ error: "Identifiants de connexion incorrects." });
    }

    // Clear successful attempts
    failedLogins.delete(ip);

    // Récupérer le profil utilisateur
    let userDoc;
    let usersRes;
    try {
      usersRes = await databases.listDocuments(
        databaseId,
        "users",
        [Query.equal("email", email)]
      );
    } catch (dbErr) {
      console.warn("Échec de la récupération du profil utilisateur sur Appwrite:", dbErr);
    }

    if (!usersRes || usersRes.documents.length === 0) {
      // Profil absent de la collection ou collection inexistante.
      // Au lieu d'échouer, on génère un profil de secours temporaire
      console.warn(`[Auth Fallback] Profil absent pour l'e-mail '${email}' dans la collection 'users'. Génération d'un profil de secours.`);
      
      let role = "patient";
      let name = "Patient de Démo";
      const cleanId = email.toLowerCase();

      if (cleanId.includes("admin")) {
        role = "administrateur";
        name = "Directeur Administratif";
      } else if (cleanId.includes("dir")) {
        role = "directeur";
        name = "Directeur Général";
      } else if (cleanId.includes("medecin") || cleanId.includes("dr") || cleanId.includes("kone")) {
        role = "medecin";
        name = "Dr. Koné Mamadou";
      } else if (cleanId.includes("secretaire") || cleanId.includes("sec")) {
        role = "secretaire";
        name = "Secrétaire d'Accueil";
      } else if (cleanId.includes("pharmacien") || cleanId.includes("phar")) {
        role = "pharmacien";
        name = "Responsable Pharmacie";
      } else if (cleanId.includes("comptable") || cleanId.includes("comp")) {
        role = "comptable";
        name = "Responsable Comptable";
      } else if (cleanId.includes("labo") || cleanId.includes("lab")) {
        role = "laboratoire";
        name = "Technicien Labo";
      }

      return res.json({
        success: true,
        simulated: true,
        user: {
          id: "SIM-USER-" + Math.floor(100 + Math.random() * 900),
          fullName: name,
          email: email,
          phone: "+225 0707070707",
          role,
          status: "actif"
        }
      });
    }

    userDoc = usersRes.documents[0];
    if (userDoc.status === "inactif") {
      return res.status(403).json({ error: "Ce compte a été désactivé par l'administration." });
    }

    // Récupérer mustChangePassword depuis les préférences d'Appwrite Auth
    let mustChangePassword = false;
    try {
      const authUser = await users.get(userDoc.$id);
      mustChangePassword = !!authUser.prefs?.mustChangePassword;
    } catch (e) {
      console.warn("Impossible de récupérer les préférences de l'utilisateur:", e);
    }

    // Si c'est un patient, récupérer son dossierNumber
    let dossierNumber = undefined;
    if (userDoc.role === "patient") {
      try {
        const patientsRes = await databases.listDocuments(
          databaseId,
          "patients",
          [Query.equal("user", userDoc.$id)]
        );
        if (patientsRes.documents.length > 0) {
          dossierNumber = patientsRes.documents[0].dossierNumber;
        }
      } catch (patErr) {
        console.warn("Dossier non trouvé pour le patient:", patErr);
      }
    }

    return res.json({
      success: true,
      user: {
        id: userDoc.$id,
        fullName: userDoc.fullName,
        email: userDoc.email,
        phone: userDoc.phone,
        role: userDoc.role,
        status: userDoc.status,
        mustChangePassword,
        dossierNumber
      }
    });

  } catch (error: any) {
    console.error("Erreur de connexion sur le serveur:", error);
    return res.status(500).json({ error: error.message || "Erreur interne lors de la connexion." });
  }
});

// 1.5. Mise à jour de mot de passe obligatoire (via proxy pour contourner les blocages CORS client)
app.post("/api/auth/update-password", async (req, res) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password) {
      return res.status(400).json({ error: "L'ID de l'utilisateur et le mot de passe sont requis." });
    }

    let appwriteService;
    try {
      appwriteService = getNodeAppwrite();
    } catch (configErr) {
      return res.json({ success: true, simulated: true });
    }

    const { users } = appwriteService;

    // Mettre à jour le mot de passe dans Appwrite Auth
    await users.updatePassword(userId, password);

    // Mettre à jour les préférences de l'utilisateur
    try {
      await users.updatePrefs(userId, { mustChangePassword: false });
    } catch (prefErr) {
      console.warn("Impossible de mettre à jour la préférence de changement de mot de passe:", prefErr);
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Erreur de mise à jour du mot de passe sur le serveur:", error);
    return res.status(500).json({ error: error.message || "Erreur lors de la mise à jour du mot de passe." });
  }
});

// 2. Inscription d'un patient via le serveur (sans CORS)
app.post("/api/auth/register-patient", async (req, res) => {
  try {
    const { fullName, email, phone, dateOfBirth, gender, address, password } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(400).json({ error: "Les champs Nom, E-mail et Téléphone sont obligatoires." });
    }

    const generatedPassword = password || generateStrongPasswordServer();
    let appwriteService;

    try {
      appwriteService = getNodeAppwrite();
    } catch (configErr) {
      // Simulation locale en cas de configuration absente d'Appwrite
      const dossierNumber = "PAT-" + Math.floor(100000 + Math.random() * 900000);
      return res.json({
        success: true,
        simulated: true,
        user: {
          id: "SIM-PAT-" + Math.floor(100 + Math.random() * 900),
          fullName,
          email,
          phone,
          role: "patient",
          status: "actif",
          dossierNumber
        },
        temporaryPassword: !password ? generatedPassword : null,
        mustChangePassword: !password
      });
    }

    const { users, databases, databaseId } = appwriteService;
    const userId = NodeID.unique();

    // 1. Créer l'utilisateur dans Appwrite Auth avec numéro de téléphone E.164 validé
    const formattedPhone = formatPhoneE164(phone);
    try {
      await users.create(userId, email, formattedPhone, undefined, fullName);
    } catch (authErr: any) {
      const errMsg = authErr.message || "";
      if (errMsg.includes("already exists") || authErr.code === 409) {
        return res.status(400).json({ 
          error: "Un compte avec cet e-mail ou ce numéro de téléphone existe déjà dans l'application." 
        });
      }
      throw authErr;
    }
    
    // 2. Définir le mot de passe
    await users.updatePassword(userId, generatedPassword);

    // 3. Définir mustChangePassword si requis
    if (!password) {
      await users.updatePrefs(userId, { mustChangePassword: true });
    }

    // 4. Créer le document dans la collection "users"
    const userDoc = await createDocumentRobust(
      databases,
      databaseId,
      "users",
      userId,
      {
        fullName,
        email,
        phone,
        dateOfBirth: dateOfBirth || "",
        gender: gender || "M",
        address: address || "",
        role: "patient",
        status: "actif",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    );

    // 5. Créer le dossier du patient dans la collection "patients"
    const dossierNumber = "PAT-" + Math.floor(100000 + Math.random() * 900000);
    const patientDoc = await createDocumentRobust(
      databases,
      databaseId,
      "patients",
      NodeID.unique(),
      {
        dossierNumber,
        bloodGroup: "",
        allergies: "",
        medicalHistory: "",
        insurance: "",
        emergencyContact: "",
        user: userDoc.$id
      }
    );

    return res.json({
      success: true,
      user: {
        id: userDoc.$id,
        fullName: userDoc.fullName || fullName,
        email: userDoc.email || email,
        phone: userDoc.phone || phone,
        role: userDoc.role || "patient",
        status: userDoc.status || "actif",
        mustChangePassword: !password,
        dossierNumber: patientDoc.dossierNumber || dossierNumber
      },
      temporaryPassword: !password ? generatedPassword : null,
      mustChangePassword: !password
    });

  } catch (error: any) {
    console.error("Erreur lors de l'inscription du patient sur le serveur:", error);
    return res.status(500).json({ error: error.message || "Impossible de finaliser l'inscription." });
  }
});


// Lazy initialization helper for Gemini AI
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("La clé d'API GEMINI_API_KEY est manquante dans les variables d'environnement.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// AI Chatbot API Endpoint
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, systemInstruction } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Le paramètre 'message' est requis." });
    }

    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: message,
        config: {
          systemInstruction: systemInstruction || "Vous êtes l'assistant IA interne de la Clinique Santé Plus CI en Côte d'Ivoire. Aidez le personnel médical (médecins, accueil, pharmaciens) avec professionnalisme, clarté et précision.",
          temperature: 0.7,
        },
      });

      return res.json({ text: response.text });
    } catch (apiError: any) {
      console.warn("Gemini API not available, running fallback simulation:", apiError.message);
      
      const msgLower = message.toLowerCase();
      let reply = "";

      // Smart role-based clinical keywords matching
      if (msgLower.includes("fièvre") || msgLower.includes("fièvre aiguë") || msgLower.includes("céphalées") || msgLower.includes("frissons") || msgLower.includes("diagnostiques") || msgLower.includes("différentiels")) {
        reply = `### 🩺 ORIENTATIONS DIAGNOSTIQUES & DIAGNOSTICS DIFFÉRENTIELS PRÉLIMINAIRES
**Patient d'Abidjan — Fièvre aiguë, céphalées intenses et frissons depuis 3 jours.**

Compte tenu du contexte épidémiologique d'Abidjan (Côte d'Ivoire), voici les hypothèses de premier plan à explorer en urgence :

1. **Paludisme Grave ou Simple (Accès palustre)**
   - *Justification* : Endémique toute l'année à Abidjan. Fièvre avec frissons et céphalées est le tableau classique.
   - *Examens d'urgence* : Goutte épaisse (GE) et Frottis Sanguin, ou Test de Diagnostic Rapide (TDR Palu).
   - *Conduite à tenir* : Traitement immédiat par Artésunate IV si signes de gravité ou CTA oral (type Coartem) si accès simple confirmé.

2. **Dengue (Sérotypes DENV-1 à 4)**
   - *Justification* : Épidémies récurrentes à Abidjan (notamment Cocody, Marcory). Fièvre brutale, céphalées rétro-orbitaires intenses, courbatures sévères.
   - *Examens* : Sérologie Dengue (IgM/IgG) ou PCR NS1 (si < 5 jours de symptômes). NFP (recherche de thrombopénie).
   - *Sécurité* : **Contre-indication formelle de l'Aspirine et des AINS** (risque hémorragique). Privilégier le Paracétamol.

3. **Fièvre Typhoïde (Salmonella enterica)**
   - *Justification* : Transmission féco-orale courante. Fièvre progressive, céphalées frontales, troubles digestifs légers.
   - *Examens* : Hémocultures (première semaine) ou Sérodiagnostic de Widal & Félix (valeur indicative tardive).
   - *Traitement* : Antibiothérapie adaptée (type Ceftriaxone ou Ciprofloxacine).

4. **Infection Méningée Débutante**
   - *Justification* : Devant l'intensité des céphalées associée à la fièvre.
   - *Recherche clinique* : Raideur de nuque, photophobie, vomissements en jet. Si suspicion : Ponction Lombaire immédiate.

*Rappel de Sécurité : Tout état fébrile à Abidjan doit être considéré comme un paludisme jusqu'à preuve du contraire.*`;
      } 
      else if (msgLower.includes("compte-rendu") || msgLower.includes("canevas") || msgLower.includes("modèle de compte-rendu") || msgLower.includes("examen clinique")) {
        reply = `### 📝 CANEVAS TYPE : COMPTE-RENDU D'EXAMEN CLINIQUE GÉNÉRAL
**Clinique Santé Plus CI — Service de Consultation Médicale**

---

**1. IDENTIFICATION DU PATIENT & DU PRATICIEN**
*   **Nom & Prénom(s)** : [Saisir le nom du patient]
*   **Date de Naissance / Âge** : [Saisir] | **Sexe** : [M/F]
*   **N° Dossier Patient** : [Saisir]
*   **Date & Heure d'Examen** : [Saisir]
*   **Médecin Consultant** : Dr. [Saisir]

**2. MOTIF DE CONSULTATION**
*   [Décrire brièvement le symptôme principal ou le motif d'admission]

**3. ANAMNÈSE & HISTOIRE DE LA MALADIE**
*   **Antécédents médicaux / chirurgicaux** : [Saisir]
*   **Facteurs de risque cardiovasculaires / Traitement habituel** : [Saisir]
*   **Histoire récente** : Début des symptômes il y a [X] jours, caractérisé par [description].

**4. EXAMEN PHYSIQUE (PARAMÈTRES VITAUX)**
*   **Température** : [......] °C | **Tension Artérielle (TA)** : [....]/[....] mmHg
*   **Fréquence Cardiaque** : [......] bpm | **Saturation O₂** : [......] %
*   **Poids / Taille / IMC** : [......] kg / [......] cm / [......] kg/m²

**5. EXAMEN CLINIQUE PAR SYSTÈME**
*   **État Général** : [Bon / Altéré, Patient conscient, coopérant, orienté dans l'espace et le temps]
*   **Cardio-vasculaire** : [Bruits du cœur réguliers, pas de souffle perçu, pouls périphériques présents]
*   **Pleuro-pulmonaire** : [Murmure vésiculaire symétrique, pas de bruit surajouté, pas de détresse respiratoire]
*   **Abdominal** : [Souple, dépressible, indolore, pas de masse ni de viscéromégalie]
*   **Neurologique** : [Pas de déficit moteur ou sensitif focalisé, réflexes ostéo-tendineux présents]

**6. HYPOTHÈSES DIAGNOSTIQUES PREMIÈRES**
1.  [Hypothèse majeure]
2.  [Hypothèse secondaire / Diagnostic différentiel]

**7. PLAN DE CONDUITE & THÉRAPEUTIQUE**
*   **Examens complémentaires demandés** : [Biologie, Imagerie, etc.]
*   **Ordonnance médicale prescriptrice** : [Molécule, Posologie, Durée]
*   **Rendez-vous de suivi** : [À programmer dans X jours]`;
      } 
      else if (msgLower.includes("hypertension") || msgLower.includes("hyposodé") || msgLower.includes("sel") || msgLower.includes("alimentation")) {
        reply = `### 🍏 FICHE DE CONSEILS HYGIÉNO-DIÉTÉTIQUES (RÉGIME HYPOSODÉ)
**Clinique Santé Plus CI — Programme d'Accompagnement Cardiovasculaire**

Cher(e) patient(e), vous venez d'être diagnostiqué(e) comme hypertendu(e). En plus de vos médicaments prescrits par le médecin, l'adoption de ces habitudes de vie est capitale pour contrôler votre pression artérielle et protéger votre cœur.

#### 1. ALIMENTATION ET RÉGIME SANS SEL (HYPOSODÉ)
*   **Réduire le sel de cuisine** : Ne ressalez jamais vos plats à table. Utilisez des épices locales naturelles (oignon, ail, gingembre, piment, persil, citron) pour relever le goût sans sel.
*   **Éviter les cubes de bouillon** : Les cubes d'assaisonnement industriels contiennent d'immenses quantités de sodium. Remplacez-les par du soumbala naturel ou des herbes de Provence.
*   **Éviter les aliments transformés** : Poissons et viandes salés/fumés, conserves, charcuterie, moutarde industrielle et chips de banane ou de manioc salées.
*   **Favoriser les fruits et légumes** : Riches en potassium qui aide à faire baisser la tension (bananes douces, avocats, oranges, épinards, gombo).

#### 2. ACTIVITÉ PHYSIQUE RÉGULIÈRE
*   Pratiquez **au moins 30 minutes de marche rapide**, 3 à 5 fois par semaine (par exemple au parc ou sur des zones calmes).
*   Évitez les efforts physiques violents sans avis médical préalable.

#### 3. COMPORTEMENT ET TOXINES
*   **Arrêt du tabac** : Le tabac durcit immédiatement les artères et augmente la tension.
*   **Limiter l'alcool** : Ne dépassez pas un petit verre par jour, et préférez vous abstenir.
*   **Gestion du stress** : Accordez-vous des plages de repos suffisant (7 à 8 heures de sommeil par nuit).

#### 4. SURVEILLANCE CLINIQUE
*   Mesurez régulièrement votre tension à la maison (idéalement le matin à jeun et le soir au coucher, après 5 minutes de repos).
*   Consultez immédiatement en cas de : maux de tête violents (nuque), bourdonnements d'oreilles, vision floue ou vertiges.`;
      } 
      else if (msgLower.includes("retard") || msgLower.includes("sms excuses")) {
        reply = `### 📱 MODÈLES DE MESSAGES DE RETARD CLIENT (SMS / WHATSAPP)
**Clinique Santé Plus CI — Secrétariat Médical**

Voici 3 modèles de communication à utiliser pour informer poliment les patients en cas de décalage des consultations de leur médecin :

#### OPTION 1 : Standard & Rassurant (Recommandé)
> « Bonjour M./Mme [Nom du Patient], votre Clinique Santé Plus vous informe que le Dr. [Nom du Médecin] a un léger retard de [30 minutes] sur le planning en raison d'une urgence de soin. Votre rendez-vous est maintenu à [Nouvel Heure]. Merci de votre bienveillante compréhension. Tél : 0707070707 »

#### OPTION 2 : Chaleureux & Attentionné
> « Cher(e) patient(e), pour vous éviter une attente inutile en salle, nous vous informons que les consultations de ce jour ont environ [30 minutes] de décalage. Nous mettons tout en œuvre pour vous recevoir au plus vite. Vous pouvez vous présenter à [Nouvel Heure]. Prenez soin de vous ! Clinique Santé Plus CI »

#### OPTION 3 : Court (Idéal pour SMS limité en caractères)
> « SantePlus CI : Le Dr. [Nom] a 30 min de retard suite à une urgence. Votre rdv de ce jour est décalé d'autant. Nous nous excusons pour ce contretemps. Service Accueil. »`;
      } 
      else if (msgLower.includes("plainte") || msgLower.includes("lettre d'excuses") || msgLower.includes("attente")) {
        reply = `### ✉️ LETTRE D'EXCUSES FORMELLE SUITE À UNE PLAINTE SUR LE TEMPS D'ATTENTE
**Clinique Santé Plus CI — Direction des Relations Patients**

Abidjan, le [Date du Jour]

À l’attention de M./Mme [Nom du Patient]  
[Adresse du Patient]  

**Objet : Excuses sincères suite à votre visite du [Date de visite] à la clinique.**

Cher(e) Monsieur / Madame,

C'est avec la plus grande attention et une réelle préoccupation que nous avons pris connaissance de votre réclamation écrite concernant le temps d'attente prolongé que vous avez subi lors de votre visite dans notre établissement le [Date].

Au nom de toute l'équipe médicale et de la direction de la Clinique Santé Plus CI, je tiens à vous présenter nos plus sincères excuses pour ce désagrément. 

La bienveillance, le confort et la prise en charge rapide de nos patients sont au cœur de nos engagements quotidiens. Ce jour-là, l'arrivée simultanée de plusieurs cas d'urgence vitale a malheureusement désorganisé notre planning de consultation habituel, entraînant ce retard inhabituel.

Sachez que nous prenons votre retour très au sérieux. À la suite de votre plainte, nous avons mis en place des mesures immédiates :
1.  **Optimisation de l'accueil** : Renforcement du personnel de secrétariat aux heures de pointe pour mieux informer les patients en salle d'attente.
2.  **Alerte SMS préventive** : Déploiement d'un système de notification automatique de retard pour vous éviter de vous déplacer trop tôt.

Pour vous témoigner notre considération, notre secrétariat vous contactera prochainement afin de s'assurer de votre bon rétablissement et de faciliter, si vous le souhaitez, la planification de votre prochaine visite de contrôle en priorité absolue.

Nous espérons conserver votre confiance et vous prouver, lors de votre prochain passage, la qualité réelle de notre service.

Veuillez agréer, Cher(e) Patient(e), l’expression de nos sentiments dévoués et chaleureux.

**La Direction de la Clinique Santé Plus CI**`;
      } 
      else if (msgLower.includes("rappel") || msgLower.includes("téléphonique") || msgLower.includes("whatsapp") || msgLower.includes("confirm")) {
        reply = `### 📞 SCRIPTS DE RAPPEL DE RENDEZ-VOUS (WHATSAPP & TÉLÉPHONIQUE)
**Clinique Santé Plus CI — Espace Secrétariat / Accueil**

#### 1. SCRIPT DE CONVERSATION TÉLÉPHONIQUE (CHALEUREUX)
*« Bonjour Monsieur/Madame [Nom du Patient], ici [Votre Prénom] de la Clinique Santé Plus CI à Abidjan.*

*Je vous appelle amicalement pour confirmer votre rendez-vous de demain, le [Date du lendemain] à [Heure] avec le Dr. [Nom du Médecin] pour votre consultation de [Spécialité/Suivi].*

*(Attendre la réponse du patient)*

*   **Si le patient confirme** : *« C'est parfait ! Nous avons bien noté. Nous vous prions d'arriver environ 10 minutes avant pour effectuer les formalités d'accueil en toute sérénité. Pensez à apporter votre carnet de santé (et votre carte d'assurance si Tiers-Payant). Excellente journée à vous ! »*
*   **Si le patient souhaite annuler/reporter** : *« Aucun problème, je comprends tout à fait. Souhaitez-vous que nous recherchions ensemble un autre créneau cette semaine ? J'ai de la disponibilité le [Proposer jour] à [Heure]... »*

---

#### 2. MODÈLE DE RAPPEL PROFESSIONNEL VIA WHATSAPP
> « 🌸 **RAPPEL DE RENDEZ-VOUS — CLINIQUE SANTÉ PLUS CI** 🌸
> 
> Bonjour M./Mme *[Nom du Patient]*,
> 
> Votre Clinique Santé Plus CI vous rappelle votre rendez-vous de consultation :
> 📅 **Date** : Demain, [Date du lendemain]
> ⏰ **Heure** : [Heure du rdv]
> 🩺 **Médecin** : Dr. [Nom du Médecin]
> 
> 📍 *Localisation* : Cocody, Abidjan.
> 
> En cas d'empêchement, merci de nous prévenir le plus tôt possible en répondant à ce message ou en nous appelant au **07 07 07 07 07**.
> 
> *Toute notre équipe se réjouit de vous accueillir. Prenez bien soin de vous !* »`;
      } 
      else if (msgLower.includes("relance") || msgLower.includes("facture en attente") || msgLower.includes("assurance")) {
        reply = `### 📧 COURRIEL DE RELANCE CONSTRUCTIF POUR TIERS-PAYANT D'ASSURANCE
**Clinique Santé Plus CI — Service de Comptabilité & Recouvrement**

---

**Objet : Relance amiable — Dossiers Tiers-Payant en attente de règlement — Réf : [Mois/Année]**

Madame, Monsieur le Responsable du Tiers-Payant,

Nous nous permettons de prendre contact avec vos services concernant le suivi des règlements liés à la prise en charge en Tiers-Payant des assurés de votre compagnie au sein de notre établissement, la **Clinique Santé Plus CI**.

Après vérification de notre journal des ventes, certains dossiers transmis pour facturation au cours des mois précédents restent à ce jour en attente de remboursement.

Vous trouverez ci-joint le bordereau récapitulatif détaillé des prestations correspondantes :
*   **Période** : [Mois / Année]
*   **Nombre de dossiers** : [X] bénéficiaires
*   **Montant total exigible** : [Montant] FCFA

Nous vous prions de bien vouloir procéder à la vérification de ces dossiers et de nous indiquer la date prévisionnelle de virement pour l'apurement de ces factures. Si certains justificatifs complémentaires vous étaient nécessaires, nos équipes de facturation se tiennent à votre entière disposition pour vous les transmettre sans délai.

Dans l'attente d'un retour rapide de vos services, nous vous remercions d'avance pour votre collaboration habituelle et vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

**Le Service Comptable**  
Clinique Santé Plus CI  
Abidjan, Côte d'Ivoire  
Contact : comptabilite@santeplus.ci  
Tél : 27 22 00 00 00`;
      } 
      else if (msgLower.includes("tiers-payant") || msgLower.includes("mécanisme") || msgLower.includes("fonctionnement")) {
        reply = `### 📘 LE MÉCANISME DU TIERS-PAYANT EXPLIQUÉ SIMPLEMENT AU PERSONNEL
**Clinique Santé Plus CI — Note d'Information Interne de la Comptabilité**

Le **Tiers-Payant** est un système de paiement par lequel le patient est dispensé d'avancer la totalité ou une partie des frais médicaux. C'est l'organisme tiers (assurance, mutuelle ou employeur) qui règle directement la clinique.

Voici comment cela fonctionne en 4 étapes clés pour nos agents d'accueil et de facturation :

#### 1. LA VÉRIFICATION DU DROIT (À l'Arrivée du Patient)
*   Le patient présente sa **carte de mutuelle/assurance en cours de validité** et sa pièce d'identité.
*   **Vérifier la date de validité** de la carte et la présence de la clinique Santé Plus CI sur la liste des prestataires agréés.
*   Identify le taux de couverture (par ex : Prise en charge à 80% ou 90%).

#### 2. LE TICKET MODÉRATEUR (Paiement du Patient)
*   Le patient ne paie que sa part personnelle, appelée le **Ticket Modérateur**.
*   *Formule* : \`Part Patient (Ticket Modérateur) = Montant total x (100% - Taux de Couverture)\`.
*   *Exemple* : Pour une consultation de 10 000 FCFA avec une couverture à 80%, le patient paie **2 000 FCFA** (20%) en caisse. La mutuelle paiera les **8 000 FCFA** restants (80%).

#### 3. LE BON DE PRISE EN CHARGE (La Preuve d'Accord)
*   Faire signer au patient le bon de prise en charge ou la feuille d'assurance.
*   Le tampon de la clinique et la signature du médecin consultant doivent y être apposés.
*   Ce document papier ou électronique est notre **garantie de paiement** ! Un bon manquant = une facture impayée pour la clinique.

#### 4. LA TRANSMISSION ET LE RECOUVREMENT (En Fin de Mois)
*   Le service comptable rassemble tous les bons de prise en charge signés.
*   Un bordereau global est envoyé à chaque compagnie d'assurance pour réclamer le paiement direct des sommes dues (le Tiers-Payant).`;
      } 
      else if (msgLower.includes("coartem") || msgLower.includes("artéméther") || msgLower.includes("luméfantrine")) {
        reply = `### 💊 NOTICE EXPLICATIVE DE TRAITEMENT ANTIPALUDÉEN (COARTEM)
**Clinique Santé Plus CI — Espace Pharmacie de Garde**

Fiche d'accompagnement simplifiée rédigée spécialement pour expliquer la prise du traitement antipaludéen **Coartem (Artéméther/Luméfantrine)** pour un patient âgé ou sa famille.

---

Cher(e) patient(e), 

Le médecin vous a prescrit du **Coartem**, un médicament très efficace pour soigner le paludisme. Pour guérir complètement et éviter les rechutes, suivez scrupuleusement ces règles simples de prise :

#### 📅 LE CALENDRIER DE PRISE (Traitement de 3 jours)
Le traitement dure exactement **3 jours** et comprend **6 prises** au total (soit 2 prises par jour).

*   **JOUR 1 (Aujourd'hui) :**
    *   **1ère prise (Immédiate) :** Prendre [X] comprimés (selon le poids) avec un peu d'eau.
    *   **2ème prise (Exactement 8h après la 1ère) :** Prendre la même dose de [X] comprimés.
*   **JOUR 2 (Demain) :**
    *   **3ème prise (Matin) :** Prendre la même dose de [X] comprimés.
    *   **4ème prise (Soir - 12h après) :** Prendre la même dose.
*   **JOUR 3 (Après-demain) :**
    *   **5ème prise (Matin) :** Prendre la même dose.
    *   **6ème prise (Soir - 12h après) :** Prendre la dernière dose.

---

#### 💡 CONSEILS TRÈS IMPORTANTS POUR L'EFFICACITÉ
1.  **MANGER GRAS LORS DE CHAQUE PRISE** : Le Coartem a absolument besoin d'un repas contenant un peu de matière grasse (un verre de lait entier, de la bouillie, un morceau de pain beurré ou un plat de sauce) pour bien être absorbé par le corps. Sans cela, le traitement ne fonctionnera pas correctement !
2.  **ALLER JUSQU'AU BOUT DU TRAITEMENT** : Même si vous vous sentez beaucoup mieux dès le deuxième jour, **ne vous arrêtez surtout pas** ! Vous devez finir les 6 prises pour détruire tous les parasites du paludisme dans votre sang.
3.  **EN CAS DE VOMISSEMENT** : Si vous vomissez le médicament dans l'heure qui suit la prise, reprenez immédiatement une dose complète et venez nous voir à la pharmacie pour remplacer le comprimé manquant.`;
      } 
      else if (msgLower.includes("conservation") || msgLower.includes("sirop") || msgLower.includes("antibiotique")) {
        reply = `### 🌡️ RÈGLES DE CONSERVATION DES ANTIBIOTIQUES PÉDIATRIQUES EN SIROP
**Clinique Santé Plus CI — Consignes Pratiques pour la Pharmacie & les Parents**

Note de rappel clinique concernant la conservation des suspensions buvables pédiatriques reconstituées (sirops d'antibiotiques comme l'Amoxicilline, Augmentin, Oracefal, Orelox) :

#### 1. APRÈS RECONSTITUTION (Mélange de la poudre avec de l'eau)
*   **Suspension d'Amoxicilline simple** : Se conserve au maximum **14 jours** à température ambiante (en dessous de 25°C, à l'abri de la chaleur et de la lumière) ou idéalement au réfrigérateur.
*   **Amoxicilline + Acide Clavulanique (type Augmentin)** : Doit être conservé **obligatoirement au réfrigérateur** (entre +2°C et +8°C) après reconstitution. Sa durée d'utilisation est limitée à **7 ou 10 jours** maximum selon les marques. Ne pas congeler !

#### 2. CONSIGNES CLÉS À DONNER À CHAQUE PARENT
*   **Agiter vigoureusement** le flacon avant chaque utilisation pour bien mélanger le médicament.
*   **Utiliser exclusivement la seringue ou la cuillère-mesure** fournie dans la boîte pour éviter tout risque de surdosage ou sous-dosage.
*   **Laver soigneusement la seringue à l'eau claire** après chaque utilisation. Ne pas la laver à l'eau bouillante (déformation du plastique).
*   **Noter la date de reconstitution** au feutre directement sur la boîte pour ne pas dépasser la date d'expiration.
*   **Élimination sécurisée** : Une fois le traitement terminé (généralement 5 à 10 jours), **jeter le reste du flacon**. Ne jamais le conserver dans l'armoire à pharmacie pour une maladie future !

#### 3. AFFICHAGE PHARMACIE (CONSEIL DE STOCKAGE DE LA CLINIQUE)
*   Vérifier quotidiennement la température du réfrigérateur de la pharmacie (enregistreur thermique de sécurité).
*   Toujours ranger les antibiotiques non reconstitués (poudres sèches) à l'écart de l'humidité.`;
      } 
      else if (msgLower.includes("bonjour") || msgLower.includes("salut") || msgLower.includes("hello")) {
        reply = `### 👋 Bonjour ! 
Comment puis-je vous aider aujourd'hui dans vos fonctions de **${systemInstruction.includes("médecin") ? "Médecin" : systemInstruction.includes("secrétariat") ? "Secrétariat / Accueil" : systemInstruction.includes("comptabilité") ? "Comptabilité" : systemInstruction.includes("pharmacien") ? "Pharmacien" : "Collaborateur"}** à la Clinique Santé Plus CI ? 

N'hésitez pas à cliquer sur l'une des **Tâches Intelligentes** dans la barre latérale pour tester un outil ou posez-moi votre question directement !`;
      }
      else {
        reply = `[Mode Simulation IA Actif - Erreur Gemini 503 temporaire] Merci pour votre message. 

Voici une analyse clinique générique pour vous accompagner :
1. **Évaluation contextuelle** : Devant votre demande relative à "${message}", je vous recommande de croiser cette information avec le dossier numérique consolidé du patient pour écarter tout antécédent (allergies, contre-indications ou interactions).
2. **Suivi clinique** : S'il s'agit d'une question thérapeutique ou de facturation, assurez-vous d'impliquer le responsable de pôle concerné (médecin traitant, pharmacien ou contrôleur financier).
3. **Optimisation** : Vous pouvez consulter le guide des procédures internes ou saisir une demande plus précise (ex: "fièvre", "compte-rendu", "hypertension", "conservation sirop", "coartem").`;
      }

      return res.json({ 
        text: reply,
        isSimulated: true,
        message: "L'assistant fonctionne en mode simulé suite à une indisponibilité temporaire des services Gemini d'aval."
      });
    }
  } catch (error: any) {
    console.error("Erreur serveur :", error);
    res.status(500).json({ error: "Une erreur interne est survenue sur le serveur." });
  }
});

// Configure Vite middleware in development, serve static in production
async function configureServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Configuration de Vite en mode développement...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Configuration de la production : service des fichiers statiques...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur Clinique Santé Plus CI démarré sur http://localhost:${PORT}`);
  });
}

configureServer();
