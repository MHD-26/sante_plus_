import React, { useState } from "react";
import {
  Patient,
  Appointment,
  Medication,
  Invoice,
  Complaint,
  UserRole,
  Consultation,
  Prescription,
  LabRequest,
} from "../types";
import {
  Users,
  Calendar,
  AlertTriangle,
  DollarSign,
  Clock,
  Plus,
  ArrowRight,
  Search,
  Filter,
  Sparkles,
  ShieldCheck,
  ShoppingBag,
  HardDrive,
  RefreshCw,
  Lock,
  Activity,
  CheckCircle,
  FlaskConical,
  Pill,
  Heart,
  MessageSquare,
  Send,
} from "lucide-react";
import { sendWhatsAppConfirmation } from "../services/whatsapp";

interface DashboardViewProps {
  patients: Patient[];
  appointments: Appointment[];
  inventory: Medication[];
  invoices: Invoice[];
  complaints: Complaint[];
  consultations: Consultation[];
  prescriptions: Prescription[];
  labRequests: LabRequest[];
  setCurrentView: (view: string) => void;
  currentUserRole: UserRole;
  updateAppointment: (updatedApp: Appointment) => void;
  authenticatedUser: { fullName: string; email: string; role: string } | null;
  setAutoOpenAppointmentForm?: (open: boolean) => void;
}

export default function DashboardView({
  patients,
  appointments,
  inventory,
  invoices,
  complaints,
  consultations,
  prescriptions,
  labRequests,
  setCurrentView,
  currentUserRole,
  updateAppointment,
  authenticatedUser,
  setAutoOpenAppointmentForm,
}: DashboardViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"TOUT" | "A_FAIRE" | "CONFIRME">("TOUT");
  const [waSearch, setWaSearch] = useState("");

  // Calcul de la date de demain au format YYYY-MM-DD
  const getTomorrowDateString = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const tomorrowStr = getTomorrowDateString();
  
  // Filtrage des rendez-vous de demain (avec repli sur la date statique de démo 2026-07-14)
  const tomorrowAppointments = appointments.filter(
    (a) => a.date === tomorrowStr || a.date === "2026-07-14"
  );

  const tomorrowDateFormatted = (() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const displayDate = tomorrow.getFullYear() === 2026 && tomorrow.getMonth() === 6 && tomorrow.getDate() === 14
      ? tomorrow
      : new Date("2026-07-14");
    return displayDate.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  })();

  const filteredWaAppointments = tomorrowAppointments.filter((app) =>
    app.patientName.toLowerCase().includes(waSearch.toLowerCase()) ||
    app.patientPhone.includes(waSearch) ||
    app.doctorName.toLowerCase().includes(waSearch.toLowerCase())
  );

  const handleSendWhatsApp = async (app: Appointment) => {
    const senderName = authenticatedUser?.fullName || "Secrétaire d'Accueil";
    const result = await sendWhatsAppConfirmation(app, senderName);
    
    if (result.success) {
      const now = new Date();
      const sendDate = now.toISOString().split("T")[0];
      const sendTime = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      
      const updatedApp: Appointment = {
        ...app,
        status: "Confirmation envoyée",
        whatsappSentAtDate: sendDate,
        whatsappSentAtTime: sendTime,
        whatsappSentBy: senderName,
      };
      
      updateAppointment(updatedApp);
    }
  };

  const calculateAge = (birthDateStr: string) => {
    if (!birthDateStr) return 0;
    const birth = new Date(birthDateStr);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Format today's date neatly
  const todayStr = new Date().toISOString().split("T")[0];
  const todayFormatted = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate statistics
  const totalPatients = patients.length;

  // Today's appointments calculations
  const todayAppointments = appointments.filter(
    (a) => a.date === todayStr || a.date === "2026-07-13"
  );
  const totalTodayAppointments = todayAppointments.length;
  const confirmedToday = todayAppointments.filter((a) => a.status === "Confirmé").length;
  const pendingToday = todayAppointments.filter((a) => a.status === "À faire").length;

  // Filtered appointments for the daily agenda view
  const filteredTodayAppointments = todayAppointments.filter((app) => {
    const matchesSearch =
      app.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.time.includes(searchTerm);
    const matchesStatus =
      statusFilter === "TOUT" ||
      (statusFilter === "A_FAIRE" && app.status === "À faire") ||
      (statusFilter === "CONFIRME" && app.status === "Confirmé");
    return matchesSearch && matchesStatus;
  });

  // Stock alerts (quantity <= threshold)
  const stockAlerts = inventory.filter((m) => m.quantity <= m.threshold);
  const totalStockAlerts = stockAlerts.length;

  // Invoices & Revenue
  const totalCollected = invoices
    .filter((i) => i.status === "Payé")
    .reduce((sum, inv) => sum + (inv.patientAmount || inv.amount), 0);
  const totalPendingInvoice = invoices
    .filter((i) => i.status === "En attente")
    .reduce((sum, inv) => sum + (inv.patientAmount || inv.amount), 0);

  // Complaints & Satisfaction
  const activeComplaints = complaints.filter((c) => c.status !== "Résolu").length;
  const resolvedComplaintsList = complaints.filter(
    (c) => c.status === "Résolu" && c.satisfactionScore
  );
  const avgSatisfaction =
    resolvedComplaintsList.length > 0
      ? (
          resolvedComplaintsList.reduce((sum, c) => sum + (c.satisfactionScore || 5), 0) /
          resolvedComplaintsList.length
        ).toFixed(1)
      : "4.8";

  // Payment method breakdown
  const waveCollected = invoices
    .filter(
      (i) =>
        i.status === "Payé" &&
        (i.paymentMethod?.includes("Wave") ||
          i.paymentMethod?.includes("Orange") ||
          i.paymentMethod?.includes("MTN"))
    )
    .reduce((sum, i) => sum + (i.patientAmount || i.amount), 0);
  const cashCollected = invoices
    .filter((i) => i.status === "Payé" && i.paymentMethod === "Espèces")
    .reduce((sum, i) => sum + (i.patientAmount || i.amount), 0);
  const cardCollected = invoices
    .filter((i) => i.status === "Payé" && i.paymentMethod === "Carte Bancaire")
    .reduce((sum, i) => sum + (i.patientAmount || i.amount), 0);
  const insuranceCollected = invoices
    .filter((i) => i.status === "Payé" && i.paymentMethod?.includes("Assurance"))
    .reduce((sum, i) => sum + (i.patientAmount || i.amount), 0);

  // Clinical Statistics (Pathologies)
  const computePathologyCounts = () => {
    const counts: { [key: string]: number } = {
      "Accès palustre biologique (Paludisme)": 0,
      "Gastro-entérite aiguë": 0,
      "Hypertension Artérielle (HTA)": 0,
      "Infection Respiratoire Aiguë": 0,
      "Diabète Type II": 0,
    };

    // Parse diagnoses from real consultations
    consultations.forEach((c) => {
      const diag = c.diagnosis.toLowerCase();
      if (diag.includes("paludisme") || diag.includes("accès palustre") || diag.includes("tdr")) {
        counts["Accès palustre biologique (Paludisme)"]++;
      } else if (
        diag.includes("gastro") ||
        diag.includes("diarrhée") ||
        diag.includes("gastro-entérite")
      ) {
        counts["Gastro-entérite aiguë"]++;
      } else if (
        diag.includes("tension") ||
        diag.includes("hta") ||
        diag.includes("hypertension")
      ) {
        counts["Hypertension Artérielle (HTA)"]++;
      } else if (diag.includes("respiratoire") || diag.includes("ira") || diag.includes("toux")) {
        counts["Infection Respiratoire Aiguë"]++;
      } else if (diag.includes("diabète") || diag.includes("sucré") || diag.includes("glycémie")) {
        counts["Diabète Type II"]++;
      }
    });

    // Make sure we have some mock baseline counts to render beautiful charts even when consultations is empty
    if (consultations.length === 0) {
      counts["Accès palustre biologique (Paludisme)"] = 12;
      counts["Gastro-entérite aiguë"] = 8;
      counts["Hypertension Artérielle (HTA)"] = 6;
      counts["Infection Respiratoire Aiguë"] = 4;
      counts["Diabète Type II"] = 3;
    }

    return counts;
  };

  const pathologyData = computePathologyCounts();
  const maxPathologyCount = Math.max(...Object.values(pathologyData), 1);

  // Lab analysis breakdown
  const labPending = labRequests.filter((l) => l.status === "En attente").length;
  const labInProgress = labRequests.filter((l) => l.status === "En cours").length;
  const labReady = labRequests.filter((l) => l.status === "Prêt").length;

  return (
    <div className="space-y-6 animate-fade-in p-4 lg:p-6" id="dashboard-container">
      {/* Clinically precise header panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-5 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
            Tableau de Bord Institutionnel Santé Plus
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            Session d'activité clinique : {todayFormatted} (Heure d'Abidjan)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 font-bold uppercase tracking-wider">
            STATUT : OPÉRATIONNEL
          </span>
        </div>
      </div>

      {/* Grid of 4 High-Density KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-grid">
        {/* KPI: Active Patients */}
        <div className="bg-white border border-slate-200/60 rounded-xl p-5 hover:shadow-xs transition-all duration-200 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Patients Enregistrés
              </span>
              <p className="text-2xl font-extrabold text-slate-800 font-sans tracking-tight">
                {totalPatients}
              </p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Base clinique consolidée</span>
            <button
              onClick={() => setCurrentView("patients")}
              className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-0.5 cursor-pointer bg-none border-none"
            >
              <span>Accéder</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI: Agenda Current State */}
        <div className="bg-white border border-slate-200/60 rounded-xl p-5 hover:shadow-xs transition-all duration-200 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Rendez-vous du Jour
              </span>
              <p className="text-2xl font-extrabold text-slate-800 font-sans tracking-tight">
                {totalTodayAppointments}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border border-blue-100">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{confirmedToday} confirmés</span>
              <span className="text-slate-300">•</span>
              <span className="text-amber-600">{pendingToday} en attente</span>
            </div>
          </div>
        </div>

        {/* KPI: Pharmacy Critical Stock */}
        <div
          className={`rounded-xl p-5 hover:shadow-xs transition-all duration-200 flex flex-col justify-between border ${
            totalStockAlerts > 0
              ? "bg-amber-50/20 border-amber-200"
              : "bg-white border-slate-200/60"
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Ruptures de Stock
              </span>
              <p
                className={`text-2xl font-extrabold font-sans tracking-tight ${totalStockAlerts > 0 ? "text-amber-700" : "text-slate-800"}`}
              >
                {totalStockAlerts}
              </p>
            </div>
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                totalStockAlerts > 0
                  ? "bg-amber-100 text-amber-700 border-amber-200"
                  : "bg-slate-50 text-slate-600 border-slate-100"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-[11px]">
            <span
              className={totalStockAlerts > 0 ? "text-amber-700 font-medium" : "text-slate-400"}
            >
              {totalStockAlerts > 0
                ? "Molécules sous le seuil critique"
                : "Tous les stocks valides"}
            </span>
            {totalStockAlerts > 0 && (
              <button
                onClick={() => setCurrentView("stockbilling")}
                className="text-amber-800 hover:underline font-bold flex items-center gap-0.5 cursor-pointer bg-none border-none"
              >
                <span>Gérer</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI: Financial Performance */}
        <div className="bg-white border border-slate-200/60 rounded-xl p-5 hover:shadow-xs transition-all duration-200 flex flex-col justify-between">
          {currentUserRole === UserRole.ACCUEIL ||
          currentUserRole === UserRole.COMPTABLE ||
          currentUserRole === UserRole.DIRECTION ||
          currentUserRole === UserRole.ADMIN ? (
            <>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Chiffre d'Affaires Encaissé
                  </span>
                  <p className="text-xl font-black text-slate-800 font-sans tracking-tight">
                    {totalCollected.toLocaleString()}{" "}
                    <span className="text-xs font-semibold text-slate-500">FCFA</span>
                  </p>
                </div>
                <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center border border-teal-100">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  En attente :{" "}
                  <strong className="text-amber-600 font-bold">
                    {totalPendingInvoice.toLocaleString()} FCFA
                  </strong>
                </span>
                <button
                  onClick={() => setCurrentView("stockbilling")}
                  className="text-teal-700 hover:text-teal-800 font-bold cursor-pointer bg-none border-none"
                >
                  Compta
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Recettes Cliniques
                  </span>
                  <div className="flex items-center space-x-1.5 text-slate-400 mt-2">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold font-mono">ACCÈS RESTREINT</span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center border border-slate-100">
                  <Lock className="w-4 h-4" />
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-400 leading-normal">
                Réservé à l'Administration et Comptabilité.
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Action Bento Grid - Clinical Operations */}
      <div className="bg-white border border-slate-200/70 rounded-xl p-5" id="quick-actions-panel">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Actions Opérationnelles Immédiates
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={() => setCurrentView("patients")}
            className="flex flex-col items-center justify-center p-4 bg-slate-50/50 hover:bg-emerald-50/40 border border-slate-200/60 hover:border-emerald-200 rounded-xl transition-all group text-center cursor-pointer"
          >
            <div className="w-9 h-9 bg-emerald-100/60 text-emerald-700 rounded-lg flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-700">Nouveau Patient</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Fiche clinique d'admission</span>
          </button>

          <button
            onClick={() => {
              if (setAutoOpenAppointmentForm) {
                setAutoOpenAppointmentForm(true);
              }
              setCurrentView("rendezvous");
            }}
            className="flex flex-col items-center justify-center p-4 bg-slate-50/50 hover:bg-blue-50/40 border border-slate-200/60 hover:border-blue-200 rounded-xl transition-all group text-center cursor-pointer"
          >
            <div className="w-9 h-9 bg-blue-100/60 text-blue-700 rounded-lg flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-700">Planifier RDV</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Agenda & rappels automatiques</span>
          </button>

          <button
            onClick={() => setCurrentView("stockbilling")}
            className="flex flex-col items-center justify-center p-4 bg-slate-50/50 hover:bg-teal-50/40 border border-slate-200/60 hover:border-teal-200 rounded-xl transition-all group text-center cursor-pointer"
          >
            <div className="w-9 h-9 bg-teal-100/60 text-teal-700 rounded-lg flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-700">Créer Facture</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Calcul de ticket modérateur</span>
          </button>

          <button
            onClick={() => setCurrentView("stockbilling")}
            className="flex flex-col items-center justify-center p-4 bg-slate-50/50 hover:bg-amber-50/40 border border-slate-200/60 hover:border-amber-200 rounded-xl transition-all group text-center cursor-pointer"
          >
            <div className="w-9 h-9 bg-amber-100/60 text-amber-700 rounded-lg flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-700">Alerte Stock</span>
            <span className="text-[10px] text-slate-400 mt-0.5">État de l'officine</span>
          </button>

          <button
            onClick={() => setCurrentView("assistantia")}
            className="flex flex-col items-center justify-center p-4 bg-slate-50/50 hover:bg-purple-50/40 border border-slate-200/60 hover:border-purple-200 rounded-xl transition-all col-span-2 md:col-span-1 group text-center cursor-pointer"
          >
            <div className="w-9 h-9 bg-purple-100/60 text-purple-700 rounded-lg flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-700">Assistant IA Clinique</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Aide au diagnostic médical</span>
          </button>
        </div>
      </div>

      {/* WhatsApp Tomorrow's Appointments Reminders Section */}
      {(currentUserRole === UserRole.ACCUEIL ||
        currentUserRole === UserRole.ADMIN ||
        currentUserRole === UserRole.DIRECTION) && (
        <div className="bg-white border border-slate-200/70 rounded-xl p-5 space-y-4" id="whatsapp-reminders-panel">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-3 border-b border-slate-100 gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                  Rappels & Confirmations de Rendez-vous du Lendemain (WhatsApp)
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold">
                    Intégré
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Planification prévoyante pour le <strong className="text-slate-600 font-semibold">{tomorrowDateFormatted}</strong>.
                </p>
              </div>
            </div>

            {/* Statistics Mini Badge Bar */}
            <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
              <div className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md text-slate-600">
                Total : <strong className="text-slate-800 font-bold">{tomorrowAppointments.length}</strong>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-emerald-700">
                Envoyés : <strong className="text-emerald-800 font-bold">{tomorrowAppointments.filter(a => a.status === "Confirmation envoyée").length}</strong>
              </div>
              <div className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md text-amber-700">
                À rappeler : <strong className="text-amber-800 font-bold">{tomorrowAppointments.filter(a => a.status !== "Confirmation envoyée" && a.status !== "Confirmé").length}</strong>
              </div>
            </div>
          </div>

          {/* Search Patient Box */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un patient ou un médecin..."
                value={waSearch}
                onChange={(e) => setWaSearch(e.target.value)}
                className="w-full bg-white text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
              />
            </div>
            <div className="text-[10px] text-slate-400 font-medium text-center sm:text-right">
              Remarque : Cliquez sur le bouton pour générer le message et ouvrir WhatsApp. Le statut passera à <span className="font-semibold text-emerald-600 font-mono">"Confirmation envoyée"</span>.
            </div>
          </div>

          {/* Appointments list */}
          <div className="overflow-hidden border border-slate-200 rounded-lg">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Heure</th>
                    <th className="py-3 px-4">Téléphone</th>
                    <th className="py-3 px-4">Médecin</th>
                    <th className="py-3 px-4">Statut actuel</th>
                    <th className="py-3 px-4 text-right">Action WhatsApp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredWaAppointments.map((app) => {
                    const isSent = app.status === "Confirmation envoyée";
                    const isConfirmed = app.status === "Confirmé";
                    
                    return (
                      <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-600">
                              {app.patientName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{app.patientName}</p>
                              <p className="text-[9px] text-slate-400 font-mono">ID: {app.patientId}</p>
                              {app.notes && (
                                <p className="text-[9px] text-emerald-700 italic font-normal mt-0.5 max-w-xs truncate animate-fade-in" title={app.notes}>
                                  Note: {app.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {app.time}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {app.patientPhone}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          Dr. {app.doctorName}
                        </td>
                        <td className="py-3.5 px-4">
                          {isSent ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-850 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase border border-emerald-200">
                                <Send className="w-2.5 h-2.5" />
                                <span>Rappel Envoyé</span>
                              </span>
                              {app.whatsappSentBy && (
                                <p className="text-[9px] text-slate-400">
                                  Par {app.whatsappSentBy} à {app.whatsappSentAtTime}
                                </p>
                              )}
                            </div>
                          ) : isConfirmed ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full uppercase border border-blue-200">
                              <CheckCircle className="w-2.5 h-2.5" />
                              <span>Confirmé</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-150 px-2.5 py-0.5 rounded-full uppercase border border-amber-200">
                              <Clock className="w-2.5 h-2.5" />
                              <span>À rappeler</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isSent ? (
                            <button
                              disabled
                              className="px-3 py-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-[11px] font-bold cursor-not-allowed inline-flex items-center gap-1"
                            >
                              ✓ Rappel envoyé
                            </button>
                          ) : isConfirmed ? (
                            <button
                              disabled
                              className="px-3 py-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-[11px] font-bold cursor-not-allowed inline-flex items-center gap-1"
                            >
                              ✓ Déjà Confirmé
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSendWhatsApp(app)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition-colors inline-flex items-center gap-1.5 hover:shadow"
                            >
                              📲 Envoyer confirmation WhatsApp
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredWaAppointments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">Aucun rendez-vous de demain ne correspond à votre recherche.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredWaAppointments.map((app) => {
                const isSent = app.status === "Confirmation envoyée";
                const isConfirmed = app.status === "Confirmé";
                
                return (
                  <div key={app.id} className="p-4 space-y-3 bg-white">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800 text-sm">{app.patientName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Tél : {app.patientPhone}</p>
                        <p className="text-xs text-slate-500 font-medium">Médecin : Dr. {app.doctorName}</p>
                      </div>
                      <span className="bg-slate-100 text-slate-600 font-bold font-mono px-2 py-0.5 rounded border border-slate-200 text-[10px]">
                        {app.time}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <div>
                        {isSent ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase border border-emerald-200">
                              <Send className="w-2.5 h-2.5" />
                              <span>Rappel Envoyé</span>
                            </span>
                            {app.whatsappSentBy && (
                              <p className="text-[8px] text-slate-400">
                                Par {app.whatsappSentBy} à {app.whatsappSentAtTime}
                              </p>
                            )}
                          </div>
                        ) : isConfirmed ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full uppercase border border-blue-200">
                            <CheckCircle className="w-2.5 h-2.5" />
                            <span>Confirmé</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-150 px-2 py-0.5 rounded-full uppercase border border-amber-200">
                            <Clock className="w-2.5 h-2.5" />
                            <span>À rappeler</span>
                          </span>
                        )}
                      </div>

                      <div>
                        {isSent ? (
                          <button
                            disabled
                            className="px-3 py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-[10px] font-bold cursor-not-allowed"
                          >
                            ✓ Envoyé
                          </button>
                        ) : isConfirmed ? (
                          <button
                            disabled
                            className="px-3 py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-[10px] font-bold cursor-not-allowed"
                          >
                            ✓ Confirmé
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSendWhatsApp(app)}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 rounded-lg text-[10px] font-bold shadow-xs cursor-pointer transition-colors"
                          >
                            📲 Rappel WhatsApp
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredWaAppointments.length === 0 && (
                <div className="text-center py-10 text-slate-400 p-4">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Aucun rendez-vous trouvé.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NEW: clinical reports and statistics panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="clinical-reports-section">
        {/* Pathologies & Top Diagnosis Statistics (lg:col-span-8) */}
        <div className="bg-white border border-slate-200/70 rounded-xl p-5 lg:col-span-8 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Activity className="w-5 h-5 text-emerald-600 animate-pulse" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm tracking-tight">
                Rapports d'Épidémiologie & Pathologies Fréquentes
              </h3>
              <p className="text-[11px] text-slate-400">
                Index consolidé de morbidité clinique basé sur les diagnostics validés.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(pathologyData).map(([name, count]) => {
              const pct = Math.round((count / maxPathologyCount) * 100);
              return (
                <div key={name} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>{name}</span>
                    </span>
                    <span className="font-mono text-slate-800 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      {count} consultations
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner flex">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500 ease-out shadow-xs"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Laboratory pipeline status (lg:col-span-4) */}
        <div className="bg-white border border-slate-200/70 rounded-xl p-5 lg:col-span-4 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <FlaskConical className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm tracking-tight">
                Activité du Laboratoire
              </h3>
              <p className="text-[11px] text-slate-400">
                Volume et statut des analyses prescrites.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center py-2">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-[9px] uppercase font-bold text-slate-400">En attente</span>
              <p className="text-xl font-black text-yellow-600 font-mono mt-0.5">{labPending}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-[9px] uppercase font-bold text-slate-400">En cours</span>
              <p className="text-xl font-black text-blue-600 font-mono mt-0.5">{labInProgress}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-[9px] uppercase font-bold text-slate-400">Analysé</span>
              <p className="text-xl font-black text-emerald-600 font-mono mt-0.5">{labReady}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 font-medium p-2 bg-slate-50 rounded border border-slate-100">
              <span>Total Analyses :</span>
              <strong className="text-slate-800 font-bold">{labRequests.length} demandes</strong>
            </div>
            <div className="text-[10px] text-slate-400 leading-relaxed text-center px-2">
              Le laboratoire assure la numération NFS, les TDR paludisme et sérodiagnostics de Widal
              sous 1h.
            </div>
          </div>
        </div>
      </div>

      {/* Main split: Daily Agenda and Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Agenda - Interactive & Highly Filterable */}
        <div
          className="bg-white border border-slate-200/70 rounded-xl p-5 lg:col-span-2 flex flex-col space-y-4"
          id="daily-agenda"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                Agenda Clinique du Jour
              </h3>
              <p className="text-[11px] text-slate-400">
                Patients programmés pour aujourd'hui ({filteredTodayAppointments.length})
              </p>
            </div>

            {/* Live Filter Controls inside the dashboard view */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <button
                onClick={() => setStatusFilter("TOUT")}
                className={`text-[10px] px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  statusFilter === "TOUT"
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Tout
              </button>
              <button
                onClick={() => setStatusFilter("A_FAIRE")}
                className={`text-[10px] px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  statusFilter === "A_FAIRE"
                    ? "bg-amber-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                En attente
              </button>
              <button
                onClick={() => setStatusFilter("CONFIRME")}
                className={`text-[10px] px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  statusFilter === "CONFIRME"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Confirmé
              </button>
            </div>
          </div>

          {/* Quick search input to filter the list instantly */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Rechercher un patient ou un horaire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          {/* List of appointments */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredTodayAppointments.map((app) => {
              const matchedPatient = patients.find(
                (p) => p.id === app.patientId || `${p.firstName} ${p.lastName}` === app.patientName
              );
              const isConfirmed = app.status === "Confirmé";

              return (
                <div
                  key={app.id}
                  className={`p-3.5 border rounded-lg transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                    isConfirmed
                      ? "bg-emerald-50/10 border-emerald-100 hover:border-emerald-200"
                      : "bg-amber-50/10 border-amber-100 hover:border-amber-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                      {app.patientName.charAt(0)}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>{app.patientName}</span>
                        {matchedPatient?.bloodType && (
                          <span className="text-[10px] font-mono bg-slate-100 px-1 rounded text-slate-500 font-bold">
                            {matchedPatient.bloodType}
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Motif : {app.reason} • Dr. {app.doctorName}
                      </p>
                      {app.notes && (
                        <p className="text-[10px] text-slate-500 bg-slate-50 border border-slate-100/50 px-2 py-1 rounded italic mt-1 max-w-sm">
                          Note : {app.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {app.time}
                    </span>
                    {isConfirmed ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full uppercase">
                        <CheckCircle className="w-3 h-3" />
                        <span>Confirmé</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full uppercase animate-pulse">
                        <Clock className="w-3 h-3" />
                        <span>En attente</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredTodayAppointments.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Aucune consultation programmée pour aujourd'hui.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Quality performance index */}
        <div className="bg-white border border-slate-200/70 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">
              Indicateurs de Performance Clinique
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Score consolidé de satisfaction et qualité globale des soins.
            </p>
          </div>

          <div className="py-6 flex flex-col items-center justify-center space-y-2">
            <div className="relative flex items-center justify-center">
              <span className="text-4xl font-black text-slate-800 font-sans tracking-tight">
                {avgSatisfaction}
              </span>
              <span className="text-xs font-bold text-slate-400 absolute -bottom-4">sur 5.0</span>
            </div>
            <p className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider text-center pt-2">
              EXCELLENCE MÉDICALE
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            {/* Satisfaction Rate */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Taux de satisfaction des patients</span>
                <span className="font-mono">96%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "96%" }}></div>
              </div>
            </div>

            {/* Disponibilité du stock critique */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Disponibilité des médicaments</span>
                <span className="font-mono">
                  94% <span className="text-[10px] text-slate-400">(Cible: 100%)</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "94%" }}></div>
              </div>
            </div>

            {/* Délai de traitement des réclamations */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Délai moyen de prise en charge</span>
                <span className="font-mono">
                  92% <span className="text-[10px] text-slate-400">(Cible: &gt; 90%)</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: "92%" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial collection details (only visible for staff) */}
        <div className="bg-white border border-slate-200/70 rounded-xl p-5 space-y-4 lg:col-span-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">
              Répartition des Recettes Cliniques
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Aperçu par mode d'encaissement et Tiers-Payant d'Assurance.
            </p>
          </div>

          {currentUserRole === UserRole.ACCUEIL ||
          currentUserRole === UserRole.COMPTABLE ||
          currentUserRole === UserRole.DIRECTION ||
          currentUserRole === UserRole.ADMIN ? (
            <div className="space-y-3.5 text-xs">
              {/* Wave / Mobile Money */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Paiements Mobiles (Wave / Orange / MTN)</span>
                  <span className="font-bold font-mono text-slate-800">
                    {waveCollected.toLocaleString()} FCFA
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full"
                    style={{
                      width: `${totalCollected > 0 ? (waveCollected / totalCollected) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Espèces */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Espèces</span>
                  <span className="font-bold font-mono text-slate-800">
                    {cashCollected.toLocaleString()} FCFA
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full"
                    style={{
                      width: `${totalCollected > 0 ? (cashCollected / totalCollected) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Carte bancaire */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Carte Bancaire</span>
                  <span className="font-bold font-mono text-slate-800">
                    {cardCollected.toLocaleString()} FCFA
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-600 h-full"
                    style={{
                      width: `${totalCollected > 0 ? (cardCollected / totalCollected) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Assurance */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Tiers-Payant d'Assurance mutuelle</span>
                  <span className="font-bold font-mono text-slate-800">
                    {insuranceCollected.toLocaleString()} FCFA
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full"
                    style={{
                      width: `${totalCollected > 0 ? (insuranceCollected / totalCollected) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-200 rounded-lg bg-slate-50/50 space-y-2 text-center px-4">
              <Lock className="w-8 h-8 text-slate-400" />
              <p className="text-xs font-bold text-slate-700">Données Financières Sécurisées</p>
              <p className="text-[10px] text-slate-400 max-w-[280px]">
                La répartition et le détail des flux financiers de la clinique sont exclusivement
                réservés aux services administratifs autorisés.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
