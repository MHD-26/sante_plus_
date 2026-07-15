import { account, databases, APPWRITE_DB_ID, ID, isAppwriteConfigured } from "../lib/appwrite";
import { Query } from "appwrite";
import { UserRole } from "../types";

export interface AppwriteUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: "actif" | "inactif";
  mustChangePassword?: boolean;
  dossierNumber?: string; // Si c'est un patient
}

// Générateur de mot de passe sécurisé et temporaire conforme aux spécifications
export function generateStrongPassword(): string {
  const length = 14;
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const specials = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

  // Garantir au moins un caractère de chaque type
  let password = "";
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += specials[Math.floor(Math.random() * specials.length)];

  const allChars = uppercase + lowercase + digits + specials;
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Mélanger le mot de passe de façon non prévisible
  return password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
}

export const authService = {
  /**
   * Identifie l'adresse e-mail correspondante à partir de l'identifiant fourni
   * (e-mail, téléphone ou numéro de patient / dossier)
   */
  async resolveEmail(identifier: string): Promise<string> {
    const cleanId = identifier.trim();

    if (!isAppwriteConfigured) {
      throw new Error(
        "Appwrite n'est pas configuré. Veuillez vérifier vos variables d'environnement."
      );
    }

    // 1. C'est déjà une adresse e-mail
    if (cleanId.includes("@")) {
      return cleanId;
    }

    // 2. Recherche par numéro de patient / dossier (ex: PAT-xxx)
    if (cleanId.toUpperCase().startsWith("PAT-") || cleanId.length < 8) {
      try {
        const patientsRes = await databases.listDocuments(APPWRITE_DB_ID, "patients", [
          Query.equal("dossierNumber", cleanId),
        ]);

        if (patientsRes.documents.length > 0) {
          const patientDoc = patientsRes.documents[0];
          if (patientDoc.user && patientDoc.user.email) {
            return patientDoc.user.email;
          }
        }
      } catch (e) {
        console.warn("Échec de la recherche par dossierNumber dans la collection patients:", e);
      }
    }

    // 3. Recherche par numéro de téléphone dans la collection users
    try {
      const usersRes = await databases.listDocuments(APPWRITE_DB_ID, "users", [
        Query.equal("phone", cleanId),
      ]);

      if (usersRes.documents.length > 0) {
        return usersRes.documents[0].email;
      }
    } catch (e) {
      console.warn("Échec de la recherche par téléphone dans la collection users:", e);
    }

    // Si on n'a rien trouvé, on tente de l'utiliser comme email direct
    return cleanId;
  },

  /**
   * Connexion de l'utilisateur
   */
  async login(identifier: string, password: string): Promise<AppwriteUser> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(
        errData.error || "Identifiants de connexion incorrects ou compte inexistant."
      );
    }

    const data = await response.json();

    // Si c'est une connexion réelle d'Appwrite, on tente de créer également la session côté client
    // afin de conserver la session s'ils n'ont pas de blocage CORS, mais on ne bloque pas si ça échoue.
    if (isAppwriteConfigured && !data.simulated) {
      try {
        const email = await this.resolveEmail(identifier).catch(() => identifier);
        await account.createEmailPasswordSession(email, password);
      } catch (clientSessionErr) {
        console.warn(
          "⚠️ Session client non établie (CORS), utilisation de l'authentification serveur validée.",
          clientSessionErr
        );
      }
    }

    return data.user;
  },

  /**
   * Récupérer l'utilisateur actuellement connecté
   */
  async getCurrentUser(): Promise<AppwriteUser> {
    if (!isAppwriteConfigured) {
      throw new Error("Appwrite non configuré.");
    }

    const authAccount = await account.get();

    // Charger les préférences de l'utilisateur (pour le flag de réinitialisation du mot de passe)
    const prefs = await account.getPrefs();
    const mustChangePassword = !!prefs.mustChangePassword;

    // Chercher le document correspondant dans la collection "users"
    try {
      const usersRes = await databases.listDocuments(APPWRITE_DB_ID, "users", [
        Query.equal("email", authAccount.email),
      ]);

      if (usersRes.documents.length === 0) {
        throw new Error("Aucun profil utilisateur trouvé dans la base de données.");
      }

      const userDoc = usersRes.documents[0];

      // Si c'est un patient, on récupère aussi son numéro de dossier
      let dossierNumber = undefined;
      if (userDoc.role === UserRole.PATIENT) {
        try {
          const patientsRes = await databases.listDocuments(APPWRITE_DB_ID, "patients", [
            Query.equal("user", userDoc.$id),
          ]);
          if (patientsRes.documents.length > 0) {
            dossierNumber = patientsRes.documents[0].dossierNumber;
          }
        } catch (patErr) {
          console.warn("Impossible de récupérer le dossier du patient:", patErr);
        }
      }

      return {
        id: userDoc.$id,
        fullName: userDoc.fullName,
        email: userDoc.email,
        phone: userDoc.phone,
        role: userDoc.role as UserRole,
        status: userDoc.status,
        mustChangePassword,
        dossierNumber,
      };
    } catch (dbErr) {
      // Profil absent de la bdd, on retourne un profil par défaut basé sur l'auth
      return {
        id: authAccount.$id,
        fullName: authAccount.name,
        email: authAccount.email,
        phone: authAccount.phone,
        role: UserRole.PATIENT,
        status: "actif",
        mustChangePassword,
      };
    }
  },

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    if (isAppwriteConfigured) {
      try {
        await account.deleteSession("current");
      } catch (err) {
        console.warn("Déconnexion client ignorée car déjà déconnecté ou CORS bloquant.");
      }
    }
  },

  /**
   * Inscription d'un nouveau patient (publique)
   */
  async registerPatient(data: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    password?: string;
  }): Promise<AppwriteUser> {
    const response = await fetch("/api/auth/register-patient", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(
        errData.error || "Une erreur est survenue lors de la création de votre compte."
      );
    }

    const resData = await response.json();

    // Établir la session client si un mot de passe a été défini ou généré et si pas d'erreur de CORS
    if (isAppwriteConfigured && !resData.simulated) {
      try {
        const passToUse = data.password || resData.temporaryPassword;
        if (passToUse) {
          await account.createEmailPasswordSession(data.email, passToUse);
        }
      } catch (clientSessionErr) {
        console.warn(
          "⚠️ Session d'inscription client non établie en direct (CORS), utilisation du compte authentifié serveur.",
          clientSessionErr
        );
      }
    }

    return resData.user;
  },

  /**
   * Changement de mot de passe obligatoire lors de la première connexion
   */
  async updatePassword(password: string, userId?: string): Promise<void> {
    if (!isAppwriteConfigured) return;

    // Si on a un userId, on passe par l'API serveur pour contourner d'éventuels soucis CORS client
    if (userId) {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Échec de la mise à jour du mot de passe sur le serveur.");
      }
      return;
    }

    // Sinon fallback sur le SDK client (si session active valide)
    try {
      await account.updatePassword(password);
      await account.updatePrefs({ mustChangePassword: false });
    } catch (err: any) {
      // Si échec client (CORS ou autre), on tente de récupérer le user courant pour appeler le serveur
      try {
        const currentUser = await account.get();
        const response = await fetch("/api/auth/update-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.$id, password }),
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error);
        }
      } catch (innerErr) {
        throw new Error(err.message || "Échec de la mise à jour du mot de passe.");
      }
    }
  },

  /**
   * Actions d'administration du personnel via le serveur Node.js sécurisé
   */
  async createStaffAccount(staffData: {
    fullName: string;
    email: string;
    phone: string;
    role: UserRole;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    password?: string;
  }): Promise<any> {
    const response = await fetch("/api/staff/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(staffData),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Échec de la création du compte personnel.");
    }
    return await response.json();
  },

  async updateStaffAccount(staffId: string, updates: any): Promise<any> {
    const response = await fetch(`/api/staff/update/${staffId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Échec de la modification du compte.");
    }
    return await response.json();
  },

  async deleteStaffAccount(staffId: string): Promise<any> {
    const response = await fetch(`/api/staff/delete/${staffId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Échec de la suppression du compte.");
    }
    return await response.json();
  },

  /**
   * Réinitialisation de mot de passe sécurisée (Appwrite Recovery)
   */
  async resetPassword(email: string): Promise<void> {
    if (!isAppwriteConfigured) {
      // Simulation pour le mode démo hors-ligne
      console.log(`[Simulation] Demande de récupération de mot de passe reçue pour : ${email}`);
      return;
    }

    const redirectUrl = `${window.location.origin}/`;
    try {
      await account.createRecovery(email, redirectUrl);
    } catch (err: any) {
      console.error("Appwrite recovery error:", err);
      throw new Error(err.message || "Échec de l'envoi du lien de récupération.");
    }
  },
};
