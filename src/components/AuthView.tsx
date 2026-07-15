import React, { useState } from "react";
import { authService, AppwriteUser, generateStrongPassword } from "../services/auth";
import { isAppwriteConfigured } from "../lib/appwrite";
import { UserRole } from "../types";
import {
  ShieldCheck,
  Mail,
  Lock,
  Phone,
  User,
  Calendar,
  MapPin,
  Eye,
  EyeOff,
  Key,
  ChevronLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Logo from "./Logo";
import { motion, AnimatePresence } from "motion/react";

interface AuthViewProps {
  onLoginSuccess: (user: AppwriteUser) => void;
}

type AuthScreen = "landing" | "login" | "register" | "must_change_password" | "forgot_password";

export default function AuthView({ onLoginSuccess }: AuthViewProps) {
  const [screen, setScreen] = useState<AuthScreen>("landing");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [appwriteCorsError, setAppwriteCorsError] = useState<boolean>(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState<string>("");
  const [resetSent, setResetSent] = useState<boolean>(false);

  // States pour connexion
  const [loginId, setLoginId] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");

  // States pour inscription patient
  const [regFullName, setRegFullName] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPhone, setRegPhone] = useState<string>("");
  const [regBirthDate, setRegBirthDate] = useState<string>("");
  const [regGender, setRegGender] = useState<string>("M");
  const [regAddress, setRegAddress] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");
  const [useGeneratedPassword, setUseGeneratedPassword] = useState<boolean>(true);
  const [generatedPass, setGeneratedPass] = useState<string>("");

  // States pour changement obligatoire de mot de passe
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [tempUser, setTempUser] = useState<AppwriteUser | null>(null);

  // Générer un mot de passe fort si demandé
  const handleGeneratePassword = () => {
    const pwd = generateStrongPassword();
    setGeneratedPass(pwd);
    setRegPassword(pwd);
  };

  const handleBypassDemo = (role: UserRole = UserRole.PATIENT) => {
    let simulatedName = regFullName || "Patient de Démo";
    if (role === UserRole.ADMIN) simulatedName = "Directeur Administratif";
    else if (role === UserRole.MEDECIN) simulatedName = "Dr. Koné Mamadou";
    else if (role === UserRole.ACCUEIL) simulatedName = "Secrétaire d'Accueil";
    else if (role === UserRole.PHARMACIE) simulatedName = "Responsable Pharmacie";
    else if (role === UserRole.COMPTABLE) simulatedName = "Responsable Comptable";
    else if (role === UserRole.LABORATOIRE) simulatedName = "Technicien Labo";
    else if (role === UserRole.DIRECTION) simulatedName = "Directeur Général";

    const simulatedUser: AppwriteUser = {
      id: "SIM-USER-123",
      fullName: simulatedName,
      email: regEmail || loginId || "demo@santeplus.ci",
      phone: regPhone || "+225 0707070707",
      role: role,
      status: "actif",
      dossierNumber: "PAT-" + Math.floor(100000 + Math.random() * 900000),
    };
    onLoginSuccess(simulatedUser);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId || !loginPassword) {
      setError("Veuillez saisir vos identifiants.");
      return;
    }

    setLoading(true);
    setError(null);
    setAppwriteCorsError(false);

    try {
      if (!isAppwriteConfigured) {
        // En l'absence de config réelle d'Appwrite, simulation pour la démo
        console.warn("Utilisation de la connexion simulée locale.");
        let simulatedRole = UserRole.PATIENT;
        let simulatedName = "Patient de Démo";

        if (loginId === "admin" || loginId.includes("admin")) {
          simulatedRole = UserRole.ADMIN;
          simulatedName = "Directeur Administratif";
        } else if (loginId === "directeur" || loginId.includes("dir")) {
          simulatedRole = UserRole.DIRECTION;
          simulatedName = "Directeur Général";
        } else if (loginId === "medecin" || loginId.includes("dr")) {
          simulatedRole = UserRole.MEDECIN;
          simulatedName = "Dr. Koné Mamadou";
        } else if (loginId === "secretaire" || loginId.includes("sec")) {
          simulatedRole = UserRole.ACCUEIL;
          simulatedName = "Secrétaire d'Accueil";
        } else if (loginId === "pharmacien" || loginId.includes("phar")) {
          simulatedRole = UserRole.PHARMACIE;
          simulatedName = "Responsable Pharmacie";
        } else if (loginId === "comptable" || loginId.includes("comp")) {
          simulatedRole = UserRole.COMPTABLE;
          simulatedName = "Responsable Comptable";
        } else if (loginId === "labo" || loginId.includes("lab")) {
          simulatedRole = UserRole.LABORATOIRE;
          simulatedName = "Technicien Labo";
        }

        const simulatedUser: AppwriteUser = {
          id: "SIM-USER-123",
          fullName: simulatedName,
          email: loginId.includes("@") ? loginId : "demo@santeplus.ci",
          phone: "+225 0707070707",
          role: simulatedRole,
          status: "actif",
        };

        onLoginSuccess(simulatedUser);
        return;
      }

      // Vraie connexion avec Appwrite
      const user = await authService.login(loginId, loginPassword);

      if (user.status === "inactif") {
        throw new Error("Votre compte a été désactivé par l'administration.");
      }

      // Vérifier si un changement de mot de passe est exigé
      if (user.mustChangePassword) {
        setTempUser(user);
        setScreen("must_change_password");
        setLoading(false);
        return;
      }

      onLoginSuccess(user);
    } catch (err: any) {
      console.error("Login error:", err);
      const isNetwork =
        err.message &&
        (err.message.includes("fetch") ||
          err.message.toLowerCase().includes("network") ||
          err.message.toLowerCase().includes("failed to fetch") ||
          err.name === "TypeError");
      if (isNetwork) {
        setAppwriteCorsError(true);
        setError(
          "Impossible de joindre le serveur d'authentification Appwrite (Erreur de réseau / CORS)."
        );
      } else {
        setError(err.message || "Identifiants invalides ou erreur de connexion.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regEmail || !regPhone) {
      setError("Les champs Nom, Email et Téléphone sont obligatoires.");
      return;
    }

    setLoading(true);
    setError(null);
    setAppwriteCorsError(false);

    const targetPassword = useGeneratedPassword ? generatedPass : regPassword;

    if (!targetPassword || targetPassword.length < 12) {
      setError("Le mot de passe doit comporter au moins 12 caractères.");
      setLoading(false);
      return;
    }

    try {
      if (!isAppwriteConfigured) {
        // Mode simulation d'inscription si Appwrite n'est pas configuré
        const simulatedUser: AppwriteUser = {
          id: "SIM-PAT-" + Math.floor(100 + Math.random() * 900),
          fullName: regFullName,
          email: regEmail,
          phone: regPhone,
          role: UserRole.PATIENT,
          status: "actif",
          dossierNumber: "PAT-" + Math.floor(100000 + Math.random() * 900000),
        };
        alert(
          `Compte Patient créé (Simulation)\nNuméro de dossier attribué : ${simulatedUser.dossierNumber}`
        );
        onLoginSuccess(simulatedUser);
        return;
      }

      const user = await authService.registerPatient({
        fullName: regFullName,
        email: regEmail,
        phone: regPhone,
        dateOfBirth: regBirthDate,
        gender: regGender,
        address: regAddress,
        password: useGeneratedPassword ? undefined : regPassword,
      });

      if (user.mustChangePassword) {
        // Si mot de passe temporaire fort généré, on l'affiche d'abord
        setTempUser(user);
        setScreen("must_change_password");
      } else {
        onLoginSuccess(user);
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      const isNetwork =
        err.message &&
        (err.message.includes("fetch") ||
          err.message.toLowerCase().includes("network") ||
          err.message.toLowerCase().includes("failed to fetch") ||
          err.name === "TypeError");
      if (isNetwork) {
        setAppwriteCorsError(true);
        setError("Impossible de s'inscrire (Erreur de réseau / CORS avec Appwrite).");
      } else {
        setError(err.message || "Une erreur est survenue lors de la création de votre compte.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMustChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    // Validation de la robustesse
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+~`|}{[\]:;?><,./-]).{12,}$/;
    if (!pwdRegex.test(newPassword)) {
      setError(
        "Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial."
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isAppwriteConfigured) {
        await authService.updatePassword(newPassword, tempUser?.id);
      }

      if (tempUser) {
        onLoginSuccess({
          ...tempUser,
          mustChangePassword: false,
        });
      }
    } catch (err: any) {
      console.error("Password update error:", err);
      setError(err.message || "Impossible de mettre à jour le mot de passe.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError("Veuillez saisir votre adresse e-mail.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authService.resetPassword(forgotEmail);
      setResetSent(true);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err.message || "Impossible d'initier la procédure de récupération.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Decorative vector assets */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-100 p-6 sm:p-8 relative z-10">
        {/* Status indicator for Appwrite config status */}
        {!isAppwriteConfigured && (
          <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-700 font-bold flex items-center gap-1.5 leading-snug">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>
              Mode Démo actif (Appwrite non connecté dans .env). Utilisez des identifiants factices
              pour naviguer.
            </span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* 1. LANDING SCREEN */}
          {screen === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="text-center space-y-8"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center shadow-lg border border-emerald-100">
                  <Logo size={42} />
                </div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                  Clinique Santé Plus
                </h1>
                <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">
                  Portail de soins sécurisé
                </p>
              </div>

              <div className="space-y-3.5">
                <button
                  onClick={() => setScreen("login")}
                  className="w-full py-3 bg-[#065f46] hover:bg-[#047857] text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-emerald-900/10 hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Se connecter</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setScreen("register");
                    handleGeneratePassword();
                  }}
                  className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Nouveau patient – Créer un compte
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Sécurisé de bout en bout par Appwrite</span>
              </div>
            </motion.div>
          )}

          {/* 2. LOGIN SCREEN */}
          {screen === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <button
                onClick={() => {
                  setScreen("landing");
                  setError(null);
                }}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-bold transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Retour</span>
              </button>

              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                  Bienvenue à Santé Plus
                </h2>
                <p className="text-xs text-slate-400">
                  Connectez-vous pour accéder à votre espace de travail ou médical.
                </p>
              </div>

              {error && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>

                  {appwriteCorsError && (
                    <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-xl space-y-3 text-xs text-amber-900 leading-relaxed shadow-sm">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-800 font-bold block mb-1">
                            Configuration de domaine manquante (CORS)
                          </strong>
                          <span>
                            Appwrite requiert que le domaine actuel de l'application soit enregistré
                            comme plateforme autorisée.
                          </span>
                        </div>
                      </div>
                      <div className="bg-white/90 border border-amber-100 p-3 rounded-lg space-y-1.5 text-[11px] text-slate-700 font-medium">
                        <span className="font-bold text-slate-800 block">
                          Pour configurer cela en 1 minute :
                        </span>
                        <ol className="list-decimal pl-4 space-y-1">
                          <li>
                            Allez sur la console{" "}
                            <strong className="text-emerald-700">Appwrite</strong>.
                          </li>
                          <li>Sélectionnez votre projet.</li>
                          <li>
                            Allez dans <strong className="text-slate-800">Paramètres</strong> &gt;{" "}
                            <strong className="text-slate-800">Plateformes</strong>.
                          </li>
                          <li>
                            Ajoutez une plateforme{" "}
                            <strong className="text-emerald-700">Application Web (Web App)</strong>.
                          </li>
                          <li>
                            Indiquez ce nom d'hôte :{" "}
                            <code className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-red-600 font-mono">
                              {window.location.hostname}
                            </code>
                          </li>
                        </ol>
                      </div>
                      <div className="pt-2 border-t border-amber-200/60 space-y-2">
                        <p className="text-[10px] text-amber-700 font-bold">
                          Sinon, bypasser et continuer d'explorer en un clic :
                        </p>
                        <button
                          type="button"
                          onClick={() => handleBypassDemo(UserRole.PATIENT)}
                          className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Accéder en Mode Démo (Patient)</span>
                        </button>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleBypassDemo(UserRole.ADMIN)}
                            className="py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded text-[10px] transition-all cursor-pointer text-center"
                          >
                            Rôle Directeur
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBypassDemo(UserRole.MEDECIN)}
                            className="py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded text-[10px] transition-all cursor-pointer text-center"
                          >
                            Rôle Médecin
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Identifiant
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="E-mail, N° de téléphone ou N° Dossier"
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium text-slate-800"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 leading-normal block">
                    Exemples de démo locale :{" "}
                    <strong className="text-slate-600">
                      admin, medecin, secretaire, pharmacien, comptable
                    </strong>
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Mot de passe
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setScreen("forgot_password");
                        setError(null);
                      }}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer transition-colors"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Saisissez votre mot de passe"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-11 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 mt-2 bg-[#065f46] hover:bg-[#047857] text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authentification...</span>
                    </>
                  ) : (
                    <span>Se connecter</span>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* 3. REGISTER SCREEN */}
          {screen === "register" && (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 max-h-[85vh] overflow-y-auto pr-1"
            >
              <button
                onClick={() => {
                  setScreen("landing");
                  setError(null);
                }}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-bold transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Retour</span>
              </button>

              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                  Création de compte Patient
                </h2>
                <p className="text-xs text-slate-400">
                  Remplissez ces informations pour créer votre dossier médical numérique.
                </p>
              </div>

              {error && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>

                  {appwriteCorsError && (
                    <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-xl space-y-3 text-xs text-amber-900 leading-relaxed shadow-sm">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-800 font-bold block mb-1">
                            Configuration de domaine manquante (CORS)
                          </strong>
                          <span>
                            Appwrite requiert que le domaine actuel de l'application soit enregistré
                            comme plateforme autorisée.
                          </span>
                        </div>
                      </div>
                      <div className="bg-white/90 border border-amber-100 p-3 rounded-lg space-y-1.5 text-[11px] text-slate-700 font-medium">
                        <span className="font-bold text-slate-800 block">
                          Pour configurer cela en 1 minute :
                        </span>
                        <ol className="list-decimal pl-4 space-y-1">
                          <li>
                            Allez sur la console{" "}
                            <strong className="text-emerald-700">Appwrite</strong>.
                          </li>
                          <li>Sélectionnez votre projet.</li>
                          <li>
                            Allez dans <strong className="text-slate-800">Paramètres</strong> &gt;{" "}
                            <strong className="text-slate-800">Plateformes</strong>.
                          </li>
                          <li>
                            Ajoutez une plateforme{" "}
                            <strong className="text-emerald-700">Application Web (Web App)</strong>.
                          </li>
                          <li>
                            Indiquez ce nom d'hôte :{" "}
                            <code className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-red-600 font-mono">
                              {window.location.hostname}
                            </code>
                          </li>
                        </ol>
                      </div>
                      <div className="pt-2 border-t border-amber-200/60 space-y-2">
                        <p className="text-[10px] text-amber-700 font-bold">
                          Sinon, bypasser et continuer d'explorer en un clic :
                        </p>
                        <button
                          type="button"
                          onClick={() => handleBypassDemo(UserRole.PATIENT)}
                          className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Accéder en Mode Démo (Patient)</span>
                        </button>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleBypassDemo(UserRole.ADMIN)}
                            className="py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded text-[10px] transition-all cursor-pointer text-center"
                          >
                            Rôle Directeur
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBypassDemo(UserRole.MEDECIN)}
                            className="py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded text-[10px] transition-all cursor-pointer text-center"
                          >
                            Rôle Médecin
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleRegisterPatient} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Nom & Prénoms complets
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Kouassi Koffi Jean"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="Ex: jean.kouassi@email.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Numéro de téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="Ex: +225 0707070707"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Date de naissance
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <input
                        type="date"
                        required
                        value={regBirthDate}
                        onChange={(e) => setRegBirthDate(e.target.value)}
                        className="w-full pl-9 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Genre
                    </label>
                    <select
                      value={regGender}
                      onChange={(e) => setRegGender(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium text-slate-800"
                    >
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Adresse d'habitation
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-2.5 w-4.5 h-4.5 text-slate-400" />
                    <textarea
                      placeholder="Ex: Cocody, Cité des Arts, Abidjan"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      rows={2}
                      className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium text-slate-800 resize-none"
                    />
                  </div>
                </div>

                {/* Sécurité : Options de mot de passe */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="chk-gen-password"
                      checked={useGeneratedPassword}
                      onChange={(e) => {
                        setUseGeneratedPassword(e.target.checked);
                        if (e.target.checked) {
                          handleGeneratePassword();
                        } else {
                          setRegPassword("");
                        }
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label
                      htmlFor="chk-gen-password"
                      className="text-[11px] font-bold text-slate-600 cursor-pointer select-none"
                    >
                      Générer un mot de passe fort temporaire
                    </label>
                  </div>

                  {useGeneratedPassword ? (
                    <div className="space-y-1.5 pt-1 border-t border-slate-200/50">
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Mot de passe sécurisé généré automatiquement :
                      </span>
                      <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-lg font-mono text-xs text-emerald-800 text-center select-all select-all font-bold tracking-wider">
                        {generatedPass}
                      </div>
                      <span className="text-[9px] text-emerald-700/80 block leading-snug font-medium">
                        🔑 Vous devrez impérativement modifier ce mot de passe temporaire lors de
                        votre première connexion.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 pt-1 border-t border-slate-200/50">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Saisir votre mot de passe
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Min. 12 caractères sécurisés"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 transition-all font-medium text-slate-800"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#065f46] hover:bg-[#047857] text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Création du compte...</span>
                    </>
                  ) : (
                    <span>Valider l'inscription</span>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* 4. MUST CHANGE PASSWORD SCREEN */}
          {screen === "must_change_password" && (
            <motion.div
              key="must_change_password"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center border border-amber-100">
                  <Key className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                  Changement de mot de passe requis
                </h2>
                <p className="text-xs text-slate-400 max-w-sm">
                  Pour des raisons de sécurité, vous devez remplacer votre mot de passe temporaire
                  par un nouveau mot de passe fort personnel.
                </p>
              </div>

              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleMustChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Au moins 12 caractères forts"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-11 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-500 transition-all font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Saisissez à nouveau"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-11 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-500 transition-all font-medium text-slate-800"
                    />
                  </div>
                </div>

                {/* Exigences de sécurité */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5 text-[10px] text-slate-500 font-medium leading-relaxed">
                  <span className="font-bold text-slate-600 block mb-0.5">
                    Le mot de passe doit respecter :
                  </span>
                  <p>✔ Au moins 12 caractères de longueur</p>
                  <p>✔ Au moins une lettre majuscule & une lettre minuscule</p>
                  <p>✔ Au moins un chiffre (0-9) & un caractère spécial (ex: @, !, #)</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#065f46] hover:bg-[#047857] text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mise à jour...</span>
                    </>
                  ) : (
                    <span>Mettre à jour et accéder</span>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {screen === "forgot_password" && (
            <motion.div
              key="forgot_password"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <button
                onClick={() => {
                  setScreen("login");
                  setResetSent(false);
                  setError(null);
                }}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-bold transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Retour</span>
              </button>

              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                  Récupération sécurisée
                </h2>
                <p className="text-xs text-slate-400">
                  Saisissez l'e-mail de votre compte pour recevoir un lien de réinitialisation
                  sécurisé.
                </p>
              </div>

              {resetSent ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 leading-relaxed space-y-2">
                  <p className="font-bold text-emerald-900">✓ Lien d'authentification envoyé</p>
                  <p>
                    Un e-mail de réinitialisation sécurisé contenant un jeton d'accès unique
                    temporaire à usage unique a été envoyé à <strong>{forgotEmail}</strong>.
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold">
                    Pour préserver la confidentialité, ce lien expirera automatiquement sous 1
                    heure.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Adresse e-mail du compte
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="Ex: medecin@santeplus.ci"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-emerald-500 transition-all font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-[#065f46] hover:bg-[#047857] text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Envoi en cours...</span>
                      </>
                    ) : (
                      <span>Envoyer le lien de récupération</span>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
