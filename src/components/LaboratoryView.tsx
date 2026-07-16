import React, { useState, useEffect } from "react";
import { UserRole, LabRequest, LabTest, LabReagent, Patient, AuditLog } from "../types";
import {
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  QrCode,
  FileText,
  Upload,
  Eye,
  Lock,
  Bell,
  Calendar,
  Layers,
  Sparkles,
  Check,
  TrendingUp,
  X,
  FileCheck,
  ChevronRight,
  Database,
  ArrowRight,
  Info
} from "lucide-react";

interface LaboratoryViewProps {
  labRequests: LabRequest[];
  updateLabRequest: (req: LabRequest) => void;
  patients: Patient[];
  currentUserRole: UserRole;
  authenticatedUser: any;
  addAuditLog: (log: Omit<AuditLog, "id" | "timestamp">) => void;
  labReagents: LabReagent[];
  setLabReagents: React.Dispatch<React.SetStateAction<LabReagent[]>>;
}

export default function LaboratoryView({
  labRequests,
  updateLabRequest,
  patients,
  currentUserRole,
  authenticatedUser,
  addAuditLog,
  labReagents,
  setLabReagents,
}: LaboratoryViewProps) {
  const [activeTab, setActiveTab] = useState<"requests" | "stock" | "stats">("requests");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState("");

  // Selected Request for Action
  const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(null);
  
  // Modals / Workflows States
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showResultForm, setShowResultForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddReagentModal, setShowAddReagentModal] = useState(false);

  // Sample Registration Form State
  const [sampleType, setSampleType] = useState("Sang total");
  const [sampleTime, setSampleTime] = useState(new Date().toLocaleTimeString().slice(0, 5));
  const [sampleDate, setSampleDate] = useState(new Date().toISOString().split("T")[0]);

  // Results Entry Form State
  const [testResults, setTestResults] = useState<Record<string, { value: string; isAbnormal: boolean; unit: string; min: string; max: string }>>({});
  const [technicianNotes, setTechnicianNotes] = useState("");
  const [attachedDocument, setAttachedDocument] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Stock Form State
  const [newReagentName, setNewReagentName] = useState("");
  const [newReagentQty, setNewReagentQty] = useState<number>(100);
  const [newReagentUnit, setNewReagentUnit] = useState("tests");
  const [newReagentThreshold, setNewReagentThreshold] = useState<number>(20);
  const [newReagentExpiry, setNewReagentExpiry] = useState("");

  // Simulated New Request Notification
  const [showNewRequestNotification, setShowNewRequestNotification] = useState(false);
  const [lastRequestCount, setLastRequestCount] = useState(labRequests.length);

  // Monitor for new prescriptions in real time (simulation)
  useEffect(() => {
    if (labRequests.length > lastRequestCount) {
      const difference = labRequests.length - lastRequestCount;
      if (difference > 0) {
        setShowNewRequestNotification(true);
        // Play notification sound if allowed
        try {
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav");
          audio.volume = 0.2;
          audio.play().catch(() => {});
        } catch (e) {}
      }
    }
    setLastRequestCount(labRequests.length);
  }, [labRequests.length, lastRequestCount]);

  // Handle sample submission
  const handleRegisterSample = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    // Generate unique barcode identifier: ECH-YEAR-RANDOM
    const year = new Date().getFullYear();
    const randomId = Math.floor(100000 + Math.random() * 900000);
    const barcode = `ECH-${year}-${randomId}`;

    const updatedRequest: LabRequest = {
      ...selectedRequest,
      status: "En cours",
      sampleId: barcode,
      sampleType,
      sampleCollectedAt: `${sampleDate} ${sampleTime}`,
      validationStatus: "en_attente_saisie",
      updatedAt: new Date().toISOString(),
    };

    updateLabRequest(updatedRequest);
    setSelectedRequest(updatedRequest);
    setShowSampleModal(false);

    // Track in Audit Log
    addAuditLog({
      userEmail: authenticatedUser?.email || "laborantin@santeplus.ci",
      userName: authenticatedUser?.fullName || "Laborantin Clinique",
      userRole: currentUserRole,
      action: "Modification importante",
      details: `Réception et enregistrement d'un échantillon pour la demande ${selectedRequest.id}. Code-barres associé: ${barcode}. Type: ${sampleType}`,
      status: "Succès",
    });

    // Automatically deduct related stock if matching reagent
    deductStockForTest(selectedRequest);
  };

  // Helper to suggest stock deductions based on test types
  const deductStockForTest = (req: LabRequest) => {
    const stockUpdates: Record<string, number> = {};

    req.tests.forEach((test) => {
      const name = test.name.toLowerCase();
      if (name.includes("paludisme") || name.includes("tdr")) {
        stockUpdates["REA-001"] = 1; // 1 unit of TDR reagent
        stockUpdates["REA-003"] = 1; // 1 blood tubes
      } else if (name.includes("goutte") || name.includes("giemsa")) {
        stockUpdates["REA-002"] = 0.05; // 0.05 flacons
        stockUpdates["REA-003"] = 1;
      } else if (name.includes("nfs") || name.includes("numération")) {
        stockUpdates["REA-003"] = 1;
      } else if (name.includes("typhoïde") || name.includes("widal")) {
        stockUpdates["REA-004"] = 0.1; // 0.1 flacons
        stockUpdates["REA-006"] = 1; // Sec tube
      } else if (name.includes("glycémie")) {
        stockUpdates["REA-005"] = 1; // 1 strip
      }
    });

    if (Object.keys(stockUpdates).length > 0) {
      setLabReagents((prev) =>
        prev.map((item) => {
          if (stockUpdates[item.id]) {
            const newQty = Math.max(0, item.quantity - stockUpdates[item.id]);
            return { ...item, quantity: parseFloat(newQty.toFixed(2)) };
          }
          return item;
        })
      );
    }
  };

  // Pre-fill results input on open
  const openResultForm = (req: LabRequest) => {
    setSelectedRequest(req);
    
    // Set default ranges and fields based on common tests
    const initialResults: typeof testResults = {};
    req.tests.forEach((test, idx) => {
      const name = test.name.toLowerCase();
      let defaultMin = "";
      let defaultMax = "";
      let defaultUnit = "";
      let defaultValue = test.result || "";

      if (name.includes("hémoglobine") || name.includes("nfs")) {
        defaultMin = "12.0";
        defaultMax = "16.0";
        defaultUnit = "g/dL";
      } else if (name.includes("glycémie")) {
        defaultMin = "0.70";
        defaultMax = "1.10";
        defaultUnit = "g/L";
      } else if (name.includes("leucocytes")) {
        defaultMin = "4000";
        defaultMax = "10000";
        defaultUnit = "/mm³";
      }

      initialResults[idx] = {
        value: defaultValue,
        isAbnormal: test.isAbnormal || false,
        unit: test.unit || defaultUnit,
        min: test.referenceMin || defaultMin,
        max: test.referenceMax || defaultMax,
      };
    });

    setTestResults(initialResults);
    setTechnicianNotes(req.notes || "");
    setAttachedDocument(req.documents?.[0] || null);
    setShowResultForm(true);
  };

  // Auto-flag abnormal values if entered value is numeric and outside limits
  const handleValueChange = (testIdx: number, val: string) => {
    const current = testResults[testIdx];
    if (!current) return;

    let autoAbnormal = current.isAbnormal;
    const numVal = parseFloat(val);
    const minLimit = parseFloat(current.min);
    const maxLimit = parseFloat(current.max);

    if (!isNaN(numVal)) {
      if (!isNaN(minLimit) && numVal < minLimit) {
        autoAbnormal = true;
      } else if (!isNaN(maxLimit) && numVal > maxLimit) {
        autoAbnormal = true;
      } else {
        autoAbnormal = false;
      }
    }

    setTestResults((prev) => ({
      ...prev,
      [testIdx]: {
        ...prev[testIdx],
        value: val,
        isAbnormal: autoAbnormal,
      },
    }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Simulate file upload
      const fileName = e.dataTransfer.files[0].name;
      setAttachedDocument(fileName);
    }
  };

  const simulateFileUpload = () => {
    const simulatedFiles = [
      "Scan_Resultats_NFS_LabSante.pdf",
      "Courbe_Glycemique_Patient.png",
      "Rapport_Analyses_Sanguines_Signe.pdf"
    ];
    const randomFile = simulatedFiles[Math.floor(Math.random() * simulatedFiles.length)];
    setAttachedDocument(randomFile);
  };

  // Submit entered results (Technician entry - Stage 1)
  const handleSaveResults = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    const updatedTests: LabTest[] = selectedRequest.tests.map((test, idx) => {
      const entry = testResults[idx];
      if (entry) {
        return {
          ...test,
          result: entry.value,
          unit: entry.unit,
          isAbnormal: entry.isAbnormal,
          referenceMin: entry.min,
          referenceMax: entry.max,
          referenceRange: entry.min && entry.max ? `${entry.min} - ${entry.max} ${entry.unit}` : test.referenceRange,
          status: "Prêt",
        };
      }
      return test;
    });

    const updatedRequest: LabRequest = {
      ...selectedRequest,
      tests: updatedTests,
      validationStatus: "technicien_saisi",
      technicianName: authenticatedUser?.fullName || "Technicien de Labo",
      notes: technicianNotes,
      documents: attachedDocument ? [attachedDocument] : [],
      updatedAt: new Date().toISOString(),
    };

    updateLabRequest(updatedRequest);
    setSelectedRequest(updatedRequest);
    setShowResultForm(false);

    // Track in Audit Log
    addAuditLog({
      userEmail: authenticatedUser?.email || "laborantin@santeplus.ci",
      userName: authenticatedUser?.fullName || "Laborantin Clinique",
      userRole: currentUserRole,
      action: "Modification importante",
      details: `Saisie technique des résultats effectuée pour la demande ${selectedRequest.id}. En attente de validation biologique.`,
      status: "Succès",
    });
  };

  // Validate results biologically (Biologist / Admin - Stage 2)
  const handleBiologistValidation = (req: LabRequest) => {
    const updatedRequest: LabRequest = {
      ...req,
      status: "Prêt",
      validationStatus: "biologiste_valide",
      biologistName: authenticatedUser?.fullName || "Dr. Soro (Biologiste en chef)",
      validatedAt: new Date().toISOString().split("T")[0] + " à " + new Date().toLocaleTimeString().slice(0, 5),
      updatedAt: new Date().toISOString(),
    };

    updateLabRequest(updatedRequest);
    if (selectedRequest && selectedRequest.id === req.id) {
      setSelectedRequest(updatedRequest);
    }

    // Track in Audit Log
    addAuditLog({
      userEmail: authenticatedUser?.email || "biologiste@santeplus.ci",
      userName: authenticatedUser?.fullName || "Dr. Soro (Biologiste)",
      userRole: currentUserRole,
      action: "Modification importante",
      details: `Validation biologique définitive effectuée pour les analyses de la demande ${req.id}. Diffusion des résultats autorisée.`,
      status: "Succès",
    });

    // Simulated doctor notification
    alert(`Succès: Résultats validés biologiquement ! Ils sont désormais visibles par le ${req.doctorName} et disponibles dans l'Espace Patient.`);
  };

  // Add new laboratory reagent
  const handleAddReagent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReagentName) return;

    const newReagent: LabReagent = {
      id: "REA-" + Math.floor(100 + Math.random() * 900),
      name: newReagentName,
      quantity: newReagentQty,
      unit: newReagentUnit,
      threshold: newReagentThreshold,
      expiryDate: newReagentExpiry || new Date(Date.now() + 365 * 24 * 3600000).toISOString().split("T")[0],
    };

    setLabReagents((prev) => [newReagent, ...prev]);
    setShowAddReagentModal(false);

    // Reset Form
    setNewReagentName("");
    setNewReagentQty(100);
    setNewReagentUnit("tests");
    setNewReagentThreshold(20);
    setNewReagentExpiry("");

    // Audit Log
    addAuditLog({
      userEmail: authenticatedUser?.email || "laborantin@santeplus.ci",
      userName: authenticatedUser?.fullName || "Laborantin Clinique",
      userRole: currentUserRole,
      action: "Création de compte", // Reusing standard action
      details: `Ajout d'une nouvelle référence de réactif de laboratoire: ${newReagent.name} (Qté initiale: ${newReagent.quantity} ${newReagent.unit})`,
      status: "Succès",
    });
  };

  // Restock existing reagent
  const handleRestockReagent = (id: string, qtyToAdd: number) => {
    setLabReagents((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, quantity: item.quantity + qtyToAdd };
        }
        return item;
      })
    );

    const reagentName = labReagents.find(r => r.id === id)?.name || "Réactif";
    
    // Audit Log
    addAuditLog({
      userEmail: authenticatedUser?.email || "laborantin@santeplus.ci",
      userName: authenticatedUser?.fullName || "Laborantin Clinique",
      userRole: currentUserRole,
      action: "Modification importante",
      details: `Réapprovisionnement de réactif: +${qtyToAdd} unités ajoutées à ${reagentName}`,
      status: "Succès",
    });
  };

  // Filter Logic
  const filteredRequests = labRequests.filter((req) => {
    const matchesSearch =
      req.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.tests.some((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" ? true : req.status === statusFilter;
    const matchesPriority = priorityFilter === "all" ? true : (req.priority || "normal") === priorityFilter;
    const matchesDate = dateFilter ? req.date === dateFilter : true;

    return matchesSearch && matchesStatus && matchesPriority && matchesDate;
  });

  const getPatientDetails = (patientId: string) => {
    return patients.find((p) => p.id === patientId);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 p-4 lg:p-6" id="laboratory-root">
      
      {/* Simulation New Request Toast Notification */}
      {showNewRequestNotification && (
        <div className="xl:col-span-12 bg-indigo-600 text-white rounded-xl p-4 shadow-md flex items-center justify-between animate-bounce">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 animate-swing text-yellow-300" />
            <div>
              <h4 className="font-extrabold text-sm">Nouvelle prescription d'analyses détectée !</h4>
              <p className="text-xs text-indigo-100">Un médecin vient de soumettre une nouvelle demande d'examens de laboratoire.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setStatusFilter("En attente");
                setShowNewRequestNotification(false);
              }}
              className="px-3 py-1 bg-white text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-50"
            >
              Voir la file d'attente
            </button>
            <button onClick={() => setShowNewRequestNotification(false)} className="p-1 hover:bg-indigo-500 rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- 1. STATE INDICATORS TOP ROW --- */}
      <div className="xl:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending Requests Box */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-3xs flex items-center space-x-4">
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Analyses en Attente
            </span>
            <p className="text-xl font-bold text-slate-800 mt-0.5">
              {labRequests.filter((r) => r.status === "En attente").length} Demandes
            </p>
            <span className="text-[10px] text-red-500 font-semibold flex items-center mt-1">
              {labRequests.filter((r) => r.status === "En attente" && r.priority === "urgent").length} urgences critiques
            </span>
          </div>
        </div>

        {/* Current Analytical queue */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-3xs flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Échantillons en Cours
            </span>
            <p className="text-xl font-bold text-slate-800 mt-0.5">
              {labRequests.filter((r) => r.status === "En cours").length} en cours
            </p>
            <span className="text-[10px] text-indigo-600 font-semibold mt-1 block">
              {labRequests.filter((r) => r.validationStatus === "technicien_saisi").length} saisies en attente de visa
            </span>
          </div>
        </div>

        {/* Inventory low stock indicator */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-3xs flex items-center space-x-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Alertes Stock Labo
            </span>
            <p className="text-xl font-bold text-slate-800 mt-0.5">
              {labReagents.filter((r) => r.quantity <= r.threshold).length} Réactifs bas
            </p>
            <span className="text-[10px] text-rose-500 font-semibold flex items-center mt-1">
              {labReagents.filter((r) => new Date(r.expiryDate) <= new Date(Date.now() + 30 * 24 * 3600000)).length} péremptions à 30 jours
            </span>
          </div>
        </div>
      </div>

      {/* --- 2. MAIN WORKSPACE TAB CONTROLLER --- */}
      <div className="xl:col-span-12 flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition cursor-pointer ${
            activeTab === "requests"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Suivi des Analyses ({filteredRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("stock")}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition cursor-pointer ${
            activeTab === "stock"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Gestion des Réactifs ({labReagents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("stats")}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition cursor-pointer ${
            activeTab === "stats"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Indicateurs & Performance</span>
        </button>
      </div>

      {/* --- 3. RENDERING ACTIVE VIEW --- */}
      
      {/* TAB A: LAB REQUESTS AND ANALYSIS FLOW */}
      {activeTab === "requests" && (
        <>
          {/* Left Column: Filter panel & Requests list */}
          <div className="xl:col-span-8 space-y-4">
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-3xs space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Search */}
                <div className="relative sm:col-span-2">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher patient, code, médecin, examen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                {/* Status */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  >
                    <option value="all">Tous statuts</option>
                    <option value="En attente">En attente (Prescrit)</option>
                    <option value="En cours">En cours d'analyse</option>
                    <option value="Prêt">Terminé (Visa biologique)</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  >
                    <option value="all">Toutes priorités</option>
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent 🔴</option>
                  </select>
                </div>
              </div>

              {/* Extra Date Filter */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span className="font-bold">Date de prescription:</span>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="border border-slate-200 rounded px-2 py-0.5"
                />
                {dateFilter && (
                  <button
                    onClick={() => setDateFilter("")}
                    className="text-red-500 font-bold hover:underline"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>

            {/* List of Requests */}
            <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-3xs">
              <div className="border-b border-slate-100 p-4 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  File d'Attente Biologique ({filteredRequests.length} demandes filtrées)
                </h3>
              </div>

              {filteredRequests.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {filteredRequests.map((req) => {
                    const isUrgent = req.priority === "urgent";
                    const isSampleRegistered = !!req.sampleId;
                    
                    return (
                      <div
                        key={req.id}
                        onClick={() => setSelectedRequest(req)}
                        className={`p-4 transition hover:bg-slate-50/80 cursor-pointer flex items-center justify-between gap-4 ${
                          selectedRequest?.id === req.id ? "bg-indigo-50/40 border-l-4 border-indigo-600" : ""
                        }`}
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-mono font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {req.id}
                            </span>
                            
                            {isUrgent && (
                              <span className="text-[9px] font-extrabold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 animate-pulse flex items-center">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                URGENT
                              </span>
                            )}

                            {isSampleRegistered ? (
                              <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center font-mono">
                                <QrCode className="w-3 h-3 mr-1" />
                                {req.sampleId}
                              </span>
                            ) : (
                              <span className="text-[9px] font-extrabold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-dashed border-slate-300">
                                Échantillon à prélever
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs font-extrabold text-slate-800 truncate">
                            {req.patientName}
                          </h4>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500">
                            <span>Prescrit par: <strong className="text-slate-600 font-bold">{req.doctorName}</strong></span>
                            <span>Date: <strong className="font-bold">{req.date}</strong></span>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-1">
                            {req.tests.map((test, index) => (
                              <span
                                key={index}
                                className={`text-[9px] px-2 py-0.5 rounded-md font-bold ${
                                  test.status === "Prêt"
                                    ? test.isAbnormal
                                      ? "bg-red-100 text-red-800 border border-red-200"
                                      : "bg-emerald-100 text-emerald-800 border border-emerald-100"
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}
                              >
                                {test.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-col items-end shrink-0 space-y-1.5">
                          {req.status === "En attente" && (
                            <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-200 flex items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
                              À PRÉLEVER
                            </span>
                          )}
                          {req.status === "En cours" && (
                            <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-200 flex items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5 animate-spin" />
                              {req.validationStatus === "technicien_saisi" ? "RELEVE EN ATTENTE VISA" : "EN ANALYSE"}
                            </span>
                          )}
                          {req.status === "Prêt" && (
                            <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200 flex items-center">
                              <CheckCircle className="w-3 h-3 text-emerald-600 mr-1" />
                              DIFFUSÉ (VALIDÉ)
                            </span>
                          )}

                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 px-4 space-y-2">
                  <Layers className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">Aucune demande d'examens ne correspond à vos filtres.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Interactive Detail Panel & Restriction of Access */}
          <div className="xl:col-span-4">
            {selectedRequest ? (
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-3xs space-y-5 sticky top-6">
                
                {/* Restricted Access Badge / Security Disclaimer */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5">
                  <Lock className="w-4.5 h-4.5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider block">Accès Restreint Laborantin</span>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Par respect du secret médical, seules les données d'analyse (identité, allergies, groupe sanguin, note clinique de labo) sont visibles. L'historique complet des diagnostics médecin est restreint.
                    </p>
                  </div>
                </div>

                {/* Panel Header */}
                <div className="border-b border-slate-100 pb-3 flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[9px] font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 block w-fit mb-1">
                      {selectedRequest.id}
                    </span>
                    <h3 className="text-xs font-black text-slate-800">{selectedRequest.patientName}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Prescrit par {selectedRequest.doctorName} le {selectedRequest.date}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setSelectedRequest(null);
                    }}
                    className="p-1 hover:bg-slate-100 rounded-full"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {/* Patient Restricted Info */}
                {(() => {
                  const pat = getPatientDetails(selectedRequest.patientId);
                  return (
                    <div className="grid grid-cols-2 gap-3 text-[11px] bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Groupe Sanguin</span>
                        <strong className="text-slate-700 font-black">{pat?.bloodType || "Non renseigné"}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Genre / Âge</span>
                        <strong className="text-slate-700 font-bold">
                          {pat?.gender === "M" ? "Masculin" : "Féminin"} ({pat?.birthDate ? new Date().getFullYear() - new Date(pat.birthDate).getFullYear() : "?"} ans)
                        </strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase text-amber-800">Allergies Cliniques</span>
                        <p className="text-[10px] text-amber-900 font-bold truncate leading-relaxed">
                          {pat?.allergies || "Aucune allergie critique déclarée"}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Sample barcode & Type details if received */}
                {selectedRequest.sampleId && (
                  <div className="border border-emerald-100 bg-emerald-50/30 p-3.5 rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-extrabold text-emerald-800">
                      <span className="flex items-center"><QrCode className="w-4 h-4 mr-1.5 text-emerald-600" /> Échantillon Enregistré</span>
                      <span className="font-mono text-xs">{selectedRequest.sampleId}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-emerald-950">
                      <div>Type: <strong className="font-bold">{selectedRequest.sampleType}</strong></div>
                      <div>Heure: <strong className="font-bold">{selectedRequest.sampleCollectedAt}</strong></div>
                    </div>
                  </div>
                )}

                {/* Test details list with values entered */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Examens Requis & Résultats</h4>
                  <div className="space-y-2">
                    {selectedRequest.tests.map((test, index) => (
                      <div key={index} className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="text-xs font-bold text-slate-800 block">{test.name}</span>
                          {test.status === "Prêt" && test.result ? (
                            <div className="space-y-0.5">
                              <span className="text-xs font-mono font-black text-slate-900">
                                Valeur: <span className={test.isAbnormal ? "text-red-600 underline font-black" : "text-emerald-700 font-bold"}>{test.result}</span>
                              </span>
                              {test.referenceRange && (
                                <span className="text-[9px] text-slate-400 block font-mono">Plage Réf: {test.referenceRange}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic block">Aucun résultat saisi</span>
                          )}
                        </div>

                        {test.status === "Prêt" && test.isAbnormal && (
                          <span className="text-[9px] font-black bg-red-100 text-red-800 border border-red-200 px-1.5 py-0.5 rounded-sm flex items-center shrink-0">
                            HORS PLAGE ⚠️
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technician Notes or Documents if any */}
                {selectedRequest.notes && (
                  <div className="text-[10px] text-slate-500 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-700 block">Notes du laboratoire:</span>
                    <p className="italic mt-0.5 leading-relaxed">{selectedRequest.notes}</p>
                  </div>
                )}

                {selectedRequest.documents && selectedRequest.documents.length > 0 && (
                  <div className="text-[10px] bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between">
                    <span className="flex items-center text-slate-700"><FileText className="w-4 h-4 text-slate-400 mr-1.5" /> {selectedRequest.documents[0]}</span>
                    <span className="text-xs font-extrabold text-indigo-600 hover:underline cursor-pointer">Consulter</span>
                  </div>
                )}

                {/* Workflow Buttons based on Request Status */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  {selectedRequest.status === "En attente" && (
                    <button
                      onClick={() => {
                        setShowSampleModal(true);
                      }}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                    >
                      <QrCode className="w-4.5 h-4.5" />
                      <span>Enregistrer Prélèvement Échantillon</span>
                    </button>
                  )}

                  {selectedRequest.status === "En cours" && selectedRequest.validationStatus !== "technicien_saisi" && (
                    <button
                      onClick={() => openResultForm(selectedRequest)}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                    >
                      <FileCheck className="w-4.5 h-4.5" />
                      <span>Saisir les Résultats</span>
                    </button>
                  )}

                  {/* Two-Level Biological Validation Block */}
                  {selectedRequest.status === "En cours" && selectedRequest.validationStatus === "technicien_saisi" && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg space-y-3">
                      <div className="flex items-start gap-1.5 text-[11px] text-amber-800 leading-normal">
                        <Info className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Résultats saisis par le technicien.</strong>
                          <p className="text-[10px] text-slate-500 mt-0.5">Ces analyses requièrent la validation définitive du biologiste responsable avant d'être diffusées.</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openResultForm(selectedRequest)}
                          className="flex-1 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold transition"
                        >
                          Corriger saisie
                        </button>
                        <button
                          onClick={() => handleBiologistValidation(selectedRequest)}
                          className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Valider (Biologiste)</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedRequest.status === "Prêt" && (
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center space-y-2">
                      <div className="flex items-center justify-center text-xs font-extrabold text-emerald-800">
                        <CheckCircle className="w-4.5 h-4.5 mr-1.5 text-emerald-600" />
                        <span>Analyses diffusées et sécurisées</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Validé par <strong>{selectedRequest.biologistName}</strong> le {selectedRequest.validatedAt}.
                        Résultats enregistrés de manière irréversible dans le dossier médical du patient.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 space-y-2 sticky top-6">
                <Eye className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-xs font-bold text-slate-500">Aucune demande sélectionnée</h4>
                <p className="text-[10px] text-slate-400">Cliquez sur une demande d'analyses dans la file d'attente à gauche pour voir les détails, enregistrer l'échantillon ou saisir les résultats.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB B: LABORATORY REAGENTS & CONSUMABLES STOCK */}
      {activeTab === "stock" && (
        <div className="xl:col-span-12 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-3xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-800">Stock des Réactifs & Consommables de Laboratoire</h3>
              <p className="text-xs text-slate-400 mt-1">Suivez les réactifs utilisés, gérez les alertes d'approvisionnement et contrôlez les dates de péremption médicales.</p>
            </div>
            
            <button
              onClick={() => setShowAddReagentModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Réactif</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-3xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="p-4">ID</th>
                  <th className="p-4">Nom du Réactif</th>
                  <th className="p-4">Quantité en Stock</th>
                  <th className="p-4">Alerte Seuil Min</th>
                  <th className="p-4">Date Péremption</th>
                  <th className="p-4">Statut Alerte</th>
                  <th className="p-4 text-right">Actions Réapprovisionnement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {labReagents.map((item) => {
                  const isExpired = new Date(item.expiryDate) < new Date();
                  const isCritical = item.quantity <= item.threshold;
                  const nearExpiry = new Date(item.expiryDate) <= new Date(Date.now() + 60 * 24 * 3600000); // 60 days
                  
                  let statusLabel = "Optimal";
                  let statusClass = "bg-emerald-50 text-emerald-800 border-emerald-100";
                  if (isExpired) {
                    statusLabel = "Périmé ⚠️";
                    statusClass = "bg-red-100 text-red-950 border-red-200";
                  } else if (item.quantity === 0) {
                    statusLabel = "Rupture 🚨";
                    statusClass = "bg-red-50 text-red-800 border-red-200";
                  } else if (isCritical) {
                    statusLabel = "Approvisionner";
                    statusClass = "bg-amber-50 text-amber-800 border-amber-200";
                  } else if (nearExpiry) {
                    statusLabel = "Périme bientôt";
                    statusClass = "bg-yellow-50 text-yellow-800 border-yellow-200";
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-mono font-black text-slate-500">{item.id}</td>
                      <td className="p-4 font-extrabold text-slate-800">{item.name}</td>
                      <td className="p-4">
                        <span className="font-extrabold text-slate-900">{item.quantity}</span>{" "}
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{item.unit}</span>
                      </td>
                      <td className="p-4 font-bold text-slate-400">
                        {item.threshold} <span className="text-[9px] uppercase">{item.unit}</span>
                      </td>
                      <td className={`p-4 font-mono font-bold ${isExpired ? "text-red-600 line-through" : nearExpiry ? "text-yellow-600" : "text-slate-500"}`}>
                        {item.expiryDate}
                      </td>
                      <td className="p-4">
                        <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full border ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleRestockReagent(item.id, 50)}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-md text-[10px] font-bold transition"
                          >
                            +50
                          </button>
                          <button
                            onClick={() => handleRestockReagent(item.id, 200)}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-md text-[10px] font-bold transition"
                          >
                            +200
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB C: LAB PERFORMANCE STATS & DIAGNOSTICS */}
      {activeTab === "stats" && (
        <div className="xl:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-3xs space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Productivité Labo</h4>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Prescrits</span>
                <strong className="text-2xl font-black text-slate-800">{labRequests.length}</strong>
              </div>
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg">
                <span className="text-[10px] text-emerald-600 font-bold block uppercase">Total Validés</span>
                <strong className="text-2xl font-black text-emerald-950">{labRequests.filter(r => r.status === "Prêt").length}</strong>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 leading-normal">
              Statistiques globales de traitement pour l'année 2026. Taux d'achèvement des analyses : 
              <strong className="text-slate-700 font-extrabold"> {labRequests.length ? Math.round((labRequests.filter(r => r.status === "Prêt").length / labRequests.length) * 100) : 0}%</strong>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-3xs space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Durée de Prise en Charge</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Temps moyen de prélèvement:</span>
                <span className="font-extrabold text-slate-800">12 minutes</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Temps moyen de saisie technique:</span>
                <span className="font-extrabold text-slate-800">45 minutes</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Délai moyen de signature biologique:</span>
                <span className="font-extrabold text-indigo-600">1.2 heure</span>
              </div>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-[10px] text-indigo-950 leading-relaxed">
              💡 <strong>Indicateur Qualité :</strong> Les délais d'urgence cliniques sont conformes aux objectifs hospitaliers (inférieurs à 30 minutes de bout en bout).
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-3xs space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Top Examens Prescrits</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-bold">1. TDR Paludisme</span>
                <span className="text-slate-400 font-mono">42% des demandes</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: "42%" }} />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-600 font-bold">2. NFS complète</span>
                <span className="text-slate-400 font-mono">28% des demandes</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: "28%" }} />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-600 font-bold">3. Glycémie</span>
                <span className="text-slate-400 font-mono">15% des demandes</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: "15%" }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 4. POPUP MODALS --- */}

      {/* A. REGISTER SAMPLE MODAL */}
      {showSampleModal && selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-200">
            <div className="bg-indigo-600 text-white p-4 flex justify-between items-center">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                <QrCode className="w-4.5 h-4.5" /> Enregistrement de l'Échantillon
              </h3>
              <button onClick={() => setShowSampleModal(false)} className="hover:bg-indigo-500 rounded-full p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterSample} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                Patient: <strong className="font-black text-slate-800">{selectedRequest.patientName}</strong> <br />
                ID Demande: <strong className="font-mono">{selectedRequest.id}</strong>
              </div>

              {/* Sample Type selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type d'échantillon biologique</label>
                <select
                  value={sampleType}
                  onChange={(e) => setSampleType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Sang total (Tube EDTA)">Sang total (Tube EDTA) 🩸</option>
                  <option value="Sérum (Tube sec)">Sérum (Tube sec) 🧪</option>
                  <option value="Urine (Flacon stérile)">Urine (Flacon stérile) 🫙</option>
                  <option value="Plasma">Plasma 🧬</option>
                  <option value="Selles">Selles 💩</option>
                  <option value="Liquide Céphalo-Rachidien (LCR)">Liquide Céphalo-Rachidien (LCR) 🔬</option>
                  <option value="Frottis biologique">Frottis biologique 🧫</option>
                </select>
              </div>

              {/* Sample Time & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Prélèvement</label>
                  <input
                    type="date"
                    value={sampleDate}
                    onChange={(e) => setSampleDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Heure Prélèvement</label>
                  <input
                    type="time"
                    value={sampleTime}
                    onChange={(e) => setSampleTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex items-start gap-1">
                <Info className="w-3.5 h-3.5 shrink-0 text-slate-300 mt-0.5" />
                <span>La validation générera automatiquement un code-barres unique pour l'échantillon, et déduira les consommables associés de l'inventaire labo.</span>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowSampleModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg text-xs font-bold transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Valider le Prélèvement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. RESULT ENTRY FORM MODAL */}
      {showResultForm && selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="bg-indigo-600 text-white p-4 flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                <FileCheck className="w-4.5 h-4.5" /> Saisie Technique des Résultats
              </h3>
              <button onClick={() => setShowResultForm(false)} className="hover:bg-indigo-500 rounded-full p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveResults} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 flex justify-between items-center gap-4 text-xs">
                <div>
                  Patient: <strong className="font-black text-slate-800">{selectedRequest.patientName}</strong> <br />
                  Échantillon: <strong className="font-mono font-bold text-emerald-800">{selectedRequest.sampleId}</strong> ({selectedRequest.sampleType})
                </div>
                <div>
                  Prescripteur: <strong className="font-bold text-slate-700">{selectedRequest.doctorName}</strong>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">Résultats par examen</h4>
                
                {selectedRequest.tests.map((test, idx) => {
                  const entry = testResults[idx];
                  if (!entry) return null;

                  return (
                    <div key={idx} className="bg-slate-50/50 p-4 border border-slate-100 rounded-lg grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-4">
                        <strong className="text-xs text-slate-800 block">{test.name}</strong>
                      </div>
                      
                      {/* Entered Value */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Valeur</label>
                        <input
                          type="text"
                          placeholder="Ex: 11.2, Négatif..."
                          value={entry.value}
                          onChange={(e) => handleValueChange(idx, e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                          required
                        />
                      </div>

                      {/* Unit */}
                      <div className="sm:col-span-1.5 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Unité</label>
                        <input
                          type="text"
                          placeholder="g/dL"
                          value={entry.unit}
                          onChange={(e) =>
                            setTestResults((prev) => ({
                              ...prev,
                              [idx]: { ...prev[idx], unit: e.target.value },
                            }))
                          }
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                        />
                      </div>

                      {/* Reference Range Min */}
                      <div className="sm:col-span-1.5 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Min Réf</label>
                        <input
                          type="text"
                          placeholder="Ex: 12.0"
                          value={entry.min}
                          onChange={(e) =>
                            setTestResults((prev) => ({
                              ...prev,
                              [idx]: { ...prev[idx], min: e.target.value },
                            }))
                          }
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                        />
                      </div>

                      {/* Reference Range Max */}
                      <div className="sm:col-span-1.5 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Max Réf</label>
                        <input
                          type="text"
                          placeholder="Ex: 16.0"
                          value={entry.max}
                          onChange={(e) =>
                            setTestResults((prev) => ({
                              ...prev,
                              [idx]: { ...prev[idx], max: e.target.value },
                            }))
                          }
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                        />
                      </div>

                      {/* Manual / Automatic abnormal overrides */}
                      <div className="sm:col-span-12 flex justify-end">
                        <label className="inline-flex items-center space-x-1.5 text-[10px] text-red-700 font-bold bg-red-50/50 px-2 py-1 rounded border border-red-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={entry.isAbnormal}
                            onChange={(e) =>
                              setTestResults((prev) => ({
                                ...prev,
                                [idx]: { ...prev[idx], isAbnormal: e.target.checked },
                              }))
                            }
                            className="text-red-600 focus:ring-red-500"
                          />
                          <span>Valeur anormale (Détectée ou Forcée)</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Technician global commentary */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Commentaire technique du laborantin</label>
                <textarea
                  rows={2}
                  placeholder="Suspicion de paludisme, hémolyse partielle, observations microscopiques..."
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Document / Scan attachment (Drag and Drop) */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Joindre des documents d'analyses (Scanners, Courbes)</label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={simulateFileUpload}
                  className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition ${
                    dragActive
                      ? "border-indigo-600 bg-indigo-50/25"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-bold">
                    {attachedDocument ? (
                      <span className="text-emerald-700 flex items-center justify-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Fichier joint: {attachedDocument}
                      </span>
                    ) : (
                      "Glissez-déposez le scan des résultats ou cliquez pour simuler le scan."
                    )}
                  </p>
                  <span className="text-[9px] text-slate-400">Prend en charge PDF, PNG, JPG (Max 5Mo)</span>
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setShowResultForm(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg text-xs font-bold transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Enregistrer les résultats (Saisie technique)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. ADD REAGENT STOCK MODAL */}
      {showAddReagentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-indigo-600 text-white p-4 flex justify-between items-center">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                <Plus className="w-4.5 h-4.5" /> Ajouter un nouveau Réactif
              </h3>
              <button onClick={() => setShowAddReagentModal(false)} className="hover:bg-indigo-500 rounded-full p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddReagent} className="p-5 space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nom du réactif / consommable</label>
                <input
                  type="text"
                  placeholder="Ex: Réactif de détermination du groupe sanguin"
                  value={newReagentName}
                  onChange={(e) => setNewReagentName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  required
                />
              </div>

              {/* Initial Qty & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantité Initiale</label>
                  <input
                    type="number"
                    value={newReagentQty}
                    onChange={(e) => setNewReagentQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unité de mesure</label>
                  <select
                    value={newReagentUnit}
                    onChange={(e) => setNewReagentUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  >
                    <option value="tests">Tests</option>
                    <option value="flacons">Flacons</option>
                    <option value="pièces">Pièces</option>
                    <option value="boites">Boites</option>
                    <option value="litres">Litres</option>
                  </select>
                </div>
              </div>

              {/* Alert threshold & Expiry */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alerte Seuil Bas</label>
                  <input
                    type="number"
                    value={newReagentThreshold}
                    onChange={(e) => setNewReagentThreshold(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date d'expiration</label>
                  <input
                    type="date"
                    value={newReagentExpiry}
                    onChange={(e) => setNewReagentExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddReagentModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg text-xs font-bold transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Créer le Réactif
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
