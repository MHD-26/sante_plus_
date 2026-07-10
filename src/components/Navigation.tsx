import React, { useState } from "react";
import { UserRole } from "../types";
import { 
  Activity, Calendar, Users, Pill, FileText, Frown, Sparkles, Settings, 
  BookOpen, Wifi, WifiOff, RefreshCw, ShieldAlert, ChevronDown, LayoutDashboard, Home, Menu, X, LogOut
} from "lucide-react";
import Logo from "./Logo";

interface NavigationProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  isOnline: boolean;
  toggleConnection: () => void;
  syncQueueLength: number;
  triggerSync: () => void;
  isSyncing: boolean;
  userFullName?: string;
  onLogout?: () => void;
  isRealAuth?: boolean;
}

export default function Navigation({
  currentView,
  setCurrentView,
  currentUserRole,
  setCurrentUserRole,
  isOnline,
  toggleConnection,
  syncQueueLength,
  triggerSync,
  isSyncing,
  userFullName,
  onLogout,
  isRealAuth
}: NavigationProps) {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const principalItems = [
    { id: "accueil", label: "Accueil Clinique", icon: Home, roles: Object.values(UserRole) },
    { id: "dashboard", label: "Tableau de Bord", icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.DIRECTION, UserRole.COMPTABLE] },
    { id: "rendezvous", label: "Rendez-vous & Rappels", icon: Calendar, roles: [UserRole.ADMIN, UserRole.ACCUEIL, UserRole.MEDECIN, UserRole.DIRECTION] },
    { id: "patients", label: "Suivi Patients", icon: Users, roles: [UserRole.ADMIN, UserRole.ACCUEIL, UserRole.MEDECIN, UserRole.DIRECTION] },
  ];

  const operationsItems = [
    { id: "stockbilling", label: "Stocks & Factures", icon: Pill, roles: Object.values(UserRole) },
    { id: "complaints", label: "Plaintes & Satisfaction", icon: Frown, roles: [UserRole.ADMIN, UserRole.DIRECTION, UserRole.ACCUEIL] },
    { id: "assistantia", label: "Assistant IA Clinique", icon: Sparkles, roles: Object.values(UserRole) },
    { id: "procedures", label: "Procédures & Aide", icon: BookOpen, roles: Object.values(UserRole) },
    { id: "settings", label: "Sauvegarde & Paramètres", icon: Settings, roles: [UserRole.ADMIN, UserRole.DIRECTION] },
  ];

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return "bg-red-500/15 text-red-200 border-red-500/30";
      case UserRole.DIRECTION: return "bg-purple-500/15 text-purple-200 border-purple-500/30";
      case UserRole.ACCUEIL: return "bg-blue-500/15 text-blue-200 border-blue-500/30";
      case UserRole.MEDECIN: return "bg-emerald-500/15 text-emerald-200 border-emerald-500/30";
      case UserRole.COMPTABLE: return "bg-amber-500/15 text-amber-200 border-amber-500/30";
      case UserRole.PHARMACIE: return "bg-teal-500/15 text-teal-200 border-teal-500/30";
      case UserRole.LABORATOIRE: return "bg-indigo-500/15 text-indigo-200 border-indigo-500/30";
      case UserRole.PATIENT: return "bg-sky-500/15 text-sky-200 border-sky-500/30";
      default: return "bg-slate-500/15 text-slate-200 border-slate-500/30";
    }
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return "Administrateur";
      case UserRole.DIRECTION: return "Direction Générale";
      case UserRole.ACCUEIL: return "Secrétariat / Accueil";
      case UserRole.MEDECIN: return "Médecin Docteur";
      case UserRole.COMPTABLE: return "Comptabilité";
      case UserRole.PHARMACIE: return "Pharmacien";
      case UserRole.LABORATOIRE: return "Laboratoire";
      case UserRole.PATIENT: return "Patient";
      default: return role;
    }
  };

  const renderNavList = (items: typeof principalItems) => {
    return items.map((item) => {
      const isAllowed = item.roles.includes(currentUserRole);
      if (!isAllowed) return null;

      const Icon = item.icon;
      const isActive = currentView === item.id;

      return (
        <button
          key={item.id}
          onClick={() => {
            setCurrentView(item.id);
            setMobileMenuOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold rounded-lg transition-all text-left cursor-pointer ${
            isActive
              ? "bg-[#047857] text-white border-r-4 border-emerald-400 shadow-sm"
              : "text-emerald-100 hover:bg-[#047857]/60 hover:text-white"
          }`}
          id={`nav-tab-${item.id}`}
        >
          <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-emerald-300"}`} />
          <span>{item.label}</span>
        </button>
      );
    });
  };

  return (
    <>
      {/* MOBILE HEADER (lg:hidden) */}
      <header className="lg:hidden h-16 bg-[#065f46] text-white flex items-center justify-between px-4 sticky top-0 z-50 border-b border-[#047857]" id="mobile-nav-header">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView("accueil")}>
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md">
            <Logo size={28} />
          </div>
          <span className="font-bold text-sm tracking-tight">Santé Plus</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Offline Status */}
          <button 
            onClick={toggleConnection}
            className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
              isOnline ? "bg-emerald-700 text-emerald-100" : "bg-amber-700 text-amber-100"
            }`}
            title="Simuler réseau"
          >
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          </button>

          {/* Quick toggle list button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 hover:bg-[#047857] rounded-lg transition-colors cursor-pointer"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER MENU (lg:hidden) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-[#065f46] z-40 flex flex-col p-4 space-y-4 overflow-y-auto border-t border-[#047857] animate-fade-in" id="mobile-nav-drawer">
          
          {/* Mobile Profile Widget & Logout Button */}
          {userFullName && (
            <div className="bg-[#04402f] p-3 rounded-xl border border-[#047857]/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-700 border border-emerald-500/30 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-inner">
                  {userFullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate leading-tight">{userFullName}</h4>
                  <span className="text-[9px] text-emerald-300 font-medium tracking-wide uppercase mt-0.5 block">
                    {getRoleDisplayName(currentUserRole)}
                  </span>
                </div>
              </div>
              {onLogout && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="px-2.5 py-1 bg-rose-600/25 hover:bg-rose-600/40 text-rose-100 border border-rose-500/30 hover:border-rose-400/40 rounded-md text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3 h-3 text-rose-400" />
                  <span>Quitter</span>
                </button>
              )}
            </div>
          )}

          {/* Role Switcher */}
          <div className="bg-[#054b38] p-3 rounded-lg border border-[#047857] space-y-2">
            <div className="flex justify-between items-center text-xs text-emerald-200">
              <span>Rôle Actif :</span>
              <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${getRoleBadgeClass(currentUserRole)}`}>
                {currentUserRole}
              </span>
            </div>
            
            <select
              value={currentUserRole}
              onChange={(e) => {
                setCurrentUserRole(e.target.value as UserRole);
                setCurrentView("accueil");
                setMobileMenuOpen(false);
              }}
              className="w-full bg-[#065f46] text-white border border-[#047857] rounded px-2 py-1.5 text-xs focus:outline-none"
            >
              {Object.values(UserRole).map((role) => (
                <option key={role} value={role}>{getRoleDisplayName(role)}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Principal</div>
            {renderNavList(principalItems)}
          </div>

          <div className="space-y-1 pt-2">
            <div className="px-2 py-1 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Opérations</div>
            {renderNavList(operationsItems)}
          </div>

          {/* Connection status footer for mobile */}
          <div className="bg-[#054b38] p-3 rounded-lg text-xs text-emerald-100 flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <span>État Réseau :</span>
              <span className="font-bold text-emerald-300">{isOnline ? "Connecté" : "Hors-ligne"}</span>
            </div>
            {syncQueueLength > 0 && (
              <button
                onClick={triggerSync}
                disabled={!isOnline || isSyncing}
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs flex items-center justify-center space-x-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                <span>Synchroniser ({syncQueueLength})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR NAVIGATION (lg:flex, hidden on mobile/tablet) */}
      <aside className="hidden lg:flex w-64 bg-[#065f46] flex-col h-screen sticky top-0 shrink-0 border-r border-[#047857]" id="desktop-sidebar">
        
        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3 border-b border-[#047857] shrink-0">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md">
            <Logo size={36} />
          </div>
          <div>
            <span className="text-white font-black text-base tracking-tight leading-none block">Santé Plus</span>
            <span className="text-[10px] text-emerald-300 font-mono tracking-wider block mt-0.5">PORTAIL CLINIQUE</span>
          </div>
        </div>

        {/* Dense Navigation Lists */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {/* Principal Category */}
          <div className="space-y-1">
            <div className="px-3 mb-1.5 text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider">Principal</div>
            {renderNavList(principalItems)}
          </div>

          {/* Operations Category */}
          <div className="space-y-1">
            <div className="px-3 mb-1.5 text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider">Opérations</div>
            {renderNavList(operationsItems)}
          </div>
        </div>

        {/* Bottom Profile, Network Sync, and Role Switcher Panel */}
        <div className="p-4 bg-[#054b38] border-t border-[#047857] shrink-0 space-y-3">
          
          {/* Real User Profile Widget & Logout Button */}
          {userFullName ? (
            <div className="bg-[#04402f] p-3 rounded-xl border border-[#047857]/50 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-700 border border-emerald-500/30 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-inner">
                  {userFullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate leading-tight">{userFullName}</h4>
                  <span className="text-[9px] text-emerald-300 font-medium tracking-wide uppercase mt-0.5 block">
                    {getRoleDisplayName(currentUserRole)}
                  </span>
                </div>
              </div>
              
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full py-1.5 bg-[#d97706]/20 hover:bg-[#d97706]/45 text-amber-100 border border-amber-600/30 hover:border-amber-500/40 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-amber-400 rotate-180" />
                  <span>Se déconnecter</span>
                </button>
              )}
            </div>
          ) : (
            /* Role selector dropdown wrapper (uniquement pour le mode dev non authentifié) */
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 bg-[#065f46] border border-[#047857] rounded hover:bg-[#047857] transition-all text-[11px] text-white cursor-pointer"
                id="btn-role-switcher"
              >
                <span className="truncate text-left text-emerald-200">Session : <strong className="text-white">{currentUserRole}</strong></span>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-300 shrink-0 ml-1" />
              </button>

              {showRoleDropdown && (
                <div className="absolute left-0 bottom-full mb-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-slate-800">
                  <div className="px-2.5 py-1 border-b border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Changer de Session :
                  </div>
                  {Object.values(UserRole).map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        setCurrentUserRole(role);
                        setShowRoleDropdown(false);
                        setCurrentView("accueil");
                      }}
                      className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-emerald-50 hover:text-emerald-900 transition-colors cursor-pointer ${
                        currentUserRole === role ? "bg-emerald-50 font-bold text-emerald-700" : ""
                      }`}
                    >
                      {getRoleDisplayName(role)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* User profile identifier & Network state simulation */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-pulse"}`}></div>
              <span className="text-[11px] text-emerald-200 truncate">
                {isOnline ? "En ligne" : "Hors-ligne"}
              </span>
            </div>
            
            <button
              onClick={toggleConnection}
              className="text-[9px] px-1.5 py-0.5 bg-[#065f46] text-emerald-200 rounded border border-[#047857] hover:text-white hover:bg-[#047857] transition-colors cursor-pointer"
              title="Simuler instabilité de connexion"
            >
              Réseau
            </button>
          </div>

          {/* Sync actions inline inside sidebar */}
          {syncQueueLength > 0 && (
            <div className="bg-[#065f46]/60 p-2 rounded border border-[#047857] flex items-center justify-between text-[10px]">
              <span className="text-emerald-200 font-mono">{syncQueueLength} txn en cache</span>
              <button
                onClick={triggerSync}
                disabled={!isOnline || isSyncing}
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                title="Synchroniser"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                <span>Synchro</span>
              </button>
            </div>
          )}
        </div>

      </aside>
    </>
  );
}
