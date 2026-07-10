import React, { useState } from "react";
import { UserRole, Patient, Appointment, Invoice, Complaint } from "../types";
import { AppwriteUser } from "../services/auth";
import { 
  ArrowRight, Stethoscope, HeartPulse, Bed, Baby, Heart, 
  FlaskConical, Pill, MapPin, Phone, Mail, Clock, 
  Users, Award, Shield, Map, Activity,
  User, Calendar, FileText, Frown, Plus, Check, Clipboard, AlertCircle, Sparkles
} from "lucide-react";
import Logo from "./Logo";

interface WelcomeViewProps {
  currentUserRole: UserRole;
  setCurrentView: (view: string) => void;
  authenticatedUser?: AppwriteUser | null;
  patients?: Patient[];
  appointments?: Appointment[];
  invoices?: Invoice[];
  addComplaint?: (comp: Omit<Complaint, "id" | "date" | "status">) => Complaint;
  addAppointment?: (app: Omit<Appointment, "id">) => Appointment;
  updateAppointment?: (app: Appointment) => void;
}

export default function WelcomeView({ 
  currentUserRole, 
  setCurrentView,
  authenticatedUser,
  patients = [],
  appointments = [],
  invoices = [],
  addComplaint,
  addAppointment,
  updateAppointment
}: WelcomeViewProps) {
  
  const getRoleWelcomeMessage = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return {
          title: "Session Administrateur Active",
          desc: "Gestion des configurations cliniques, des comptes rendus d'activité et du pilotage général de l'établissement.",
          actions: [
            { label: "Consulter le Tableau de bord", view: "dashboard" },
            { label: "Gérer la base de données", view: "settings" }
          ]
        };
      case UserRole.DIRECTION:
        return {
          title: "Session Direction Générale Active",
          desc: "Pilotage de la performance opérationnelle et médicale de la clinique, suivi de la satisfaction et des dossiers de soins.",
          actions: [
            { label: "Consulter le Tableau de bord", view: "dashboard" },
            { label: "Consulter les Réclamations", view: "complaints" }
          ]
        };
      case UserRole.ACCUEIL:
        return {
          title: "Session Accueil Active",
          desc: "Accueil des patients, planification des rendez-vous médicaux et gestion des dossiers administratifs d'admission.",
          actions: [
            { label: "Gérer les Rendez-vous", view: "rendezvous" },
            { label: "Inscrire un nouveau Patient", view: "patients" }
          ]
        };
      case UserRole.MEDECIN:
        return {
          title: "Session Médicale Active",
          desc: "Consultation des dossiers médicaux, saisie d'observations cliniques, ordonnances et comptes-rendus de visites.",
          actions: [
            { label: "Voir les Rendez-vous du jour", view: "rendezvous" },
            { label: "Consulter les Dossiers Patients", view: "patients" }
          ]
        };
      case UserRole.COMPTABLE:
        return {
          title: "Session Comptabilité Active",
          desc: "Facturation des actes de soin, encaissement des tickets modérateurs et suivi des règlements d'assurance.",
          actions: [
            { label: "Saisir une Facture / Paiement", view: "stockbilling" },
            { label: "Voir le Tableau de Bord Financier", view: "dashboard" }
          ]
        };
      case UserRole.PHARMACIE:
        return {
          title: "Session Pharmacie Active",
          desc: "Gestion de l'approvisionnement en médicaments, suivi des stocks cliniques et préparation des ordonnances prescrites.",
          actions: [
            { label: "Gérer le Stock Médicaments", view: "stockbilling" },
            { label: "Consulter les Protocoles cliniques", view: "procedures" }
          ]
        };
      default:
        return {
          title: "Bienvenue sur le portail de gestion clinique",
          desc: "Veuillez sélectionner votre profil utilisateur pour accéder à vos outils métiers dédiés.",
          actions: []
        };
    }
  };

  const roleMessage = getRoleWelcomeMessage(currentUserRole);

  const stats = [
    { value: "15+", label: "Médecins Spécialistes", icon: Stethoscope, color: "text-emerald-600 bg-emerald-50" },
    { value: "12", label: "Spécialités Médicales", icon: Award, color: "text-teal-600 bg-teal-50" },
    { value: "9", label: "Services Majeurs", icon: Shield, color: "text-blue-600 bg-blue-50" },
    { value: "45", label: "Lits d'Hospitalisation", icon: Bed, color: "text-cyan-600 bg-cyan-50" },
    { value: "10+", label: "Années d'Expérience", icon: Activity, color: "text-indigo-600 bg-indigo-50" },
    { value: "2", label: "Sites à Abidjan", icon: Map, color: "text-amber-600 bg-amber-50" },
  ];

  const services = [
    { name: "Médecine Générale", desc: "Consultations courantes, diagnostics de précision et médecine préventive.", icon: Stethoscope },
    { name: "Urgences 24h/7", desc: "Prise en charge réactive immédiate avec équipe médicale de garde permanente.", icon: HeartPulse },
    { name: "Hospitalisation", desc: "Chambres modernes climatisées, équipées pour un suivi sécurisé continu.", icon: Bed },
    { name: "Pédiatrie", desc: "Consultations pédiatriques, vaccinations et soins spécialisés pour les enfants.", icon: Baby },
    { name: "Gynécologie", desc: "Suivi gynécologique complet, obstétrique et accompagnement à la maternité.", icon: Users },
    { name: "Cardiologie", desc: "Dépistage, ECG, examens cardiovasculaires et traitements personnalisés.", icon: Heart },
    { name: "Laboratoire d'Analyses", desc: "Analyses de biologie clinique, bilans sanguins et diagnostics rapides.", icon: FlaskConical },
    { name: "Imagerie Médicale", desc: "Radiographie numérique, échographie générale et doppler de pointe.", icon: Activity },
    { name: "Pharmacie Intégrée", desc: "Disponibilité immédiate des traitements et médicaments de qualité.", icon: Pill },
  ];

  // --- ESPACE PATIENT LOGIQUE ---
  const [patientTab, setPatientTab] = useState<"dossier" | "rdv" | "factures" | "reclamation">("dossier");

  // Rechercher le dossier clinique correspondant au patient connecté
  const patientRecord = patients.find((p) => {
    if (!authenticatedUser) return false;
    
    // 1. Recherche par numéro de dossier (si stocké dans authenticatedUser.dossierNumber)
    if (authenticatedUser.dossierNumber && p.id.toLowerCase() === authenticatedUser.dossierNumber.toLowerCase()) {
      return true;
    }
    
    // 2. Recherche par email
    if (authenticatedUser.email && p.email.toLowerCase() === authenticatedUser.email.toLowerCase()) {
      return true;
    }
    
    // 3. Recherche par nom complet
    const authFullName = authenticatedUser.fullName.toLowerCase().replace(/\s+/g, "");
    const recordFullName = (p.firstName + p.lastName).toLowerCase().replace(/\s+/g, "");
    if (authFullName === recordFullName) {
      return true;
    }
    
    // 4. Recherche par téléphone
    if (authenticatedUser.phone && p.phone.replace(/[^0-9]/g, "") === authenticatedUser.phone.replace(/[^0-9]/g, "")) {
      return true;
    }
    
    return false;
  });

  const fallbackPatient: Patient = {
    id: authenticatedUser?.dossierNumber || "PAT-001",
    firstName: authenticatedUser?.fullName.split(" ")[0] || "Patient",
    lastName: authenticatedUser?.fullName.split(" ").slice(1).join(" ") || "Démo",
    phone: authenticatedUser?.phone || "+225 0707070707",
    email: authenticatedUser?.email || "patient@santeplus.ci",
    birthDate: "1990-01-01",
    gender: "Masculin",
    bloodType: "A+",
    allergies: "Aucune allergie connue",
    sensitiveDataSigned: true,
    createdAt: new Date().toISOString(),
    medicalHistory: []
  };

  const activePatient = patientRecord || fallbackPatient;

  // Filtrer les rendez-vous du patient
  const myAppointments = appointments.filter((app) => {
    return app.patientId === activePatient.id || 
           app.patientPhone === activePatient.phone || 
           (app.patientName.toLowerCase().includes(activePatient.firstName.toLowerCase()) && 
            app.patientName.toLowerCase().includes(activePatient.lastName.toLowerCase()));
  });

  // Filtrer les rendez-vous en attente de confirmation (pour la vue médecin)
  const pendingConfirmations = appointments.filter((app) => app.status === "En attente de confirmation");

  // Filtrer les factures du patient
  const myInvoices = invoices.filter((inv) => {
    return inv.patientId === activePatient.id || 
           (inv.patientName.toLowerCase().includes(activePatient.firstName.toLowerCase()) && 
            inv.patientName.toLowerCase().includes(activePatient.lastName.toLowerCase()));
  });

  // Form pour nouveau rdv
  const [newRdvDate, setNewRdvDate] = useState("");
  const [newRdvTime, setNewRdvTime] = useState("09:00");
  const [newRdvReason, setNewRdvReason] = useState("Consultation Générale");
  const [newRdvDoctor, setNewRdvDoctor] = useState("Dr. Essoh Cyrille");
  const [newRdvNotes, setNewRdvNotes] = useState("");
  const [rdvSubmitted, setRdvSubmitted] = useState(false);

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRdvDate || !newRdvTime) {
      alert("Veuillez renseigner la date et l'heure du rendez-vous.");
      return;
    }

    if (addAppointment) {
      addAppointment({
        patientId: activePatient.id,
        patientName: `${activePatient.firstName} ${activePatient.lastName}`,
        patientPhone: activePatient.phone,
        doctorName: newRdvDoctor,
        date: newRdvDate,
        time: newRdvTime,
        reason: `${newRdvReason}${newRdvNotes ? " - " + newRdvNotes : ""}`,
        status: "En attente de confirmation",
        notes: newRdvNotes
      });
      setRdvSubmitted(true);
      setNewRdvDate("");
      setNewRdvNotes("");
      setTimeout(() => setRdvSubmitted(false), 5000);
    } else {
      alert("Le service de planification n'est pas disponible pour le moment.");
    }
  };

  // Form pour réclamation
  const [compCategory, setCompCategory] = useState<"Accueil" | "Temps d'attente" | "Qualité des soins" | "Tarification" | "Autre">("Qualité des soins");
  const [compSeverity, setCompSeverity] = useState<"Basse" | "Moyenne" | "Critique">("Moyenne");
  const [compDesc, setCompDesc] = useState("");
  const [compSubmitted, setCompSubmitted] = useState(false);

  const handlePostComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compDesc.trim()) {
      alert("Veuillez décrire votre avis ou motif de réclamation.");
      return;
    }

    if (addComplaint) {
      addComplaint({
        patientName: `${activePatient.firstName} ${activePatient.lastName}`,
        patientPhone: activePatient.phone,
        category: compCategory,
        severity: compSeverity,
        description: compDesc
      });
      setCompSubmitted(true);
      setCompDesc("");
      setTimeout(() => setCompSubmitted(false), 5000);
    } else {
      alert("Le service de réclamations n'est pas disponible pour le moment.");
    }
  };

  if (currentUserRole === UserRole.PATIENT) {
    return (
      <div className="space-y-8 animate-fade-in py-4 max-w-5xl">
        {/* Welcome Patient Header Banner */}
        <div className="bg-gradient-to-br from-[#065f46] to-[#047857] text-white rounded-2xl p-6 md:p-8 shadow-lg shadow-emerald-900/5 border border-[#047857]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
              <Logo size={46} />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Bonjour, {activePatient.firstName} {activePatient.lastName}
              </h1>
              <p className="text-xs md:text-sm text-emerald-100/90 font-medium max-w-xl">
                Bienvenue dans votre espace santé personnel sécurisé. Vous pouvez consulter vos dossiers, planifier vos visites et échanger avec nos équipes.
              </p>
            </div>
          </div>
          <div className="bg-emerald-950/40 border border-emerald-500/20 px-4 py-3 rounded-xl shrink-0 text-left space-y-1">
            <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">Numéro de dossier</span>
            <span className="text-lg font-mono font-black text-white">{activePatient.id}</span>
          </div>
        </div>

        {/* Info Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-1.5 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Groupe Sanguin</span>
            <div className="flex items-center gap-2">
              <div className="p-1 bg-red-50 text-red-600 rounded-lg">
                <HeartPulse className="w-4 h-4" />
              </div>
              <span className="text-base font-black text-slate-800">{activePatient.bloodType || "N/A"}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-1.5 shadow-2xs col-span-1 md:col-span-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Allergies signalées</span>
            <div className="flex items-start gap-2">
              <div className="p-1 bg-amber-50 text-amber-600 rounded-lg mt-0.5 shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700 leading-normal truncate">
                {activePatient.allergies || "Aucune allergie connue renseignée."}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-1.5 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Téléphone de contact</span>
            <div className="flex items-center gap-2">
              <div className="p-1 bg-emerald-50 text-emerald-600 rounded-lg">
                <Phone className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-slate-800 truncate">{activePatient.phone}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex flex-wrap border-b border-slate-100 pb-2 mb-6 gap-1">
            <button
              onClick={() => setPatientTab("dossier")}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                patientTab === "dossier"
                  ? "bg-[#065f46] text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Clipboard className="w-4 h-4" />
              <span>Mon Dossier Clinique</span>
            </button>
            <button
              onClick={() => setPatientTab("rdv")}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                patientTab === "rdv"
                  ? "bg-[#065f46] text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Mes Rendez-vous ({myAppointments.length})</span>
            </button>
            <button
              onClick={() => setPatientTab("factures")}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                patientTab === "factures"
                  ? "bg-[#065f46] text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Mes Factures ({myInvoices.length})</span>
            </button>
            <button
              onClick={() => setPatientTab("reclamation")}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                patientTab === "reclamation"
                  ? "bg-[#065f46] text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Frown className="w-4 h-4" />
              <span>Donner mon avis / Plainte</span>
            </button>
          </div>

          {/* TAB 1: MEDICAL RECORD DOSSIER */}
          {patientTab === "dossier" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Historique de vos Consultations</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Retrouvez ici vos comptes rendus cliniques et vos ordonnances médicales prescrites à la Clinique Santé Plus.
                </p>
              </div>

              {activePatient.medicalHistory && activePatient.medicalHistory.length > 0 ? (
                <div className="relative border-l border-emerald-100 pl-6 ml-3 space-y-8">
                  {activePatient.medicalHistory.map((hist) => (
                    <div key={hist.id} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full bg-emerald-50 border-4 border-emerald-500 shadow-sm" />
                      
                      <div className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 rounded-xl p-5 space-y-3.5 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/40 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md font-mono">{hist.id}</span>
                            <span className="text-xs font-bold text-emerald-800">{hist.doctorName}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-400">{hist.date}</span>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Diagnostic de consultation</span>
                            <p className="text-xs font-extrabold text-slate-800 mt-0.5">{hist.diagnosis}</p>
                          </div>
                          <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-lg p-3.5 mt-2">
                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">Traitement prescrit (Ordonnance)</span>
                            <p className="text-xs font-medium text-emerald-950 leading-relaxed italic">{hist.prescription}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6 space-y-2">
                  <Clipboard className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">Aucun historique de consultation enregistré</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Si vous venez de créer votre compte, votre médecin l'alimentera lors de votre prochaine consultation à la clinique.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: APPOINTMENTS */}
          {patientTab === "rdv" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left col: Appointment list */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Vos rendez-vous planifiés</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Liste de vos rendez-vous pris ou en attente à la clinique.
                  </p>
                </div>

                {myAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {myAppointments.map((app) => (
                      <div key={app.id} className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded">{app.id}</span>
                            <span className="text-xs font-extrabold text-slate-800">{app.reason}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-[11px] font-medium">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {app.date} à {app.time}</span>
                            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> {app.doctorName}</span>
                          </div>
                        </div>

                        <div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            app.status === "Confirmé"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : app.status === "À faire"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : app.status === "En attente de confirmation"
                              ? "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse"
                              : app.status === "Reporté"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6 space-y-2">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-500">Aucun rendez-vous à venir</p>
                    <p className="text-[11px] text-slate-400">
                      Vous pouvez demander un rendez-vous en remplissant le formulaire ci-contre.
                    </p>
                  </div>
                )}
              </div>

              {/* Right col: Booking Form */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 space-y-4">
                <div className="border-b border-slate-200/60 pb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Prendre un rendez-vous</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Planifiez une consultation externe</p>
                </div>

                {rdvSubmitted ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2 animate-fade-in">
                    <Check className="w-8 h-8 text-emerald-600 mx-auto bg-white rounded-full p-1.5 shadow animate-bounce" />
                    <p className="text-xs font-bold text-emerald-800">Demande de RDV envoyée !</p>
                    <p className="text-[11px] text-emerald-600 leading-normal">
                      Votre demande a été enregistrée avec succès. Elle est actuellement en attente de confirmation par le médecin choisi.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleBookAppointment} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Spécialité / Motif</label>
                      <select
                        value={newRdvReason}
                        onChange={(e) => setNewRdvReason(e.target.value)}
                        className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-800"
                      >
                        <option value="Consultation Générale">Consultation Générale</option>
                        <option value="Pédiatrie">Pédiatrie</option>
                        <option value="Gynécologie">Gynécologie</option>
                        <option value="Cardiologie">Cardiologie</option>
                        <option value="Laboratoire d'analyses">Laboratoire d'analyses</option>
                        <option value="Urgences / Soins rapides">Urgences / Soins rapides</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Médecin Préféré</label>
                      <select
                        value={newRdvDoctor}
                        onChange={(e) => setNewRdvDoctor(e.target.value)}
                        className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-800"
                      >
                        <option value="Dr. Essoh Cyrille">Dr. Essoh Cyrille (Généraliste)</option>
                        <option value="Dr. Bamba Salimata">Dr. Bamba Salimata (Pédiatre)</option>
                        <option value="Dr. Kouamé Franck">Dr. Kouamé Franck (Cardiologue)</option>
                        <option value="Médecin de garde">Médecin de garde 24h/7</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Date</label>
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().split("T")[0]}
                          value={newRdvDate}
                          onChange={(e) => setNewRdvDate(e.target.value)}
                          className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Heure</label>
                        <select
                          value={newRdvTime}
                          onChange={(e) => setNewRdvTime(e.target.value)}
                          className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-800"
                        >
                          <option value="08:00">08:00</option>
                          <option value="09:00">09:00</option>
                          <option value="10:00">10:00</option>
                          <option value="11:00">11:00</option>
                          <option value="14:00">14:00</option>
                          <option value="15:00">15:00</option>
                          <option value="16:00">16:00</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Notes (Symptômes...)</label>
                      <textarea
                        value={newRdvNotes}
                        onChange={(e) => setNewRdvNotes(e.target.value)}
                        placeholder="Ex: Douleurs de tête, contrôle annuel..."
                        className="w-full h-16 text-xs font-medium bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-800 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-[#065f46] hover:bg-[#047857] text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Confirmer le rdv</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: INVOICES */}
          {patientTab === "factures" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Vos Factures & Règlements</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Retrouvez et imprimez l'historique de vos factures de soins et de pharmacie émis par la clinique.
                </p>
              </div>

              {myInvoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 font-sans">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-2">Réf Facture</th>
                        <th className="py-3 px-2">Date d'émission</th>
                        <th className="py-3 px-2">Détails Prestations</th>
                        <th className="py-3 px-2 text-right">Montant Total</th>
                        <th className="py-3 px-2 text-center">Statut règlement</th>
                        <th className="py-3 px-2">Mode de paiement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {myInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-2 font-mono font-black text-slate-800">{inv.id}</td>
                          <td className="py-3.5 px-2 text-slate-400">{inv.date}</td>
                          <td className="py-3.5 px-2 max-w-xs truncate">
                            {inv.items.map((it) => `${it.description} (x${it.quantity})`).join(", ")}
                          </td>
                          <td className="py-3.5 px-2 text-right font-black text-slate-800 font-mono">
                            {inv.amount.toLocaleString()} FCFA
                          </td>
                          <td className="py-3.5 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                              inv.status === "Payé"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : "bg-amber-50 text-amber-700 border border-amber-100"
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-slate-500 font-bold">{inv.paymentMethod}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6 space-y-2">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">Aucune facture enregistrée à votre nom</p>
                  <p className="text-[11px] text-slate-400">
                    Les factures de consultations ou de médicaments apparaîtront dès qu'elles seront validées par la caisse.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COMPLAINTS & SATISFACTION */}
          {patientTab === "reclamation" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left description */}
              <div className="space-y-4 lg:col-span-1">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3.5 text-emerald-900 leading-relaxed shadow-xs">
                  <h4 className="font-extrabold text-sm flex items-center gap-1.5 text-emerald-800">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>À votre écoute</span>
                  </h4>
                  <p className="text-xs font-medium">
                    La Clinique Santé Plus s'engage à fournir des soins d'excellence dans le respect total de votre bien-être.
                  </p>
                  <p className="text-xs font-medium">
                    Vos critiques constructives et appréciations nous permettent de rehausser continuellement la qualité de nos services d'accueil, d'administration et de soins médicaux.
                  </p>
                  <div className="pt-2 border-t border-emerald-200 text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                    Suivi direct par la Direction Générale
                  </div>
                </div>
              </div>

              {/* Right Form */}
              <div className="lg:col-span-2 bg-slate-50 border border-slate-200/60 rounded-xl p-6 space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Donner votre avis ou signaler une insatisfaction</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Chaque retour est lu attentivement par nos équipes administratives.
                  </p>
                </div>

                {compSubmitted ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3 animate-fade-in">
                    <Check className="w-10 h-10 text-emerald-600 mx-auto bg-white rounded-full p-2 shadow-md" />
                    <p className="text-sm font-extrabold text-emerald-800">Votre avis a bien été transmis !</p>
                    <p className="text-xs text-emerald-600 max-w-md mx-auto leading-relaxed">
                      Nous vous remercions sincèrement d'avoir pris le temps de nous écrire. Vos remarques seront présentées en comité de direction pour améliorer notre accueil et nos soins.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handlePostComplaint} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Catégorie</label>
                        <select
                          value={compCategory}
                          onChange={(e) => setCompCategory(e.target.value as any)}
                          className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-slate-800"
                        >
                          <option value="Qualité des soins">Qualité des soins</option>
                          <option value="Temps d'attente">Temps d'attente / Retard</option>
                          <option value="Accueil">Accueil / Secrétariat</option>
                          <option value="Tarification">Tarification / Devis</option>
                          <option value="Autre">Autre motif / Remerciements</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Degré d'importance</label>
                        <select
                          value={compSeverity}
                          onChange={(e) => setCompSeverity(e.target.value as any)}
                          className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-slate-800"
                        >
                          <option value="Basse">Basse (Avis simple ou suggestion)</option>
                          <option value="Moyenne">Moyenne (Réclamation sur le parcours)</option>
                          <option value="Critique">Critique (Urgence d'écoute ou éthique)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Votre Message / Témoignage</label>
                      <textarea
                        required
                        value={compDesc}
                        onChange={(e) => setCompDesc(e.target.value)}
                        placeholder="Veuillez décrire en quelques phrases votre expérience (positive ou négative)..."
                        className="w-full h-32 text-xs font-medium bg-white border border-slate-200 rounded-lg p-3 focus:outline-none focus:border-emerald-500 text-slate-800 resize-none leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#065f46] hover:bg-[#047857] text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ml-auto"
                    >
                      <span>Transmettre mon avis</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Support Info Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 border border-slate-200/60 rounded-2xl p-6 md:p-8 font-sans">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Nos Adresses</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Site Bingerville : Boulevard de la Nation, face au Jardin Botanique<br />
              Site Cocody : Rue des Jardins, à 100m du Lycée Technique
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs uppercase tracking-wider">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Contacts Clinique</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Urgences 24h/7 : <strong className="text-slate-700">+221 76 725 7479</strong><br />
              Administration : contact@cliniquesanteplus.com
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs uppercase tracking-wider">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Heures d'Ouverture</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Consultations externes : Lun - Ven (08h - 18h), Sam (08h - 13h)<br />
              Hospitalisation & Urgences : Continu 24h/24
            </p>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in py-4 max-w-5xl">
      
      {/* En-tête de bienvenue avec le nouveau logo et un fond dégradé de la marque */}
      <div className="bg-gradient-to-br from-[#065f46] to-[#047857] text-white rounded-2xl p-6 md:p-8 shadow-lg shadow-emerald-900/5 border border-[#047857]/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 md:gap-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            <Logo size={46} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight font-sans">
              Clinique Santé Plus
            </h1>
            <p className="text-sm md:text-base text-emerald-50/90 font-medium leading-relaxed max-w-3xl">
              Votre partenaire de confiance pour une prise en charge médicale personnalisée, moderne et sécurisée. Nous accompagnons chaque patient avec rigueur et humanité, du premier rendez-vous jusqu'au suivi thérapeutique complet.
            </p>
          </div>
        </div>
      </div>

      {/* Menu d'orientation métier épuré */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-7 shadow-xs hover:shadow-sm transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
              Espace de soins professionnel
            </span>
            <h3 className="text-lg font-bold text-slate-800 mt-2">{roleMessage.title}</h3>
            <p className="text-xs text-slate-500 max-w-xl leading-normal">{roleMessage.desc}</p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            {roleMessage.actions.map((act, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentView(act.view)}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  idx === 0 
                    ? "bg-[#065f46] text-white hover:bg-[#047857] hover:shadow-xs" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                <span>{act.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION EXCLUSIVE MÉDECIN : CONFIRMATION DES RENDEZ-VOUS */}
      {currentUserRole === UserRole.MEDECIN && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-7 shadow-xs hover:shadow-sm transition-all space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100 animate-pulse">
                Action requise
              </span>
              <h2 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2 mt-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>Confirmations des Rendez-vous Patient</span>
              </h2>
              <p className="text-xs text-slate-500">
                Gérez les demandes de consultations formulées en ligne par vos patients ci-dessous.
              </p>
            </div>
            <div className="shrink-0">
              <span className="px-3.5 py-1.5 bg-amber-500/10 text-amber-800 border border-amber-500/20 rounded-full text-xs font-black uppercase tracking-wider">
                {pendingConfirmations.length} en attente
              </span>
            </div>
          </div>

          {pendingConfirmations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingConfirmations.map((app) => (
                <div key={app.id} className="border border-slate-200/80 hover:border-emerald-200/80 bg-slate-50/40 rounded-xl p-5 flex flex-col justify-between gap-4 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-black text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        {app.id}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        Médecin : <span className="text-emerald-700 font-extrabold">{app.doctorName}</span>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-slate-400" />
                        {app.patientName}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {app.patientPhone}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-white border border-slate-100 p-2.5 rounded-lg text-xs font-medium">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Date demandée</span>
                        <span className="text-slate-700 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {app.date}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Heure</span>
                        <span className="text-slate-700 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> {app.time}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Motif de consultation</span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5 leading-normal">{app.reason}</p>
                    </div>

                    {app.notes && (
                      <div className="bg-amber-50/50 border border-amber-100/60 rounded-lg p-2.5 text-[11px] text-amber-900 leading-relaxed font-medium">
                        <span className="font-bold text-amber-950">Symptômes/Notes :</span> {app.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 border-t border-slate-200/40 pt-3">
                    <button
                      onClick={() => {
                        if (updateAppointment) {
                          updateAppointment({
                            ...app,
                            status: "Confirmé"
                          });
                          alert(`Le rendez-vous de ${app.patientName} a été confirmé avec succès !`);
                        }
                      }}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirmer le RDV</span>
                    </button>
                    <button
                      onClick={() => {
                        if (updateAppointment) {
                          updateAppointment({
                            ...app,
                            status: "Reporté"
                          });
                          alert(`Le rendez-vous de ${app.patientName} a été marqué comme reporté.`);
                        }
                      }}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-extrabold transition-all cursor-pointer"
                    >
                      Reporter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6 space-y-2">
              <Check className="w-10 h-10 text-emerald-500 mx-auto bg-white rounded-full p-2 border border-emerald-100 shadow-sm" />
              <p className="text-xs font-bold text-slate-600">Aucune demande en attente de confirmation</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Toutes les demandes de rendez-vous en ligne formulées par les patients ont été traitées. Félicitations !
              </p>
            </div>
          )}
        </div>
      )}

      {/* Section 1: Chiffres clés de la clinique */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <div className="w-1.5 h-6 bg-emerald-600 rounded-full" />
            La clinique en chiffres
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Une infrastructure robuste et une expertise médicale dédiée au service de votre santé au quotidien.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {stats.map((stat, i) => {
            const IconComponent = stat.icon;
            return (
              <div 
                key={i} 
                className="bg-white border border-slate-200/60 rounded-xl p-4 flex flex-col justify-between items-center text-center shadow-xs hover:border-emerald-200 transition-all group"
              >
                <div className={`p-2 rounded-lg ${stat.color} mb-3 group-hover:scale-110 transition-transform`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="text-xl md:text-2xl font-black text-slate-800 font-sans tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider leading-tight">
                    {stat.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Services de la clinique */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <div className="w-1.5 h-6 bg-emerald-600 rounded-full" />
            Nos spécialités & services cliniques
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Découvrez nos départements médicaux équipés de technologies modernes pour un diagnostic et un accompagnement optimal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {services.map((srv, i) => {
            const IconComp = srv.icon;
            return (
              <div 
                key={i} 
                className="bg-white border border-slate-200/60 rounded-xl p-5 flex items-start gap-4 shadow-xs hover:border-emerald-300 hover:shadow-xs transition-all group"
              >
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
                  <IconComp className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 tracking-tight group-hover:text-emerald-700 transition-colors">
                    {srv.name}
                  </h4>
                  <p className="text-xs text-slate-500 leading-normal font-medium">
                    {srv.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Informations utiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 border border-slate-200/60 rounded-2xl p-6 md:p-8">
        
        {/* Adresses */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-800">
            <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider">Nos Adresses</h3>
          </div>
          <div className="space-y-3.5 text-xs text-slate-600 font-medium">
            <div className="space-y-1 pl-1">
              <p className="font-bold text-slate-800">Site Bingerville (Principal)</p>
              <p className="leading-relaxed">Boulevard de la Nation, face au Jardin Botanique, Abidjan</p>
            </div>
            <div className="space-y-1 pl-1 border-t border-slate-200/50 pt-3">
              <p className="font-bold text-slate-800">Site Cocody</p>
              <p className="leading-relaxed">Rue des Jardins, à 100m du Lycée Technique, Abidjan</p>
            </div>
          </div>
        </div>

        {/* Contacts */}
        <div className="space-y-4 border-t md:border-t-0 md:border-x border-slate-200/80 pt-5 md:pt-0 md:px-6">
          <div className="flex items-center gap-2.5 text-emerald-800">
            <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
              <Phone className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider">Contacts</h3>
          </div>
          <div className="space-y-3.5 text-xs text-slate-600 font-medium">
            <div className="space-y-1 pl-1">
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Téléphone Général</p>
              <p className="text-base font-extrabold text-slate-800 tracking-tight">+221 76 725 7479</p>
            </div>
            <div className="space-y-1 pl-1 border-t border-slate-200/50 pt-3">
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Adresse E-mail</p>
              <p className="font-bold text-emerald-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                contact@cliniquesanteplus.com
              </p>
            </div>
          </div>
        </div>

        {/* Horaires et Urgences */}
        <div className="space-y-4 border-t md:border-t-0 border-slate-200/80 pt-5 md:pt-0">
          <div className="flex items-center gap-2.5 text-emerald-800">
            <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider">Horaires & Urgences</h3>
          </div>
          <div className="space-y-3 text-xs text-slate-600 font-medium">
            <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-2xs space-y-1">
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Urgences & Hospitalisation
              </p>
              <p className="font-black text-slate-800">24h/24 et 7j/7</p>
            </div>
            <div className="pl-1 space-y-1 pt-1 text-[11px] leading-relaxed">
              <p><span className="font-bold text-slate-700">Consultations externes :</span></p>
              <p>Lundi - Vendredi : 08h00 - 18h00</p>
              <p>Samedi : 08h00 - 13h00</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

