import React, { useState } from "react";
import {
  Patient,
  MedicalRecordEntry,
  UserRole,
  AuditLog,
  Consultation,
  Prescription,
  LabRequest,
  LabTest,
} from "../types";
import { AppwriteUser } from "../services/auth";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Heart,
  Search,
  FileText,
  Calendar,
  Phone,
  Mail,
  Award,
  Key,
  Lock,
  Unlock,
  Plus,
  PlusCircle,
  Sparkles,
  Stethoscope,
  Pill,
  FlaskConical,
  Printer,
  Check,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Activity,
  Trash2,
  X,
} from "lucide-react";

interface PatientsViewProps {
  patients: Patient[];
  consultations: Consultation[];
  prescriptions: Prescription[];
  labRequests: LabRequest[];
  addPatient: (patient: Omit<Patient, "id" | "createdAt" | "medicalHistory">) => Patient;
  updatePatient: (patient: Patient) => void;
  addMedicalHistoryEntry: (
    patientId: string,
    diagnosis: string,
    prescription: string,
    doctorName: string
  ) => void;
  addConsultation: (cons: Omit<Consultation, "id">) => Consultation;
  addPrescription: (pres: Omit<Prescription, "id">) => Prescription;
  addLabRequest: (lab: Omit<LabRequest, "id">) => LabRequest;
  updateLabRequest: (lab: LabRequest) => void;
  currentUserRole: UserRole;
  addAuditLog: (log: Omit<AuditLog, "id" | "timestamp">) => void;
  authenticatedUser: AppwriteUser | null;
  onScheduleAppointment?: (patientId: string) => void;
}

export default function PatientsView({
  patients,
  consultations,
  prescriptions,
  labRequests,
  addPatient,
  updatePatient,
  addMedicalHistoryEntry,
  addConsultation,
  addPrescription,
  addLabRequest,
  updateLabRequest,
  currentUserRole,
  addAuditLog,
  authenticatedUser,
  onScheduleAppointment,
}: PatientsViewProps) {
  // UI States
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    patients[0]?.id || null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Patient sub-tabs
  const [patientSubTab, setPatientSubTab] = useState<
    "dossier" | "consultations" | "prescriptions" | "lab"
  >("dossier");

  // Audit log trigger on patient select
  React.useEffect(() => {
    if (selectedPatientId && authenticatedUser) {
      const patient = patients.find((p) => p.id === selectedPatientId);
      if (patient) {
        addAuditLog({
          userEmail: authenticatedUser.email,
          userName: authenticatedUser.fullName || "Utilisateur",
          userRole: currentUserRole,
          action: "Consultation Dossier",
          details: `Consultation du dossier médical du patient ${patient.firstName} ${patient.lastName} (ID : ${patient.id})`,
          status: "Succès",
        });
      }
    }
  }, [selectedPatientId, authenticatedUser, currentUserRole, patients]);

  // Form States (New Patient)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("1990-01-01");
  const [gender, setGender] = useState("Féminin");
  const [bloodType, setBloodType] = useState("O+");
  const [allergies, setAllergies] = useState("");
  const [sensitiveDataSigned, setSensitiveDataSigned] = useState(true);

  // Form States (New Consultation)
  const [showAddConsultation, setShowAddConsultation] = useState(false);
  const [consTemp, setConsTemp] = useState(37.0);
  const [consWeight, setConsWeight] = useState(70);
  const [consBP, setConsBP] = useState("12/8");
  const [consHeartRate, setConsHeartRate] = useState(75);
  const [consSymptoms, setConsSymptoms] = useState("");
  const [consDiagnosis, setConsDiagnosis] = useState("");
  const [consNotes, setConsNotes] = useState("");
  const [consDoctor, setConsDoctor] = useState(
    currentUserRole === UserRole.MEDECIN ? "Dr. Essoh Cyrille" : "Dr. Kouamé Franck"
  );

  // Form States (New Prescription)
  const [showAddPrescription, setShowAddPrescription] = useState(false);
  const [presMedItems, setPresMedItems] = useState([
    { medicationName: "", dosage: "1 cp", frequency: "3 fois par jour", duration: "5 jours" },
  ]);
  const [presDoctor, setPresDoctor] = useState(
    currentUserRole === UserRole.MEDECIN ? "Dr. Essoh Cyrille" : "Dr. Kouamé Franck"
  );
  const [presNotes, setPresNotes] = useState("");
  const [selectedPrescriptionForPrint, setSelectedPrescriptionForPrint] =
    useState<Prescription | null>(null);

  // Form States (New Lab Request)
  const [showAddLabRequest, setShowAddLabRequest] = useState(false);
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>([]);
  const [labDoctor, setLabDoctor] = useState(
    currentUserRole === UserRole.MEDECIN ? "Dr. Essoh Cyrille" : "Dr. Kouamé Franck"
  );
  const [labNotes, setLabNotes] = useState("");

  // Lab Results Entry (Technician Mode)
  const [editingLabRequestId, setEditingLabRequestId] = useState<string | null>(null);
  const [labTestResults, setLabTestResults] = useState<{ [key: string]: string }>({});
  const [labTechnicianName, setLabTechnicianName] = useState("Yao Kouassi (Technicien)");

  // Popular clinical tests preset
  const PRESET_LAB_TESTS = [
    "Test de Diagnostic Rapide (TDR Paludisme)",
    "Goutte Épaisse (Paludisme)",
    "Numération Formule Sanguine (NFS / FNS)",
    "Sérodiagnostic de Widal & Félix (Typhoïde)",
    "Glycémie à jeun",
    "Examen Cytobactériologique des Urines (ECBU)",
    "Créatininémie",
    "Urée sanguine",
  ];

  // Search filter
  const filteredPatients = patients.filter((p) => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    return (
      fullName.includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  // Filter clinical data by patient
  const patientConsultations = consultations.filter((c) => c.patientId === selectedPatientId);
  const patientPrescriptions = prescriptions.filter((p) => p.patientId === selectedPatientId);
  const patientLabRequests = labRequests.filter((l) => l.patientId === selectedPatientId);

  // Role permissions
  const isDoctorOrAdmin =
    currentUserRole === UserRole.MEDECIN || currentUserRole === UserRole.ADMIN;
  const isLabOrAdmin =
    currentUserRole === UserRole.LABORATOIRE || currentUserRole === UserRole.ADMIN;

  // Handle Save Patient
  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !phone) {
      alert("Veuillez remplir les champs obligatoires (Prénom, Nom, Téléphone).");
      return;
    }

    const newPatient = addPatient({
      firstName,
      lastName,
      phone,
      email,
      birthDate,
      gender,
      bloodType,
      allergies,
      sensitiveDataSigned,
    });

    addAuditLog({
      userEmail: authenticatedUser?.email || "system",
      userName: authenticatedUser?.fullName || "Administrateur",
      userRole: currentUserRole,
      action: "Création de compte",
      details: `Création de la fiche du patient ${lastName} ${firstName} (ID : ${newPatient.id})`,
      status: "Succès",
    });

    setSelectedPatientId(newPatient.id);
    setShowAddForm(false);

    // Reset fields
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setBirthDate("1990-01-01");
    setGender("Féminin");
    setBloodType("O+");
    setAllergies("");
    setSensitiveDataSigned(true);
  };

  // Handle Toggle GDPR Consent
  const handleToggleSensitiveData = () => {
    if (!selectedPatient) return;
    const updated = {
      ...selectedPatient,
      sensitiveDataSigned: !selectedPatient.sensitiveDataSigned,
    };
    updatePatient(updated);

    addAuditLog({
      userEmail: authenticatedUser?.email || "system",
      userName: authenticatedUser?.fullName || "Administrateur",
      userRole: currentUserRole,
      action: "Modification importante",
      details: `${
        updated.sensitiveDataSigned ? "Signature" : "Révocation"
      } du consentement de protection des données sensibles pour le patient ${selectedPatient.lastName} ${selectedPatient.firstName}`,
      status: "Succès",
    });
  };

  // Handle Save Consultation
  const handleSaveConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    // 1. Create clinical consultation record
    const consultation = addConsultation({
      patientId: selectedPatient.id,
      patientName: `${selectedPatient.lastName} ${selectedPatient.firstName}`,
      doctorName: consDoctor,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      temperature: Number(consTemp),
      weight: Number(consWeight),
      bloodPressure: consBP,
      heartRate: Number(consHeartRate),
      symptoms: consSymptoms,
      diagnosis: consDiagnosis,
      notes: consNotes,
    });

    // 2. Append general summary to medical history timeline
    const historySummary = `[Consultation] Temp: ${consTemp}°C, TA: ${consBP}, Pouls: ${consHeartRate} bpm. Symptômes: ${consSymptoms}. Notes de traitement: ${consNotes}`;
    addMedicalHistoryEntry(selectedPatient.id, consDiagnosis, historySummary, consDoctor);

    addAuditLog({
      userEmail: authenticatedUser?.email || "system",
      userName: authenticatedUser?.fullName || "Médecin",
      userRole: currentUserRole,
      action: "Modification importante",
      details: `Enregistrement d'une nouvelle consultation (ID : ${consultation.id}) pour le patient ${selectedPatient.lastName} ${selectedPatient.firstName}`,
      status: "Succès",
    });

    // Reset Form
    setShowAddConsultation(false);
    setConsSymptoms("");
    setConsDiagnosis("");
    setConsNotes("");
    setPatientSubTab("consultations");
  };

  // Handle Save Prescription
  const handleSavePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const validItems = presMedItems.filter((item) => item.medicationName.trim() !== "");
    if (validItems.length === 0) {
      alert("Veuillez ajouter au moins un médicament valide.");
      return;
    }

    const newPres = addPrescription({
      patientId: selectedPatient.id,
      patientName: `${selectedPatient.lastName} ${selectedPatient.firstName}`,
      doctorName: presDoctor,
      date: new Date().toISOString().split("T")[0],
      items: validItems,
      status: "Prescrite",
      notes: presNotes,
    });

    addAuditLog({
      userEmail: authenticatedUser?.email || "system",
      userName: authenticatedUser?.fullName || "Médecin",
      userRole: currentUserRole,
      action: "Modification importante",
      details: `Prescription médicale émise (ID : ${newPres.id}, ${validItems.length} médicaments) pour ${selectedPatient.lastName} ${selectedPatient.firstName}`,
      status: "Succès",
    });

    setShowAddPrescription(false);
    setPresMedItems([
      { medicationName: "", dosage: "1 cp", frequency: "3 fois par jour", duration: "5 jours" },
    ]);
    setPresNotes("");
    setPatientSubTab("prescriptions");
  };

  // Add Row to prescription wizard
  const addPrescriptionRow = () => {
    setPresMedItems([
      ...presMedItems,
      { medicationName: "", dosage: "1 cp", frequency: "3 fois par jour", duration: "5 jours" },
    ]);
  };

  // Remove Row from prescription wizard
  const removePrescriptionRow = (index: number) => {
    if (presMedItems.length === 1) return;
    setPresMedItems(presMedItems.filter((_, i) => i !== index));
  };

  // Update prescription row input
  const updatePrescriptionRow = (index: number, field: string, value: string) => {
    const updated = presMedItems.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setPresMedItems(updated);
  };

  // Handle Save Lab Request
  const handleSaveLabRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    if (selectedLabTests.length === 0) {
      alert("Veuillez cocher au moins une analyse médicale.");
      return;
    }

    const testObjects: LabTest[] = selectedLabTests.map((testName) => ({
      name: testName,
      status: "En attente",
    }));

    const newLab = addLabRequest({
      patientId: selectedPatient.id,
      patientName: `${selectedPatient.lastName} ${selectedPatient.firstName}`,
      doctorName: labDoctor,
      date: new Date().toISOString().split("T")[0],
      tests: testObjects,
      status: "En attente",
      notes: labNotes,
    });

    addAuditLog({
      userEmail: authenticatedUser?.email || "system",
      userName: authenticatedUser?.fullName || "Médecin",
      userRole: currentUserRole,
      action: "Modification importante",
      details: `Demande d'analyses de laboratoire émise (ID : ${newLab.id}, ${testObjects.length} tests) pour ${selectedPatient.lastName} ${selectedPatient.firstName}`,
      status: "Succès",
    });

    setShowAddLabRequest(false);
    setSelectedLabTests([]);
    setLabNotes("");
    setPatientSubTab("lab");
  };

  // Handle Toggle Test Selection
  const handleToggleLabTestSelect = (testName: string) => {
    if (selectedLabTests.includes(testName)) {
      setSelectedLabTests(selectedLabTests.filter((t) => t !== testName));
    } else {
      setSelectedLabTests([...selectedLabTests, testName]);
    }
  };

  // Handle Save Lab Results (Technician role)
  const handleSaveLabResults = (e: React.FormEvent, request: LabRequest) => {
    e.preventDefault();

    const updatedTests: LabTest[] = request.tests.map((test) => {
      const enteredResult = labTestResults[test.name] || "";
      return {
        ...test,
        result: enteredResult,
        status: enteredResult.trim() !== "" ? "Prêt" : "En attente",
      };
    });

    const isAllReady = updatedTests.every((t) => t.status === "Prêt");

    const updatedRequest: LabRequest = {
      ...request,
      tests: updatedTests,
      status: isAllReady ? "Prêt" : "En cours",
      technicianName: labTechnicianName,
      updatedAt: new Date().toISOString(),
    };

    updateLabRequest(updatedRequest);

    addAuditLog({
      userEmail: authenticatedUser?.email || "system",
      userName: authenticatedUser?.fullName || "Laboratoire",
      userRole: currentUserRole,
      action: "Modification importante",
      details: `Mise à jour des résultats d'analyses labo (ID : ${request.id}, Statut : ${updatedRequest.status}) pour ${request.patientName}`,
      status: "Succès",
    });

    setEditingLabRequestId(null);
    setLabTestResults({});
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 p-4 lg:p-6" id="patients-view-container">
      {/* LEFT COLUMN: Patient Directory List (xl:col-span-4) */}
      <div className="xl:col-span-4 bg-white border border-slate-100 rounded-xl shadow-xs flex flex-col h-[calc(100vh-120px)] min-h-[500px]">
        {/* Directory Header */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center space-x-1.5 font-display text-base">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Annuaire des Patients</span>
            </h3>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Nouveau</span>
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-emerald-600"
            />
          </div>
        </div>

        {/* Directory Patients list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {filteredPatients.map((p) => {
            const isSelected = p.id === selectedPatientId;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPatientId(p.id);
                  setShowAddForm(false);
                }}
                className={`w-full text-left p-4 transition flex items-start space-x-3 hover:bg-slate-50/50 ${
                  isSelected ? "bg-emerald-50/60 border-l-4 border-emerald-600 pl-3" : "pl-4"
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm flex-shrink-0">
                  {p.lastName.charAt(0)}
                  {p.firstName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex justify-between items-center">
                    <p
                      className={`text-xs font-bold truncate ${isSelected ? "text-emerald-950" : "text-slate-800"}`}
                    >
                      {p.lastName} {p.firstName}
                    </p>
                    <span className="text-[9px] font-mono font-semibold text-slate-400 uppercase">
                      {p.id}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate font-mono">{p.phone}</p>
                  <div className="flex items-center space-x-1.5 pt-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[9px] text-slate-400 font-medium">
                      Groupe : {p.bloodType}
                    </span>
                    {p.sensitiveDataSigned ? (
                      <ShieldCheck className="w-3 h-3 text-emerald-600 inline ml-auto" />
                    ) : (
                      <Shield className="w-3 h-3 text-red-400 inline ml-auto" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {filteredPatients.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              Aucun patient trouvé pour "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Patient Detail Folder / Add Form (xl:col-span-8) */}
      <div className="xl:col-span-8 h-[calc(100vh-120px)] min-h-[500px] overflow-y-auto">
        {showAddForm ? (
          /* Create New Patient Form */
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 flex items-center space-x-2 font-display text-base">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <span>Enregistrer un Nouveau Patient (CI Standard)</span>
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="w-7 h-7 bg-slate-50 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSavePatient}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs"
            >
              <div className="space-y-1">
                <label className="font-semibold text-slate-600">
                  Nom de famille <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: KOUASSI"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value.toUpperCase())}
                  className="w-full border border-slate-200 rounded p-2 focus:outline-emerald-600 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">
                  Prénom(s) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Marie-Françoise"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-slate-200 rounded p-2 focus:outline-emerald-600 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">
                  Numéro de téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: +2250707123456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded p-2 focus:outline-emerald-600 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Adresse Email</label>
                <input
                  type="email"
                  placeholder="Ex: m.kouassi@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded p-2 focus:outline-emerald-600 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 col-span-1 md:col-span-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Date de naissance</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full border border-slate-200 rounded p-2 focus:outline-emerald-600 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Genre</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full border border-slate-200 rounded p-2 focus:outline-emerald-600 bg-white"
                  >
                    <option value="Féminin">Féminin</option>
                    <option value="Masculin">Masculin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 col-span-1 md:col-span-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Groupe Sanguin</label>
                  <select
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className="w-full border border-slate-200 rounded p-2 focus:outline-emerald-600 bg-white"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Allergies connues</label>
                  <input
                    type="text"
                    placeholder="Ex: Pénicilline, arachides..."
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full border border-slate-200 rounded p-2 focus:outline-emerald-600 bg-white"
                  />
                </div>
              </div>

              {/* GDPR Data protection flag */}
              <div className="col-span-1 md:col-span-2 bg-emerald-50/50 p-3 rounded border border-emerald-100 flex items-center space-x-2.5 mt-2">
                <input
                  type="checkbox"
                  id="sensitive_signed_form"
                  checked={sensitiveDataSigned}
                  onChange={(e) => setSensitiveDataSigned(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 rounded cursor-pointer"
                />
                <label
                  htmlFor="sensitive_signed_form"
                  className="font-semibold text-emerald-950 leading-relaxed cursor-pointer select-none"
                >
                  Le patient donne son consentement éclairé pour la protection et l'enregistrement
                  sécurisé de ses données médicales et sensibles (Réglementation RGPD / Sécurité
                  CI).
                </label>
              </div>

              <div className="col-span-1 md:col-span-2 flex space-x-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-center transition shadow-xs cursor-pointer"
                >
                  Enregistrer la Fiche Patient
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-center transition cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        ) : selectedPatient ? (
          /* Detailed Patient Folder View */
          <div className="space-y-6">
            {/* Folder Header Banner */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase tracking-wider">
                  Dossier N°: {selectedPatient.id}
                </span>
                <h3 className="text-lg font-bold text-slate-800 font-display flex items-center space-x-2">
                  <span>{selectedPatient.lastName}</span>
                  <span className="text-slate-600 font-medium">{selectedPatient.firstName}</span>
                </h3>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Né(e) le: {selectedPatient.birthDate}</span>
                  </span>
                  <span>•</span>
                  <span>Genre: {selectedPatient.gender}</span>
                </div>
                {currentUserRole !== UserRole.COMPTABLE && currentUserRole !== UserRole.PHARMACIE && (
                  <button
                    onClick={() => {
                      if (onScheduleAppointment) {
                        onScheduleAppointment(selectedPatient.id);
                      }
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer mt-2"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Planifier un RDV</span>
                  </button>
                )}
              </div>

              {/* Security Consent Toggle status */}
              <div className="flex flex-col items-end">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Sécurité des Données :
                  </span>
                  {selectedPatient.sensitiveDataSigned ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-bold uppercase">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Consentement OK</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 text-[9px] font-bold uppercase">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Bloqué / Non Signé</span>
                    </span>
                  )}
                </div>

                <button
                  onClick={handleToggleSensitiveData}
                  className="text-[10px] text-slate-500 hover:text-emerald-700 underline font-semibold mt-1 cursor-pointer"
                >
                  {selectedPatient.sensitiveDataSigned
                    ? "Résilier le consentement de protection"
                    : "Faire signer le consentement de sécurité"}
                </button>
              </div>
            </div>

            {/* General Health indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs text-center">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  Groupe Sanguin
                </span>
                <p className="text-lg font-black text-emerald-800 font-mono mt-0.5">
                  {selectedPatient.bloodType}
                </p>
              </div>
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs text-center col-span-1 md:col-span-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  Allergies Signalées
                </span>
                <p
                  className="text-xs font-bold text-red-700 truncate mt-1"
                  title={selectedPatient.allergies}
                >
                  {selectedPatient.allergies || "Aucune allergie connue"}
                </p>
              </div>
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs text-center">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  Contact Téléphonique
                </span>
                <p className="text-xs font-bold text-slate-700 font-mono mt-1.5">
                  {selectedPatient.phone}
                </p>
              </div>
            </div>

            {/* IF NOT SIGNED: Lock Content Block */}
            {!selectedPatient.sensitiveDataSigned ? (
              <div className="bg-white border border-slate-100 rounded-xl shadow-xs p-12 text-center max-w-md mx-auto space-y-4">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto ring-4 ring-red-50">
                  <Lock className="w-6 h-6" />
                </div>
                <h5 className="font-bold text-slate-800 text-sm">
                  Dossier Médical Sensible Verrouillé
                </h5>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Conformément aux normes RGPD de confidentialité des informations médicales, les
                  diagnostics, consultations, prescriptions et résultats d'analyses de ce patient
                  sont inaccessibles. Vous devez d'abord faire signer le consentement de sécurité
                  électronique par le patient.
                </p>
                <button
                  onClick={handleToggleSensitiveData}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm cursor-pointer transition"
                >
                  Signer et Déverrouiller le Dossier
                </button>
              </div>
            ) : (
              /* IF SIGNED: Render Beautiful Multi-Tab Clinical Console */
              <div className="space-y-4">
                {/* Clinical Tabs Bar */}
                <div className="flex border-b border-slate-200 bg-white px-2 py-1 rounded-xl shadow-2xs gap-1">
                  <button
                    onClick={() => {
                      setPatientSubTab("dossier");
                      setShowAddConsultation(false);
                      setShowAddPrescription(false);
                      setShowAddLabRequest(false);
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      patientSubTab === "dossier"
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Historique Clinique</span>
                  </button>

                  <button
                    onClick={() => {
                      setPatientSubTab("consultations");
                      setShowAddConsultation(false);
                      setShowAddPrescription(false);
                      setShowAddLabRequest(false);
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      patientSubTab === "consultations"
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span className="hidden sm:inline">Consultations</span>
                    {patientConsultations.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-mono font-bold">
                        {patientConsultations.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setPatientSubTab("prescriptions");
                      setShowAddConsultation(false);
                      setShowAddPrescription(false);
                      setShowAddLabRequest(false);
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      patientSubTab === "prescriptions"
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Pill className="w-4 h-4" />
                    <span className="hidden sm:inline">Ordonnances</span>
                    {patientPrescriptions.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-mono font-bold">
                        {patientPrescriptions.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setPatientSubTab("lab");
                      setShowAddConsultation(false);
                      setShowAddPrescription(false);
                      setShowAddLabRequest(false);
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      patientSubTab === "lab"
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <FlaskConical className="w-4 h-4" />
                    <span className="hidden sm:inline">Laboratoire</span>
                    {patientLabRequests.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-mono font-bold">
                        {patientLabRequests.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* TAB CONTENT: 1. HISTORIQUE CLINIQUE (TIMELINE) */}
                {patientSubTab === "dossier" && (
                  <div className="bg-white border border-slate-100 rounded-xl shadow-xs p-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>Antécédents Cliniques & Chronologie de Santé</span>
                      </h4>
                    </div>

                    <div className="relative border-l border-slate-150 pl-6 ml-3 space-y-5">
                      {selectedPatient.medicalHistory.map((entry) => (
                        <div key={entry.id} className="relative">
                          {/* Dot indicator */}
                          <span className="absolute -left-[31px] top-1 w-3 h-3 bg-emerald-500 rounded-full ring-4 ring-white"></span>

                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800">{entry.diagnosis}</span>
                              <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                                {entry.date}
                              </span>
                            </div>
                            <p className="text-slate-600 leading-relaxed font-sans bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                              <span className="font-bold block text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">
                                Compte-rendu :
                              </span>
                              {entry.prescription}
                            </p>
                            <div className="text-[10px] text-slate-400 font-medium">
                              Rédigé par{" "}
                              <span className="font-bold text-slate-500">{entry.doctorName}</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {selectedPatient.medicalHistory.length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-xs">
                          Aucun antécédent médical enregistré sur la ligne de temps pour le moment.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: 2. CONSULTATIONS */}
                {patientSubTab === "consultations" && (
                  <div className="space-y-4">
                    {/* Consultations List & Action Header */}
                    <div className="bg-white border border-slate-100 rounded-xl shadow-xs p-5 space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                          <Stethoscope className="w-4 h-4 text-emerald-600" />
                          <span>Historique des Consultations Médicales</span>
                        </h4>
                        {isDoctorOrAdmin && !showAddConsultation && (
                          <button
                            onClick={() => setShowAddConsultation(true)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span>Nouvelle Consultation</span>
                          </button>
                        )}
                      </div>

                      {/* Add Consultation Wizard Form */}
                      {showAddConsultation && (
                        <form
                          onSubmit={handleSaveConsultation}
                          className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs"
                        >
                          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                            <span className="font-bold text-emerald-950 flex items-center space-x-1">
                              <Sparkles className="w-4 h-4 text-emerald-600" />
                              <span>Saisie Paramètres Vitaux & Diagnostique</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowAddConsultation(false)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Vital Signs Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                            <div className="space-y-1">
                              <label className="font-semibold text-slate-500">
                                Température (°C)
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                required
                                value={consTemp}
                                onChange={(e) => setConsTemp(Number(e.target.value))}
                                className="w-full border border-slate-200 rounded p-1.5 text-center font-bold text-slate-700 bg-slate-50"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-semibold text-slate-500">Poids (kg)</label>
                              <input
                                type="number"
                                required
                                value={consWeight}
                                onChange={(e) => setConsWeight(Number(e.target.value))}
                                className="w-full border border-slate-200 rounded p-1.5 text-center font-bold text-slate-700 bg-slate-50"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-semibold text-slate-500">
                                Tension Artérielle
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="12/8"
                                value={consBP}
                                onChange={(e) => setConsBP(e.target.value)}
                                className="w-full border border-slate-200 rounded p-1.5 text-center font-bold text-slate-700 bg-slate-50"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-semibold text-slate-500">Pouls (bpm)</label>
                              <input
                                type="number"
                                required
                                value={consHeartRate}
                                onChange={(e) => setConsHeartRate(Number(e.target.value))}
                                className="w-full border border-slate-200 rounded p-1.5 text-center font-bold text-slate-700 bg-slate-50"
                              />
                            </div>
                          </div>

                          {/* Clinical Notes Form Fields */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-600">
                                Symptômes & Plaintes :
                              </label>
                              <textarea
                                required
                                rows={2}
                                placeholder="Ex: Céphalées, douleurs musculaires, fatigue excessive..."
                                value={consSymptoms}
                                onChange={(e) => setConsSymptoms(e.target.value)}
                                className="w-full border border-slate-200 rounded p-2 bg-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-600">
                                Diagnostic Médical :
                              </label>
                              <textarea
                                required
                                rows={2}
                                placeholder="Ex: Accès palustre simple biologique suspecté..."
                                value={consDiagnosis}
                                onChange={(e) => setConsDiagnosis(e.target.value)}
                                className="w-full border border-slate-200 rounded p-2 bg-white"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-600">
                              Traitement Médical & Directives cliniques :
                            </label>
                            <textarea
                              required
                              rows={2}
                              placeholder="Repos médical, posologies, examens à programmer, etc."
                              value={consNotes}
                              onChange={(e) => setConsNotes(e.target.value)}
                              className="w-full border border-slate-200 rounded p-2 bg-white"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-600">
                                Médecin en charge :
                              </label>
                              <input
                                type="text"
                                required
                                value={consDoctor}
                                onChange={(e) => setConsDoctor(e.target.value)}
                                className="w-full border border-slate-200 rounded p-2 bg-white font-semibold text-slate-700"
                              />
                            </div>
                            <div className="flex items-end justify-end space-x-2 pt-2">
                              <button
                                type="submit"
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer transition shadow-xs"
                              >
                                Enregistrer la Consultation
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowAddConsultation(false)}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold cursor-pointer"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        </form>
                      )}

                      {/* Display Patient Consultations List */}
                      <div className="space-y-4">
                        {patientConsultations.map((cons) => (
                          <div
                            key={cons.id}
                            className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3"
                          >
                            <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold uppercase">
                                  {cons.id}
                                </span>
                                <span className="font-bold text-slate-800 text-xs">
                                  {cons.diagnosis}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500 font-semibold">
                                {cons.date} à {cons.time}
                              </span>
                            </div>

                            {/* Indicators bar */}
                            <div className="grid grid-cols-4 gap-2 text-center bg-white p-2 rounded-lg border border-slate-100 text-[10px]">
                              <div>
                                <span className="text-slate-400 block font-semibold">TEMP.</span>
                                <span className="font-mono font-bold text-emerald-700">
                                  {cons.temperature}°C
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-semibold">POIDS</span>
                                <span className="font-mono font-bold text-emerald-700">
                                  {cons.weight} kg
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-semibold">TA</span>
                                <span className="font-mono font-bold text-emerald-700">
                                  {cons.bloodPressure}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-semibold">POULS</span>
                                <span className="font-mono font-bold text-emerald-700">
                                  {cons.heartRate} bpm
                                </span>
                              </div>
                            </div>

                            {/* Details text */}
                            <div className="text-xs space-y-1 text-slate-600">
                              <p>
                                <strong className="text-slate-800">Symptômes :</strong>{" "}
                                {cons.symptoms}
                              </p>
                              <p>
                                <strong className="text-slate-800">Directives & Notes :</strong>{" "}
                                {cons.notes}
                              </p>
                            </div>

                            <div className="text-[10px] text-slate-400 flex justify-between items-center pt-1 border-t border-slate-100">
                              <span>
                                Auteur :{" "}
                                <strong className="text-slate-600">{cons.doctorName}</strong>
                              </span>
                              <span className="font-semibold text-emerald-600">
                                Validé en Clinique
                              </span>
                            </div>
                          </div>
                        ))}

                        {patientConsultations.length === 0 && (
                          <div className="text-center py-6 text-slate-400 text-xs">
                            Aucune consultation enregistrée pour ce patient.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: 3. ORDONNANCES */}
                {patientSubTab === "prescriptions" && (
                  <div className="space-y-4">
                    {/* Prescription list & Wizard Header */}
                    <div className="bg-white border border-slate-100 rounded-xl shadow-xs p-5 space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                          <Pill className="w-4 h-4 text-emerald-600" />
                          <span>Gestion des Ordonnances Médicales</span>
                        </h4>
                        {isDoctorOrAdmin && !showAddPrescription && (
                          <button
                            onClick={() => setShowAddPrescription(true)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span>Prescrire</span>
                          </button>
                        )}
                      </div>

                      {/* Add Prescription wizard Form */}
                      {showAddPrescription && (
                        <form
                          onSubmit={handleSavePrescription}
                          className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs"
                        >
                          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                            <span className="font-bold text-emerald-950 flex items-center space-x-1">
                              <Sparkles className="w-4 h-4 text-emerald-600" />
                              <span>Création de l'ordonnance</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowAddPrescription(false)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Med Rows List */}
                          <div className="space-y-2">
                            <label className="font-bold text-slate-700 block">
                              Médicaments prescrits :
                            </label>

                            {presMedItems.map((row, index) => (
                              <div
                                key={index}
                                className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-slate-200 shadow-3xs"
                              >
                                <div className="col-span-4 space-y-0.5">
                                  <input
                                    type="text"
                                    required
                                    placeholder="Nom du médicament (ex: Coartem)"
                                    value={row.medicationName}
                                    onChange={(e) =>
                                      updatePrescriptionRow(index, "medicationName", e.target.value)
                                    }
                                    className="w-full border border-slate-200 rounded p-1.5"
                                  />
                                </div>
                                <div className="col-span-2 space-y-0.5">
                                  <input
                                    type="text"
                                    required
                                    placeholder="Dosage (ex: 1 cp)"
                                    value={row.dosage}
                                    onChange={(e) =>
                                      updatePrescriptionRow(index, "dosage", e.target.value)
                                    }
                                    className="w-full border border-slate-200 rounded p-1.5 text-center"
                                  />
                                </div>
                                <div className="col-span-3 space-y-0.5">
                                  <input
                                    type="text"
                                    required
                                    placeholder="Fréquence (ex: 3x / jour)"
                                    value={row.frequency}
                                    onChange={(e) =>
                                      updatePrescriptionRow(index, "frequency", e.target.value)
                                    }
                                    className="w-full border border-slate-200 rounded p-1.5"
                                  />
                                </div>
                                <div className="col-span-2 space-y-0.5">
                                  <input
                                    type="text"
                                    required
                                    placeholder="Durée (ex: 5 jours)"
                                    value={row.duration}
                                    onChange={(e) =>
                                      updatePrescriptionRow(index, "duration", e.target.value)
                                    }
                                    className="w-full border border-slate-200 rounded p-1.5 text-center"
                                  />
                                </div>
                                <div className="col-span-1 text-center">
                                  <button
                                    type="button"
                                    disabled={presMedItems.length === 1}
                                    onClick={() => removePrescriptionRow(index)}
                                    className="p-1 text-red-500 hover:text-red-700 disabled:opacity-30 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={addPrescriptionRow}
                              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1 mt-1 cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Ajouter une ligne de traitement</span>
                            </button>
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-600">
                              Recommandations particulières (Optionnel) :
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: À prendre au milieu des repas..."
                              value={presNotes}
                              onChange={(e) => setPresNotes(e.target.value)}
                              className="w-full border border-slate-200 rounded p-2 bg-white"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-600">
                                Médecin prescripteur :
                              </label>
                              <input
                                type="text"
                                required
                                value={presDoctor}
                                onChange={(e) => setPresDoctor(e.target.value)}
                                className="w-full border border-slate-200 rounded p-2 bg-white font-semibold text-slate-700"
                              />
                            </div>
                            <div className="flex items-end justify-end space-x-2">
                              <button
                                type="submit"
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer transition shadow-xs"
                              >
                                Émettre l'ordonnance
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowAddPrescription(false)}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold cursor-pointer"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        </form>
                      )}

                      {/* Display list of active prescriptions */}
                      <div className="space-y-3">
                        {patientPrescriptions.map((pres) => (
                          <div
                            key={pres.id}
                            className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3"
                          >
                            <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-mono font-bold uppercase">
                                  {pres.id}
                                </span>
                                <span className="font-bold text-slate-800 text-xs">
                                  Ordonnance Médicale
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                {pres.status === "Délivrée" ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Délivrée
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-[9px] font-bold animate-pulse">
                                    En attente de délivrance (Pharmacie)
                                  </span>
                                )}
                                <span className="text-[10px] font-mono text-slate-400 font-semibold">
                                  {pres.date}
                                </span>
                              </div>
                            </div>

                            {/* Med list table inside prescription */}
                            <div className="bg-white rounded-lg border border-slate-100 overflow-hidden shadow-2xs">
                              <table className="w-full text-left text-xs divide-y divide-slate-100">
                                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  <tr>
                                    <th className="p-2 pl-3">Médicament</th>
                                    <th className="p-2 text-center">Posologie</th>
                                    <th className="p-2 text-center">Fréquence</th>
                                    <th className="p-2 text-center">Durée</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                                  {pres.items.map((item, idx) => (
                                    <tr key={idx}>
                                      <td className="p-2 pl-3 font-bold text-slate-800">
                                        {item.medicationName}
                                      </td>
                                      <td className="p-2 text-center text-slate-600">
                                        {item.dosage}
                                      </td>
                                      <td className="p-2 text-center text-slate-600">
                                        {item.frequency}
                                      </td>
                                      <td className="p-2 text-center text-slate-600">
                                        {item.duration}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {pres.notes && (
                              <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded border border-slate-100">
                                <strong>Note du médecin :</strong> {pres.notes}
                              </p>
                            )}

                            <div className="text-[10px] text-slate-400 flex justify-between items-center pt-2 border-t border-slate-100">
                              <span>
                                Prescrit par :{" "}
                                <strong className="text-slate-600">{pres.doctorName}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedPrescriptionForPrint(pres)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded transition cursor-pointer text-[10px]"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Aperçu d'impression</span>
                              </button>
                            </div>
                          </div>
                        ))}

                        {patientPrescriptions.length === 0 && (
                          <div className="text-center py-6 text-slate-400 text-xs">
                            Aucune prescription rédigée pour ce patient.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: 4. LABORATOIRE */}
                {patientSubTab === "lab" && (
                  <div className="space-y-4">
                    {/* Lab Request & Technician section */}
                    <div className="bg-white border border-slate-100 rounded-xl shadow-xs p-5 space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                          <FlaskConical className="w-4 h-4 text-emerald-600" />
                          <span>Analyses & Examens de Laboratoire</span>
                        </h4>
                        {isDoctorOrAdmin && !showAddLabRequest && (
                          <button
                            onClick={() => setShowAddLabRequest(true)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span>Prescrire Analyse</span>
                          </button>
                        )}
                      </div>

                      {/* Add Lab Request wizard Form */}
                      {showAddLabRequest && (
                        <form
                          onSubmit={handleSaveLabRequest}
                          className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs"
                        >
                          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                            <span className="font-bold text-emerald-950 flex items-center space-x-1">
                              <Sparkles className="w-4 h-4 text-emerald-600" />
                              <span>Prescription d'analyses biologiques</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowAddLabRequest(false)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-2">
                            <label className="font-bold text-slate-700 block">
                              Sélectionnez les examens requis :
                            </label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-slate-200">
                              {PRESET_LAB_TESTS.map((testName, idx) => {
                                const isChecked = selectedLabTests.includes(testName);
                                return (
                                  <label
                                    key={idx}
                                    className={`flex items-center space-x-2.5 p-2 rounded-md border transition cursor-pointer ${
                                      isChecked
                                        ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                                        : "bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100/50"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleLabTestSelect(testName)}
                                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <span>{testName}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-600">
                              Renseignements cliniques ou commentaires :
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: Fièvre persistante depuis 4 jours, suspicion d'accès lac..."
                              value={labNotes}
                              onChange={(e) => setLabNotes(e.target.value)}
                              className="w-full border border-slate-200 rounded p-2 bg-white"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-600">Prescrit par :</label>
                              <input
                                type="text"
                                required
                                value={labDoctor}
                                onChange={(e) => setLabDoctor(e.target.value)}
                                className="w-full border border-slate-200 rounded p-2 bg-white font-semibold text-slate-700"
                              />
                            </div>
                            <div className="flex items-end justify-end space-x-2">
                              <button
                                type="submit"
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer transition shadow-xs"
                              >
                                Demander les Analyses
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowAddLabRequest(false)}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold cursor-pointer"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        </form>
                      )}

                      {/* Display Lab Requests List */}
                      <div className="space-y-4">
                        {patientLabRequests.map((req) => {
                          const isEditing = editingLabRequestId === req.id;
                          return (
                            <div
                              key={req.id}
                              className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3"
                            >
                              <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-mono font-bold uppercase">
                                    {req.id}
                                  </span>
                                  <span className="font-bold text-slate-800 text-xs">
                                    Demande d'examens biologiques
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {req.status === "Prêt" ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                                      <Check className="w-3 h-3 mr-1" />
                                      Résultats Prêts
                                    </span>
                                  ) : req.status === "En cours" ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[9px] font-bold animate-pulse">
                                      Analyses en cours
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-[9px] font-bold">
                                      En attente de prélèvement
                                    </span>
                                  )}
                                  <span className="text-[10px] font-mono text-slate-400 font-semibold">
                                    {req.date}
                                  </span>
                                </div>
                              </div>

                              {/* Form to enter results if in editing mode */}
                              {isEditing ? (
                                <form
                                  onSubmit={(e) => handleSaveLabResults(e, req)}
                                  className="space-y-3"
                                >
                                  <div className="bg-white rounded-lg border border-slate-150 p-3 space-y-3">
                                    <span className="font-bold text-slate-700 text-xs block mb-1">
                                      Saisir les mesures biologiques (Mode Technicien) :
                                    </span>

                                    {req.tests.map((test, idx) => (
                                      <div
                                        key={idx}
                                        className="grid grid-cols-12 gap-2 items-center text-xs"
                                      >
                                        <div className="col-span-5 font-bold text-slate-700">
                                          {test.name}
                                        </div>
                                        <div className="col-span-7">
                                          <input
                                            type="text"
                                            placeholder="Résultat biologique (ex: POSITIF +++)"
                                            value={labTestResults[test.name] || ""}
                                            onChange={(e) =>
                                              setLabTestResults({
                                                ...labTestResults,
                                                [test.name]: e.target.value,
                                              })
                                            }
                                            className="w-full border border-slate-200 rounded p-1"
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="space-y-1">
                                      <label className="font-bold text-slate-500">
                                        Signataire de l'analyse :
                                      </label>
                                      <input
                                        type="text"
                                        required
                                        value={labTechnicianName}
                                        onChange={(e) => setLabTechnicianName(e.target.value)}
                                        className="w-full border border-slate-200 rounded p-1.5 bg-white font-semibold text-slate-700"
                                      />
                                    </div>
                                    <div className="flex items-end justify-end space-x-2">
                                      <button
                                        type="submit"
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded cursor-pointer transition shadow-xs"
                                      >
                                        Valider & Signer
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingLabRequestId(null)}
                                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded cursor-pointer"
                                      >
                                        Annuler
                                      </button>
                                    </div>
                                  </div>
                                </form>
                              ) : (
                                /* Display Lab tests results list */
                                <div className="bg-white rounded-lg border border-slate-100 overflow-hidden shadow-2xs">
                                  <table className="w-full text-left text-xs divide-y divide-slate-100">
                                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                      <tr>
                                        <th className="p-2.5 pl-3">Analyse Demandée</th>
                                        <th className="p-2.5">Résultat Biologique</th>
                                        <th className="p-2.5 text-center">Valeur de Réf.</th>
                                        <th className="p-2.5 text-right pr-3">Statut</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                                      {req.tests.map((test, idx) => (
                                        <tr key={idx}>
                                          <td className="p-2.5 pl-3 font-bold text-slate-800">
                                            {test.name}
                                          </td>
                                          <td
                                            className={`p-2.5 ${test.result?.includes("POSITIF") || test.result?.includes("Positif") ? "text-red-600 font-bold" : "text-emerald-700"}`}
                                          >
                                            {test.result || (
                                              <span className="text-slate-400 italic">
                                                Analyse en attente...
                                              </span>
                                            )}
                                          </td>
                                          <td className="p-2.5 text-center text-slate-400 font-mono text-[11px]">
                                            {test.referenceRange || "Négatif"}
                                          </td>
                                          <td className="p-2.5 text-right pr-3 text-[10px] font-bold">
                                            {test.status === "Prêt" ? (
                                              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                Prêt
                                              </span>
                                            ) : (
                                              <span className="text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100 animate-pulse">
                                                En attente
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {req.notes && !isEditing && (
                                <p className="text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-100">
                                  <strong>Renseignements cliniques :</strong> {req.notes}
                                </p>
                              )}

                              {/* Footer analysis indicators */}
                              {!isEditing && (
                                <div className="text-[10px] text-slate-400 flex justify-between items-center pt-2 border-t border-slate-100">
                                  <div>
                                    <span>
                                      Prescrit par :{" "}
                                      <strong className="text-slate-600">{req.doctorName}</strong>
                                    </span>
                                    {req.technicianName && (
                                      <span className="ml-3 font-medium">
                                        Validé par :{" "}
                                        <strong className="text-slate-600">
                                          {req.technicianName}
                                        </strong>
                                      </span>
                                    )}
                                  </div>

                                  {/* Allow laboratory technician or admin to update/complete tests */}
                                  {isLabOrAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingLabRequestId(req.id);
                                        // Load current test results to state
                                        const initialResults: { [key: string]: string } = {};
                                        req.tests.forEach((t) => {
                                          initialResults[t.name] = t.result || "";
                                        });
                                        setLabTestResults(initialResults);
                                      }}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold cursor-pointer transition text-[9px] uppercase tracking-wider shadow-3xs"
                                    >
                                      Saisir Résultats
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {patientLabRequests.length === 0 && (
                          <div className="text-center py-6 text-slate-400 text-xs">
                            Aucune demande de laboratoire effectuée.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Landing panel when no patient is active */
          <div className="p-12 text-center text-slate-400 bg-white border border-slate-100 rounded-xl shadow-xs space-y-4">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-slate-700 text-sm">Aucun Patient Sélectionné</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Veuillez sélectionner un dossier patient dans l'annuaire de gauche pour afficher son
              dossier de santé standard ou émettre des ordonnances et consultations.
            </p>
          </div>
        )}
      </div>

      {/* 5. CÔTE D'IVOIRE PRINTABLE PRESCRIPTION MODAL */}
      {selectedPrescriptionForPrint && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center p-4 z-50">
          <div className="bg-white border-2 border-emerald-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[90vh]">
            {/* Modal Header Actions */}
            <div className="bg-emerald-800 text-white p-3 flex justify-between items-center">
              <span className="font-bold text-xs uppercase tracking-wider flex items-center space-x-2">
                <Printer className="w-4 h-4" />
                <span>Impression Ordonnance Officielle</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedPrescriptionForPrint(null)}
                className="w-7 h-7 rounded-full bg-emerald-900 flex items-center justify-center text-white hover:bg-emerald-950 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Frame Area */}
            <div
              className="flex-1 overflow-y-auto p-8 font-sans bg-white relative text-slate-800 leading-normal"
              id="printable-prescription-document"
            >
              {/* Côte d'Ivoire Republic Seal details */}
              <div className="flex justify-between items-start border-b border-slate-300 pb-5">
                <div className="space-y-0.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <h4 className="text-emerald-800 font-extrabold text-xs">
                    RÉPUBLIQUE DE CÔTE D'IVOIRE
                  </h4>
                  <p>Union - Discipline - Travail</p>
                  <p className="font-normal font-sans text-[9px] lowercase">
                    ministère de la santé publique
                  </p>
                </div>
                <div className="text-right space-y-0.5">
                  <h4 className="text-emerald-700 font-black text-sm">CLINIQUE SANTÉ PLUS</h4>
                  <p className="text-[10px] text-slate-500">
                    Plateau, Boulevard de la République, Abidjan
                  </p>
                  <p className="text-[9px] text-slate-400">
                    Tél : +225 27 20 20 20 20 / Urgences : 185
                  </p>
                </div>
              </div>

              {/* Title Badge banner */}
              <div className="text-center my-6 space-y-1">
                <h2 className="text-xl font-black text-slate-800 tracking-widest uppercase font-serif border-b border-double border-slate-300 py-1.5 inline-block px-12">
                  ORDONNANCE
                </h2>
                <p className="text-[10px] text-slate-400 font-mono font-bold pt-1">
                  ID ORD : {selectedPrescriptionForPrint.id}
                </p>
              </div>

              {/* Date & Metadata */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100 text-xs mb-6">
                <div>
                  <p className="text-slate-400 uppercase font-bold text-[9px]">Patient :</p>
                  <p className="font-bold text-slate-800 text-sm">
                    {selectedPatient.lastName} {selectedPatient.firstName}
                  </p>
                  <p className="text-slate-500 font-medium pt-0.5">
                    Né(e) le : {selectedPatient.birthDate} ({selectedPatient.gender})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 uppercase font-bold text-[9px]">
                    Émis à Abidjan, le :
                  </p>
                  <p className="font-bold text-slate-800 text-sm">
                    {selectedPrescriptionForPrint.date}
                  </p>
                  <p className="text-emerald-700 font-semibold pt-0.5">
                    Par : {selectedPrescriptionForPrint.doctorName}
                  </p>
                </div>
              </div>

              {/* Drug Recipes Lists */}
              <div className="space-y-4 min-h-[150px]">
                <span className="text-slate-400 font-extrabold text-[10px] uppercase block tracking-wider border-b border-slate-200 pb-1">
                  MÉDICAMENTS & POSOLOGIES :
                </span>

                <ol className="list-decimal pl-5 space-y-4">
                  {selectedPrescriptionForPrint.items.map((item, idx) => (
                    <li key={idx} className="text-xs">
                      <div className="flex justify-between font-bold text-slate-900 text-sm">
                        <span>{item.medicationName}</span>
                        <span className="text-slate-500 text-xs font-medium font-sans">
                          Durée : {item.duration}
                        </span>
                      </div>
                      <p className="text-emerald-800 font-medium italic pt-0.5 font-sans">
                        Posologie : {item.dosage} — {item.frequency}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Doctor Stamp Visual Seal placeholder */}
              <div className="flex justify-between items-end mt-12 pt-8 border-t border-slate-200">
                <div className="text-[9px] text-slate-400 max-w-xs leading-relaxed">
                  * Cette ordonnance est sécurisée électroniquement.
                  <br />
                  Le pharmacien doit vérifier le statut sur le portail Santé Plus avant de
                  dispenser.
                  <br />
                  Clinique Santé Plus, Agréé Ministère de la Santé N° 2026/MSHP/CAB.
                </div>
                <div className="text-center pr-8 relative">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                    Cachet & Signature
                  </p>
                  <div className="w-32 h-32 border-2 border-dashed border-emerald-600/40 rounded-full flex flex-col justify-center items-center p-2 rotate-12 opacity-80 bg-emerald-50/20">
                    <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest text-center">
                      CLINIQUE SANTÉ PLUS
                    </span>
                    <span className="text-[7px] text-emerald-600 font-semibold py-1">
                      AGRÉÉ A-MSHP-CI
                    </span>
                    <span className="text-[6px] font-mono text-emerald-500 font-bold">
                      {selectedPrescriptionForPrint.id}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 italic mt-1">
                    {selectedPrescriptionForPrint.doctorName}
                  </p>
                </div>
              </div>
            </div>

            {/* Print Action Buttons */}
            <div className="bg-slate-50 p-3.5 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer / Télécharger PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPrescriptionForPrint(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
