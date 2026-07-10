import React, { useState, useRef } from "react";
import { 
  Download, Upload, RefreshCw, Server, ShieldCheck, Wifi, Trash2, 
  Database, Key, Shield, UserCheck, AlertTriangle, Search, Filter, ShieldAlert
} from "lucide-react";
import { SyncAction, AuditLog } from "../types";

interface SettingsViewProps {
  exportBackup: () => void;
  importBackup: (jsonString: string) => boolean;
  resetDatabase: () => void;
  isOnline: boolean;
  toggleConnection: () => void;
  syncQueue: SyncAction[];
  triggerSync: () => void;
  isSyncing: boolean;
  lastSyncTime: string;
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, "id" | "timestamp">) => void;
}

export default function SettingsView({
  exportBackup,
  importBackup,
  resetDatabase,
  isOnline,
  toggleConnection,
  syncQueue,
  triggerSync,
  isSyncing,
  lastSyncTime,
  auditLogs,
  addAuditLog
}: SettingsViewProps) {
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const [activeTab, setActiveTab] = useState<"infra" | "audit">("infra");
  
  // Audit log filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        const ok = importBackup(result);
        if (ok) {
          setImportStatus("success");
          addAuditLog({
            userEmail: "admin@santeplus.ci",
            userName: "Directeur Administratif",
            userRole: "administrateur",
            action: "Modification importante",
            details: "Restauration complète de la base de données via fichier JSON",
            status: "Succès"
          });
        } else {
          setImportStatus("error");
          addAuditLog({
            userEmail: "admin@santeplus.ci",
            userName: "Directeur Administratif",
            userRole: "administrateur",
            action: "Modification importante",
            details: "Tentative échouée de restauration de la base de données (fichier corrompu)",
            status: "Échec"
          });
        }
      }
    };
    reader.readAsText(file);
  };

  const handleExportClick = () => {
    exportBackup();
    addAuditLog({
      userEmail: "admin@santeplus.ci",
      userName: "Directeur Administratif",
      userRole: "administrateur",
      action: "Modification importante",
      details: "Exportation sécurisée des fiches médicales et administratives de la clinique",
      status: "Succès"
    });
  };

  const handleResetClick = () => {
    resetDatabase();
    addAuditLog({
      userEmail: "admin@santeplus.ci",
      userName: "Directeur Administratif",
      userRole: "administrateur",
      action: "Suppression",
      details: "Réinitialisation complète de la base de données clinique d'usine",
      status: "Succès"
    });
  };

  // Filter logs
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;

    return matchesSearch && matchesAction && matchesStatus;
  });

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case "Connexion": 
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Déconnexion": 
        return "bg-slate-50 text-slate-600 border-slate-200";
      case "Création de compte": 
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "Modification importante": 
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "Suppression": 
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Changement de permissions": 
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Accès refusé": 
        return "bg-amber-50 text-amber-700 border-amber-300";
      default: 
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in" id="settings-view-container">
      
      {/* Left panel: Main Configuration (Infra or Security) */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs lg:col-span-2 overflow-hidden flex flex-col">
        
        {/* Tab Headers */}
        <div className="bg-slate-50 border-b border-slate-100 flex items-center justify-between px-6 pt-3 shrink-0">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab("infra")}
              className={`pb-3 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
                activeTab === "infra" 
                  ? "text-emerald-700 border-emerald-600" 
                  : "text-slate-400 border-transparent hover:text-slate-600"
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <Database className="w-4 h-4" />
                <span>Base de Données</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`pb-3 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
                activeTab === "audit" 
                  ? "text-emerald-700 border-emerald-600" 
                  : "text-slate-400 border-transparent hover:text-slate-600"
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Centre d'Audit & Sécurité</span>
              </span>
            </button>
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded font-black uppercase tracking-wider mb-2.5">
            Sécurité Renforcée
          </span>
        </div>

        {/* Tab Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          
          {activeTab === "infra" ? (
            <div className="space-y-6" id="tab-infra-content">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-800 font-display flex items-center space-x-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>Sauvegarde & Restauration de l'Infrastructure</span>
                </h2>
                <p className="text-[11px] text-slate-500">Gérez le stockage résilient local crypté avec synchronisation Appwrite.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                
                {/* Export Box */}
                <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-lg space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 flex items-center space-x-1">
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>Exporter une sauvegarde</span>
                    </h4>
                    <p className="text-slate-500 leading-relaxed text-[11px]">
                      Générez un fichier de sauvegarde JSON autonome contenant l'ensemble des données de la clinique (fiches patients, historiques médicaux, stocks, factures, plaintes).
                    </p>
                  </div>
                  
                  <button
                    onClick={handleExportClick}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-sm text-center cursor-pointer transition-colors"
                  >
                    Télécharger Sauvegarde (.json)
                  </button>
                </div>

                {/* Import Box */}
                <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-lg space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 flex items-center space-x-1">
                      <Upload className="w-4 h-4 text-emerald-600" />
                      <span>Importer une sauvegarde</span>
                    </h4>
                    <p className="text-slate-500 leading-relaxed text-[11px]">
                      Restaurez l'ensemble des données de la clinique à partir d'un fichier de sauvegarde JSON précédemment téléchargé.
                    </p>
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImportFileChange}
                      accept=".json"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded text-center cursor-pointer transition-colors"
                    >
                      Sélectionner un fichier JSON
                    </button>
                    
                    {importStatus === "success" && (
                      <p className="text-[10px] text-emerald-700 font-bold mt-1.5 text-center">✓ Base de données restaurée avec succès !</p>
                    )}
                    {importStatus === "error" && (
                      <p className="text-[10px] text-red-600 font-bold mt-1.5 text-center">✗ Fichier invalide ou corrompu.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Destructive actions */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-red-700 flex items-center space-x-1">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span>Zone d'Administration Sensible</span>
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    La réinitialisation effacera toutes les fiches, factures et réclamations saisies récemment et rechargera les données fictives d'usine.
                  </p>
                </div>

                <button
                  onClick={handleResetClick}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold rounded text-xs transition-colors cursor-pointer"
                >
                  Réinitialiser la Base de Données
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6" id="tab-audit-content">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-800 font-display flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Journal d'Audit & de Traçabilité Médicale</span>
                  </h2>
                  <p className="text-[11px] text-slate-500">Conforme aux directives de sécurité des données de santé. Visualisez toutes les actions clés du personnel.</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] px-2 py-0.5 bg-slate-100 border border-slate-200 font-mono text-slate-600 rounded">
                    Total: {filteredLogs.length} logs
                  </span>
                </div>
              </div>

              {/* Filter controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher utilisateur, e-mail..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded pl-8 pr-3 py-1.5 text-xs text-slate-700 outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="relative">
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-emerald-500 font-medium appearance-none"
                  >
                    <option value="all">Toutes les actions</option>
                    <option value="Connexion">Connexions</option>
                    <option value="Déconnexion">Déconnexions</option>
                    <option value="Création de compte">Création de compte</option>
                    <option value="Modification importante">Modifications importantes</option>
                    <option value="Suppression">Suppressions</option>
                    <option value="Changement de permissions">Changements de permissions</option>
                    <option value="Accès refusé">Accès refusés</option>
                  </select>
                  <Filter className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-emerald-500 font-medium appearance-none"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="Succès">Succès</option>
                    <option value="Échec">Échecs</option>
                  </select>
                  <Filter className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Audit trail list */}
              <div className="border border-slate-100 rounded-lg overflow-hidden">
                <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100">
                  {filteredLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Aucun journal d'audit ne correspond à vos critères de recherche.
                    </div>
                  ) : (
                    filteredLogs.map((log) => (
                      <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors text-xs space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-700">{log.userName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({log.userRole})</span>
                            <span className="text-[10px] text-slate-400">•</span>
                            <span className="text-[10px] text-slate-400 font-mono">{log.userEmail}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono font-medium">
                            {new Date(log.timestamp).toLocaleString("fr-FR")}
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-slate-600 leading-relaxed font-medium">{log.details}</p>
                          </div>
                          
                          <div className="flex items-center space-x-1.5 shrink-0">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getActionBadgeClass(log.action)}`}>
                              {log.action}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider border ${
                              log.status === "Succès" 
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                                : "bg-red-50 text-red-800 border-red-200 animate-pulse"
                            }`}>
                              {log.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Security Banner Info */}
              <div className="bg-emerald-50/55 border border-emerald-100 p-4 rounded-lg flex items-start space-x-3 text-xs text-emerald-800">
                <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1 leading-relaxed">
                  <p className="font-black text-emerald-900">Réglementation & Protection des Fiches de Soins</p>
                  <p className="text-[11px] text-emerald-700">
                    Ce journal d'audit est à lecture seule pour la direction générale et les administrateurs agréés. Les tentatives d'altération, les élévations de privilèges ou les connexions suspectes génèrent automatiquement des alertes de sécurité prioritaires dans le tableau de bord d'Appwrite.
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Right panel: Connection Sync simulation status & System Security Status */}
      <div className="space-y-6">
        
        {/* Connection status */}
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Server className="w-5 h-5 text-slate-400" />
              <span>Statut Réseau & Cache</span>
            </h3>
            <p className="text-[10px] text-slate-500">Contrôle de la résilience aux pannes Internet.</p>
          </div>

          <div className="space-y-4 text-xs font-medium text-slate-600">
            
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span>État du Réseau :</span>
              <div className="flex items-center space-x-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
                <span className={`font-bold ${isOnline ? "text-emerald-700" : "text-amber-700"}`}>
                  {isOnline ? "Connecté (Stable)" : "Hors-ligne / Instable"}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span>Actions en attente :</span>
              <span className="font-mono font-bold text-slate-800">{syncQueue.length} transactions</span>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span>Dernière synchro réussie :</span>
              <span className="text-slate-500">{lastSyncTime}</span>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={toggleConnection}
                className={`w-full py-2.5 text-white font-bold rounded-lg text-center cursor-pointer transition-all text-xs ${
                  isOnline ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isOnline ? "Passer en mode Hors-ligne" : "Simuler la reconnexion Internet"}
              </button>

              {syncQueue.length > 0 && (
                <button
                  onClick={triggerSync}
                  disabled={!isOnline || isSyncing}
                  className="w-full py-2.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-center flex items-center justify-center space-x-2 disabled:opacity-50 text-xs cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>{isSyncing ? "Synchronisation en cours..." : "Forcer la synchronisation"}</span>
                </button>
              )}
            </div>

            {/* Sync transaction history preview */}
            {syncQueue.length > 0 && (
              <div className="space-y-1.5 pt-4 border-t border-slate-100">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Journal de synchronisation locale :</label>
                <div className="bg-slate-900 text-[10px] text-emerald-400 font-mono p-2.5 rounded max-h-32 overflow-y-auto space-y-1">
                  {syncQueue.map((act) => (
                    <div key={act.id}>
                      {`[${act.timestamp.slice(11, 19)}] ${act.type} ➜ ${act.id}`}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Global Security metrics */}
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldAlert className="w-5 h-5 text-emerald-600 animate-pulse" />
              <span>Diagnostic de Sécurité Globale</span>
            </h3>
            <p className="text-[10px] text-slate-500">Contrôle permanent des protocoles et accès.</p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded">
              <span className="text-slate-500 font-medium">Authentification Appwrite Auth</span>
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase tracking-wide rounded">Actif & Chiffré</span>
            </div>
            
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded">
              <span className="text-slate-500 font-medium">Contrôle RBAC (Rôles)</span>
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase tracking-wide rounded">8/8 Profils Strict</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded">
              <span className="text-slate-500 font-medium">Double Protection Injection</span>
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase tracking-wide rounded">Actif</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded">
              <span className="text-slate-500 font-medium">Anti Brute-Force & Lockout</span>
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase tracking-wide rounded">Actif (5 tentative max)</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
