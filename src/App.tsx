import React, { useEffect, useState } from "react";
import { useAppState } from "./useAppState";
import { UserRole } from "./types";
import { authService, AppwriteUser } from "./services/auth";
import { LogOut } from "lucide-react";

// Component Views
import Navigation from "./components/Navigation";
import WelcomeView from "./components/WelcomeView";
import DashboardView from "./components/DashboardView";
import AppointmentsView from "./components/AppointmentsView";
import PatientsView from "./components/PatientsView";
import StockBillingView from "./components/StockBillingView";
import ComplaintsView from "./components/ComplaintsView";
import AssistantIAView from "./components/AssistantIAView";
import ProceduresView from "./components/ProceduresView";
import SettingsView from "./components/SettingsView";
import AuthView from "./components/AuthView";
import LaboratoryView from "./components/LaboratoryView";

export default function App() {
  const [authenticatedUser, setAuthenticatedUser] = useState<AppwriteUser | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [autoOpenAppointmentForm, setAutoOpenAppointmentForm] = useState<boolean>(false);
  const [preselectedPatientId, setPreselectedPatientId] = useState<string | null>(null);

  const {
    currentUserRole,
    setCurrentUserRole,
    currentView,
    setCurrentView,
    getHeaders,
    patients,
    appointments,
    inventory,
    invoices,
    complaints,
    consultations,
    prescriptions,
    labRequests,
    auditLogs,
    addAuditLog,
    isOnline,
    toggleConnection,
    syncQueue,
    isSyncing,
    triggerSync,
    lastSyncTime,
    resetDatabase,
    addPatient,
    updatePatient,
    addMedicalHistoryEntry,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    updateStock,
    addMedication,
    addInvoice,
    markInvoiceAsPaid,
    addComplaint,
    resolveComplaint,
    updateComplaintStatus,
    addConsultation,
    addPrescription,
    updatePrescriptionStatus,
    addLabRequest,
    updateLabRequest,
    labReagents,
    setLabReagents,
    exportBackup,
    importBackup,
  } = useAppState(authenticatedUser);

  // Tentative de reconnexion automatique au démarrage
  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await authService.getCurrentUser();
        setAuthenticatedUser(user);
        setCurrentUserRole(user.role);
      } catch (err) {
        console.log("Aucune session active d'authentification détectée.");
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();
  }, [setCurrentUserRole]);

  // Verrouiller le rôle de l'utilisateur authentifié pour empêcher tout changement non autorisé
  useEffect(() => {
    if (authenticatedUser && currentUserRole !== authenticatedUser.role) {
      setCurrentUserRole(authenticatedUser.role);
    }
  }, [authenticatedUser, currentUserRole, setCurrentUserRole]);

  // Route protection / fallback in case of role switching
  useEffect(() => {
    // Si l'utilisateur n'est pas encore vérifié, ne rien faire
    if (authChecking || !authenticatedUser) return;

    // List views that are restricted
    const viewRoles: { [key: string]: UserRole[] } = {
      dashboard: [UserRole.ADMIN, UserRole.DIRECTION, UserRole.COMPTABLE, UserRole.ACCUEIL],
      rendezvous: [UserRole.ADMIN, UserRole.ACCUEIL, UserRole.MEDECIN, UserRole.DIRECTION],
      patients: [UserRole.ADMIN, UserRole.ACCUEIL, UserRole.MEDECIN, UserRole.DIRECTION],
      laboratory: [UserRole.ADMIN, UserRole.DIRECTION, UserRole.MEDECIN, UserRole.LABORATOIRE],
      stockbilling: Object.values(UserRole),
      complaints: [UserRole.ADMIN, UserRole.DIRECTION, UserRole.ACCUEIL],
      settings: [UserRole.ADMIN, UserRole.DIRECTION],
    };

    if (viewRoles[currentView] && !viewRoles[currentView].includes(currentUserRole)) {
      // Direct unauthorized roles back to landing
      setCurrentView("accueil");
    }
  }, [currentUserRole, currentView, authenticatedUser, authChecking, setCurrentView]);

  const handleLoginSuccess = (user: AppwriteUser) => {
    setAuthenticatedUser(user);
    setCurrentUserRole(user.role);
    setCurrentView("accueil");
    addAuditLog({
      userEmail: user.email,
      userName: user.fullName || "Utilisateur",
      userRole: user.role,
      action: "Connexion",
      details: "Connexion réussie au portail de l'hôpital",
      status: "Succès",
    });
  };

  const handleLogout = async () => {
    if (authenticatedUser) {
      addAuditLog({
        userEmail: authenticatedUser.email,
        userName: authenticatedUser.fullName || "Utilisateur",
        userRole: authenticatedUser.role,
        action: "Déconnexion",
        details: "Déconnexion manuelle de la session de l'utilisateur",
        status: "Succès",
      });
    }
    try {
      await authService.logout();
    } catch (e) {
      console.error("Erreur déconnexion:", e);
    }
    setAuthenticatedUser(null);
    setCurrentView("accueil");
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-slate-600">Chargement de l'espace Santé Plus...</p>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, afficher le portail d'authentification obligatoire
  if (!authenticatedUser) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  // Render proper view based on currentView
  const renderCurrentView = () => {
    switch (currentView) {
      case "accueil":
        return (
          <WelcomeView
            currentUserRole={currentUserRole}
            setCurrentView={setCurrentView}
            authenticatedUser={authenticatedUser}
            patients={patients}
            appointments={appointments}
            invoices={invoices}
            labRequests={labRequests}
            addComplaint={addComplaint}
            addAppointment={addAppointment}
            updateAppointment={updateAppointment}
            setAutoOpenAppointmentForm={setAutoOpenAppointmentForm}
          />
        );
      case "dashboard":
        return (
          <DashboardView
            patients={patients}
            appointments={appointments}
            inventory={inventory}
            invoices={invoices}
            complaints={complaints}
            consultations={consultations}
            prescriptions={prescriptions}
            labRequests={labRequests}
            setCurrentView={setCurrentView}
            currentUserRole={currentUserRole}
            updateAppointment={updateAppointment}
            authenticatedUser={authenticatedUser}
            setAutoOpenAppointmentForm={setAutoOpenAppointmentForm}
          />
        );
      case "rendezvous":
        return (
          <AppointmentsView
            appointments={appointments}
            patients={patients}
            addPatient={addPatient}
            addAppointment={addAppointment}
            updateAppointment={updateAppointment}
            deleteAppointment={deleteAppointment}
            currentUserRole={currentUserRole}
            addAuditLog={addAuditLog}
            authenticatedUser={authenticatedUser}
            autoOpenAddForm={autoOpenAppointmentForm}
            setAutoOpenAddForm={setAutoOpenAppointmentForm}
            preselectedPatientId={preselectedPatientId}
            setPreselectedPatientId={setPreselectedPatientId}
          />
        );
      case "patients":
        return (
          <PatientsView
            patients={patients}
            consultations={consultations}
            prescriptions={prescriptions}
            labRequests={labRequests}
            addPatient={addPatient}
            updatePatient={updatePatient}
            addMedicalHistoryEntry={addMedicalHistoryEntry}
            addConsultation={addConsultation}
            addPrescription={addPrescription}
            addLabRequest={addLabRequest}
            updateLabRequest={updateLabRequest}
            currentUserRole={currentUserRole}
            addAuditLog={addAuditLog}
            authenticatedUser={authenticatedUser}
            onScheduleAppointment={(patientId) => {
              setPreselectedPatientId(patientId);
              setAutoOpenAppointmentForm(true);
              setCurrentView("rendezvous");
            }}
          />
        );
      case "stockbilling":
        return (
          <StockBillingView
            inventory={inventory}
            invoices={invoices}
            patients={patients}
            prescriptions={prescriptions}
            updateStock={updateStock}
            addMedication={addMedication}
            addInvoice={addInvoice}
            markInvoiceAsPaid={markInvoiceAsPaid}
            updatePrescriptionStatus={updatePrescriptionStatus}
            currentUserRole={currentUserRole}
            patientDossierNumber={authenticatedUser?.dossierNumber}
          />
        );
      case "laboratory":
        return (
          <LaboratoryView
            labRequests={labRequests}
            updateLabRequest={updateLabRequest}
            patients={patients}
            currentUserRole={currentUserRole}
            authenticatedUser={authenticatedUser}
            addAuditLog={addAuditLog}
            labReagents={labReagents}
            setLabReagents={setLabReagents}
          />
        );
      case "complaints":
        return (
          <ComplaintsView
            complaints={complaints}
            addComplaint={addComplaint}
            resolveComplaint={resolveComplaint}
            updateComplaintStatus={updateComplaintStatus}
            currentUserRole={currentUserRole}
          />
        );
      case "assistantia":
        return <AssistantIAView currentUserRole={currentUserRole} getHeaders={getHeaders} />;
      case "procedures":
        return <ProceduresView />;
      case "settings":
        return (
          <SettingsView
            exportBackup={exportBackup}
            importBackup={importBackup}
            resetDatabase={resetDatabase}
            isOnline={isOnline}
            toggleConnection={toggleConnection}
            syncQueue={syncQueue}
            triggerSync={triggerSync}
            isSyncing={isSyncing}
            lastSyncTime={lastSyncTime}
            auditLogs={auditLogs}
            addAuditLog={addAuditLog}
          />
        );
      default:
        return <WelcomeView currentUserRole={currentUserRole} setCurrentView={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f2] flex flex-col lg:flex-row font-sans" id="app-root">
      {/* Sidebar Navigation */}
      <Navigation
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentUserRole={currentUserRole}
        setCurrentUserRole={setCurrentUserRole}
        isOnline={isOnline}
        toggleConnection={toggleConnection}
        syncQueueLength={syncQueue.length}
        triggerSync={triggerSync}
        isSyncing={isSyncing}
        userFullName={authenticatedUser?.fullName}
        onLogout={handleLogout}
        isRealAuth={true}
      />

      {/* Main Container Viewport */}
      <div className="flex-1 flex flex-col min-w-0" id="main-wrapper">
        {/* Top Header of the main area - perfectly matching High Density theme */}
        <header
          className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0"
          id="main-header"
        >
          <div className="flex items-center space-x-3">
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-800 tracking-tight">
              Bonjour,{" "}
              <span className="text-emerald-700 font-extrabold">
                {authenticatedUser?.fullName || currentUserRole}
              </span>
            </h1>
            <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 font-bold uppercase tracking-wider">
              Espace Clinique
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick Actions based on Role */}
            {currentUserRole === UserRole.ACCUEIL && (
              <button
                onClick={() => {
                  setAutoOpenAppointmentForm(true);
                  setPreselectedPatientId(null);
                  setCurrentView("rendezvous");
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                + Nouveau RDV
              </button>
            )}

            {currentUserRole === UserRole.MEDECIN && (
              <button
                onClick={() => setCurrentView("patients")}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                + Nouvelle Visite
              </button>
            )}

            {currentUserRole === UserRole.PHARMACIE && (
              <button
                onClick={() => setCurrentView("stockbilling")}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                + Ajouter Médicament
              </button>
            )}

            <div className="flex items-center space-x-2 text-xs text-slate-500 font-semibold">
              <span
                className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-amber-500"}`}
              ></span>
              <span className="hidden sm:inline">
                {isOnline ? "Internet Stable" : "Cache Local Actif"}
              </span>
            </div>

            {/* Logout button for all viewports in top header */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-all cursor-pointer shadow-2xs"
              title="Se déconnecter"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Se déconnecter</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main
          className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6"
          id="main-content"
        >
          {renderCurrentView()}
        </main>

        {/* Elegant Professional Footer */}
        <footer
          className="bg-white border-t border-slate-200/80 py-5 mt-auto text-slate-400 text-xs shrink-0"
          id="app-footer"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <p className="font-bold text-slate-700">Clinique Santé Plus</p>
              <p className="text-[10px] text-slate-400">
                Portail sécurisé de gestion intégrée pour l'activité de soins cliniques.
              </p>
            </div>

            <div className="text-center sm:text-right text-[10px] text-slate-400">
              <p>© {new Date().getFullYear()} • Tous Droits Réservés • Abidjan, Côte d'Ivoire</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
