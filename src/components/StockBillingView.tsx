import React, { useState } from "react";
import { Medication, Invoice, Patient, InvoiceItem, UserRole, Prescription } from "../types";
import {
  Pill,
  FileText,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Plus,
  ShieldCheck,
  Search,
  Printer,
  Check,
  DollarSign,
  RefreshCw,
  Trash,
  CreditCard,
  User,
  Heart,
  Lock,
  PlusCircle,
  Clock,
  PrinterIcon,
  ChevronRight,
  Shield,
  Activity,
  CheckCircle,
  X,
} from "lucide-react";

const COMMON_MEDICAL_ACTS = [
  { name: "Consultation Médecin Généraliste", price: 10000 },
  { name: "Consultation Médecin Spécialiste", price: 15000 },
  { name: "Pansement clinique simple", price: 3000 },
  { name: "Pansement complexe réfection", price: 7000 },
  { name: "Suture de plaie clinique", price: 8000 },
  { name: "Injection intraveineuse (IV)", price: 2000 },
  { name: "Injection intramusculaire (IM)", price: 1500 },
  { name: "Prélèvement de sang (Laboratoire)", price: 2000 },
  { name: "Échographie obstétricale / générale", price: 15000 },
  { name: "Fiche d'aptitude médicale physique", price: 5000 },
  { name: "Hospitalisation en chambre climatisée / nuit", price: 15000 },
];

interface StockBillingViewProps {
  inventory: Medication[];
  invoices: Invoice[];
  patients: Patient[];
  prescriptions: Prescription[];
  updateStock: (medId: string, quantityChange: number) => void;
  addMedication: (med: Omit<Medication, "id">) => Medication;
  addInvoice: (inv: Omit<Invoice, "id" | "date">) => Invoice;
  markInvoiceAsPaid: (id: string, paymentMethod: Invoice["paymentMethod"]) => void;
  updatePrescriptionStatus: (id: string, status: "Délivrée", notes?: string) => void;
  currentUserRole: UserRole;
  patientDossierNumber?: string;
}

export default function StockBillingView({
  inventory,
  invoices,
  patients,
  prescriptions,
  updateStock,
  addMedication,
  addInvoice,
  markInvoiceAsPaid,
  updatePrescriptionStatus,
  currentUserRole,
  patientDossierNumber,
}: StockBillingViewProps) {
  // Tabs: "stock" | "billing" | "pharmacy"
  const [activeTab, setActiveTab] = useState<"stock" | "billing" | "pharmacy">("stock");

  // --- 1. Stock State Management ---
  const [stockSearch, setStockSearch] = useState("");
  const [showAddMedForm, setShowAddMedForm] = useState(false);
  const [medName, setMedName] = useState("");
  const [medCategory, setMedCategory] = useState("Antipaludéens");
  const [medQuantity, setMedQuantity] = useState(100);
  const [medUnit, setMedUnit] = useState("Boîtes");
  const [medThreshold, setMedThreshold] = useState(20);
  const [medExpiry, setMedExpiry] = useState("2028-12-31");
  const [medPrice, setMedPrice] = useState(2500);

  // --- 2. Billing State Management ---
  const [billingSearch, setBillingSearch] = useState("");
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [selectedInvoiceForDetails, setSelectedInvoiceForDetails] = useState<Invoice | null>(
    currentUserRole === UserRole.PATIENT
      ? invoices.find((inv) => inv.patientId === patientDossierNumber) || null
      : invoices[0] || null
  );

  // New Invoice Form State
  const [invPatientId, setInvPatientId] = useState(patients[0]?.id || "");
  const [invItems, setInvItems] = useState<InvoiceItem[]>([
    { description: "Consultation Médecin Généraliste", quantity: 1, unitPrice: 10000 },
  ]);
  const [invMethod, setInvMethod] = useState<Invoice["paymentMethod"]>("Espèces");

  // Insurance fields for billing
  const [invInsuranceName, setInvInsuranceName] = useState("");
  const [invCoverageRate, setInvCoverageRate] = useState(0); // percentage, e.g. 70

  // Printable Receipt view state
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState<Invoice | null>(null);

  // --- 3. Pharmacy Prescriptions State ---
  const [pharmacySearch, setPharmacySearch] = useState("");
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);

  const selectedPrescription = prescriptions.find(
    (p) =>
      p.id === selectedPrescriptionId &&
      (currentUserRole !== UserRole.PATIENT || p.patientId === patientDossierNumber)
  );

  // Helper to match medication name with actual inventory items
  const findInventoryMatch = (prescriptionMedName: string) => {
    return inventory.find(
      (med) =>
        med.name.toLowerCase().includes(prescriptionMedName.toLowerCase()) ||
        prescriptionMedName.toLowerCase().includes(med.name.toLowerCase())
    );
  };

  // Process Dispense (Pharmacist clicks deliver)
  const handleDispensePrescription = (pres: Prescription) => {
    // 1. Verify and update stock for each item, compile invoice items
    const invoiceItemsList: InvoiceItem[] = [];
    let allInStock = true;
    let missingMedsList: string[] = [];

    pres.items.forEach((item) => {
      const match = findInventoryMatch(item.medicationName);
      if (match) {
        if (match.quantity <= 0) {
          allInStock = false;
          missingMedsList.push(item.medicationName);
        } else {
          invoiceItemsList.push({
            description: `Pharmacie : ${match.name}`,
            quantity: 1, // default 1 pack delivered
            unitPrice: match.price,
          });
        }
      } else {
        // Fallback custom item if not in database
        invoiceItemsList.push({
          description: `Pharmacie : ${item.medicationName}`,
          quantity: 1,
          unitPrice: 2500, // fallback standard price
        });
      }
    });

    if (!allInStock) {
      alert(
        `Impossible de délivrer l'ordonnance : stock épuisé pour (${missingMedsList.join(", ")}). Veuillez réapprovisionner.`
      );
      return;
    }

    // 2. Reduce the physical inventory stock of these items
    pres.items.forEach((item) => {
      const match = findInventoryMatch(item.medicationName);
      if (match) {
        updateStock(match.id, -1); // decrease stock by 1
      }
    });

    // 3. Create a pending invoice automatically in comptabilité!
    const totalAmount = invoiceItemsList.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
    const invoice = addInvoice({
      patientId: pres.patientId,
      patientName: pres.patientName,
      items: invoiceItemsList,
      amount: totalAmount,
      status: "En attente",
      paymentMethod: "Espèces",
    });

    // 4. Mark prescription as delivered
    updatePrescriptionStatus(
      pres.id,
      "Délivrée",
      `Servie à la pharmacie le ${new Date().toISOString().split("T")[0]}. Facture générée : ${invoice.id}.`
    );

    alert(
      `Ordonnance ${pres.id} servie avec succès ! Stock mis à jour et facture ${invoice.id} envoyée à la Caisse.`
    );
    setSelectedPrescriptionId(null);
  };

  // Handle Save New Medication
  const handleSaveMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName || medPrice <= 0 || medQuantity < 0) {
      alert("Veuillez saisir des valeurs de stock valides.");
      return;
    }

    addMedication({
      name: medName,
      category: medCategory,
      quantity: medQuantity,
      unit: medUnit,
      threshold: medThreshold,
      expiryDate: medExpiry,
      price: medPrice,
    });

    setShowAddMedForm(false);
    setMedName("");
    setMedPrice(2500);
    setMedQuantity(100);
  };

  // Handle Create custom Invoice (Accountant panel)
  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id === invPatientId);
    if (!patient) return;

    const total = invItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

    // Coverage calculations if insurance is set
    const insRate = Number(invCoverageRate);
    const hasInsurance = insRate > 0 && invInsuranceName.trim() !== "";
    const insuranceAmount = hasInsurance ? total * (insRate / 100) : 0;
    const patientAmount = total - insuranceAmount;

    addInvoice({
      patientId: patient.id,
      patientName: `${patient.lastName} ${patient.firstName}`,
      items: invItems,
      amount: total,
      status: "En attente", // default pending
      paymentMethod: hasInsurance ? "Assurance (Assur)" : invMethod,
      insuranceName: hasInsurance ? invInsuranceName : undefined,
      insuranceCoverageRate: hasInsurance ? insRate : undefined,
      insuranceAmount: hasInsurance ? insuranceAmount : undefined,
      patientAmount: hasInsurance ? patientAmount : total,
    });

    setShowCreateInvoice(false);
    setInvItems([
      { description: "Consultation Médecin Généraliste", quantity: 1, unitPrice: 10000 },
    ]);
    setInvInsuranceName("");
    setInvCoverageRate(0);
  };

  const addInvoiceRow = (description: string, price: number) => {
    setInvItems([...invItems, { description, quantity: 1, unitPrice: price }]);
  };

  const removeInvoiceRow = (index: number) => {
    if (invItems.length === 1) return;
    setInvItems(invItems.filter((_, idx) => idx !== index));
  };

  // Cash In Pending Invoice
  const handleCashIn = (inv: Invoice) => {
    // Select payment method for the cash-in
    const method = window.prompt(
      `Encaisser la facture ${inv.id} d'un montant de ${inv.patientAmount || inv.amount} FCFA.\nEntrez la méthode de paiement (Espèces, Wave / Orange / MTN, Carte Bancaire, Assurance) :`,
      "Espèces"
    );

    if (method) {
      markInvoiceAsPaid(inv.id, method as Invoice["paymentMethod"]);

      // Update selected detail invoice state to reflect paid status
      setSelectedInvoiceForDetails({
        ...inv,
        status: "Payé",
      });

      alert(`Facture ${inv.id} encaissée avec succès !`);
    }
  };

  const isPatient = currentUserRole === UserRole.PATIENT;

  // Stock Filter
  const filteredStock = inventory.filter(
    (m) =>
      m.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
      m.category.toLowerCase().includes(stockSearch.toLowerCase())
  );

  // Billing Filter (Patients only see their own invoices)
  const filteredInvoices = invoices
    .filter((inv) => !isPatient || inv.patientId === patientDossierNumber)
    .filter(
      (inv) =>
        inv.patientName.toLowerCase().includes(billingSearch.toLowerCase()) ||
        inv.id.toLowerCase().includes(billingSearch.toLowerCase())
    );

  // Pharmacy Prescriptions Filter (Patients only see their own prescriptions)
  const filteredPrescriptions = prescriptions
    .filter((p) => !isPatient || p.patientId === patientDossierNumber)
    .filter(
      (p) =>
        p.patientName.toLowerCase().includes(pharmacySearch.toLowerCase()) ||
        p.id.toLowerCase().includes(pharmacySearch.toLowerCase())
    );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 p-4 lg:p-6" id="stockbilling-root">
      {/* 1. STATE INDICATORS TOP ROW (3 boxes) */}
      <div className="xl:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Stock value or Catalogue reference */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-3xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {isPatient ? "Catalogue Tarifs" : "Médicaments en Stock"}
            </span>
            <p className="text-xl font-bold text-slate-800 mt-0.5">{inventory.length} Références</p>
            {isPatient ? (
              <span className="text-[10px] text-slate-400 font-medium">
                Tarifs de référence disponibles
              </span>
            ) : (
              <span className="text-[10px] text-red-500 font-semibold flex items-center mt-1">
                {inventory.filter((m) => m.quantity <= m.threshold).length} alertes rupture stock
              </span>
            )}
          </div>
        </div>

        {/* Total Revenue cashed or My billing sum */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-3xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {isPatient ? "Total de mes Factures" : "Chiffre d'Affaires"}
            </span>
            <p className="text-xl font-bold text-slate-800 mt-0.5">
              {isPatient
                ? invoices
                    .filter((i) => i.patientId === patientDossierNumber)
                    .reduce((acc, i) => acc + (i.patientAmount || i.amount), 0)
                    .toLocaleString()
                : invoices
                    .filter((i) => i.status === "Payé")
                    .reduce((acc, i) => acc + i.amount, 0)
                    .toLocaleString()}{" "}
              FCFA
            </p>
            <span className="text-[10px] text-slate-400 font-medium">
              {isPatient ? "Montant cumulé de vos prestations" : "Encaissé sur les paiements validés"}
            </span>
          </div>
        </div>

        {/* Prescriptions queue or My prescriptions */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-3xs flex items-center space-x-4">
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {isPatient ? "Mes Ordonnances" : "File d'Attente Pharmacie"}
            </span>
            <p className="text-xl font-bold text-slate-800 mt-0.5">
              {isPatient
                ? prescriptions.filter((p) => p.patientId === patientDossierNumber).length
                : prescriptions.filter((p) => p.status === "Prescrite").length}{" "}
              ordonnances
            </p>
            <span className="text-[10px] text-yellow-600 font-semibold mt-1 block">
              {isPatient
                ? `${prescriptions.filter((p) => p.patientId === patientDossierNumber && p.status === "Prescrite").length} en attente de service`
                : "En attente de service/délivrance"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. SUB-TABS NAVIGATION COLUMN (12 cols width) */}
      <div className="xl:col-span-12 flex bg-white border border-slate-200/60 p-1.5 rounded-xl gap-1">
        <button
          onClick={() => setActiveTab("stock")}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === "stock"
              ? "bg-emerald-50 text-emerald-700"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>{isPatient ? "Catalogue des Tarifs" : "Pharmacie : Inventaire & Prix"}</span>
        </button>

        <button
          onClick={() => setActiveTab("pharmacy")}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === "pharmacy"
              ? "bg-emerald-50 text-emerald-700"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{isPatient ? "Mes Ordonnances" : "Ordonnances à Servir"}</span>
          {(isPatient
            ? prescriptions.filter((p) => p.patientId === patientDossierNumber && p.status === "Prescrite").length
            : prescriptions.filter((p) => p.status === "Prescrite").length) > 0 && (
            <span className="w-4.5 h-4.5 bg-yellow-500 text-white font-mono font-bold text-[9px] rounded-full flex items-center justify-center animate-pulse">
              {isPatient
                ? prescriptions.filter((p) => p.patientId === patientDossierNumber && p.status === "Prescrite").length
                : prescriptions.filter((p) => p.status === "Prescrite").length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("billing")}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === "billing"
              ? "bg-emerald-50 text-emerald-700"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{isPatient ? "Mes Factures Clinique" : "Facturation & Comptabilité"}</span>
          {(!isPatient
            ? invoices.filter((i) => i.status === "En attente").length
            : invoices.filter((i) => i.patientId === patientDossierNumber && i.status === "En attente").length) > 0 && (
            <span className="w-4.5 h-4.5 bg-red-500 text-white font-mono font-bold text-[9px] rounded-full flex items-center justify-center">
              {isPatient
                ? invoices.filter((i) => i.patientId === patientDossierNumber && i.status === "En attente").length
                : invoices.filter((i) => i.status === "En attente").length}
            </span>
          )}
        </button>
      </div>

      {/* --- TAB CONTENT: 1. INVENTAIRE DU STOCK --- */}
      {activeTab === "stock" && (
        <div className="xl:col-span-12 space-y-4">
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-3xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                <Pill className="w-4 h-4 text-emerald-600" />
                <span>Base des Produits Médicamenteux & Consommables</span>
              </h4>
              {currentUserRole !== UserRole.PATIENT && (
                <button
                  onClick={() => setShowAddMedForm(!showAddMedForm)}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Enregistrer Médicament</span>
                </button>
              )}
            </div>

            {/* Add stock product form */}
            {showAddMedForm && (
              <form
                onSubmit={handleSaveMedication}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs"
              >
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">
                    Désignation du médicament :
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Coartem 80/480mg"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    className="w-full border border-slate-200 rounded p-2 bg-white focus:outline-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">
                    Catégorie pharmacologique :
                  </label>
                  <select
                    value={medCategory}
                    onChange={(e) => setMedCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded p-2 bg-white focus:outline-emerald-600"
                  >
                    <option value="Antipaludéens">Antipaludéens</option>
                    <option value="Antibiotiques">Antibiotiques</option>
                    <option value="Antalgiques / Anti-inflammatoires">
                      Antalgiques / Anti-inflammatoires
                    </option>
                    <option value="Cardio-vasculaires">Cardio-vasculaires</option>
                    <option value="Diabète / Endocrinologie">Diabète / Endocrinologie</option>
                    <option value="Consommables Cliniques">Consommables Cliniques</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Prix unitaire (FCFA) :</label>
                  <input
                    type="number"
                    required
                    value={medPrice}
                    onChange={(e) => setMedPrice(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded p-2 bg-white focus:outline-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Quantité initiale :</label>
                  <input
                    type="number"
                    required
                    value={medQuantity}
                    onChange={(e) => setMedQuantity(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded p-2 bg-white focus:outline-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Seuil d'alerte rupture :</label>
                  <input
                    type="number"
                    required
                    value={medThreshold}
                    onChange={(e) => setMedThreshold(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded p-2 bg-white focus:outline-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Date de péremption :</label>
                  <input
                    type="date"
                    required
                    value={medExpiry}
                    onChange={(e) => setMedExpiry(e.target.value)}
                    className="w-full border border-slate-200 rounded p-2 bg-white focus:outline-emerald-600"
                  />
                </div>
                <div className="md:col-span-3 flex justify-end space-x-2 pt-2 border-t border-slate-200">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition shadow-2xs"
                  >
                    Enregistrer Médicament
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddMedForm(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold cursor-pointer"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}

            {/* Filter Stock Search */}
            <div className="relative max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Filtrer par désignation ou catégorie pharmacologique..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-emerald-600"
              />
            </div>

            {/* Stock table */}
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-xs divide-y divide-slate-100">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-3 pl-4">Médicament</th>
                    <th className="p-3">Catégorie</th>
                    <th className="p-3 text-center">Quantité</th>
                    <th className="p-3 text-center">Alerte Seuil</th>
                    <th className="p-3 text-right">Prix Boîte</th>
                    <th className="p-3 text-center">Expiration</th>
                    {currentUserRole !== UserRole.PATIENT && (
                      <th className="p-3 text-center pr-4">Approvisionner</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                  {filteredStock.map((m) => {
                    const isLow = m.quantity <= m.threshold;
                    const isOut = m.quantity === 0;
                    return (
                      <tr key={m.id} className={isLow ? "bg-red-50/20" : ""}>
                        <td className="p-3 pl-4">
                          <div className="font-bold text-slate-800">{m.name}</div>
                          <span className="text-[9px] text-slate-400 font-mono font-bold uppercase">
                            {m.id}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{m.category}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isOut
                                ? "bg-red-100 text-red-800"
                                : isLow
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-emerald-50 text-emerald-800"
                            }`}
                          >
                            {m.quantity} {m.unit}
                          </span>
                        </td>
                        <td className="p-3 text-center text-slate-400 font-mono">{m.threshold}</td>
                        <td className="p-3 text-right font-bold text-slate-900">
                          {m.price.toLocaleString()} FCFA
                        </td>
                        <td className="p-3 text-center text-slate-500 font-mono">{m.expiryDate}</td>
                        {currentUserRole !== UserRole.PATIENT && (
                          <td className="p-3 text-center pr-4">
                            <div className="inline-flex rounded-md shadow-3xs" role="group">
                              <button
                                onClick={() => updateStock(m.id, 50)}
                                className="px-2 py-1 bg-slate-50 border border-slate-200 text-emerald-700 text-[10px] font-bold rounded-l hover:bg-slate-100 transition cursor-pointer"
                              >
                                +50
                              </button>
                              <button
                                onClick={() => m.quantity >= 10 && updateStock(m.id, -10)}
                                className="px-2 py-1 bg-slate-50 border-t border-b border-r border-slate-200 text-red-700 text-[10px] font-bold rounded-r hover:bg-slate-100 transition cursor-pointer"
                              >
                                -10
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: 2. ORDONNANCES A SERVIR (PHARMACY DISPENSING) --- */}
      {activeTab === "pharmacy" && (
        <div className="xl:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* List panel */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-3xs space-y-4 md:col-span-1">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-50 pb-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Ordonnances Actives</span>
            </h4>

            {/* Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                <Search className="w-3.5 h-3.5 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Chercher patient, ID..."
                value={pharmacySearch}
                onChange={(e) => setPharmacySearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredPrescriptions.map((pres) => {
                const isSelected = pres.id === selectedPrescriptionId;
                const isPending = pres.status === "Prescrite";
                return (
                  <button
                    key={pres.id}
                    onClick={() => setSelectedPrescriptionId(pres.id)}
                    className={`w-full text-left p-3.5 rounded-lg border text-xs transition flex flex-col space-y-1 ${
                      isSelected
                        ? "bg-emerald-50/50 border-emerald-400"
                        : "bg-slate-50/60 border-slate-100 hover:bg-slate-100/50"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold text-slate-800 truncate">{pres.patientName}</span>
                      <span className="font-mono text-[9px] font-bold text-slate-400">
                        {pres.id}
                      </span>
                    </div>
                    <div className="flex justify-between items-center w-full pt-1">
                      <span className="text-[10px] text-slate-500">Dr : {pres.doctorName}</span>
                      {isPending ? (
                        <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider animate-pulse">
                          Prescrite
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">
                          Délivrée
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {filteredPrescriptions.length === 0 && (
                <p className="text-center py-6 text-slate-400 text-xs">Aucune ordonnance.</p>
              )}
            </div>
          </div>

          {/* Details & serve panel */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-3xs md:col-span-2 min-h-[400px] flex flex-col justify-between">
            {selectedPrescription ? (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-mono font-bold uppercase">
                      {selectedPrescription.id}
                    </span>
                    <h4 className="font-bold text-slate-800 text-sm mt-1">
                      Servir Ordonnance : {selectedPrescription.patientName}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Prescrit par : {selectedPrescription.doctorName} le{" "}
                      {selectedPrescription.date}
                    </p>
                  </div>
                  {selectedPrescription.status === "Délivrée" ? (
                    <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded text-xs font-bold uppercase flex items-center">
                      <Check className="w-3.5 h-3.5 mr-1" /> Delivered
                    </span>
                  ) : (
                    <span className="bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded text-xs font-bold uppercase animate-pulse">
                      Pending
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                    Médicaments prescrits :
                  </span>

                  <div className="space-y-2.5">
                    {selectedPrescription.items.map((item, idx) => {
                      const match = findInventoryMatch(item.medicationName);
                      const inStock = match ? match.quantity > 0 : false;
                      const hasLowStock = match ? match.quantity <= match.threshold : false;

                      return (
                        <div
                          key={idx}
                          className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800">{item.medicationName}</span>
                            <div className="text-[10px] text-slate-500">
                              Posologie : {item.dosage} — {item.frequency} ({item.duration})
                            </div>
                          </div>

                          <div className="text-right space-y-0.5">
                            {match ? (
                              <>
                                <span
                                  className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    inStock
                                      ? hasLowStock
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-emerald-100 text-emerald-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {inStock
                                    ? `En stock : ${match.quantity} Boîtes`
                                    : "STOCK RUPTURE"}
                                </span>
                                <p className="text-[10px] font-bold text-slate-600 pt-0.5">
                                  {match.price.toLocaleString()} FCFA
                                </p>
                              </>
                            ) : (
                              <span className="bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                                Non répertorié au stock
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedPrescription.notes && (
                  <p className="text-xs italic text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-100">
                    <strong>Instructions cliniques :</strong> {selectedPrescription.notes}
                  </p>
                )}

                {selectedPrescription.status === "Prescrite" ? (
                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    {currentUserRole !== UserRole.PATIENT ? (
                      <button
                        type="button"
                        onClick={() => handleDispensePrescription(selectedPrescription)}
                        className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        <Pill className="w-4 h-4" />
                        <span>Délivrer les Médicaments & Facturer</span>
                      </button>
                    ) : (
                      <span className="text-xs text-yellow-700 font-bold bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
                        Cette ordonnance est en cours de préparation par la pharmacie interne.
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="pt-4 border-t border-slate-100 text-xs text-emerald-800 font-bold bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1.5 text-emerald-600" />
                    <span>Cette ordonnance a été servie et délivrée par la pharmacie.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 flex flex-col justify-center items-center h-full space-y-3">
                <Clock className="w-12 h-12 text-slate-300" />
                <p className="text-xs max-w-xs">
                  Sélectionnez une ordonnance clinique dans le panneau de gauche pour la servir ou
                  vérifier la disponibilité de ses produits.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: 3. FACTURATION & COMPTABILITE --- */}
      {activeTab === "billing" && (
        <div className="xl:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Invoices Directory (lg:col-span-4) */}
          <div className="lg:col-span-4 bg-white border border-slate-100 rounded-xl p-4 shadow-3xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Factures Hôpital</span>
              </h4>
              {currentUserRole !== UserRole.PATIENT && (
                <button
                  onClick={() => setShowCreateInvoice(true)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-md cursor-pointer transition shadow-3xs"
                >
                  Nouvelle Facture
                </button>
              )}
            </div>

            {/* Create Invoice dialog popup overlay */}
            {showCreateInvoice && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-3xs flex justify-center items-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-2xl border border-slate-150 w-full max-w-lg p-5 space-y-4 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-800 text-sm flex items-center space-x-1">
                      <PlusCircle className="w-4 h-4 text-emerald-600" />
                      <span>Éditer Facture Clinique</span>
                    </span>
                    <button
                      onClick={() => setShowCreateInvoice(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateInvoiceSubmit} className="space-y-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Patient destinataire :</label>
                      <select
                        value={invPatientId}
                        onChange={(e) => setInvPatientId(e.target.value)}
                        className="w-full border border-slate-200 rounded p-2 bg-white"
                      >
                        {patients.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.lastName} {p.firstName} ({p.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">
                        Sélectionner actes cliniques à ajouter :
                      </label>
                      <div className="grid grid-cols-2 gap-1 max-h-[140px] overflow-y-auto bg-slate-50 p-2 rounded border border-slate-250">
                        {COMMON_MEDICAL_ACTS.map((act, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => addInvoiceRow(act.name, act.price)}
                            className="text-left text-[10px] p-1 bg-white hover:bg-emerald-50 rounded border border-slate-200 truncate transition font-medium"
                          >
                            + {act.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Invoice items display */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">
                        Détails des actes facturés :
                      </label>

                      {invItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-slate-50 p-1.5 rounded border border-slate-100"
                        >
                          <span className="font-bold text-[10px] text-slate-700 max-w-[200px] truncate">
                            {item.description}
                          </span>
                          <div className="flex items-center space-x-2 text-[10px]">
                            <span className="font-semibold text-slate-600">
                              {item.unitPrice.toLocaleString()} FCFA
                            </span>
                            <button
                              type="button"
                              disabled={invItems.length === 1}
                              onClick={() => removeInvoiceRow(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Mutuelle co-payment configuration */}
                    <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <label className="font-bold text-emerald-950 text-[10px]">
                          Mutuelle / Assurance (Assur) :
                        </label>
                        <select
                          value={invInsuranceName}
                          onChange={(e) => setInvInsuranceName(e.target.value)}
                          className="w-full border border-slate-200 rounded p-1 bg-white text-[10px]"
                        >
                          <option value="">Aucune (Paiement 100% Patient)</option>
                          <option value="MUGEF-CI">MUGEF-CI (Fonctionnaires)</option>
                          <option value="ASCOMA">ASCOMA</option>
                          <option value="GNA Assurance">GNA Assurance</option>
                          <option value="Saham Assurance">Saham Assurance</option>
                        </select>
                      </div>
                      <div className="space-y-0.5">
                        <label className="font-bold text-emerald-950 text-[10px]">
                          Taux de couverture (%) :
                        </label>
                        <select
                          value={invCoverageRate}
                          onChange={(e) => setInvCoverageRate(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded p-1 bg-white text-[10px] font-bold"
                        >
                          <option value="0">0%</option>
                          <option value="70">70% (Standard)</option>
                          <option value="80">80% (MUGEF-CI)</option>
                          <option value="100">100% (Prise en charge totale)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600">
                          Mode d'encaissement par défaut :
                        </label>
                        <select
                          value={invMethod}
                          onChange={(e) => setInvMethod(e.target.value as any)}
                          className="w-full border border-slate-200 rounded p-1.5 bg-white text-xs"
                        >
                          <option value="Espèces">Espèces</option>
                          <option value="Wave / Orange / MTN">Wave / Orange / MTN MoMo</option>
                          <option value="Carte Bancaire">Carte Bancaire</option>
                        </select>
                      </div>

                      <div className="flex items-end justify-end space-x-2">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                        >
                          Émettre Facture
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCreateInvoice(false)}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold cursor-pointer"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                <Search className="w-3.5 h-3.5 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Chercher facture, patient..."
                value={billingSearch}
                onChange={(e) => setBillingSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Invoice list */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {filteredInvoices.map((inv) => {
                const isSelected = inv.id === selectedInvoiceForDetails?.id;
                const isPaid = inv.status === "Payé";
                return (
                  <button
                    key={inv.id}
                    onClick={() => setSelectedInvoiceForDetails(inv)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition flex flex-col space-y-1 ${
                      isSelected
                        ? "bg-emerald-50/50 border-emerald-400"
                        : "bg-slate-50/60 border-slate-100 hover:bg-slate-100/50"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold text-slate-800 truncate">{inv.patientName}</span>
                      <span className="font-mono text-[9px] font-bold text-slate-400">
                        {inv.id}
                      </span>
                    </div>
                    <div className="flex justify-between items-center w-full pt-1">
                      <span className="font-bold text-slate-900">
                        {(inv.patientAmount || inv.amount).toLocaleString()} FCFA
                      </span>
                      {isPaid ? (
                        <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">
                          Payée
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase animate-pulse">
                          En attente
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Invoice Details & Cashed actions (lg:col-span-8) */}
          <div className="lg:col-span-8 bg-white border border-slate-100 rounded-xl p-5 shadow-3xs flex flex-col justify-between min-h-[400px]">
            {selectedInvoiceForDetails ? (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-mono font-bold uppercase">
                      ID Facture : {selectedInvoiceForDetails.id}
                    </span>
                    <h4 className="font-bold text-slate-800 text-sm mt-1">
                      Destinataire : {selectedInvoiceForDetails.patientName}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Date d'émission : {selectedInvoiceForDetails.date}
                    </p>
                  </div>
                  {selectedInvoiceForDetails.status === "Payé" ? (
                    <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded text-xs font-bold uppercase">
                      Facture Payée
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded text-xs font-bold uppercase animate-pulse">
                      Attente de Règlement
                    </span>
                  )}
                </div>

                {/* Items lists */}
                <div className="space-y-1.5 text-xs">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                    Prestations détaillées :
                  </span>

                  <div className="bg-white rounded-lg border border-slate-100 overflow-hidden">
                    <table className="w-full text-left divide-y divide-slate-100">
                      <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
                        <tr>
                          <th className="p-2 pl-3">Description Prestation</th>
                          <th className="p-2 text-center">Quantité</th>
                          <th className="p-2 text-right pr-3">Prix unitaire</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                        {selectedInvoiceForDetails.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-2 pl-3 font-bold text-slate-800">
                              {item.description}
                            </td>
                            <td className="p-2 text-center">{item.quantity}</td>
                            <td className="p-2 text-right pr-3 font-bold">
                              {item.unitPrice.toLocaleString()} FCFA
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Insurance claims calculations displays */}
                {selectedInvoiceForDetails.insuranceName && (
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-xs grid grid-cols-3 gap-4 font-medium text-emerald-950">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">
                        Mutuelle :
                      </span>
                      <strong className="text-emerald-900">
                        {selectedInvoiceForDetails.insuranceName}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">
                        Taux de Prise en Charge :
                      </span>
                      <strong className="text-emerald-900">
                        {selectedInvoiceForDetails.insuranceCoverageRate}%
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">
                        Couverture Assurance :
                      </span>
                      <strong className="text-emerald-900">
                        {selectedInvoiceForDetails.insuranceAmount?.toLocaleString()} FCFA
                      </strong>
                    </div>
                  </div>
                )}

                {/* Grand totals display */}
                <div className="border-t border-slate-100 pt-3 flex flex-col items-end text-xs space-y-1">
                  <div className="text-slate-500">
                    Montant Brut Total :{" "}
                    <strong className="text-slate-800 text-sm font-semibold">
                      {selectedInvoiceForDetails.amount.toLocaleString()} FCFA
                    </strong>
                  </div>
                  {selectedInvoiceForDetails.insuranceName && (
                    <div className="text-emerald-700">
                      Tiers-Payant Assurance :{" "}
                      <strong>
                        -{selectedInvoiceForDetails.insuranceAmount?.toLocaleString()} FCFA
                      </strong>
                    </div>
                  )}
                  <div className="text-base font-black text-slate-900 pt-1">
                    NET À PAYER PATIENT :{" "}
                    {(
                      selectedInvoiceForDetails.patientAmount || selectedInvoiceForDetails.amount
                    ).toLocaleString()}{" "}
                    FCFA
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                  {selectedInvoiceForDetails.status === "En attente" &&
                    currentUserRole !== UserRole.PATIENT && (
                      <button
                        type="button"
                        onClick={() => handleCashIn(selectedInvoiceForDetails)}
                        className="inline-flex items-center space-x-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition shadow-2xs text-xs"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>Encaisser Règlement</span>
                      </button>
                    )}

                  {selectedInvoiceForDetails.status === "Payé" && (
                    <button
                      type="button"
                      onClick={() => setSelectedInvoiceForReceipt(selectedInvoiceForDetails)}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer text-xs"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Aperçu du Reçu de Caisse</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 flex flex-col justify-center items-center h-full space-y-3">
                <FileText className="w-12 h-12 text-slate-300" />
                <p className="text-xs">
                  Sélectionnez une facture dans le répertoire de gauche pour voir les détails,
                  appliquer une mutuelle ou encaisser les règlements.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- 5. PRINTABLE CASH RECEIPT MODAL --- */}
      {selectedInvoiceForReceipt && (currentUserRole !== UserRole.PATIENT || selectedInvoiceForReceipt.patientId === patientDossierNumber) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center p-4 z-50">
          <div className="bg-white border-2 border-emerald-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="bg-emerald-800 text-white p-3 flex justify-between items-center">
              <span className="font-bold text-xs uppercase tracking-wider flex items-center space-x-2">
                <PrinterIcon className="w-4 h-4" />
                <span>Reçu de Caisse Officiel</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedInvoiceForReceipt(null)}
                className="w-7 h-7 rounded-full bg-emerald-900 flex items-center justify-center text-white hover:bg-emerald-950 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt layout */}
            <div
              className="flex-1 overflow-y-auto p-6 font-sans bg-white relative text-slate-800 text-xs space-y-5"
              id="printable-cash-receipt"
            >
              <div className="text-center border-b border-slate-200 pb-3 space-y-0.5">
                <h4 className="text-emerald-800 font-black text-sm">CLINIQUE SANTÉ PLUS</h4>
                <p className="text-[10px] text-slate-500">
                  Service Encaissement & Facturation — Abidjan, Côte d'Ivoire
                </p>
                <p className="text-[9px] text-slate-400 font-mono">
                  REÇU DE PAIEMENT N° {selectedInvoiceForReceipt.id}
                </p>
              </div>

              {/* Patient Metadata */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 font-bold text-[8px] uppercase">
                    Patient bénéficiaire :
                  </span>
                  <p className="font-bold text-slate-800">
                    {selectedInvoiceForReceipt.patientName}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Dossier ID : {selectedInvoiceForReceipt.patientId}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-bold text-[8px] uppercase">
                    Encaissé le :
                  </span>
                  <p className="font-bold text-slate-800">{selectedInvoiceForReceipt.date}</p>
                  <p className="text-emerald-700 font-bold text-[10px]">
                    Mode : {selectedInvoiceForReceipt.paymentMethod}
                  </p>
                </div>
              </div>

              {/* Recip items table */}
              <div className="space-y-1">
                <span className="text-slate-400 font-bold text-[8px] uppercase">
                  Détails des règlements :
                </span>
                <table className="w-full text-left divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50 text-[9px] font-bold text-slate-400">
                    <tr>
                      <th className="p-2">Prestation / Médicament</th>
                      <th className="p-2 text-right">Montant brut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {selectedInvoiceForReceipt.items.map((item, index) => (
                      <tr key={index}>
                        <td className="p-2 font-bold text-slate-800">{item.description}</td>
                        <td className="p-2 text-right font-bold text-slate-700">
                          {item.unitPrice.toLocaleString()} FCFA
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Insurance co-payments detailed rows if applicable */}
              <div className="border-t border-slate-200 pt-3 space-y-1 text-right">
                <div className="text-slate-500 text-[11px]">
                  Montant Brut Total :{" "}
                  <span className="font-bold text-slate-700">
                    {selectedInvoiceForReceipt.amount.toLocaleString()} FCFA
                  </span>
                </div>
                {selectedInvoiceForReceipt.insuranceName && (
                  <>
                    <div className="text-emerald-700 text-[11px]">
                      Part Mutuelle ({selectedInvoiceForReceipt.insuranceName}{" "}
                      {selectedInvoiceForReceipt.insuranceCoverageRate}%) :{" "}
                      <span className="font-bold">
                        -{selectedInvoiceForReceipt.insuranceAmount?.toLocaleString()} FCFA
                      </span>
                    </div>
                  </>
                )}
                <div className="text-xs font-black text-slate-900 border-t border-double border-slate-300 pt-1">
                  NET PAYÉ PATIENT (QUITUS) :{" "}
                  {(
                    selectedInvoiceForReceipt.patientAmount || selectedInvoiceForReceipt.amount
                  ).toLocaleString()}{" "}
                  FCFA
                </div>
              </div>

              {/* Stamp */}
              <div className="flex justify-between items-end pt-5 border-t border-slate-150">
                <div className="text-[8px] text-slate-400 leading-relaxed max-w-[200px]">
                  Clinique Santé Plus, Agréé Ministère de la Santé N° 2026/MSHP/CAB.
                  <br />
                  Le présent quitus libère le patient pour les actes spécifiés ci-dessus.
                </div>
                <div className="text-center relative">
                  <div className="w-24 h-24 border-2 border-double border-emerald-600 rounded-full flex flex-col justify-center items-center rotate-12 bg-emerald-50/10 p-1 opacity-80">
                    <span className="text-[7px] font-black text-emerald-800 uppercase tracking-widest text-center">
                      CAISSE CENTRALE
                    </span>
                    <span className="text-[8px] font-bold text-emerald-600 py-0.5">ACQUITTÉ</span>
                    <span className="text-[6px] font-mono text-emerald-500 font-bold">
                      CSP-C-01
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-semibold mt-1">
                    La caissière centrale
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer Reçu</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoiceForReceipt(null)}
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
