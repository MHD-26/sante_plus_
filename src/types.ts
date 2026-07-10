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
  PATIENT = "patient"
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

export type AppointmentStatus = "À faire" | "Envoyé" | "Confirmé" | "Reporté" | "Absent" | "En attente de confirmation";

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
}

// Local Sync Queue for Offline Management
export interface SyncAction {
  id: string;
  timestamp: string;
  type: "CREATE_PATIENT" | "CREATE_APPOINTMENT" | "UPDATE_APPOINTMENT" | "DELETE_APPOINTMENT" | "UPDATE_STOCK" | "CREATE_INVOICE" | "CREATE_COMPLAINT";
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

