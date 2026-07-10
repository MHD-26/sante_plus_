import React, { useState } from "react";
import { Medication, Invoice, Patient, InvoiceItem, UserRole } from "../types";
import { 
  Pill, FileText, AlertTriangle, ArrowUp, ArrowDown, Plus, ShieldCheck, 
  Search, Printer, Check, DollarSign, RefreshCw, Trash, CreditCard, User, Heart, Lock
} from "lucide-react";

const COMMON_MEDICAL_ACTS = [
  { name: "Consultation Médecin Généraliste", price: 10000 },
  { name: "Consultation Médecin Spécialiste", price: 15000 },
  { name: "Pansement simple", price: 3000 },
  { name: "Pansement complexe", price: 7000 },
  { name: "Suture de plaie clinique", price: 8000 },
  { name: "Injection intraveineuse (IV)", price: 2000 },
  { name: "Injection intramusculaire (IM)", price: 1500 },
  { name: "Prélèvement de sang (Laboratoire)", price: 2000 },
  { name: "Échographie obstétricale / générale", price: 15000 },
  { name: "Fiche d'aptitude médicale", price: 5000 },
  { name: "Aérosolthérapie (la séance)", price: 5000 },
  { name: "Hospitalisation en chambre climatisée / nuit", price: 15000 }
];

interface StockBillingViewProps {
  inventory: Medication[];
  invoices: Invoice[];
  patients: Patient[];
  updateStock: (medId: string, quantityChange: number) => void;
  addMedication: (med: Omit<Medication, "id">) => Medication;
  addInvoice: (inv: Omit<Invoice, "id" | "date">) => Invoice;
  markInvoiceAsPaid: (id: string, paymentMethod: Invoice["paymentMethod"]) => void;
  currentUserRole: UserRole;
  patientDossierNumber?: string;
}

export default function StockBillingView({
  inventory,
  invoices,
  patients,
  updateStock,
  addMedication,
  addInvoice,
  markInvoiceAsPaid,
  currentUserRole,
  patientDossierNumber
}: StockBillingViewProps) {
  
  // Tabs: "stock" or "billing"
  const [activeTab, setActiveTab] = useState<"stock" | "billing">("stock");

  // 1. Stock State Management
  const [stockSearch, setStockSearch] = useState("");
  const [showAddMedForm, setShowAddMedForm] = useState(false);
  
  // Stock Form
  const [medName, setMedName] = useState("");
  const [medCategory, setMedCategory] = useState("Antipaludéens");
  const [medQuantity, setMedQuantity] = useState(100);
  const [medUnit, setMedUnit] = useState("Boîtes");
  const [medThreshold, setMedThreshold] = useState(20);
  const [medExpiry, setMedExpiry] = useState("2028-12-31");
  const [medPrice, setMedPrice] = useState(2500);

  // 2. Billing State Management
  const [billingSearch, setBillingSearch] = useState("");
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [selectedInvoiceForDetails, setSelectedInvoiceForDetails] = useState<Invoice | null>(invoices[0] || null);

  // New Invoice Form State
  const [invPatientId, setInvPatientId] = useState(patients[0]?.id || "");
  const [invItems, setInvItems] = useState<InvoiceItem[]>([
    { description: "Consultation Médecin Généraliste", quantity: 1, unitPrice: 10000 }
  ]);
  const [invMethod, setInvMethod] = useState<Invoice["paymentMethod"]>("Wave / Orange / MTN");
  const [invStatus, setInvStatus] = useState<Invoice["status"]>("Payé");

  // Helper to match medication to invoice items
  const isMedicationInInvoice = (medName: string, itemDescription: string) => {
    const mName = medName.toLowerCase();
    const iDesc = itemDescription.toLowerCase();
    if (mName.includes(iDesc) || iDesc.includes(mName)) return true;
    
    const extractWords = (str: string) => {
      return str
        .replace(/[()\[\]\/,]/g, ' ')
        .split(/\s+/)
        .map(w => w.trim().toLowerCase())
        .filter(w => w.length > 3);
    };
    
    const medWords = extractWords(medName);
    const itemWords = extractWords(itemDescription);
    
    return medWords.some(mw => itemWords.includes(mw));
  };

  const patientInvoices = currentUserRole === UserRole.PATIENT && patientDossierNumber
    ? invoices.filter((i) => i.patientId === patientDossierNumber && i.status === "Payé")
    : [];

  const purchasedMedIds = new Set<string>();
  if (currentUserRole === UserRole.PATIENT) {
    patientInvoices.forEach(inv => {
      inv.items.forEach(item => {
        inventory.forEach(med => {
          if (isMedicationInInvoice(med.name, item.description)) {
            purchasedMedIds.add(med.id);
          }
        });
      });
    });
  }

  // Filter lists
  const filteredStock = inventory
    .filter((m) => {
      if (currentUserRole === UserRole.PATIENT) {
        return purchasedMedIds.has(m.id);
      }
      return true;
    })
    .filter((m) => m.name.toLowerCase().includes(stockSearch.toLowerCase()) || m.category.toLowerCase().includes(stockSearch.toLowerCase()));
  const filteredInvoices = invoices
    .filter((i) => {
      if (currentUserRole === UserRole.PATIENT && patientDossierNumber) {
        return i.patientId === patientDossierNumber;
      }
      return true;
    })
    .filter((i) => i.patientName.toLowerCase().includes(billingSearch.toLowerCase()) || i.id.toLowerCase().includes(billingSearch.toLowerCase()));

  // Safeguard patient confidentiality by ensuring the selected invoice is actually in the filtered list
  const displayedInvoice = selectedInvoiceForDetails && filteredInvoices.some(i => i.id === selectedInvoiceForDetails.id)
    ? selectedInvoiceForDetails
    : (filteredInvoices[0] || null);

  // 1. Save Medication Handler
  const handleSaveMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName || medPrice <= 0) {
      alert("Veuillez remplir correctement les informations du médicament.");
      return;
    }

    addMedication({
      name: medName,
      category: medCategory,
      quantity: medQuantity,
      unit: medUnit,
      threshold: medThreshold,
      expiryDate: medExpiry,
      price: medPrice
    });

    alert("Médicament ajouté avec succès à la pharmacie !");
    setShowAddMedForm(false);
    
    // Clear
    setMedName("");
    setMedPrice(2500);
  };

  // 2. Save Invoice Handler
  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPatient = patients.find((p) => p.id === invPatientId);
    if (!targetPatient) return;

    const finalAmount = invItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

    const newInv = addInvoice({
      patientId: invPatientId,
      patientName: `${targetPatient.firstName} ${targetPatient.lastName}`,
      items: invItems,
      amount: finalAmount,
      status: invStatus,
      paymentMethod: invMethod
    });

    alert(`Facture enregistrée avec succès ! ID: ${newInv.id}`);
    
    // Select this invoice for receipt viewing
    setSelectedInvoiceForDetails(newInv);
    setShowCreateInvoice(false);
    
    // Reset form
    if (currentUserRole === UserRole.PHARMACIE) {
      if (inventory.length > 0) {
        setInvItems([{ description: inventory[0].name, quantity: 1, unitPrice: inventory[0].price }]);
      } else {
        setInvItems([{ description: "", quantity: 1, unitPrice: 0 }]);
      }
    } else {
      setInvItems([{ description: COMMON_MEDICAL_ACTS[0].name, quantity: 1, unitPrice: COMMON_MEDICAL_ACTS[0].price }]);
    }
  };

  const handleOpenCreateInvoiceForm = () => {
    if (currentUserRole === UserRole.PHARMACIE) {
      if (inventory.length > 0) {
        setInvItems([{ description: inventory[0].name, quantity: 1, unitPrice: inventory[0].price }]);
      } else {
        setInvItems([{ description: "", quantity: 1, unitPrice: 0 }]);
      }
    } else {
      setInvItems([{ description: COMMON_MEDICAL_ACTS[0].name, quantity: 1, unitPrice: COMMON_MEDICAL_ACTS[0].price }]);
    }
    setShowCreateInvoice(true);
  };

  const handleAddInvoiceItemLine = () => {
    if (currentUserRole === UserRole.PHARMACIE) {
      if (inventory.length > 0) {
        setInvItems([...invItems, { description: inventory[0].name, quantity: 1, unitPrice: inventory[0].price }]);
      } else {
        setInvItems([...invItems, { description: "", quantity: 1, unitPrice: 0 }]);
      }
    } else {
      setInvItems([...invItems, { description: COMMON_MEDICAL_ACTS[0].name, quantity: 1, unitPrice: COMMON_MEDICAL_ACTS[0].price }]);
    }
  };

  const handleRemoveInvoiceItemLine = (idx: number) => {
    if (invItems.length === 1) return;
    setInvItems(invItems.filter((_, i) => i !== idx));
  };

  const handleUpdateInvoiceItemLine = (idx: number, field: keyof InvoiceItem, val: any) => {
    setInvItems(invItems.map((item, i) => {
      if (i === idx) {
        return {
          ...item,
          [field]: (field === "description" || field === "isCustom") ? val : Number(val)
        };
      }
      return item;
    }));
  };

  // Trigger browser print for Printable Receipt
  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Upper Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setActiveTab("stock"); setShowAddMedForm(false); }}
          className={`px-6 py-3 text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === "stock" 
              ? "border-b-2 border-emerald-600 text-emerald-800" 
              : "text-slate-500 hover:text-slate-800"
          }`}
          id="tab-btn-stock"
        >
          <Pill className="w-4 h-4" />
          <span>Gestion des Stocks Pharmacie</span>
        </button>
        
        <button
          onClick={() => { setActiveTab("billing"); setShowCreateInvoice(false); }}
          className={`px-6 py-3 text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === "billing" 
              ? "border-b-2 border-emerald-600 text-emerald-800" 
              : "text-slate-500 hover:text-slate-800"
          }`}
          id="tab-btn-billing"
        >
          <FileText className="w-4 h-4" />
          <span>Facturation & Paiements Clinique</span>
        </button>
      </div>

      {/* ======================= TAB 1: PHARMACY STOCK ======================= */}
      {activeTab === "stock" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Stock inventory view */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Inventaire des Médicaments</h3>
                <p className="text-xs text-slate-500">Ajustez les quantités, suivez les dates de péremption et contrôlez les alertes.</p>
              </div>

              <div className="flex items-center space-x-2">
                {currentUserRole === UserRole.PHARMACIE && (
                  <button
                    onClick={() => setShowAddMedForm(true)}
                    className="inline-flex items-center space-x-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nouveau Médicament</span>
                  </button>
                )}
              </div>
            </div>

            {/* Search filter bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher une molécule ou catégorie..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="w-full text-xs border border-slate-200 bg-white pl-9 pr-4 py-2.5 rounded-lg focus:outline-emerald-600"
              />
            </div>

            {/* Medication list grid */}
            <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Médicament</th>
                    <th className="px-4 py-3">Catégorie / Prix</th>
                    <th className="px-4 py-3 text-center">Quantité</th>
                    <th className="px-4 py-3 text-right">Ajuster (Mouvement)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {filteredStock.map((med) => {
                    const isLowStock = med.quantity <= med.threshold;

                    return (
                      <tr key={med.id} className={`hover:bg-slate-50/50 transition-colors ${isLowStock ? "bg-amber-50/20" : ""}`}>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-800">{med.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Exp : {med.expiryDate} | ID: {med.id}</div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-semibold uppercase">{med.category}</span>
                          <div className="font-bold text-slate-700 mt-1">{med.price.toLocaleString()} FCFA</div>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <div className={`font-black text-sm ${isLowStock ? "text-amber-600 animate-pulse" : "text-slate-800"}`}>
                            {med.quantity} {med.unit}
                          </div>
                          {isLowStock && (
                            <span className="inline-flex items-center space-x-1 text-[9px] font-extrabold text-amber-700 uppercase mt-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>Seuil Alerte!</span>
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center space-x-1">
                            {currentUserRole === UserRole.PHARMACIE ? (
                              <>
                                <button
                                  onClick={() => updateStock(med.id, 10)}
                                  className="p-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 hover:bg-emerald-100 transition-colors text-[10px] font-bold flex items-center space-x-0.5 cursor-pointer"
                                  title="Réapprovisionner (+10 unités)"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                  <span>+10</span>
                                </button>
                                
                                <button
                                  onClick={() => updateStock(med.id, -1)}
                                  disabled={med.quantity === 0}
                                  className="p-1 bg-red-50 text-red-700 rounded border border-red-100 hover:bg-red-100 transition-colors text-[10px] font-bold flex items-center space-x-0.5 disabled:opacity-50 cursor-pointer"
                                  title="Distribuer / Retirer (-1 unité)"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                  <span>-1</span>
                                </button>
                              </>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-[10px] text-slate-400 font-medium bg-slate-50 border border-slate-200 rounded px-2 py-1">
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span>Verrouillé</span>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  
                  {filteredStock.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center p-8 text-slate-400">
                        Aucun médicament trouvé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Sidebar form (Add Medication) */}
          <div className="space-y-6">
            {currentUserRole === UserRole.PHARMACIE ? (
              showAddMedForm ? (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Ajouter un Médicament</h3>
                  
                  <form onSubmit={handleSaveMedication} className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600">Nom commercial / Molécule :</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Efferalgan 500mg, Augmentin..."
                        value={medName}
                        onChange={(e) => setMedName(e.target.value)}
                        className="w-full border border-slate-200 rounded p-2 bg-slate-50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600">Catégorie pharmaceutique :</label>
                      <select
                        value={medCategory}
                        onChange={(e) => setMedCategory(e.target.value)}
                        className="w-full border border-slate-200 rounded p-2 bg-slate-50 focus:outline-emerald-600"
                      >
                        <option value="Antipaludéens">Antipaludéens</option>
                        <option value="Analgésiques">Analgésiques</option>
                        <option value="Antibiotiques">Antibiotiques</option>
                        <option value="Cardiologie">Cardiologie</option>
                        <option value="Diabétologie">Diabétologie</option>
                        <option value="Antispasmodiques">Antispasmodiques</option>
                        <option value="Vitamines">Vitamines & Suppléments</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">Quantité Initiale :</label>
                        <input
                          type="number"
                          min="0"
                          value={medQuantity}
                          onChange={(e) => setMedQuantity(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded p-2 bg-slate-50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">Unité :</label>
                        <input
                          type="text"
                          placeholder="Ex: Boîtes, Flacons..."
                          value={medUnit}
                          onChange={(e) => setMedUnit(e.target.value)}
                          className="w-full border border-slate-200 rounded p-2 bg-slate-50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">Seuil d'Alerte :</label>
                        <input
                          type="number"
                          min="5"
                          value={medThreshold}
                          onChange={(e) => setMedThreshold(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded p-2 bg-slate-50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">Prix unitaire (FCFA) :</label>
                        <input
                          type="number"
                          min="0"
                          value={medPrice}
                          onChange={(e) => setMedPrice(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded p-2 bg-slate-50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600">Date d'expiration :</label>
                      <input
                        type="date"
                        value={medExpiry}
                        onChange={(e) => setMedExpiry(e.target.value)}
                        className="w-full border border-slate-200 rounded p-2 bg-slate-50"
                      />
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded"
                      >
                        Enregistrer le stock
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddMedForm(false)}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-bold"
                      >
                        Fermer
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-6 space-y-3 text-xs text-emerald-800">
                  <h4 className="font-bold flex items-center space-x-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Procédures Pharmacie</span>
                  </h4>
                  <p className="leading-relaxed">
                    L'approvisionnement régulier de la pharmacie clinique est crucial pour éviter les retards de traitement. 
                    Notre système d'alerte s'active dès qu'une molécule passe sous le seuil d'urgence défini. 
                    Toute modification de stock est immédiatement auditée et enregistrée en cache local pour une parfaite traçabilité.
                  </p>
                </div>
              )
            ) : (
              <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-6 space-y-3 text-xs text-amber-800">
                <h4 className="font-bold flex items-center space-x-1">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>Accès Restreint - Pharmacie</span>
                </h4>
                <p className="leading-relaxed">
                  Conformément aux protocoles sécurisés de Clinique Santé Plus, la gestion de l'inventaire, l'ajout de nouvelles molécules et l'ajustement direct des quantités de stock sont <strong>exclusivement réservés aux pharmaciens</strong> autorisés.
                </p>
                <div className="pt-2 text-[10px] text-slate-500 italic">
                  Votre rôle actuel : <span className="font-bold uppercase text-slate-600">{currentUserRole}</span>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ======================= TAB 2: BILLING & INVOICES ======================= */}
      {activeTab === "billing" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Factures directory */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-800">Registre Facturation</h3>
                <p className="text-[11px] text-slate-500">Suivi des paiements et encaissements.</p>
              </div>
              
              {currentUserRole === UserRole.ACCUEIL || currentUserRole === UserRole.COMPTABLE || currentUserRole === UserRole.PHARMACIE ? (
                <button
                  onClick={handleOpenCreateInvoiceForm}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                  title="Créer une nouvelle facture clinique"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouvelle Facture</span>
                </button>
              ) : (
                <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lecture seule</span>
                </span>
              )}
            </div>

            {/* Search Invoice */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher patient, code..."
                value={billingSearch}
                onChange={(e) => setBillingSearch(e.target.value)}
                className="w-full text-xs border border-slate-200 bg-white pl-9 pr-4 py-2.5 rounded-lg focus:outline-emerald-600"
              />
            </div>

            {/* list rows */}
            <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden max-h-[450px] overflow-y-auto">
              <div className="divide-y divide-slate-50">
                {filteredInvoices.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => {
                      setSelectedInvoiceForDetails(inv);
                      setShowCreateInvoice(false);
                    }}
                    className={`w-full text-left p-4 flex justify-between items-center transition-all ${
                      displayedInvoice?.id === inv.id ? "bg-emerald-50/40 border-r-4 border-emerald-600" : "hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-slate-800">{inv.patientName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Le {inv.date} | {inv.id}</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-slate-700 text-xs">{inv.amount.toLocaleString()} FCFA</div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold mt-1 ${
                        inv.status === "Payé" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  </button>
                ))}

                {filteredInvoices.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Aucune facture trouvée.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center/Right Facture details (Receipt printable card OR New Invoice form) */}
          <div className="lg:col-span-2">
            
            {showCreateInvoice ? (
              /* CREATE FACTURE FORM */
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <span>Saisir une Facture de Consultation / Médicaments</span>
                </h3>

                <form onSubmit={handleSaveInvoice} className="space-y-4 text-xs">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Patient */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Patient débiteur :</label>
                      <select
                        value={invPatientId}
                        onChange={(e) => setInvPatientId(e.target.value)}
                        className="w-full border border-slate-200 rounded p-2 bg-slate-50 focus:outline-emerald-600"
                      >
                        {patients.map((p) => (
                          <option key={p.id} value={p.id}>{p.lastName} {p.firstName} ({p.id})</option>
                        ))}
                      </select>
                    </div>

                    {/* Payment Mode */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Mode de règlement :</label>
                      <select
                        value={invMethod}
                        onChange={(e) => setInvMethod(e.target.value as Invoice["paymentMethod"])}
                        className="w-full border border-slate-200 rounded p-2 bg-slate-50 focus:outline-emerald-600"
                      >
                        <option value="Wave / Orange / MTN">Wave / Orange / MTN (Mobile Money)</option>
                        <option value="Espèces">Espèces (Dépôt direct)</option>
                        <option value="Carte Bancaire">Carte Bancaire</option>
                        <option value="Assurance (Assur)">Prise en charge Assurance (Tiers-Payant)</option>
                      </select>
                    </div>
                  </div>

                  {/* Facture Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Statut initial :</label>
                      <select
                        value={invStatus}
                        onChange={(e) => setInvStatus(e.target.value as Invoice["status"])}
                        className="w-full border border-slate-200 rounded p-2 bg-slate-50 focus:outline-emerald-600"
                      >
                        <option value="Payé">Payé (Encaissement immédiat)</option>
                        <option value="En attente">En attente (Crédit / Assurance à valider)</option>
                      </select>
                    </div>
                  </div>

                  {/* Dynamic Items list */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="font-bold text-slate-600 uppercase tracking-wider">Actes médicaux / Médicaments fournis :</label>
                      <button
                        type="button"
                        onClick={handleAddInvoiceItemLine}
                        className="text-emerald-700 text-xs font-bold hover:underline"
                      >
                        + Ajouter une ligne
                      </button>
                    </div>

                    <div className="space-y-3">
                      {invItems.map((item, idx) => {
                        const dropdownValue = (() => {
                          if (item.isCustom) return "CUSTOM_ACT";
                          if (!item.description) return "";
                          const isPredefinedAct = COMMON_MEDICAL_ACTS.some(act => act.name === item.description);
                          const isMed = inventory.some(m => m.name === item.description);
                          if (isPredefinedAct || isMed) return item.description;
                          return "CUSTOM_ACT";
                        })();

                        const isCustomAct = dropdownValue === "CUSTOM_ACT";
                        const isPredefined = !item.isCustom && (COMMON_MEDICAL_ACTS.some(act => act.name === item.description) || inventory.some(m => m.name === item.description));

                        return (
                          <div key={idx} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                              
                              {/* Item description select dropdown */}
                              <div className="md:col-span-6 space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Désignation de l'élément</label>
                                {currentUserRole === UserRole.PHARMACIE ? (
                                  <select
                                    required
                                    value={item.description}
                                    onChange={(e) => {
                                      const med = inventory.find(m => m.name === e.target.value);
                                      if (med) {
                                        handleUpdateInvoiceItemLine(idx, "description", med.name);
                                        handleUpdateInvoiceItemLine(idx, "unitPrice", med.price);
                                        handleUpdateInvoiceItemLine(idx, "isCustom", false);
                                      } else {
                                        handleUpdateInvoiceItemLine(idx, "description", "");
                                        handleUpdateInvoiceItemLine(idx, "unitPrice", 0);
                                        handleUpdateInvoiceItemLine(idx, "isCustom", false);
                                      }
                                    }}
                                    className="w-full border border-slate-200 rounded p-2 bg-white text-xs font-semibold focus:outline-emerald-600"
                                  >
                                    <option value="">-- Choisir un médicament (Pharmacie uniquement) --</option>
                                    {inventory.map((med) => (
                                      <option key={med.id} value={med.name}>
                                        💊 {med.name} ({med.price.toLocaleString()} FCFA - Stock: {med.quantity})
                                      </option>
                                    ))}
                                  </select>
                                ) : currentUserRole === UserRole.ACCUEIL ? (
                                  <select
                                    required
                                    value={dropdownValue}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === "CUSTOM_ACT") {
                                        handleUpdateInvoiceItemLine(idx, "description", "Soin médical spécifique");
                                        handleUpdateInvoiceItemLine(idx, "unitPrice", 5000);
                                        handleUpdateInvoiceItemLine(idx, "isCustom", true);
                                      } else {
                                        const act = COMMON_MEDICAL_ACTS.find(a => a.name === val);
                                        if (act) {
                                          handleUpdateInvoiceItemLine(idx, "description", act.name);
                                          handleUpdateInvoiceItemLine(idx, "unitPrice", act.price);
                                          handleUpdateInvoiceItemLine(idx, "isCustom", false);
                                        } else {
                                          handleUpdateInvoiceItemLine(idx, "description", "");
                                          handleUpdateInvoiceItemLine(idx, "unitPrice", 0);
                                          handleUpdateInvoiceItemLine(idx, "isCustom", false);
                                        }
                                      }
                                    }}
                                    className="w-full border border-slate-200 rounded p-2 bg-white text-xs font-semibold focus:outline-emerald-600"
                                  >
                                    <option value="">-- Choisir un acte clinique (Secrétariat uniquement) --</option>
                                    {COMMON_MEDICAL_ACTS.map((act, aIdx) => (
                                      <option key={`act-${aIdx}`} value={act.name}>
                                        🩺 {act.name} ({act.price.toLocaleString()} FCFA)
                                      </option>
                                    ))}
                                    <option value="CUSTOM_ACT">✍️ Autre acte médical (Saisie libre)</option>
                                  </select>
                                ) : (
                                  /* COMPTABLE can select both acts and meds */
                                  <select
                                    required
                                    value={dropdownValue}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === "CUSTOM_ACT") {
                                        handleUpdateInvoiceItemLine(idx, "description", "Soin médical spécifique");
                                        handleUpdateInvoiceItemLine(idx, "unitPrice", 5000);
                                        handleUpdateInvoiceItemLine(idx, "isCustom", true);
                                      } else {
                                        const act = COMMON_MEDICAL_ACTS.find(a => a.name === val);
                                        const med = inventory.find(m => m.name === val);
                                        if (act) {
                                          handleUpdateInvoiceItemLine(idx, "description", act.name);
                                          handleUpdateInvoiceItemLine(idx, "unitPrice", act.price);
                                          handleUpdateInvoiceItemLine(idx, "isCustom", false);
                                        } else if (med) {
                                          handleUpdateInvoiceItemLine(idx, "description", med.name);
                                          handleUpdateInvoiceItemLine(idx, "unitPrice", med.price);
                                          handleUpdateInvoiceItemLine(idx, "isCustom", false);
                                        } else {
                                          handleUpdateInvoiceItemLine(idx, "description", "");
                                          handleUpdateInvoiceItemLine(idx, "unitPrice", 0);
                                          handleUpdateInvoiceItemLine(idx, "isCustom", false);
                                        }
                                      }
                                    }}
                                    className="w-full border border-slate-200 rounded p-2 bg-white text-xs font-semibold focus:outline-emerald-600"
                                  >
                                    <option value="">-- Choisir un acte ou médicament (Comptabilité) --</option>
                                    <optgroup label="🩺 Actes Médicaux & Cliniques">
                                      {COMMON_MEDICAL_ACTS.map((act, aIdx) => (
                                        <option key={`compta-act-${aIdx}`} value={act.name}>
                                          🩺 {act.name} ({act.price.toLocaleString()} FCFA)
                                        </option>
                                      ))}
                                      <option value="CUSTOM_ACT">✍️ Autre acte médical (Saisie libre)</option>
                                    </optgroup>
                                    <optgroup label="💊 Médicaments (Pharmacie)">
                                      {inventory.map((med) => (
                                        <option key={`compta-med-${med.id}`} value={med.name}>
                                          💊 {med.name} ({med.price.toLocaleString()} FCFA - Stock: {med.quantity})
                                        </option>
                                      ))}
                                    </optgroup>
                                  </select>
                                )}
                              </div>

                              {/* Quantity input */}
                              <div className="md:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Quantité</label>
                                <input
                                  type="number"
                                  min="1"
                                  required
                                  placeholder="Qté"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateInvoiceItemLine(idx, "quantity", e.target.value)}
                                  className="w-full border border-slate-200 rounded p-2 text-center bg-white text-xs font-semibold focus:outline-emerald-600"
                                />
                              </div>

                              {/* Unit Price input */}
                              <div className="md:col-span-3 space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Prix Unitaire (FCFA)</label>
                                <input
                                  type="number"
                                  min="0"
                                  required
                                  readOnly={isPredefined}
                                  placeholder="Prix"
                                  value={item.unitPrice}
                                  onChange={(e) => handleUpdateInvoiceItemLine(idx, "unitPrice", e.target.value)}
                                  className={`w-full border border-slate-200 rounded p-2 text-right font-bold font-mono text-xs focus:outline-emerald-600 ${
                                    isPredefined ? "bg-slate-100 text-slate-600" : "bg-white text-emerald-800"
                                  }`}
                                />
                              </div>

                              {/* Delete button */}
                              <div className="md:col-span-1 flex justify-center pb-1">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveInvoiceItemLine(idx)}
                                  disabled={invItems.length === 1}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                                  title="Retirer cette ligne"
                                >
                                  ×
                                </button>
                              </div>

                            </div>

                            {/* Custom Saisie Libre input if CUSTOM_ACT is active */}
                            {isCustomAct && currentUserRole !== UserRole.PHARMACIE && (
                              <div className="space-y-1 pt-1.5 border-t border-slate-200/50">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Saisie libre : Description de l'acte médical</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Ex: Soin infirmier, Petite chirurgie d'urgence..."
                                  value={item.description}
                                  onChange={(e) => handleUpdateInvoiceItemLine(idx, "description", e.target.value)}
                                  className="w-full border border-slate-200 rounded p-2 text-xs bg-white focus:outline-emerald-600 font-semibold"
                                />
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Total calculation */}
                  <div className="text-right border-t border-slate-100 pt-3 text-sm">
                    <span className="font-medium text-slate-500">Montant Total Facturé : </span>
                    <span className="font-black text-emerald-800 text-base">
                      {invItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0).toLocaleString()} FCFA
                    </span>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded"
                    >
                      Valider et Enregistrer la Facture
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateInvoice(false)}
                      className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-bold"
                    >
                      Annuler
                    </button>
                  </div>

                </form>
              </div>
            ) : displayedInvoice ? (
              /* RENDER PRINTABLE RECEIPT CARD */
              <div className="space-y-6">
                
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Aperçu du Reçu Clinique</h4>
                  <div className="space-x-2">
                    {displayedInvoice.status === "En attente" && (
                      <button
                        onClick={() => {
                          markInvoiceAsPaid(displayedInvoice.id, "Espèces");
                          // refresh local selected ref
                          setSelectedInvoiceForDetails({
                            ...displayedInvoice,
                            status: "Payé",
                            paymentMethod: "Espèces"
                          });
                          alert("Facture marquée comme PAYÉE !");
                        }}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Enregistrer l'encaissement</span>
                      </button>
                    )}
                    
                    <button
                      onClick={handlePrintReceipt}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimer le reçu</span>
                    </button>
                  </div>
                </div>

                {/* Print layout wrap */}
                <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm font-sans relative overflow-hidden" id="print-section">
                  
                  {/* Decorative stamp watermark */}
                  {displayedInvoice.status === "Payé" && (
                    <div className="absolute right-8 top-16 border-4 border-emerald-600 text-emerald-600 rounded-lg p-2 font-black text-xs tracking-wider transform rotate-12 uppercase select-none opacity-80">
                      PAID • PAYÉ <br/> CLINIQUE SANTÉ PLUS
                    </div>
                  )}

                  {/* Receipt Header details */}
                  <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">CLINIQUE SANTÉ PLUS CI</h2>
                      <p className="text-[10px] text-slate-500">Cocody Angré, Abidjan, Côte d'Ivoire</p>
                      <p className="text-[10px] text-slate-500">Tél: +225 07 07 12 34 56 | CC: 2605149Z</p>
                    </div>
                    
                    <div className="text-right text-xs">
                      <div className="font-extrabold text-slate-800">REÇU DE SOINS</div>
                      <div className="font-mono text-slate-500 mt-1">{displayedInvoice.id}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Date : {displayedInvoice.date}</div>
                    </div>
                  </div>

                  {/* Bill Debtor details */}
                  <div className="py-6 border-b border-slate-100 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">DÉBITEUR / PATIENT :</span>
                      <div className="font-bold text-slate-800">{displayedInvoice.patientName}</div>
                      <div className="text-slate-500 mt-0.5">Identifiant : {displayedInvoice.patientId}</div>
                    </div>
                    
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">RÈGLEMENT :</span>
                      <div className="font-bold text-slate-800">Mode : {displayedInvoice.paymentMethod}</div>
                      <div className="text-slate-500 mt-0.5">Statut : <span className="font-semibold text-emerald-700">{displayedInvoice.status}</span></div>
                    </div>
                  </div>

                  {/* Items list table */}
                  <div className="py-6">
                    <table className="min-w-full text-xs text-left">
                      <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-2">Description des Actes / Articles</th>
                          <th className="py-2 text-center">Quantité</th>
                          <th className="py-2 text-right">Tarif unitaire</th>
                          <th className="py-2 text-right">Total (FCFA)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {displayedInvoice.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-3 font-medium">{item.description}</td>
                            <td className="py-3 text-center">{item.quantity}</td>
                            <td className="py-3 text-right">{item.unitPrice.toLocaleString()}</td>
                            <td className="py-3 text-right font-bold">{(item.unitPrice * item.quantity).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Invoice Summary bottom */}
                  <div className="border-t border-slate-200 pt-6 flex justify-between items-center">
                    <div className="text-[10px] text-slate-400 max-w-sm">
                      Merci pour votre confiance. En cas de réclamation, veuillez contacter le service comptabilité 
                      de la Clinique Santé Plus. Document officiel.
                    </div>
                    
                    <div className="text-right space-y-1">
                      <div className="text-[11px] text-slate-500">Montant Net à payer :</div>
                      <div className="text-xl font-black text-emerald-800 font-display">
                        {displayedInvoice.amount.toLocaleString()} FCFA
                      </div>
                    </div>
                  </div>

                  {/* Simulated barcode for professionalism */}
                  <div className="mt-8 pt-4 border-t border-dashed border-slate-200 flex justify-center">
                    <div className="text-center space-y-1">
                      <div className="inline-block bg-slate-900 text-white px-8 py-1.5 font-mono text-[9px] tracking-[6px]">
                        *CLIN_SANTE_PLUS_{displayedInvoice.id}*
                      </div>
                      <p className="text-[8px] text-slate-400 uppercase font-mono tracking-widest">Code de validation sécurisé - Certification CI</p>
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 bg-white border border-slate-100 rounded-xl shadow-xs">
                Sélectionnez une facture dans le registre de gauche pour afficher son reçu.
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
