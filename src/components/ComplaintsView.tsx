import React, { useState } from "react";
import { Complaint, UserRole } from "../types";
import {
  Frown,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  ThumbsUp,
  Star,
  Search,
  Plus,
  ShieldAlert,
  HeartPulse,
  Clock,
  FileText,
  Check,
} from "lucide-react";

interface ComplaintsViewProps {
  complaints: Complaint[];
  addComplaint: (comp: Omit<Complaint, "id" | "date" | "status">) => Complaint;
  resolveComplaint: (id: string, resolutionNotes: string, satisfactionScore?: number) => void;
  updateComplaintStatus: (id: string, status: Complaint["status"]) => void;
  currentUserRole: UserRole;
}

export default function ComplaintsView({
  complaints,
  addComplaint,
  resolveComplaint,
  updateComplaintStatus,
  currentUserRole,
}: ComplaintsViewProps) {
  // UI States
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(
    complaints[0]?.id || null
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Form State: New Complaint
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [category, setCategory] = useState<Complaint["category"]>("Temps d'attente");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Complaint["severity"]>("Moyenne");

  // Form State: Resolve Complaint
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [satisfactionScore, setSatisfactionScore] = useState(5);
  const [showResolvePanel, setShowResolvePanel] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("Tous");

  // Filter listings
  const filteredComplaints = complaints.filter((c) => {
    const nameMatch = c.patientName.toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch = statusFilter === "Tous" || c.status === statusFilter;
    return nameMatch && statusMatch;
  });

  const selectedComplaint = complaints.find((c) => c.id === selectedComplaintId);

  // Save new complaint handler
  const handleSaveComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !patientPhone || !description) {
      alert("Veuillez remplir toutes les informations obligatoires.");
      return;
    }

    const newComp = addComplaint({
      patientName,
      patientPhone,
      category,
      description,
      severity,
    });

    alert(`Réclamation enregistrée avec succès sous la référence : ${newComp.id}`);

    // Auto select
    setSelectedComplaintId(newComp.id);
    setShowAddForm(false);

    // Reset Form
    setPatientName("");
    setPatientPhone("");
    setDescription("");
  };

  // Resolve complaint handler
  const handleResolveComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintId || !resolutionNotes) {
      alert("Veuillez saisir les notes de résolution.");
      return;
    }

    resolveComplaint(selectedComplaintId, resolutionNotes, satisfactionScore);
    alert("La réclamation a été marquée comme résolue !");

    // Clear and close
    setResolutionNotes("");
    setShowResolvePanel(false);
  };

  // Helpers for badge styling
  const getSeverityBadge = (sev: Complaint["severity"]) => {
    switch (sev) {
      case "Basse":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Moyenne":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Critique":
        return "bg-red-50 text-red-700 border-red-200";
    }
  };

  const getStatusBadge = (status: Complaint["status"]) => {
    switch (status) {
      case "Reçu":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "En cours de traitement":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Résolu":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
  };

  // Calculate high level KPI stats
  const totalReceived = complaints.length;
  const totalResolved = complaints.filter((c) => c.status === "Résolu").length;
  const totalPending = totalReceived - totalResolved;
  const resolvedList = complaints.filter((c) => c.status === "Résolu" && c.satisfactionScore);
  const avgSatisfaction =
    resolvedList.length > 0
      ? (
          resolvedList.reduce((sum, c) => sum + (c.satisfactionScore || 5), 0) / resolvedList.length
        ).toFixed(1)
      : "4.5";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* complaints Directory Left Panel */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800 font-display">Registre des Plaintes</h2>
            <p className="text-[11px] text-slate-500 font-mono">
              Total : {totalReceived} reçues | {totalPending} en cours
            </p>
          </div>

          <button
            onClick={() => {
              setShowAddForm(true);
              setShowResolvePanel(false);
            }}
            className="inline-flex items-center space-x-1 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            title="Enregistrer un retour ou plainte patient"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Filter / Search inputs */}
        <div className="space-y-2 text-xs">
          <input
            type="text"
            placeholder="Rechercher par nom de patient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs border border-slate-200 bg-white px-3 py-2.5 rounded-lg focus:outline-emerald-600"
          />

          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-500">Filtrer par état :</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 bg-white rounded px-2 py-0.5"
            >
              <option value="Tous">Tous</option>
              <option value="Reçu">Reçu</option>
              <option value="En cours de traitement">En cours</option>
              <option value="Résolu">Résolu</option>
            </select>
          </div>
        </div>

        {/* Complaint list items container */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden max-h-[420px] overflow-y-auto">
          <div className="divide-y divide-slate-50">
            {filteredComplaints.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedComplaintId(c.id);
                  setShowAddForm(false);
                  setShowResolvePanel(false);
                }}
                className={`w-full text-left p-4 flex justify-between items-start transition-all ${
                  selectedComplaintId === c.id
                    ? "bg-emerald-50/40 border-r-4 border-emerald-600"
                    : "hover:bg-slate-50/50"
                }`}
              >
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-800">{c.patientName}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Le {c.date} | {c.category}
                  </div>
                  <div className="text-[10px] text-slate-600 truncate max-w-[160px]">
                    {c.description}
                  </div>
                </div>

                <div className="text-right flex flex-col items-end space-y-1.5">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] border font-bold ${getSeverityBadge(c.severity)}`}
                  >
                    {c.severity}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] border font-bold ${getStatusBadge(c.status)}`}
                  >
                    {c.status}
                  </span>
                </div>
              </button>
            ))}

            {filteredComplaints.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                Aucune réclamation trouvée.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Details Area or Add form */}
      <div className="lg:col-span-2">
        {showAddForm ? (
          /* CREATE / SUBMIT NEW COMPLAINT FORM */
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md space-y-4">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center space-x-2">
              <Frown className="w-5 h-5 text-emerald-600" />
              <span>Enregistrer un Retour Patient / Réclamation</span>
            </h3>

            <form
              onSubmit={handleSaveComplaint}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs"
            >
              <div className="space-y-1">
                <label className="font-semibold text-slate-600">
                  Nom complet du patient <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Kouassi Amenan Marie"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full border border-slate-200 rounded p-2 focus:outline-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">
                  Numéro de téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: +225 07 07 12 34 56"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded p-2 focus:outline-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Catégorie du problème :</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Complaint["category"])}
                  className="w-full border border-slate-200 rounded p-2 focus:outline-emerald-600"
                >
                  <option value="Accueil">Qualité de l'accueil</option>
                  <option value="Temps d'attente">Temps d'attente excessif</option>
                  <option value="Qualité des soins">Qualité des soins dispensés</option>
                  <option value="Tarification">Incohérence de tarification / assurance</option>
                  <option value="Autre">Autre motif de réclamation</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Gravité estimée :</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as Complaint["severity"])}
                  className="w-full border border-slate-200 rounded p-2 focus:outline-emerald-600"
                >
                  <option value="Basse">Basse (Désagrément mineur)</option>
                  <option value="Moyenne">Moyenne (Impact sur l'expérience)</option>
                  <option value="Critique">Critique (Erreur grave ou incident de soins)</option>
                </select>
              </div>

              <div className="col-span-1 md:col-span-2 space-y-1">
                <label className="font-semibold text-slate-600">
                  Description détaillée de l'incident <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  placeholder="Veuillez retranscrire fidèlement le témoignage ou l'observation du patient..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded p-2.5 focus:outline-emerald-600"
                  rows={4}
                />
              </div>

              <div className="col-span-1 md:col-span-2 flex space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-xs text-center"
                >
                  Valider la réclamation
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-bold"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        ) : selectedComplaint ? (
          /* DISPLAY DETAILED COMPLAINT SPEC SHEET */
          <div className="space-y-6">
            {/* Top Sheet Banner */}
            <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">
                  Réf: {selectedComplaint.id}
                </span>
                <h3 className="text-lg font-bold text-slate-800 font-display">
                  Réclamation de {selectedComplaint.patientName}
                </h3>
                <p className="text-slate-500">
                  Contact :{" "}
                  <span className="font-semibold text-slate-700">
                    {selectedComplaint.patientPhone}
                  </span>{" "}
                  | Enregistrée le : {selectedComplaint.date}
                </p>
              </div>

              <div className="flex flex-col items-end space-y-1.5">
                <div className="flex space-x-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] border font-bold ${getSeverityBadge(selectedComplaint.severity)}`}
                  >
                    Gravité : {selectedComplaint.severity}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] border font-bold ${getStatusBadge(selectedComplaint.status)}`}
                  >
                    État : {selectedComplaint.status}
                  </span>
                </div>

                {/* Resolve status changer */}
                {selectedComplaint.status !== "Résolu" && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() =>
                        updateComplaintStatus(selectedComplaint.id, "En cours de traitement")
                      }
                      className="text-[10px] bg-amber-50 text-amber-800 px-2 py-1 rounded border border-amber-200 font-semibold hover:bg-amber-100"
                    >
                      Prendre en charge
                    </button>
                    <button
                      onClick={() => setShowResolvePanel(true)}
                      className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded font-bold hover:bg-emerald-700"
                    >
                      Résoudre
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* complaint Body Description */}
            <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
                <FileText className="w-5 h-5 text-slate-400" />
                <span>Description de l'incident (Catégorie : {selectedComplaint.category})</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-sans bg-slate-50 p-4 rounded-lg border border-slate-100">
                {selectedComplaint.description}
              </p>
            </div>

            {/* RESOLUTION WORKSPACE PANEL */}
            {showResolvePanel && (
              <form
                onSubmit={handleResolveComplaint}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-md space-y-4 animate-fade-in text-xs"
              >
                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">
                  Clôturer et Résoudre l'incident
                </h4>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">
                    Actions correctives menées (Notes de résolution){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    placeholder="Saisissez précisément les démarches effectuées (appel d'excuses, remboursement, formation d'accueil, etc.)..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="w-full border border-slate-200 rounded p-2.5"
                    rows={3}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-600">
                    Score de Satisfaction Patient (1 à 5 étoiles) :
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSatisfactionScore(star)}
                        className="p-1 text-amber-400 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${star <= satisfactionScore ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                        />
                      </button>
                    ))}
                    <span className="font-bold text-slate-700 ml-2">
                      Score : {satisfactionScore}/5
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold"
                  >
                    Valider la résolution
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResolvePanel(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-bold"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}

            {/* Resolved History display details */}
            {selectedComplaint.status === "Résolu" && (
              <div className="bg-emerald-50/20 border border-emerald-100 rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-emerald-100 pb-2 text-xs">
                  <div className="flex items-center space-x-1.5 text-emerald-800 font-bold">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>Dossier Résolu avec Succès</span>
                  </div>

                  {selectedComplaint.satisfactionScore && (
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-500 font-semibold text-[11px] mr-1">
                        Satisfaction :
                      </span>
                      {Array.from({ length: selectedComplaint.satisfactionScore }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-xs space-y-1">
                  <span className="font-extrabold text-emerald-950 uppercase tracking-wider text-[10px] block">
                    Notes de clôture comptabilisées :
                  </span>
                  <p className="text-slate-700 font-sans leading-relaxed p-3 bg-white/60 border border-emerald-100 rounded-lg">
                    {selectedComplaint.resolutionNotes}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 bg-white border border-slate-100 rounded-xl shadow-xs">
            Sélectionnez une réclamation dans l'annuaire de gauche pour l'analyser.
          </div>
        )}
      </div>
    </div>
  );
}
