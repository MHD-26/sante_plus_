import React, { useState } from "react";
import { Patient, Appointment, Medication, Invoice, Complaint, UserRole } from "../types";
import { 
  Users, Calendar, AlertTriangle, DollarSign, 
  Clock, Plus, ArrowRight, Search, Filter, 
  Sparkles, ShieldCheck, ShoppingBag, HardDrive, RefreshCw, Lock
} from "lucide-react";

interface DashboardViewProps {
  patients: Patient[];
  appointments: Appointment[];
  inventory: Medication[];
  invoices: Invoice[];
  complaints: Complaint[];
  setCurrentView: (view: string) => void;
  currentUserRole: UserRole;
}

export default function DashboardView({
  patients,
  appointments,
  inventory,
  invoices,
  complaints,
  setCurrentView,
  currentUserRole
}: DashboardViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"TOUT" | "A_FAIRE" | "CONFIRME">("TOUT");

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
  const todayStr = new Date().toISOString().split("T")[0]; // "2026-07-08" in mock
  const todayFormatted = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  // Calculate statistics
  const totalPatients = patients.length;
  
  // Today's appointments calculations
  const todayAppointments = appointments.filter((a) => a.date === "2026-07-08" || a.date === todayStr);
  const totalTodayAppointments = todayAppointments.length;
  const confirmedToday = todayAppointments.filter((a) => a.status === "Confirmé").length;
  const pendingToday = todayAppointments.filter((a) => a.status === "À faire").length;

  // Filtered appointments for the daily agenda view
  const filteredTodayAppointments = todayAppointments.filter((app) => {
    const matchesSearch = app.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
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
  const totalCollected = invoices.filter((i) => i.status === "Payé").reduce((sum, inv) => sum + inv.amount, 0);
  const totalPendingInvoice = invoices.filter((i) => i.status === "En attente").reduce((sum, inv) => sum + inv.amount, 0);

  // Complaints & Satisfaction
  const activeComplaints = complaints.filter((c) => c.status !== "Résolu").length;
  const resolvedComplaintsList = complaints.filter((c) => c.status === "Résolu" && c.satisfactionScore);
  const avgSatisfaction = resolvedComplaintsList.length > 0
    ? (resolvedComplaintsList.reduce((sum, c) => sum + (c.satisfactionScore || 5), 0) / resolvedComplaintsList.length).toFixed(1)
    : "4.7";

  // Payment method breakdown
  const waveCollected = invoices.filter((i) => i.status === "Payé" && i.paymentMethod === "Wave / Orange / MTN").reduce((sum, i) => sum + i.amount, 0);
  const cashCollected = invoices.filter((i) => i.status === "Payé" && i.paymentMethod === "Espèces").reduce((sum, i) => sum + i.amount, 0);
  const cardCollected = invoices.filter((i) => i.status === "Payé" && i.paymentMethod === "Carte Bancaire").reduce((sum, i) => sum + i.amount, 0);
  const insuranceCollected = invoices.filter((i) => i.status === "Payé" && i.paymentMethod.includes("Assurance")).reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in" id="dashboard-container">
      
      {/* Clinically precise header panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-5 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
            Tableau de Bord Institutionnel
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-600"></span>
            Session d'activité clinique : {todayFormatted} (Heure d'Abidjan)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 font-bold">
            STATUT : OPÉRATIONNEL
          </span>
        </div>
      </div>

      {/* Grid of 4 High-Density KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-grid">
        
        {/* KPI: Active Patients */}
        <div className="bg-white border border-slate-200/60 rounded-xl p-5 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patients Enregistrés</span>
              <p className="text-2xl font-extrabold text-slate-800 font-sans tracking-tight">{totalPatients}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Base clinique consolidée</span>
            <button 
              onClick={() => setCurrentView("patients")}
              className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-0.5 cursor-pointer"
            >
              <span>Accéder</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI: Agenda Current State */}
        <div className="bg-white border border-slate-200/60 rounded-xl p-5 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Consultations du Jour</span>
              <p className="text-2xl font-extrabold text-slate-800 font-sans tracking-tight">{totalTodayAppointments}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border border-blue-100">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{confirmedToday} confirmées</span>
              <span className="text-slate-300">•</span>
              <span className="text-amber-600">{pendingToday} en attente</span>
            </div>
          </div>
        </div>

        {/* KPI: Pharmacy Critical Stock */}
        <div className={`rounded-xl p-5 hover:shadow-md transition-all duration-200 flex flex-col justify-between border ${
          totalStockAlerts > 0 ? "bg-amber-50/20 border-amber-200" : "bg-white border-slate-200/60"
        }`}>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alertes Approvisionnement</span>
              <p className={`text-2xl font-extrabold font-sans tracking-tight ${totalStockAlerts > 0 ? "text-amber-700" : "text-slate-800"}`}>
                {totalStockAlerts}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
              totalStockAlerts > 0 ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-slate-50 text-slate-600 border-slate-100"
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-[11px]">
            <span className={totalStockAlerts > 0 ? "text-amber-700 font-medium" : "text-slate-400"}>
              {totalStockAlerts > 0 ? "Ruptures imminentes de molécules" : "Tous les stocks valides"}
            </span>
            {totalStockAlerts > 0 && (
              <button 
                onClick={() => setCurrentView("stockbilling")}
                className="text-amber-800 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
              >
                <span>Inventaire</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI: Financial Performance */}
        <div className="bg-white border border-slate-200/60 rounded-xl p-5 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          {currentUserRole === UserRole.ACCUEIL || currentUserRole === UserRole.COMPTABLE ? (
            <>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Encaissements Pris</span>
                  <p className="text-xl font-black text-slate-800 font-sans tracking-tight">
                    {totalCollected.toLocaleString()} <span className="text-xs font-semibold text-slate-500">FCFA</span>
                  </p>
                </div>
                <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center border border-teal-100">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-[11px] text-slate-500">
                <span>En attente : <strong className="text-amber-600 font-bold">{totalPendingInvoice.toLocaleString()} F</strong></span>
                <button 
                  onClick={() => setCurrentView("stockbilling")}
                  className="text-teal-700 hover:text-teal-800 font-bold cursor-pointer"
                >
                  Compta
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recettes Cliniques</span>
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
                Réservé au Secrétariat et à la Comptabilité.
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
            onClick={() => setCurrentView("rendezvous")}
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

      {/* Main split: Daily Agenda and Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Agenda - Interactive & Highly Filterable */}
        <div className="bg-white border border-slate-200/70 rounded-xl p-5 lg:col-span-2 flex flex-col space-y-4" id="daily-agenda">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">Agenda Clinique du Jour</h3>
              <p className="text-[11px] text-slate-400">Patients programmés pour aujourd'hui ({filteredTodayAppointments.length})</p>
            </div>
            
            {/* Live Filter Controls inside the dashboard view */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <button 
                onClick={() => setStatusFilter("TOUT")}
                className={`text-[10px] px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  statusFilter === "TOUT" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Tout
              </button>
              <button 
                onClick={() => setStatusFilter("A_FAIRE")}
                className={`text-[10px] px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  statusFilter === "A_FAIRE" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                En attente
              </button>
              <button 
                onClick={() => setStatusFilter("CONFIRME")}
                className={`text-[10px] px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  statusFilter === "CONFIRME" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
              const matchedPatient = patients.find(p => p.id === app.patientId || `${p.firstName} ${p.lastName}` === app.patientName);
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
                    {/* Visual time badge */}
                    <div className={`w-12 py-1.5 rounded-md text-center shrink-0 flex flex-col justify-center border font-mono ${
                      isConfirmed 
                        ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                        : "bg-amber-50 text-amber-800 border-amber-100"
                    }`}>
                      <Clock className="w-3.5 h-3.5 mx-auto mb-0.5" />
                      <span className="text-[10px] font-bold">{app.time}</span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-800">{app.patientName}</h4>
                        {matchedPatient && (
                          <span className="text-[9px] text-slate-400 font-medium">
                            ({matchedPatient.gender === "M" ? "H" : "F"}, {calculateAge(matchedPatient.birthDate)} ans)
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500">Motif : {app.notes || "Consultation de routine"}</p>
                      {matchedPatient && matchedPatient.phone && (
                        <p className="text-[9px] text-slate-400 font-mono">Tél : {matchedPatient.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      isConfirmed ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {app.status === "À faire" ? "Rappel en attente" : "Rappel validé"}
                    </span>
                    <button 
                      onClick={() => setCurrentView("rendezvous")}
                      className="p-1 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 border border-slate-200 rounded transition-colors"
                      title="Ouvrir le dossier"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredTodayAppointments.length === 0 && (
              <div className="py-12 border border-dashed border-slate-200 rounded-lg text-center">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-500">Aucune consultation trouvée</p>
                <p className="text-[10px] text-slate-400 mt-1">Ajustez vos filtres ou recherchez un autre nom.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quality & Satisfaction Indicators */}
        <div className="bg-white border border-slate-200/70 rounded-xl p-5 flex flex-col justify-between space-y-5" id="quality-satisfaction">
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Qualité & Satisfaction Patient</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Indicateurs consolidés d'amélioration de l'accueil.</p>
          </div>

          {/* Satisfaction Arc Score */}
          <div className="flex flex-col items-center py-2">
            <div className="relative w-28 h-28 rounded-full border-[6px] border-emerald-500 border-t-slate-100 flex flex-col items-center justify-center bg-emerald-50/10">
              <span className="text-4xl font-extrabold text-slate-800 font-sans tracking-tight">{avgSatisfaction}</span>
              <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-widest mt-0.5">Sur 5.0</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100/50 px-3 py-1 rounded-full mt-4">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Service de soins qualifié</span>
            </div>
          </div>

          {/* Actionable Complaints List */}
          <div className="bg-slate-50/50 border border-slate-200/50 p-3.5 rounded-lg space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-600">Plaintes ou réclamations :</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${activeComplaints > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"}`}>
                {activeComplaints} active{activeComplaints > 1 ? "s" : ""}
              </span>
            </div>
            
            <p className="text-[10px] text-slate-500 leading-normal">
              Le traitement rapide des insatisfactions permet de maintenir notre engagement d'excellence. 
            </p>

            <button 
              onClick={() => setCurrentView("complaints")}
              className="w-full py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-800 font-bold rounded-lg text-[10px] text-center transition-colors cursor-pointer block"
            >
              Gérer les plaintes
            </button>
          </div>
        </div>

      </div>

      {/* Grid of operational charts: Financial breakdown and Performance progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-financials">
        
        {/* Performance indicators */}
        <div className="bg-white border border-slate-200/70 rounded-xl p-5 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Performance Clinique globale</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Indicateurs de conformité par rapport aux objectifs fixés.</p>
          </div>

          <div className="space-y-4">
            
            {/* Taux de présence aux RDV */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Taux de Présence aux Rendez-vous</span>
                <span className="font-mono">88% <span className="text-[10px] text-slate-400">(Cible: 95%)</span></span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: "88%" }}></div>
              </div>
            </div>

            {/* Disponibilité du stock critique */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Disponibilité des médicaments critiques</span>
                <span className="font-mono">83% <span className="text-[10px] text-slate-400">(Cible: 100%)</span></span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "83%" }}></div>
              </div>
            </div>

            {/* Délai de traitement des réclamations */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Délai moyen de prise en charge</span>
                <span className="font-mono">92% <span className="text-[10px] text-slate-400">(Cible: &gt; 90%)</span></span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: "92%" }}></div>
              </div>
            </div>

          </div>
        </div>

        {/* Financial collection details */}
        <div className="bg-white border border-slate-200/70 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Répartition des Recettes Cliniques</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Aperçu par mode d'encaissement et Tiers-Payant.</p>
          </div>
          
          {currentUserRole === UserRole.ACCUEIL || currentUserRole === UserRole.COMPTABLE ? (
            <div className="space-y-3.5 text-xs">
              
              {/* Wave / Mobile Money */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Paiements Mobiles (Wave / Orange / MTN)</span>
                  <span className="font-bold font-mono text-slate-800">{waveCollected.toLocaleString()} FCFA</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full" style={{ width: `${totalCollected > 0 ? (waveCollected / totalCollected) * 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Espèces */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Espèces</span>
                  <span className="font-bold font-mono text-slate-800">{cashCollected.toLocaleString()} FCFA</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full" style={{ width: `${totalCollected > 0 ? (cashCollected / totalCollected) * 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Carte bancaire */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Carte Bancaire</span>
                  <span className="font-bold font-mono text-slate-800">{cardCollected.toLocaleString()} FCFA</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full" style={{ width: `${totalCollected > 0 ? (cardCollected / totalCollected) * 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Assurance */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Tiers-Payant d'Assurance mutuelle</span>
                  <span className="font-bold font-mono text-slate-800">{insuranceCollected.toLocaleString()} FCFA</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: `${totalCollected > 0 ? (insuranceCollected / totalCollected) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-200 rounded-lg bg-slate-50/50 space-y-2 text-center px-4">
              <Lock className="w-8 h-8 text-slate-400" />
              <p className="text-xs font-bold text-slate-700">Données Financières Sécurisées</p>
              <p className="text-[10px] text-slate-400 max-w-[280px]">
                La répartition et le détail des flux financiers de la clinique sont exclusivement réservés aux services de secrétariat et de comptabilité.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
