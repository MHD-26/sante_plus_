import React, { useState } from "react";
import { Patient, MedicalRecordEntry, UserRole } from "../types";
import { 
  Users, UserPlus, Shield, ShieldCheck, Heart, Search, FileText, 
  Calendar, Phone, Mail, Award, Key, Lock, Unlock, Plus, PlusCircle, Sparkles
} from "lucide-react";

interface PatientsViewProps {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, "id" | "createdAt" | "medicalHistory">) => Patient;
  updatePatient: (patient: Patient) => void;
  addMedicalHistoryEntry: (patientId: string, diagnosis: string, prescription: string, doctorName: string) => void;
  currentUserRole: UserRole;
}

export default function PatientsView({
  patients,
  addPatient,
  updatePatient,
  addMedicalHistoryEntry,
  currentUserRole
}: PatientsViewProps) {
  
  // UI States
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(patients[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddMedicalEntry, setShowAddMedicalEntry] = useState(false);

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

  // Form States (New Medical Entry)
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [historyDoctorName, setHistoryDoctorName] = useState(
    currentUserRole === UserRole.MEDECIN ? "Dr. Essoh Cyrille" : "Dr. Kouamé Franck"
  );

  // Search filter
  const filteredPatients = patients.filter((p) => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || p.phone.includes(searchQuery) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  // Handle Save Patient
  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !phone) {
      alert("Veuillez remplir les champs obligatoires (Prénom, Nom, Téléphone).");
      return;
    }

    const newPat = addPatient({
      firstName,
      lastName,
      phone,
      email,
      birthDate,
      gender,
      bloodType,
      allergies,
      sensitiveDataSigned
    });

    alert(`Patient ${firstName} ${lastName} enregistré avec succès ! ID: ${newPat.id}`);
    
    // Auto select the new patient
    setSelectedPatientId(newPat.id);
    setShowAddForm(false);
    
    // Clear form
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setAllergies("");
  };

  // Handle Save Medical Entry
  const handleSaveMedicalEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !diagnosis || !prescription) {
      alert("Veuillez remplir les informations de diagnostic et d'ordonnance.");
      return;
    }

    addMedicalHistoryEntry(selectedPatientId, diagnosis, prescription, historyDoctorName);
    alert("Dossier médical mis à jour avec succès !");
    
    // Clear and close
    setDiagnosis("");
    setPrescription("");
    setShowAddMedicalEntry(false);
  };

  // Toggle sensitive data permission (GDPR simulation)
  const handleToggleSensitiveData = () => {
    if (!selectedPatient) return;
    const updated = {
      ...selectedPatient,
      sensitiveDataSigned: !selectedPatient.sensitiveDataSigned
    };
    updatePatient(updated);
  };

  // Check role authorization for writing medical history
  const isAuthorizedToEditHistory = currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.MEDECIN;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      
      {/* Patient Directory (Left Column) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800 font-display">Annuaire Patients</h2>
            <p className="text-[11px] text-slate-500">Liste des fiches cliniques actives.</p>
          </div>
          
          {currentUserRole !== UserRole.COMPTABLE && currentUserRole !== UserRole.PHARMACIE && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center space-x-1 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              title="Ajouter un patient fictif"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher nom, téléphone, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs border border-slate-200 bg-white pl-9 pr-4 py-2.5 rounded-lg focus:outline-emerald-600"
          />
        </div>

        {/* Patients list box */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden max-h-[500px] overflow-y-auto">
          <div className="divide-y divide-slate-50">
            {filteredPatients.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPatientId(p.id);
                  setShowAddForm(false);
                  setShowAddMedicalEntry(false);
                }}
                className={`w-full text-left p-4 flex justify-between items-center transition-all ${
                  selectedPatientId === p.id ? "bg-emerald-50/40 border-r-4 border-emerald-600" : "hover:bg-slate-50/50"
                }`}
              >
                <div className="space-y-1">
                  <div className="font-bold text-slate-800 text-xs">
                    {p.lastName} {p.firstName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono flex items-center space-x-1">
                    <Phone className="w-3 h-3" />
                    <span>{p.phone}</span>
                  </div>
                </div>
                
                {/* Sensitive Data Badge Indicator */}
                <div className="flex items-center space-x-1">
                  {p.sensitiveDataSigned ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-600" title="Consentement de sécurité signé" />
                  ) : (
                    <Shield className="w-4 h-4 text-red-500" title="Consentement manquant" />
                  )}
                  <span className="text-[9px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">{p.bloodType}</span>
                </div>
              </button>
            ))}

            {filteredPatients.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                Aucun patient ne correspond à cette recherche.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area (Center/Right 2 Columns) */}
      <div className="lg:col-span-2">
        
        {/* Create Patient Form */}
        {showAddForm ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md space-y-4">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              <span>Enregistrer un Patient Fictif</span>
            </h3>

            <form onSubmit={handleSavePatient} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Nom de famille <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Kouassi"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border border-slate-200 rounded p-2 focus:outline-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Prénom(s) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Marie-Françoise"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-slate-200 rounded p-2 focus:outline-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Numéro de téléphone <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: +2250707123456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded p-2 focus:outline-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Adresse Email</label>
                <input
                  type="email"
                  placeholder="Ex: m.kouassi@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded p-2 focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 col-span-1 md:col-span-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Date de naissance</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full border border-slate-200 rounded p-2 focus:outline-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Genre</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full border border-slate-200 rounded p-2 focus:outline-emerald-600"
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
                    className="w-full border border-slate-200 rounded p-2 focus:outline-emerald-600"
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
                    className="w-full border border-slate-200 rounded p-2 focus:outline-emerald-600"
                  />
                </div>
              </div>

              {/* Data security option */}
              <div className="col-span-1 md:col-span-2 bg-emerald-50/50 p-3 rounded border border-emerald-100 flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="sensitive_signed"
                  checked={sensitiveDataSigned}
                  onChange={(e) => setSensitiveDataSigned(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 rounded"
                />
                <label htmlFor="sensitive_signed" className="font-semibold text-emerald-950">
                  Le patient a signé la fiche de consentement de protection des données sensibles (Réglementation de Sécurité).
                </label>
              </div>

              <div className="col-span-1 md:col-span-2 flex space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-center shadow-xs"
                >
                  Enregistrer la Fiche
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-center"
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
            <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">ID : {selectedPatient.id}</span>
                <h3 className="text-xl font-bold text-slate-800 font-display">
                  {selectedPatient.lastName} {selectedPatient.firstName}
                </h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Né(e) le: {selectedPatient.birthDate}</span>
                  </span>
                  <span>•</span>
                  <span>Genre: {selectedPatient.gender}</span>
                </div>
              </div>

              {/* Security Consent Toggle status */}
              <div className="flex flex-col items-end">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 font-medium">Données Protégées :</span>
                  {selectedPatient.sensitiveDataSigned ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Consentement OK</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 text-[10px] font-bold uppercase">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Bloqué / Non Signé</span>
                    </span>
                  )}
                </div>
                
                <button
                  onClick={handleToggleSensitiveData}
                  className="text-[10px] text-slate-500 hover:text-emerald-700 underline font-semibold mt-1"
                >
                  {selectedPatient.sensitiveDataSigned ? "Retirer le consentement de sécurité" : "Faire signer le consentement de sécurité"}
                </button>
              </div>
            </div>

            {/* General Health parameters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Groupe Sanguin</span>
                <p className="text-xl font-black text-emerald-800 font-mono mt-1">{selectedPatient.bloodType}</p>
              </div>
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs text-center col-span-1 md:col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Allergies Alimentaires / Médicales</span>
                <p className="text-xs font-bold text-red-700 truncate mt-1" title={selectedPatient.allergies}>
                  {selectedPatient.allergies || "Aucune connue"}
                </p>
              </div>
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Téléphone</span>
                <p className="text-xs font-bold text-slate-700 font-mono mt-1.5">{selectedPatient.phone}</p>
              </div>
            </div>

            {/* Medical History section (Sensitive GDPR block logic) */}
            <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-sm font-bold text-slate-800 font-display">Dossier Clinique & Antécédents Médicaux</h4>
                </div>
                
                {selectedPatient.sensitiveDataSigned && isAuthorizedToEditHistory && !showAddMedicalEntry && (
                  <button
                    onClick={() => {
                      setHistoryDoctorName(currentUserRole === UserRole.MEDECIN ? "Dr. Essoh Cyrille" : "Dr. Kouamé Franck");
                      setShowAddMedicalEntry(true);
                    }}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Nouvelle Visite</span>
                  </button>
                )}
              </div>

              {/* IF NOT SIGNED: Lock Content */}
              {!selectedPatient.sensitiveDataSigned ? (
                <div className="p-12 text-center space-y-4 max-w-md mx-auto">
                  <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h5 className="font-bold text-slate-800">Dossier Médical Sensible Verrouillé</h5>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Afin de respecter la réglementation de protection des données de santé privées, les antécédents médicaux et diagnostics 
                    sont inaccessibles tant que le patient n'a pas signé le formulaire électronique de consentement.
                  </p>
                  <button
                    onClick={handleToggleSensitiveData}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs shadow-sm"
                  >
                    Déverrouiller / Signer le Consentement maintenant
                  </button>
                </div>
              ) : (
                /* IF SIGNED: Display History */
                <div className="p-6">
                  
                  {/* Create New Visit entry Form */}
                  {showAddMedicalEntry && (
                    <form onSubmit={handleSaveMedicalEntry} className="bg-slate-50 p-4 border border-slate-200 rounded-lg space-y-3 mb-6 text-xs">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <span className="font-bold text-slate-800 flex items-center space-x-1">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          <span>Rédiger un compte-rendu médical</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Date : Aujourd'hui</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Médecin signataire :</label>
                          <input
                            type="text"
                            required
                            value={historyDoctorName}
                            onChange={(e) => setHistoryDoctorName(e.target.value)}
                            className="w-full border border-slate-200 rounded p-2 bg-white"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Diagnostic / Pathologie :</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Fièvre typhoïde, Gastro-entérite, etc."
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                            className="w-full border border-slate-200 rounded p-2 bg-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-600">Prescription & Traitement Médicamenteux :</label>
                        <textarea
                          required
                          placeholder="Médicaments, posologies détaillées et durée du traitement..."
                          value={prescription}
                          onChange={(e) => setPrescription(e.target.value)}
                          className="w-full border border-slate-200 rounded p-2 bg-white"
                          rows={3}
                        />
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold"
                        >
                          Enregistrer la consultation
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddMedicalEntry(false)}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-bold"
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Timeline listing medical history */}
                  <div className="relative border-l border-slate-100 pl-6 ml-2 space-y-6">
                    {selectedPatient.medicalHistory.map((entry) => (
                      <div key={entry.id} className="relative">
                        {/* Dot */}
                        <span className="absolute -left-[31px] top-1.5 w-3 h-3 bg-emerald-500 rounded-full ring-4 ring-white"></span>
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">{entry.diagnosis}</span>
                            <span className="text-[10px] font-mono text-slate-500">{entry.date}</span>
                          </div>
                          
                          <p className="text-xs text-slate-600 leading-relaxed font-sans bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <span className="font-bold block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Prescription :</span>
                            {entry.prescription}
                          </p>

                          <div className="text-[10px] text-slate-400 font-medium">
                            Consulté par <span className="font-bold text-slate-600">{entry.doctorName}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {selectedPatient.medicalHistory.length === 0 && (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        Aucun antécédent médical enregistré pour le moment.
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 bg-white border border-slate-100 rounded-xl shadow-xs">
            Aucun patient sélectionné. Veuillez enregistrer ou sélectionner un patient.
          </div>
        )}

      </div>

    </div>
  );
}
