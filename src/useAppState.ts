import { useState, useEffect } from "react";
import {
  Patient,
  Appointment,
  Medication,
  Invoice,
  Complaint,
  UserRole,
  SystemBackup,
  SyncAction,
  AuditLog,
  Consultation,
  Prescription,
  LabRequest,
} from "./types";
import {
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_INVENTORY,
  INITIAL_INVOICES,
  INITIAL_COMPLAINTS,
  INITIAL_CONSULTATIONS,
  INITIAL_PRESCRIPTIONS,
  INITIAL_LAB_REQUESTS,
} from "./data";

export function useAppState(authenticatedUser?: any) {
  // Current active user role
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.ADMIN);

  // Helper for generating secure role-based headers
  const getHeaders = (method = "GET") => {
    const headers: Record<string, string> = {
      "x-user-role": currentUserRole || "administrateur",
    };
    if (authenticatedUser) {
      headers["x-user-email"] = authenticatedUser.email || "";
      headers["x-user-name"] = authenticatedUser.fullName || "";
    } else {
      // Fallback for demo mode
      headers["x-user-email"] = "directeur@santeplus.ci";
      headers["x-user-name"] = "Directeur Général";
    }
    if (method !== "GET" && method !== "DELETE") {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  };

  // Current active viewport
  const [currentView, setCurrentView] = useState<string>("accueil");

  // State data arrays
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [inventory, setInventory] = useState<Medication[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labRequests, setLabRequests] = useState<LabRequest[]>([]);
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
      const storedConsultations = localStorage.getItem("csp_consultations");
      const storedPrescriptions = localStorage.getItem("csp_prescriptions");
      const storedLabRequests = localStorage.getItem("csp_lab_requests");
      const storedRole = localStorage.getItem("csp_role");
      const storedSyncQueue = localStorage.getItem("csp_sync_queue");
      const storedOnline = localStorage.getItem("csp_online");
      const storedAuditLogs = localStorage.getItem("csp_audit_logs");

      setPatients(storedPatients ? JSON.parse(storedPatients) : INITIAL_PATIENTS);
      setAppointments(storedAppointments ? JSON.parse(storedAppointments) : INITIAL_APPOINTMENTS);
      setInventory(storedInventory ? JSON.parse(storedInventory) : INITIAL_INVENTORY);
      setInvoices(storedInvoices ? JSON.parse(storedInvoices) : INITIAL_INVOICES);
      setComplaints(storedComplaints ? JSON.parse(storedComplaints) : INITIAL_COMPLAINTS);
      setConsultations(
        storedConsultations ? JSON.parse(storedConsultations) : INITIAL_CONSULTATIONS
      );
      setPrescriptions(
        storedPrescriptions ? JSON.parse(storedPrescriptions) : INITIAL_PRESCRIPTIONS
      );
      setLabRequests(storedLabRequests ? JSON.parse(storedLabRequests) : INITIAL_LAB_REQUESTS);

      const defaultAuditLogs: AuditLog[] = [
        {
          id: "LOG-1",
          timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
          userEmail: "directeur@santeplus.ci",
          userName: "Directeur Général",
          userRole: "directeur",
          action: "Connexion",
          details: "Authentification de la direction générale sur le portail Appwrite",
          status: "Succès",
        },
        {
          id: "LOG-2",
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          userEmail: "admin@santeplus.ci",
          userName: "Directeur Administratif",
          userRole: "administrateur",
          action: "Création de compte",
          details: "Création du dossier patient et du compte de démo pour Dr. Koné Mamadou",
          status: "Succès",
        },
        {
          id: "LOG-3",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          userEmail: "medecin@santeplus.ci",
          userName: "Dr. Koné Mamadou",
          userRole: "medecin",
          action: "Modification importante",
          details: "Mise à jour des antécédents médicaux d'un patient",
          status: "Succès",
        },
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
      setConsultations(INITIAL_CONSULTATIONS);
      setPrescriptions(INITIAL_PRESCRIPTIONS);
      setLabRequests(INITIAL_LAB_REQUESTS);
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
    localStorage.setItem("csp_consultations", JSON.stringify(consultations));
  }, [consultations]);

  useEffect(() => {
    localStorage.setItem("csp_prescriptions", JSON.stringify(prescriptions));
  }, [prescriptions]);

  useEffect(() => {
    localStorage.setItem("csp_lab_requests", JSON.stringify(labRequests));
  }, [labRequests]);

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

  // Synchroniser les données cliniques (patients, rendez-vous, logs) depuis Appwrite si connecté
  useEffect(() => {
    if (isOnline) {
      async function fetchFreshData() {
        try {
          // 1. Fetch Audit Logs
          fetch("/api/audit/logs", { headers: getHeaders("GET") })
            .then((res) => res.json())
            .then((data) => {
              if (data && data.success && data.documents) {
                setAuditLogs(data.documents);
              }
            })
            .catch((e) => console.warn("Impossible de charger les logs d'audit depuis Appwrite:", e));

          // 2. Fetch Patients
          fetch("/api/patients", { headers: getHeaders("GET") })
            .then((res) => res.json())
            .then((data) => {
              if (data && data.success && data.documents) {
                setPatients(data.documents);
              }
            })
            .catch((e) => console.warn("Impossible de charger les patients depuis Appwrite:", e));

          // 3. Fetch Appointments (Rendez-vous)
          fetch("/api/appointments", { headers: getHeaders("GET") })
            .then((res) => res.json())
            .then((data) => {
              if (data && data.success && data.documents) {
                setAppointments(data.documents);
              }
            })
            .catch((e) => console.warn("Impossible de charger les rendez-vous depuis Appwrite:", e));
        } catch (e) {
          console.warn("Erreur générale de synchronisation Appwrite :", e);
        }
      }
      fetchFreshData();
    }
  }, [isOnline, currentUserRole]);

  // Log action inside system audit logs (sauvegarde asynchrone côté serveur + locale)
  const addAuditLog = async (log: Omit<AuditLog, "id" | "timestamp">) => {
    const timestamp = new Date().toISOString();
    const tempId = "LOG-" + Math.floor(1000 + Math.random() * 9000);

    // Ajout local immédiat pour garantir une interface ultra réactive
    const localLog: AuditLog = {
      ...log,
      id: tempId,
      timestamp,
    };
    setAuditLogs((prev) => [localLog, ...prev]);

    // Envoi en arrière-plan vers Appwrite si en ligne
    if (isOnline) {
      try {
        const response = await fetch("/api/audit/log", {
          method: "POST",
          headers: getHeaders("POST"),
          body: JSON.stringify({
            ...log,
            timestamp,
          }),
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData && resData.success && resData.log) {
            // Remplacer le log temporaire par le vrai log stocké (avec IP et ID d'Appwrite)
            const savedLog: AuditLog = {
              id: resData.log.id || resData.log.$id || tempId,
              timestamp: resData.log.timestamp || timestamp,
              userEmail: resData.log.userEmail || log.userEmail,
              userName: resData.log.userName || log.userName,
              userRole: resData.log.userRole || log.userRole,
              action: resData.log.action || log.action,
              details: resData.log.details || log.details,
              ipAddress: resData.log.ipAddress,
              status: resData.log.status || log.status,
            };

            setAuditLogs((prev) => prev.map((l) => (l.id === tempId ? savedLog : l)));
          }
        }
      } catch (err) {
        console.warn(
          "Échec de l'envoi du log d'audit au serveur (sauvegarde locale uniquement) :",
          err
        );
      }
    }
  };

  // Helper to log actions in offline queue if needed
  const handleOfflineAction = (type: SyncAction["type"], payload: any) => {
    if (!isOnline) {
      const newAction: SyncAction = {
        id: "SYNC-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        timestamp: new Date().toISOString(),
        type,
        payload,
      };
      setSyncQueue((prev) => [...prev, newAction]);
    }
  };

  // Switch connection mode manually
  const toggleConnection = () => {
    setIsOnline((prev) => !prev);
  };

  // Perform a real and robust background synchronization with Appwrite
  const triggerSync = async () => {
    if (syncQueue.length === 0) return;
    setIsSyncing(true);

    try {
      for (const action of syncQueue) {
        try {
          if (action.type === "CREATE_PATIENT") {
            await fetch("/api/patients", {
              method: "POST",
              headers: getHeaders("POST"),
              body: JSON.stringify(action.payload),
            });
          } else if (action.type === "UPDATE_PATIENT") {
            await fetch(`/api/patients/${action.payload.id}`, {
              method: "PUT",
              headers: getHeaders("PUT"),
              body: JSON.stringify(action.payload),
            });
          } else if (action.type === "CREATE_APPOINTMENT") {
            await fetch("/api/appointments", {
              method: "POST",
              headers: getHeaders("POST"),
              body: JSON.stringify(action.payload),
            });
          } else if (action.type === "UPDATE_APPOINTMENT") {
            await fetch(`/api/appointments/${action.payload.id}`, {
              method: "PUT",
              headers: getHeaders("PUT"),
              body: JSON.stringify(action.payload),
            });
          } else if (action.type === "DELETE_APPOINTMENT") {
            await fetch(`/api/appointments/${action.payload.id}`, {
              method: "DELETE",
              headers: getHeaders("DELETE"),
            });
          }
        } catch (actionErr) {
          console.warn("Échec d'un élément de la file d'attente de synchronisation:", actionErr);
        }
      }

      // Re-fetch fresh data from Appwrite to align everything perfectly
      const [patientsRes, appointmentsRes] = await Promise.all([
        fetch("/api/patients", { headers: getHeaders("GET") }),
        fetch("/api/appointments", { headers: getHeaders("GET") })
      ]);

      if (patientsRes.ok) {
        const data = await patientsRes.json();
        if (data && data.success && data.documents && data.documents.length > 0) {
          setPatients(data.documents);
        }
      }

      if (appointmentsRes.ok) {
        const data = await appointmentsRes.json();
        if (data && data.success && data.documents && data.documents.length > 0) {
          setAppointments(data.documents);
        }
      }
    } catch (syncErr) {
      console.warn("Erreur générale lors de la synchronisation de la file :", syncErr);
    } finally {
      setIsSyncing(false);
      setSyncQueue([]);
      setLastSyncTime(new Date().toLocaleTimeString());
    }
  };

  // Reset database to initial mock values
  const resetDatabase = () => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir réinitialiser la base de données locale avec les valeurs fictives par défaut ? Toutes les modifications récentes seront écrasées."
      )
    ) {
      setPatients(INITIAL_PATIENTS);
      setAppointments(INITIAL_APPOINTMENTS);
      setInventory(INITIAL_INVENTORY);
      setInvoices(INITIAL_INVOICES);
      setComplaints(INITIAL_COMPLAINTS);
      setConsultations(INITIAL_CONSULTATIONS);
      setPrescriptions(INITIAL_PRESCRIPTIONS);
      setLabRequests(INITIAL_LAB_REQUESTS);
      setSyncQueue([]);

      localStorage.setItem("csp_patients", JSON.stringify(INITIAL_PATIENTS));
      localStorage.setItem("csp_appointments", JSON.stringify(INITIAL_APPOINTMENTS));
      localStorage.setItem("csp_inventory", JSON.stringify(INITIAL_INVENTORY));
      localStorage.setItem("csp_invoices", JSON.stringify(INITIAL_INVOICES));
      localStorage.setItem("csp_complaints", JSON.stringify(INITIAL_COMPLAINTS));
      localStorage.setItem("csp_consultations", JSON.stringify(INITIAL_CONSULTATIONS));
      localStorage.setItem("csp_prescriptions", JSON.stringify(INITIAL_PRESCRIPTIONS));
      localStorage.setItem("csp_lab_requests", JSON.stringify(INITIAL_LAB_REQUESTS));
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
      medicalHistory: [],
    };
    setPatients((prev) => [newPatient, ...prev]);
    handleOfflineAction("CREATE_PATIENT", newPatient);

    if (isOnline) {
      fetch("/api/patients", {
        method: "POST",
        headers: getHeaders("POST"),
        body: JSON.stringify(newPatient),
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (data && data.success && data.patient) {
              setPatients((prev) =>
                prev.map((p) => (p.id === newPatient.id ? data.patient : p))
              );
            }
          }
        })
        .catch((err) => console.error("Erreur d'enregistrement asynchrone du patient:", err));
    }
    return newPatient;
  };

  const updatePatient = (updatedPatient: Patient) => {
    setPatients((prev) => prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p)));
    handleOfflineAction("UPDATE_PATIENT", updatedPatient);

    if (isOnline) {
      fetch(`/api/patients/${updatedPatient.id}`, {
        method: "PUT",
        headers: getHeaders("PUT"),
        body: JSON.stringify(updatedPatient),
      }).catch((err) => console.error("Erreur de mise à jour asynchrone du patient:", err));
    }
  };

  const addMedicalHistoryEntry = (
    patientId: string,
    diagnosis: string,
    prescription: string,
    doctorName: string
  ) => {
    const entry = {
      id: "MED-" + Math.floor(100 + Math.random() * 900),
      date: new Date().toISOString().split("T")[0],
      diagnosis,
      prescription,
      doctorName,
    };

    setPatients((prev) => {
      const updatedPatients = prev.map((p) => {
        if (p.id === patientId) {
          const newHistory = [entry, ...p.medicalHistory];
          const updatedP = {
            ...p,
            medicalHistory: newHistory,
          };

          // Sauvegarde asynchrone côté Appwrite
          if (isOnline) {
            fetch(`/api/patients/${p.id}`, {
              method: "PUT",
              headers: getHeaders("PUT"),
              body: JSON.stringify({ medicalHistory: newHistory }),
            }).catch((err) => console.error("Erreur d'ajout d'historique médical dans Appwrite:", err));
          }

          return updatedP;
        }
        return p;
      });
      return updatedPatients;
    });
  };

  // 2. Appointment functions
  const addAppointment = (app: Omit<Appointment, "id">) => {
    const newApp: Appointment = {
      ...app,
      id: "RDV-" + Math.floor(100 + Math.random() * 900),
    };
    setAppointments((prev) => [newApp, ...prev]);
    handleOfflineAction("CREATE_APPOINTMENT", newApp);

    if (isOnline) {
      fetch("/api/appointments", {
        method: "POST",
        headers: getHeaders("POST"),
        body: JSON.stringify(newApp),
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (data && data.success && data.appointment) {
              setAppointments((prev) =>
                prev.map((a) => (a.id === newApp.id ? data.appointment : a))
              );
            }
          }
        })
        .catch((err) => console.error("Erreur d'enregistrement asynchrone du rdv dans Appwrite:", err));
    }
    return newApp;
  };

  const updateAppointment = (updatedApp: Appointment) => {
    setAppointments((prev) => prev.map((a) => (a.id === updatedApp.id ? updatedApp : a)));
    handleOfflineAction("UPDATE_APPOINTMENT", updatedApp);

    if (isOnline) {
      fetch(`/api/appointments/${updatedApp.id}`, {
        method: "PUT",
        headers: getHeaders("PUT"),
        body: JSON.stringify(updatedApp),
      }).catch((err) => console.error("Erreur de modification asynchrone du rdv dans Appwrite:", err));
    }
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    handleOfflineAction("DELETE_APPOINTMENT", { id });

    if (isOnline) {
      fetch(`/api/appointments/${id}`, {
        method: "DELETE",
        headers: getHeaders("DELETE"),
      }).catch((err) => console.error("Erreur de suppression asynchrone du rdv dans Appwrite:", err));
    }
  };

  // 3. Inventory Stock functions
  const updateStock = (medId: string, quantityChange: number) => {
    setInventory((prev) =>
      prev.map((m) => {
        if (m.id === medId) {
          const newQty = Math.max(0, m.quantity + quantityChange);
          const updatedMed = { ...m, quantity: newQty };
          handleOfflineAction("UPDATE_STOCK", { id: medId, quantity: newQty });
          return updatedMed;
        }
        return m;
      })
    );
  };

  const addMedication = (med: Omit<Medication, "id">) => {
    const newMed: Medication = {
      ...med,
      id: "MEDIC-" + Math.floor(100 + Math.random() * 900),
    };
    setInventory((prev) => [...prev, newMed]);
    return newMed;
  };

  // 4. Billing functions
  const addInvoice = (inv: Omit<Invoice, "id" | "date">) => {
    const newInvoice: Invoice = {
      ...inv,
      id:
        "FAC-" +
        new Date().toISOString().slice(2, 10).replace(/-/g, "") +
        Math.floor(10 + Math.random() * 90),
      date: new Date().toISOString().split("T")[0],
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    handleOfflineAction("CREATE_INVOICE", newInvoice);
    return newInvoice;
  };

  const markInvoiceAsPaid = (id: string, paymentMethod: Invoice["paymentMethod"]) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === id) {
          return { ...inv, status: "Payé" as const, paymentMethod };
        }
        return inv;
      })
    );
  };

  // 5. Complaint functions
  const addComplaint = (comp: Omit<Complaint, "id" | "date" | "status">) => {
    const newComplaint: Complaint = {
      ...comp,
      id: "PLT-" + Math.floor(100 + Math.random() * 900),
      date: new Date().toISOString().split("T")[0],
      status: "Reçu",
    };
    setComplaints((prev) => [newComplaint, ...prev]);
    handleOfflineAction("CREATE_COMPLAINT", newComplaint);
    return newComplaint;
  };

  const resolveComplaint = (id: string, resolutionNotes: string, satisfactionScore?: number) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            status: "Résolu" as const,
            resolutionNotes,
            satisfactionScore,
          };
        }
        return c;
      })
    );
  };

  const updateComplaintStatus = (id: string, status: Complaint["status"]) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return { ...c, status };
        }
        return c;
      })
    );
  };

  // --- Clinical Actions (Consultations, Prescriptions, Lab Requests) ---

  const addConsultation = (cons: Omit<Consultation, "id">) => {
    const newCons: Consultation = {
      ...cons,
      id: "CSL-" + Math.floor(100 + Math.random() * 900),
    };
    setConsultations((prev) => [newCons, ...prev]);
    return newCons;
  };

  const addPrescription = (pres: Omit<Prescription, "id">) => {
    const newPres: Prescription = {
      ...pres,
      id: "ORD-" + Math.floor(100 + Math.random() * 900),
    };
    setPrescriptions((prev) => [newPres, ...prev]);
    return newPres;
  };

  const updatePrescriptionStatus = (id: string, status: Prescription["status"], notes?: string) => {
    setPrescriptions((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            status,
            dispensedDate:
              status === "Délivrée" ? new Date().toISOString().split("T")[0] : undefined,
            notes: notes !== undefined ? notes : p.notes,
          };
        }
        return p;
      })
    );
  };

  const addLabRequest = (lab: Omit<LabRequest, "id">) => {
    const newLab: LabRequest = {
      ...lab,
      id: "LAB-" + Math.floor(100 + Math.random() * 900),
    };
    setLabRequests((prev) => [newLab, ...prev]);
    return newLab;
  };

  const updateLabRequest = (updatedLab: LabRequest) => {
    setLabRequests((prev) => prev.map((l) => (l.id === updatedLab.id ? updatedLab : l)));
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
      complaints,
      consultations,
      prescriptions,
      labRequests,
    };

    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `clinique_sante_plus_backup_${new Date().toISOString().split("T")[0]}.json`
    );
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
      if (backup.consultations) setConsultations(backup.consultations);
      if (backup.prescriptions) setPrescriptions(backup.prescriptions);
      if (backup.labRequests) setLabRequests(backup.labRequests);

      localStorage.setItem("csp_patients", JSON.stringify(backup.patients));
      localStorage.setItem("csp_appointments", JSON.stringify(backup.appointments));
      localStorage.setItem("csp_inventory", JSON.stringify(backup.inventory));
      if (backup.invoices) localStorage.setItem("csp_invoices", JSON.stringify(backup.invoices));
      if (backup.complaints)
        localStorage.setItem("csp_complaints", JSON.stringify(backup.complaints));
      if (backup.consultations)
        localStorage.setItem("csp_consultations", JSON.stringify(backup.consultations));
      if (backup.prescriptions)
        localStorage.setItem("csp_prescriptions", JSON.stringify(backup.prescriptions));
      if (backup.labRequests)
        localStorage.setItem("csp_lab_requests", JSON.stringify(backup.labRequests));

      alert("Sauvegarde restaurée avec succès !");
      return true;
    } catch (e) {
      console.error(e);
      alert(
        "Erreur lors de l'importation de la sauvegarde. Assurez-vous d'utiliser un fichier JSON de sauvegarde de la Clinique Santé Plus."
      );
      return false;
    }
  };

  return {
    // Session state
    currentUserRole,
    setCurrentUserRole,
    currentView,
    setCurrentView,
    getHeaders,

    // Core data lists
    patients,
    appointments,
    inventory,
    invoices,
    complaints,
    consultations,
    prescriptions,
    labRequests,
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
    addConsultation,
    addPrescription,
    updatePrescriptionStatus,
    addLabRequest,
    updateLabRequest,

    // Import/Export backup
    exportBackup,
    importBackup,
  };
}
