import { Request, Response, NextFunction } from "express";

/**
 * Middleware de contrôle d'accès basé sur les rôles (RBAC) pour sécuriser l'API Proxy
 * @param allowedRoles Liste des rôles autorisés à accéder à la route
 * @param logAccessDenied Callback optionnel pour journaliser les accès refusés dans la base de données
 */
export function enforceRBAC(
  allowedRoles: string[],
  logAccessDenied?: (
    req: Request,
    userRole: string,
    userEmail: string,
    userName: string
  ) => Promise<void> | void
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req.headers["x-user-role"] as string) || "patient";
    const userEmail = (req.headers["x-user-email"] as string) || "anonyme@santeplus.ci";
    const userName = (req.headers["x-user-name"] as string) || "Utilisateur anonyme";

    if (allowedRoles.includes(userRole)) {
      return next();
    }

    console.warn(
      `⚠️ [Sécurité] Accès refusé pour l'utilisateur ${userEmail} (${userRole}) sur ${req.method} ${req.path}`
    );

    if (logAccessDenied) {
      try {
        await logAccessDenied(req, userRole, userEmail, userName);
      } catch (err) {
        console.error("Échec de la journalisation de l'accès refusé:", err);
      }
    }

    return res.status(403).json({
      error: "Accès refusé. Vous n'avez pas les autorisations nécessaires pour effectuer cette action.",
      rbacError: true,
    });
  };
}
