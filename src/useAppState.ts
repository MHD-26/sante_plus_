import { useState, useEffect } from "react";
import { Patient, Appointment, Medication, Invoice, Complaint, UserRole, SystemBackup, SyncAction, AuditLog } from "./types";
import { INITIAL_PATIENTS, INITIAL_APPOINTMENTS, INITIAL_INVENTORY, INITIAL_INVOICES, INITIAL_COMPLAINTS } from "./data";

export function useAppState() {
  // Current active user role
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.ADMIN);
  
  // Current active viewport
  const [currentView, setCurrentView] = useState<string>("accueil");
  
  // State data arrays
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [inventory, setInventory] = useState<Medication[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // Connection and synchronization states (Simulation of unstable connection)
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncQueue, setSyncQueue] = useState<SyncAction[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());

  // Listen to browser network changes to automatically keep the application synchronized
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Automatically run synchronization when back online
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    if (typeof navigator !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const storedPatients = localStorage.getItem("csp_patients");
      const storedAppointments = localStorage.getItem("csp_appointments");
      const storedInventory = localStorage.getItem("csp_inventory");
      const storedInvoices = localStorage.getItem("csp_invoices");
      const storedComplaints = localStorage.getItem("csp_complaints");
      const storedRole = localStorage.getItem("csp_role");
      const storedSyncQueue = localStorage.getItem("csp_sync_queue");
      const storedOnline = localStorage.getItem("csp_online");
      const storedAuditLogs = localStorage.getItem("csp_audit_logs");

      setPatients(storedPatients ? JSON.parse(storedPatients) : INITIAL_PATIENTS);
      setAppointments(storedAppointments ? JSON.parse(storedAppointments) : INITIAL_APPOINTMENTS);
      setInventory(storedInventory ? JSON.parse(storedInventory) : INITIAL_INVENTORY);
      setInvoices(storedInvoices ? JSON.parse(storedInvoices) : INITIAL_INVOICES);
      setComplaints(storedComplaints ? JSON.parse(storedComplaints) : INITIAL_COMPLAINTS);
      
      const defaultAuditLogs: AuditLog[] = [
        {
          id: "LOG-1",
          timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
          userEmail: "directeur@santeplus.ci",
          userName: "Directeur Général",
          userRole: "directeur",
          action: "Connexion",
          details: "Authentification de la direction générale sur le portail Appwrite",
          status: "Succès"
        },
        {
          id: "LOG-2",
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          userEmail: "admin@santeplus.ci",
          userName: "Directeur Administratif",
          userRole: "administrateur",
          action: "Création de compte",
          details: "Création du dossier patient et du compte de démo pour Dr. Koné Mamadou",
          status: "Succès"
        },
        {
          id: "LOG-3",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          userEmail: "medecin@santeplus.ci",
          userName: "Dr. Koné Mamadou",
          userRole: "medecin",
          action: "Modification importante",
          details: "Mise à jour des antécédents médicaux d'un patient",
          status: "Succès"
        }
      ];
      setAuditLogs(storedAuditLogs ? JSON.parse(storedAuditLogs) : defaultAuditLogs);
      
      if (storedRole) setCurrentUserRole(storedRole as UserRole);
      if (storedSyncQueue) setSyncQueue(JSON.parse(storedSyncQueue));
      if (storedOnline) setIsOnline(JSON.parse(storedOnline));
    } catch (e) {
      console.error("Failed to load state from localStorage:", e);
      // Fallback to initial seed data
      setPatients(INITIAL_PATIENTS);
      setAppointments(INITIAL_APPOINTMENTS);
      setInventory(INITIAL_INVENTORY);
      setInvoices(INITIAL_INVOICES);
      setComplaints(INITIAL_COMPLAINTS);
    }
  }, []);

  // Sync state changes to localStorage (allowing empty arrays to save correctly too)
  useEffect(() => {
    localStorage.setItem("csp_patients", JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem("csp_appointments", JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem("csp_inventory", JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem("csp_invoices", JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem("csp_complaints", JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem("csp_role", currentUserRole);
  }, [currentUserRole]);

  useEffect(() => {
    localStorage.setItem("csp_sync_queue", JSON.stringify(syncQueue));
  }, [syncQueue]);

  useEffect(() => {
    localStorage.setItem("csp_online", JSON.stringify(isOnline));
  }, [isOnline]);

  useEffect(() => {
    localStorage.setItem("csp_audit_logs", JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Log action inside system audit logs
  const addAuditLog = (log: Omit<AuditLog, "id" | "timestamp">) => {
    const newLog: AuditLog = {
      ...log,
      id: "LOG-" + Math.floor(1000 + Math.random() * 9000),
      timestamp: new Date().toISOString()
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Helper to log actions in offline queue if needed
  const handleOfflineAction = (type: SyncAction["type"], payload: any) => {
    if (!isOnline) {
      const newAction: SyncAction = {
        id: "SYNC-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        timestamp: new Date().toISOString(),
        type,
        payload
      };
      setSyncQueue((prev) => [...prev, newAction]);
    }
  };

  // Switch connection mode manually
  const toggleConnection = () => {
    setIsOnline((prev) => !prev);
  };

  // Perform a simulated sync
  const triggerSync = () => {
    if (syncQueue.length === 0) return;
    setIsSyncing(true);
    
    // Simulate short latency
    setTimeout(() => {
      setIsSyncing(false);
      setSyncQueue([]);
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 1500);
  };

  // Reset database to initial mock values
  const resetDatabase = () => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser la base de données locale avec les valeurs fictives par défaut ? Toutes les modifications récentes seront écrasées.")) {
      setPatients(INITIAL_PATIENTS);
      setAppointments(INITIAL_APPOINTMENTS);
      setInventory(INITIAL_INVENTORY);
      setInvoices(INITIAL_INVOICES);
      setComplaints(INITIAL_COMPLAINTS);
      setSyncQueue([]);
      
      localStorage.setItem("csp_patients", JSON.stringify(INITIAL_PATIENTS));
      localStorage.setItem("csp_appointments", JSON.stringify(INITIAL_APPOINTMENTS));
      localStorage.setItem("csp_inventory", JSON.stringify(INITIAL_INVENTORY));
      localStorage.setItem("csp_invoices", JSON.stringify(INITIAL_INVOICES));
      localStorage.setItem("csp_complaints", JSON.stringify(INITIAL_COMPLAINTS));
      localStorage.setItem("csp_sync_queue", JSON.stringify([]));
      
      alert("La base de données locale a été réinitialisée avec succès !");
    }
  };

  // 1. Patient functions
  const addPatient = (patient: Omit<Patient, "id" | "createdAt" | "medicalHistory">) => {
    const newPatient: Patient = {
      ...patient,
      id: "PAT-" + Math.floor(100 + Math.random() * 900),
      createdAt: new Date().toISOString(),
      medicalHistory: []
    };
    setPatients((prev) => [newPatient, ...prev]);
    handleOfflineAction("CREATE_PATIENT", newPatient);
    return newPatient;
  };

  const updatePatient = (updatedPatient: Patient) => {
    setPatients((prev) => prev.map((p) => p.id === updatedPatient.id ? updatedPatient : p));
  };

  const addMedicalHistoryEntry = (patientId: string, diagnosis: string, prescription: string, doctorName: string) => {
    const entry = {
      id: "MED-" + Math.floor(100 + Math.random() * 900),
      date: new Date().toISOString().split("T")[0],
      diagnosis,
      prescription,
      doctorName
    };
    
    setPatients((prev) => prev.map((p) => {
      if (p.id === patientId) {
        return {
          ...p,
          medicalHistory: [entry, ...p.medicalHistory]
        };
      }
      return p;
    }));
  };

  // 2. Appointment functions
  const addAppointment = (app: Omit<Appointment, "id">) => {
    const newApp: Appointment = {
      ...app,
      id: "RDV-" + Math.floor(100 + Math.random() * 900)
    };
    setAppointments((prev) => [newApp, ...prev]);
    handleOfflineAction("CREATE_APPOINTMENT", newApp);
    return newApp;
  };

  const updateAppointment = (updatedApp: Appointment) => {
    setAppointments((prev) => prev.map((a) => a.id === updatedApp.id ? updatedApp : a));
    handleOfflineAction("UPDATE_APPOINTMENT", updatedApp);
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    handleOfflineAction("DELETE_APPOINTMENT", { id });
  };

  // 3. Inventory Stock functions
  const updateStock = (medId: string, quantityChange: number) => {
    setInventory((prev) => prev.map((m) => {
      if (m.id === medId) {
        const newQty = Math.max(0, m.quantity + quantityChange);
        const updatedMed = { ...m, quantity: newQty };
        handleOfflineAction("UPDATE_STOCK", { id: medId, quantity: newQty });
        return updatedMed;
      }
      return m;
    }));
  };

  const addMedication = (med: Omit<Medication, "id">) => {
    const newMed: Medication = {
      ...med,
      id: "MEDIC-" + Math.floor(100 + Math.random() * 900)
    };
    setInventory((prev) => [...prev, newMed]);
    return newMed;
  };

  // 4. Billing functions
  const addInvoice = (inv: Omit<Invoice, "id" | "date">) => {
    const newInvoice: Invoice = {
      ...inv,
      id: "FAC-" + new Date().toISOString().slice(2, 10).replace(/-/g, "") + Math.floor(10 + Math.random() * 90),
      date: new Date().toISOString().split("T")[0]
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    handleOfflineAction("CREATE_INVOICE", newInvoice);
    return newInvoice;
  };

  const markInvoiceAsPaid = (id: string, paymentMethod: Invoice["paymentMethod"]) => {
    setInvoices((prev) => prev.map((inv) => {
      if (inv.id === id) {
        return { ...inv, status: "Payé" as const, paymentMethod };
      }
      return inv;
    }));
  };

  // 5. Complaint functions
  const addComplaint = (comp: Omit<Complaint, "id" | "date" | "status">) => {
    const newComplaint: Complaint = {
      ...comp,
      id: "PLT-" + Math.floor(100 + Math.random() * 900),
      date: new Date().toISOString().split("T")[0],
      status: "Reçu"
    };
    setComplaints((prev) => [newComplaint, ...prev]);
    handleOfflineAction("CREATE_COMPLAINT", newComplaint);
    return newComplaint;
  };

  const resolveComplaint = (id: string, resolutionNotes: string, satisfactionScore?: number) => {
    setComplaints((prev) => prev.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          status: "Résolu" as const,
          resolutionNotes,
          satisfactionScore
        };
      }
      return c;
    }));
  };

  const updateComplaintStatus = (id: string, status: Complaint["status"]) => {
    setComplaints((prev) => prev.map((c) => {
      if (c.id === id) {
        return { ...c, status };
      }
      return c;
    }));
  };

  // 6. Backup & Restore (JSON system)
  const exportBackup = () => {
    const backupData: SystemBackup = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      patients,
      appointments,
      inventory,
      invoices,
      complaints
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `clinique_sante_plus_backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importBackup = (jsonString: string) => {
    try {
      const backup: SystemBackup = JSON.parse(jsonString);
      if (!backup.patients || !backup.appointments || !backup.inventory) {
        throw new Error("Format de fichier invalide.");
      }
      
      setPatients(backup.patients);
      setAppointments(backup.appointments);
      setInventory(backup.inventory);
      if (backup.invoices) setInvoices(backup.invoices);
      if (backup.complaints) setComplaints(backup.complaints);
      
      localStorage.setItem("csp_patients", JSON.stringify(backup.patients));
      localStorage.setItem("csp_appointments", JSON.stringify(backup.appointments));
      localStorage.setItem("csp_inventory", JSON.stringify(backup.inventory));
      if (backup.invoices) localStorage.setItem("csp_invoices", JSON.stringify(backup.invoices));
      if (backup.complaints) localStorage.setItem("csp_complaints", JSON.stringify(backup.complaints));
      
      alert("Sauvegarde restaurée avec succès !");
      return true;
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'importation de la sauvegarde. Assurez-vous d'utiliser un fichier JSON de sauvegarde de la Clinique Santé Plus.");
      return false;
    }
  };

  return {
    // Session state
    currentUserRole,
    setCurrentUserRole,
    currentView,
    setCurrentView,
    
    // Core data lists
    patients,
    appointments,
    inventory,
    invoices,
    complaints,
    auditLogs,
    addAuditLog,
    
    // Unstable internet simulation
    isOnline,
    toggleConnection,
    syncQueue,
    isSyncing,
    triggerSync,
    lastSyncTime,
    
    // Database reset
    resetDatabase,
    
    // Actions
    addPatient,
    updatePatient,
    addMedicalHistoryEntry,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    updateStock,
    addMedication,
    addInvoice,
    markInvoiceAsPaid,
    addComplaint,
    resolveComplaint,
    updateComplaintStatus,
    
    // Import/Export backup
    exportBackup,
    importBackup
  };
}
