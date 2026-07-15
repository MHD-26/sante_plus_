import React, { useState, useEffect } from "react";
import { Appointment, Patient, AppointmentStatus, UserRole, AuditLog } from "../types";
import { AppwriteUser } from "../services/auth";
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle,
  XCircle,
  Trash2,
  Edit2,
  Plus,
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
  Download,
  AlertCircle,
  FileSpreadsheet,
  X,
} from "lucide-react";

interface AppointmentsProps {
  appointments: Appointment[];
  patients: Patient[];
  addPatient?: (patient: Omit<Patient, "id" | "createdAt" | "medicalHistory">) => Patient;
  addAppointment: (app: Omit<Appointment, "id">) => Appointment;
  updateAppointment: (app: Appointment) => void;
  deleteAppointment: (id: string) => void;
  currentUserRole: UserRole;
  addAuditLog: (log: Omit<AuditLog, "id" | "timestamp">) => void;
  authenticatedUser: AppwriteUser | null;
  autoOpenAddForm?: boolean;
  setAutoOpenAddForm?: (open: boolean) => void;
  preselectedPatientId?: string | null;
  setPreselectedPatientId?: (id: string | null) => void;
}

export default function AppointmentsView({
  appointments,
  patients,
  addPatient,
  addAppointment,
  updateAppointment,
  deleteAppointment,
  currentUserRole,
  addAuditLog,
  authenticatedUser,
  autoOpenAddForm,
  setAutoOpenAddForm,
  preselectedPatientId,
  setPreselectedPatientId,
}: AppointmentsProps) {
  // Local UI states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingApp, setEditingApp] = useState<Appointment | null>(null);
  const [selectedAppForReminder, setSelectedAppForReminder] = useState<Appointment | null>(null);
  const [reminderTemplate, setReminderTemplate] = useState<string>("confirm_rdv");
  const [copiedText, setCopiedText] = useState(false);

  // New Patient Form state variables
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [newPatientFirstName, setNewPatientFirstName] = useState("");
  const [newPatientLastName, setNewPatientLastName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [newPatientGender, setNewPatientGender] = useState("Féminin");
  const [newPatientBirthDate, setNewPatientBirthDate] = useState("1990-01-01");

  // Form states (Create / Edit)
  const [patientId, setPatientId] = useState("");
  const [doctorName, setDoctorName] = useState("Dr. Essoh Cyrille");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<AppointmentStatus>("À faire");

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("Tous");
  const [doctorFilter, setDoctorFilter] = useState<string>("Tous");

  // Filter lists
  const filteredApps = appointments.filter((app) => {
    const statusMatch = statusFilter === "Tous" || app.status === statusFilter;
    const doctorMatch = doctorFilter === "Tous" || app.doctorName === doctorFilter;
    return statusMatch && doctorMatch;
  });

  // Auto-open trigger from props (such as from quick actions or patient-specific scheduling actions)
  useEffect(() => {
    if (autoOpenAddForm) {
      // Clear forms
      setNewPatientFirstName("");
      setNewPatientLastName("");
      setNewPatientPhone("");
      setNewPatientGender("Féminin");
      setNewPatientBirthDate("1990-01-01");

      if (patients.length === 0) {
        setIsNewPatient(true);
        setPatientId("");
      } else {
        setIsNewPatient(false);
        if (preselectedPatientId) {
          setPatientId(preselectedPatientId);
        } else {
          setPatientId(patients[0].id);
        }
      }

      setDoctorName("Dr. Essoh Cyrille");
      setDate(new Date().toISOString().split("T")[0]);
      setTime("10:00");
      setReason("");
      setNotes("");
      setStatus("À faire");
      setEditingApp(null);
      setShowAddForm(true);

      if (setAutoOpenAddForm) {
        setAutoOpenAddForm(false);
      }
      if (setPreselectedPatientId) {
        setPreselectedPatientId(null);
      }
    }
  }, [autoOpenAddForm, preselectedPatientId, patients, setAutoOpenAddForm, setPreselectedPatientId]);

  // Handle open add form
  const openAddForm = () => {
    // Clear forms
    setNewPatientFirstName("");
    setNewPatientLastName("");
    setNewPatientPhone("");
    setNewPatientGender("Féminin");
    setNewPatientBirthDate("1990-01-01");

    if (patients.length === 0) {
      setIsNewPatient(true);
      setPatientId("");
    } else {
      setIsNewPatient(false);
      setPatientId(patients[0].id);
    }

    setDoctorName("Dr. Essoh Cyrille");
    setDate(new Date().toISOString().split("T")[0]);
    setTime("10:00");
    setReason("");
    setNotes("");
    setStatus("À faire");
    setEditingApp(null);
    setShowAddForm(true);
  };

  // Handle open edit form
  const openEditForm = (app: Appointment) => {
    setEditingApp(app);
    setPatientId(app.patientId);
    setDoctorName(app.doctorName);
    setDate(app.date);
    setTime(app.time);
    setReason(app.reason);
    setNotes(app.notes);
    setStatus(app.status);
    setShowAddForm(true);
  };

  // Save / Update logic
  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    
    let targetPatientId = patientId;
    let targetPatientName = "";
    let targetPatientPhone = "";

    if (isNewPatient && !editingApp) {
      if (!newPatientFirstName.trim() || !newPatientLastName.trim() || !newPatientPhone.trim()) {
        alert("Veuillez remplir les informations obligatoires du nouveau patient (Prénom, Nom, Téléphone).");
        return;
      }
      if (!addPatient) {
        alert("Le service d'enregistrement de patient n'est pas disponible pour le moment.");
        return;
      }
      const newPatient = addPatient({
        firstName: newPatientFirstName.trim(),
        lastName: newPatientLastName.trim(),
        phone: newPatientPhone.trim(),
        email: "",
        birthDate: newPatientBirthDate,
        gender: newPatientGender,
        bloodType: "O+",
        allergies: "",
        sensitiveDataSigned: true,
      });
      targetPatientId = newPatient.id;
      targetPatientName = `${newPatient.firstName} ${newPatient.lastName}`;
      targetPatientPhone = newPatient.phone;

      // Enregistrer l'audit log
      addAuditLog({
        userEmail: authenticatedUser?.email || "system",
        userName: authenticatedUser?.fullName || "Administrateur",
        userRole: currentUserRole,
        action: "Création de compte",
        details: `Nouveau patient ${targetPatientName} (${targetPatientId}) enregistré à la volée lors de la planification d'un RDV.`,
        status: "Succès",
      });
    } else {
      const selectedPatient = patients.find((p) => p.id === patientId);
      if (!selectedPatient) {
        alert("Veuillez sélectionner un patient.");
        return;
      }
      targetPatientId = selectedPatient.id;
      targetPatientName = `${selectedPatient.firstName} ${selectedPatient.lastName}`;
      targetPatientPhone = selectedPatient.phone;
    }

    const appData = {
      patientId: targetPatientId,
      patientName: targetPatientName,
      patientPhone: targetPatientPhone,
      doctorName,
      date,
      time,
      reason,
      status,
      notes,
    };

    if (editingApp) {
      updateAppointment({
        ...appData,
        id: editingApp.id,
      });
      addAuditLog({
        userEmail: authenticatedUser?.email || "system",
        userName: authenticatedUser?.fullName || "Administrateur",
        userRole: currentUserRole,
        action: "Modification importante",
        details: `Modification du rendez-vous ${editingApp.id} pour le patient ${targetPatientName}.`,
        status: "Succès",
      });
      alert("Rendez-vous modifié avec succès !");
    } else {
      const newApp = addAppointment(appData);
      addAuditLog({
        userEmail: authenticatedUser?.email || "system",
        userName: authenticatedUser?.fullName || "Administrateur",
        userRole: currentUserRole,
        action: "Modification importante",
        details: `Nouveau rendez-vous ${newApp.id} planifié le ${date} à ${time} pour le patient ${targetPatientName}.`,
        status: "Succès",
      });
      alert("Rendez-vous enregistré avec succès !");
    }

    setShowAddForm(false);
    setEditingApp(null);
  };

  // Reminder message templates generator
  const generateReminderMessage = (app: Appointment, templateType: string) => {
    const timeFormatted = app.time;
    const dateFormatted = new Date(app.date).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    switch (templateType) {
      case "confirm_rdv":
        return `Bonjour M./Mme ${app.patientName}, Clinique Santé Plus vous confirme votre rendez-vous avec ${app.doctorName} le ${dateFormatted} à ${timeFormatted} pour le motif : ${app.reason}. Veuillez répondre CONFIRMER ou ANNULER par retour de message. En cas de retard, merci de nous prévenir au +2250707123456. Cordialement.`;
      case "rappel_veille":
        return `RAPPEL : Bonjour M./Mme ${app.patientName}, nous vous rappelons votre rendez-vous de demain le ${dateFormatted} à ${timeFormatted} avec ${app.doctorName} à la Clinique Santé Plus. Merci de vous présenter 15 minutes avant. Prenez soin de vous !`;
      case "suivi_medical":
        return `Suivi Clinique : Bonjour M./Mme ${app.patientName}, ${app.doctorName} souhaiterait faire un point sur l'évolution de votre traitement prescrit lors de votre dernière consultation. Pouvons-nous planifier un court appel aujourd'hui ? Clinique Santé Plus.`;
      default:
        return "";
    }
  };

  const activeMessage = selectedAppForReminder
    ? generateReminderMessage(selectedAppForReminder, reminderTemplate)
    : "";

  const handleCopyReminder = () => {
    if (!activeMessage) return;
    navigator.clipboard.writeText(activeMessage);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Launch pre-filled WhatsApp link - free alternative to API!
  const getWhatsAppLaunchUrl = (app: Appointment) => {
    // Standardize phone format (remove leading spaces or non-digits, keep leading + if present)
    let cleanPhone = app.patientPhone.replace(/\s+/g, "");
    if (!cleanPhone.startsWith("+") && !cleanPhone.startsWith("225")) {
      // Auto prepend CI country code
      cleanPhone = "225" + cleanPhone;
    }
    // Remove '+' for WhatsApp API compatibility
    cleanPhone = cleanPhone.replace("+", "");

    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(activeMessage)}`;
  };

  // Export list of patients to contact today
  const handleExportContactList = () => {
    const contactRows = appointments
      .filter((a) => a.status === "À faire" || a.status === "Reporté")
      .map(
        (a) =>
          `Patient: ${a.patientName} | Tél: ${a.patientPhone} | Date RDV: ${a.date} | Statut: ${a.status}`
      )
      .join("\n");

    if (!contactRows) {
      alert("Aucun patient à contacter aujourd'hui !");
      return;
    }

    const blob = new Blob([contactRows], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `liste_contacts_rappels_${new Date().toISOString().split("T")[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper colors for status
  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case "À faire":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Envoyé":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Confirmé":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Reporté":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Absent":
        return "bg-red-100 text-red-800 border-red-200";
      case "En attente de confirmation":
        return "bg-amber-100 text-amber-800 border-amber-200 animate-pulse font-black";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Appointments List View (Left/Center 2 Cols) */}
      <div className="space-y-6 lg:col-span-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-display">
              Gestion des Rendez-vous
            </h2>
            <p className="text-xs text-slate-500">
              Planifiez, contrôlez et suivez l'état des confirmations patients.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportContactList}
              className="inline-flex items-center space-x-1.5 px-3 py-2 border border-emerald-200 text-emerald-800 bg-emerald-50 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
              title="Exporter la liste des rappels à faire"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Exporter Contacts</span>
            </button>

            {currentUserRole !== UserRole.COMPTABLE && currentUserRole !== UserRole.PHARMACIE && (
              <button
                onClick={openAddForm}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer hover:shadow-sm active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau RDV</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white p-4 border border-slate-100 rounded-xl shadow-xs flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <span className="font-bold">Filtrer par statut :</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded px-2.5 py-1 text-xs bg-slate-50 focus:outline-emerald-600"
            >
              <option value="Tous">Tous les statuts</option>
              <option value="En attente de confirmation">Demandes en attente</option>
              <option value="À faire">À faire</option>
              <option value="Envoyé">Rappel envoyé</option>
              <option value="Confirmé">Confirmé</option>
              <option value="Reporté">Reporté</option>
              <option value="Absent">Absent</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <span className="font-bold">Médecin :</span>
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="border border-slate-200 rounded px-2.5 py-1 text-xs bg-slate-50 focus:outline-emerald-600"
            >
              <option value="Tous">Tous les médecins</option>
              <option value="Dr. Essoh Cyrille">Dr. Essoh Cyrille</option>
              <option value="Dr. Kouamé Franck">Dr. Kouamé Franck</option>
              <option value="Dr. Bamba Salimata">Dr. Bamba Salimata</option>
            </select>
          </div>
        </div>

        {/* Appointments Table / Grid */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Date & Heure</th>
                  <th className="px-4 py-3">Médecin / Motif</th>
                  <th className="px-4 py-3">Rappel Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                {filteredApps.map((app) => (
                  <tr
                    key={app.id}
                    className={`hover:bg-slate-50/50 transition-colors ${selectedAppForReminder?.id === app.id ? "bg-emerald-50/30" : ""}`}
                  >
                    {/* Patient info */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-800">{app.patientName}</div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center space-x-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{app.patientPhone}</span>
                      </div>
                    </td>

                    {/* Date and time */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-700 flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.date}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.time}</span>
                      </div>
                    </td>

                    {/* Doctor and Reason */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-700">{app.doctorName}</div>
                      <div
                        className="text-[10px] text-slate-500 italic mt-0.5 max-w-xs truncate"
                        title={app.reason}
                      >
                        {app.reason}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] border font-bold ${getStatusBadge(app.status)}`}
                      >
                        {app.status}
                      </span>
                    </td>

                    {/* Row action buttons */}
                    <td className="px-4 py-3.5 text-right space-x-1">
                      {/* Quick confirmation checkmark for pending requests */}
                      {app.status === "En attente de confirmation" &&
                        (currentUserRole === UserRole.MEDECIN ||
                          currentUserRole === UserRole.ADMIN ||
                          currentUserRole === UserRole.ACCUEIL) && (
                          <button
                            onClick={() => {
                              updateAppointment({
                                ...app,
                                status: "Confirmé",
                              });
                              alert(
                                `Le rendez-vous de ${app.patientName} a été confirmé avec succès !`
                              );
                            }}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md border border-emerald-500 hover:border-emerald-600 transition-colors cursor-pointer"
                            title="Confirmer immédiatement la demande"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}

                      {/* Remind launcher selection */}
                      <button
                        onClick={() => setSelectedAppForReminder(app)}
                        className="p-1.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100 hover:bg-emerald-100 transition-colors"
                        title="Préparer le rappel patient"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>

                      {currentUserRole !== UserRole.COMPTABLE &&
                        currentUserRole !== UserRole.PHARMACIE && (
                          <>
                            <button
                              onClick={() => openEditForm(app)}
                              className="p-1.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200 hover:bg-slate-200 transition-colors"
                              title="Modifier le rendez-vous"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (
                                  window.confirm(`Supprimer le rendez-vous de ${app.patientName} ?`)
                                ) {
                                  deleteAppointment(app.id);
                                  if (authenticatedUser) {
                                    addAuditLog({
                                      userEmail: authenticatedUser.email,
                                      userName: authenticatedUser.fullName || "Utilisateur",
                                      userRole: currentUserRole,
                                      action: "Suppression Document",
                                      details: `Suppression définitive du rendez-vous du patient ${app.patientName} prévu le ${app.date} à ${app.time} avec ${app.doctorName}`,
                                      status: "Succès",
                                    });
                                  }
                                }
                              }}
                              className="p-1.5 bg-red-50 text-red-700 rounded-md border border-red-100 hover:bg-red-100 transition-colors"
                              title="Annuler/Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                    </td>
                  </tr>
                ))}

                {filteredApps.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-slate-400">
                      Aucun rendez-vous trouvé correspondant aux filtres actifs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Interactive Reminders Engine Panel (Right Sidebar Col) */}
      <div className="space-y-6">
        {/* Rappels WhatsApp Gratuits Engine */}
        <div className="bg-white border border-emerald-100 rounded-xl shadow-xs p-6 space-y-4">
          <div className="border-b border-emerald-50 pb-3">
            <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <span>Générateur de Rappels</span>
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Alternative robuste et gratuite aux API SMS payantes.
            </p>
          </div>

          {selectedAppForReminder ? (
            <div className="space-y-4">
              {/* Selected Patient Details Card */}
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-3 text-xs space-y-1">
                <div className="font-bold text-emerald-900">
                  {selectedAppForReminder.patientName}
                </div>
                <div className="text-[10px] text-slate-600">
                  N° Tél :{" "}
                  <span className="font-semibold">{selectedAppForReminder.patientPhone}</span>
                </div>
                <div className="text-[10px] text-slate-600">
                  Le :{" "}
                  <span className="font-semibold">
                    {selectedAppForReminder.date} à {selectedAppForReminder.time}
                  </span>
                </div>
              </div>

              {/* Template selection dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Modèle de Message :
                </label>
                <select
                  value={reminderTemplate}
                  onChange={(e) => setReminderTemplate(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 text-xs rounded p-2 focus:outline-emerald-600"
                >
                  <option value="confirm_rdv">Confirmation de Rendez-vous</option>
                  <option value="rappel_veille">Rappel la Veille (24h avant)</option>
                  <option value="suivi_medical">Demande Suivi Médical Post-traitement</option>
                </select>
              </div>

              {/* Live Preview textarea */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Aperçu du message :
                  </label>
                  <button
                    onClick={handleCopyReminder}
                    className="inline-flex items-center space-x-1 text-[10px] text-emerald-600 font-bold hover:underline"
                  >
                    {copiedText ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={activeMessage}
                  readOnly
                  rows={6}
                  className="w-full text-xs border border-slate-200 bg-slate-50 p-2.5 rounded focus:outline-none text-slate-700 leading-relaxed font-sans"
                />
              </div>

              {/* Launch WhatsApp Deep-Link */}
              <a
                href={getWhatsAppLaunchUrl(selectedAppForReminder)}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  // Automatically switch appointment reminder status to "Envoyé" upon clicking launch
                  updateAppointment({
                    ...selectedAppForReminder,
                    status: "Envoyé",
                  });
                }}
                className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition-all text-center"
              >
                <span>Envoyer par WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* Status Update Quick Buttons */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Mettre à jour le statut du rappel :
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <button
                    onClick={() =>
                      updateAppointment({ ...selectedAppForReminder, status: "Confirmé" })
                    }
                    className="p-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded font-semibold text-center"
                  >
                    ✓ Confirmé
                  </button>
                  <button
                    onClick={() =>
                      updateAppointment({ ...selectedAppForReminder, status: "Reporté" })
                    }
                    className="p-1.5 bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 rounded font-semibold text-center"
                  >
                    ➜ Reporté
                  </button>
                  <button
                    onClick={() =>
                      updateAppointment({ ...selectedAppForReminder, status: "Absent" })
                    }
                    className="p-1.5 bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 rounded font-semibold text-center"
                  >
                    ✗ Absent
                  </button>
                  <button
                    onClick={() => setSelectedAppForReminder(null)}
                    className="p-1.5 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 rounded font-semibold text-center"
                  >
                    Fermer l'aperçu
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400 space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p>
                Sélectionnez un patient dans la liste de gauche pour configurer et envoyer un
                rappel.
              </p>
            </div>
          )}
        </div>

        {/* Create / Edit Appointment Form Modal Overlay */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-xs animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 w-full max-w-lg relative animate-scale-up">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingApp(null);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                {editingApp ? "Modifier le Rendez-vous" : "Planifier un Rendez-vous"}
              </h3>

              <form onSubmit={handleSaveAppointment} className="space-y-3 text-xs">
                {/* Patient Selection & Dynamic Creation Section */}
                {!editingApp && (
                  <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Type de Patient
                    </span>
                    <div className="flex gap-2">
                      {patients.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsNewPatient(false)}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-extrabold transition-all border cursor-pointer ${
                            !isNewPatient
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          Patient Existant
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewPatient(true);
                          setPatientId("");
                        }}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-extrabold transition-all border cursor-pointer ${
                          isNewPatient
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        Nouveau Patient
                      </button>
                    </div>

                    {isNewPatient ? (
                      <div className="space-y-2.5 pt-2 animate-fade-in border-t border-slate-200/60 mt-2">
                        <span className="block text-[10px] font-black text-emerald-800 uppercase tracking-wider bg-emerald-100/60 px-2.5 py-1 rounded-md border border-emerald-200/60 w-max">
                          Créer une fiche patient rapide
                        </span>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-600">Prénom <span className="text-rose-500">*</span></label>
                            <input
                              type="text"
                              required
                              placeholder="Ex: Kouassi"
                              value={newPatientFirstName}
                              onChange={(e) => setNewPatientFirstName(e.target.value)}
                              className="w-full border border-slate-200 rounded p-2 bg-white focus:outline-emerald-600 focus:border-emerald-600 text-slate-800 text-xs font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-600">Nom <span className="text-rose-500">*</span></label>
                            <input
                              type="text"
                              required
                              placeholder="Ex: Koffi"
                              value={newPatientLastName}
                              onChange={(e) => setNewPatientLastName(e.target.value)}
                              className="w-full border border-slate-200 rounded p-2 bg-white focus:outline-emerald-600 focus:border-emerald-600 text-slate-800 text-xs font-semibold"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Numéro de téléphone <span className="text-rose-500">*</span></label>
                          <input
                            type="tel"
                            required
                            placeholder="Ex: +225 07 00 00 00 00"
                            value={newPatientPhone}
                            onChange={(e) => setNewPatientPhone(e.target.value)}
                            className="w-full border border-slate-200 rounded p-2 bg-white focus:outline-emerald-600 focus:border-emerald-600 text-slate-800 text-xs font-semibold"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-600">Genre</label>
                            <select
                              value={newPatientGender}
                              onChange={(e) => setNewPatientGender(e.target.value)}
                              className="w-full border border-slate-200 rounded p-2 bg-white focus:outline-emerald-600 focus:border-emerald-600 text-slate-800 text-xs font-semibold"
                            >
                              <option value="Féminin">Féminin</option>
                              <option value="Masculin">Masculin</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-600">Date de Naissance</label>
                            <input
                              type="date"
                              required
                              value={newPatientBirthDate}
                              onChange={(e) => setNewPatientBirthDate(e.target.value)}
                              className="w-full border border-slate-200 rounded p-2 bg-white focus:outline-emerald-600 focus:border-emerald-600 text-slate-800 text-xs font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 pt-2 border-t border-slate-200/60 mt-2">
                        <label className="font-bold text-slate-600">Sélectionner le patient existant <span className="text-rose-500">*</span></label>
                        <select
                          value={patientId}
                          required
                          onChange={(e) => setPatientId(e.target.value)}
                          className="w-full border border-slate-200 rounded p-2 bg-white focus:outline-emerald-600 focus:border-emerald-600 text-slate-800 text-xs font-semibold"
                        >
                          <option value="" disabled>-- Choisir un patient --</option>
                          {patients.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.firstName} {p.lastName} ({p.id}) - {p.phone}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {editingApp && (
                  <div className="space-y-1.5 bg-slate-100 border border-slate-200 p-3 rounded-xl">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient</span>
                    <span className="text-xs font-extrabold text-slate-700">{editingApp.patientName}</span>
                  </div>
                )}

                {/* Doctor selection */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Médecin consultant :</label>
                  <select
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full border border-slate-200 rounded p-2 bg-slate-50 focus:outline-emerald-600"
                  >
                    <option value="Dr. Essoh Cyrille">Dr. Essoh Cyrille</option>
                    <option value="Dr. Kouamé Franck">Dr. Kouamé Franck</option>
                    <option value="Dr. Bamba Salimata">Dr. Bamba Salimata</option>
                  </select>
                </div>

                {/* Date & Time fields */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600">Date :</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full border border-slate-200 rounded p-2 bg-slate-50 focus:outline-emerald-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600">Heure :</label>
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full border border-slate-200 rounded p-2 bg-slate-50 focus:outline-emerald-600"
                    />
                  </div>
                </div>

                {/* Motif Consultation */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Motif de Consultation :</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Paludisme, consultation prénatale, contrôle..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full border border-slate-200 rounded p-2 bg-slate-50 focus:outline-emerald-600"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Notes Secrétariat :</label>
                  <textarea
                    placeholder="Notes optionnelles..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-slate-200 rounded p-2 bg-slate-50 focus:outline-emerald-600"
                    rows={2}
                  />
                </div>

                {/* Status Selector (If Editing) */}
                {editingApp && (
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600">Statut du Rendez-vous :</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                      className="w-full border border-slate-200 rounded p-2 bg-slate-50 focus:outline-emerald-600"
                    >
                      <option value="En attente de confirmation">En attente de confirmation</option>
                      <option value="À faire">À faire</option>
                      <option value="Envoyé">Rappel envoyé</option>
                      <option value="Confirmé">Confirmé</option>
                      <option value="Reporté">Reporté</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </div>
                )}

                {/* Actions buttons */}
                <div className="flex space-x-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-center cursor-pointer transition-colors"
                  >
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingApp(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-center cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
