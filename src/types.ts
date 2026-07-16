/**
 * Types globaux pour le système Clinique Santé Plus
 */

export enum UserRole {
  ADMIN = "administrateur",
  DIRECTION = "directeur",
  ACCUEIL = "secretaire",
  MEDECIN = "medecin",
  COMPTABLE = "comptable",
  PHARMACIE = "pharmacien",
  LABORATOIRE = "laboratoire",
  PATIENT = "patient",
}

export interface MedicalRecordEntry {
  id: string;
  date: string;
  diagnosis: string;
  prescription: string;
  doctorName: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  birthDate: string;
  gender: string;
  bloodType: string;
  allergies: string;
  sensitiveDataSigned: boolean; // Sécurisation des données sensibles
  medicalHistory: MedicalRecordEntry[];
  createdAt: string;
}

export type AppointmentStatus =
  | "À faire"
  | "Envoyé"
  | "Confirmé"
  | "Reporté"
  | "Absent"
  | "En attente de confirmation"
  | "Confirmation envoyée";

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  date: string;
  time: string;
  reason: string;
  status: AppointmentStatus;
  notes: string;
  whatsappSentAtDate?: string;
  whatsappSentAtTime?: string;
  whatsappSentBy?: string;
}

export interface Medication {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  threshold: number; // Niveau d'alerte critique
  expiryDate: string;
  price: number;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  isCustom?: boolean;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  items: InvoiceItem[];
  amount: number;
  status: "Payé" | "En attente" | "Annulé";
  paymentMethod: "Espèces" | "Wave / Orange / MTN" | "Carte Bancaire" | "Assurance (Assur)";
  insuranceName?: string;
  insuranceCoverageRate?: number; // e.g. 70, 80, 100 for percentage
  insuranceAmount?: number;
  patientAmount?: number;
}

export interface Consultation {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  temperature: number; // in °C
  weight: number; // in kg
  bloodPressure: string; // e.g. "12/8"
  heartRate: number; // bpm
  symptoms: string;
  diagnosis: string;
  notes: string;
  prescriptionId?: string; // Linked prescription
  labRequestId?: string; // Linked lab request
}

export interface PrescriptionItem {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: string;
  items: PrescriptionItem[];
  status: "Prescrite" | "Délivrée";
  dispensedDate?: string;
  notes?: string;
}

export interface LabTest {
  name: string;
  result?: string;
  referenceRange?: string;
  status: "En attente" | "En cours" | "Prêt";
  unit?: string;
  value?: string;
  isAbnormal?: boolean;
  referenceMin?: string;
  referenceMax?: string;
}

export interface LabRequest {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: string;
  tests: LabTest[];
  status: "En attente" | "En cours" | "Prêt";
  priority?: "normal" | "urgent";
  sampleId?: string;
  sampleType?: string;
  sampleCollectedAt?: string;
  validationStatus?: "en_attente_saisie" | "technicien_saisi" | "biologiste_valide";
  biologistName?: string;
  validatedAt?: string;
  documents?: string[];
  technicianName?: string;
  updatedAt?: string;
  notes?: string;
}

export interface LabReagent {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  threshold: number;
  expiryDate: string;
}

export interface Complaint {
  id: string;
  patientName: string;
  patientPhone: string;
  date: string;
  category: "Accueil" | "Temps d'attente" | "Qualité des soins" | "Tarification" | "Autre";
  description: string;
  severity: "Basse" | "Moyenne" | "Critique";
  status: "Reçu" | "En cours de traitement" | "Résolu";
  resolutionNotes?: string;
  satisfactionScore?: number; // 1 to 5 for patient satisfaction tracking
}

// System Backup format
export interface SystemBackup {
  version: string;
  exportedAt: string;
  patients: Patient[];
  appointments: Appointment[];
  inventory: Medication[];
  invoices: Invoice[];
  complaints: Complaint[];
  consultations?: Consultation[];
  prescriptions?: Prescription[];
  labRequests?: LabRequest[];
  labReagents?: LabReagent[];
}

// Local Sync Queue for Offline Management
export interface SyncAction {
  id: string;
  timestamp: string;
  type:
    | "CREATE_PATIENT"
    | "UPDATE_PATIENT"
    | "CREATE_APPOINTMENT"
    | "UPDATE_APPOINTMENT"
    | "DELETE_APPOINTMENT"
    | "UPDATE_STOCK"
    | "CREATE_INVOICE"
    | "CREATE_COMPLAINT";
  payload: any;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  userName: string;
  userRole: string;
  action: string; // "Connexion" | "Déconnexion" | "Création de compte" | "Modification importante" | "Suppression" | "Changement de permissions" | "Accès refusé" | "Changement de mot de passe"
  details: string;
  ipAddress?: string;
  status: "Succès" | "Échec";
}
