import React, { useState } from "react";
import {
  BookOpen,
  Calendar,
  ShieldCheck,
  Pill,
  CreditCard,
  Sparkles,
  AlertCircle,
  FileText,
  RefreshCw,
} from "lucide-react";

export default function ProceduresView() {
  const [activeTopic, setActiveTopic] = useState<string>("accueil");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
      {/* Sidebar Topics Nav (1 Col) */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4 lg:col-span-1">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-emerald-900 uppercase tracking-wider flex items-center space-x-1.5">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <span>Manuels d'Utilisation</span>
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">
            Guides opératoires et protocoles pour le personnel de la Clinique Santé Plus.
          </p>
        </div>

        <div className="space-y-1.5 text-xs font-semibold">
          <button
            onClick={() => setActiveTopic("accueil")}
            className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-center space-x-2 ${
              activeTopic === "accueil"
                ? "bg-emerald-600 text-white"
                : "hover:bg-slate-100 text-slate-700"
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Secrétariat & Accueil</span>
          </button>

          <button
            onClick={() => setActiveTopic("medecin")}
            className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-center space-x-2 ${
              activeTopic === "medecin"
                ? "bg-emerald-600 text-white"
                : "hover:bg-slate-100 text-slate-700"
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Médecins & Clinique</span>
          </button>

          <button
            onClick={() => setActiveTopic("pharmacie")}
            className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-center space-x-2 ${
              activeTopic === "pharmacie"
                ? "bg-emerald-600 text-white"
                : "hover:bg-slate-100 text-slate-700"
            }`}
          >
            <Pill className="w-4 h-4 shrink-0" />
            <span>Pharmacie & Stocks</span>
          </button>

          <button
            onClick={() => setActiveTopic("compta")}
            className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-center space-x-2 ${
              activeTopic === "compta"
                ? "bg-emerald-600 text-white"
                : "hover:bg-slate-100 text-slate-700"
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>Comptabilité & Encaissements</span>
          </button>
        </div>
      </div>

      {/* Main Content Area (3 Cols) */}
      <div className="lg:col-span-3 bg-white border border-slate-100 rounded-xl p-8 shadow-xs space-y-6 overflow-y-auto">
        {/* TOPIC 1: ACCUEIL */}
        {activeTopic === "accueil" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-display">
                Guide de l'Accueil et du Secrétariat
              </h2>
              <p className="text-xs text-slate-500">
                Gérer l'accueil des patients et assurer les rappels de confirmation.
              </p>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-600 font-sans">
              <div className="bg-emerald-50/40 p-4 border border-emerald-100 rounded-lg space-y-2">
                <h4 className="font-bold text-emerald-900 text-sm flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Procédure 1 : Enregistrement des Rendez-vous</span>
                </h4>
                <p>
                  Dès l'arrivée physique d'un patient ou lors d'un appel téléphonique, vérifiez si
                  la fiche du patient existe dans l'onglet <strong>Suivi Patients</strong>. Si ce
                  n'est pas le cas, enregistrez impérativement une fiche patient complète. Naviguez
                  ensuite vers l'onglet <strong>Rendez-vous</strong> et cliquez sur{" "}
                  <strong>Nouveau RDV</strong>.
                </p>
              </div>

              <div className="bg-emerald-50/40 p-4 border border-emerald-100 rounded-lg space-y-2">
                <h4 className="font-bold text-emerald-900 text-sm flex items-center space-x-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Procédure 2 : Relances & Rappels WhatsApp Gratuits</span>
                </h4>
                <p>
                  Pour éliminer le taux d'absentéisme des patients à coût nul, utilisez notre
                  générateur de messages :
                </p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>
                    Ouvrez l'onglet <strong>Rendez-vous</strong>.
                  </li>
                  <li>
                    Cliquez sur l'icône de message (bulle verte) d'un rendez-vous en attente pour le
                    charger dans le panneau latéral droit.
                  </li>
                  <li>
                    Sélectionnez un modèle de message (Rappel la veille, Confirmation ou Suivi).
                  </li>
                  <li>
                    Cliquez sur <strong>Envoyer par WhatsApp</strong> : cela ouvrira l'application
                    WhatsApp (Web ou Mobile) pré-remplie avec le message et le numéro du patient
                    sans surcoût.
                  </li>
                </ol>
              </div>

              <div className="bg-emerald-50/40 p-4 border border-emerald-100 rounded-lg space-y-2">
                <h4 className="font-bold text-emerald-900 text-sm flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>Procédure 3 : Gestion des Plaintes & Amélioration</span>
                </h4>
                <p>
                  Si un patient exprime une réclamation (temps d'attente, désagrément d'accueil) :
                  consignez fidèlement l'incident dans l'onglet <strong>Plaintes</strong>. La
                  Direction se chargera d'étudier l'incident, de contacter le patient et de résoudre
                  le dossier en saisissant la note de clôture et le score de satisfaction finale.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TOPIC 2: MEDECIN */}
        {activeTopic === "medecin" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-display">
                Guide d'Utilisation Clinique (Médecins)
              </h2>
              <p className="text-xs text-slate-500">
                Consulter et mettre à jour les dossiers médicaux confidentiels.
              </p>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-600 font-sans">
              <div className="bg-emerald-50/40 p-4 border border-emerald-100 rounded-lg space-y-2">
                <h4 className="font-bold text-emerald-900 text-sm flex items-center space-x-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    Procédure 1 : Confidentialité et Consentement (Sécurisation des Données)
                  </span>
                </h4>
                <p>
                  Pour des raisons légales de confidentialité, les dossiers cliniques de chaque
                  patient sont chiffrés et invisibles par défaut. Avant de procéder à l'examen
                  clinique, assurez-vous que le patient a bien signé la charte de protection des
                  données sensibles. Si le panneau de verrouillage s'affiche, cliquez sur{" "}
                  <strong>Faire signer le consentement</strong> après avoir expliqué au patient la
                  charte de confidentialité.
                </p>
              </div>

              <div className="bg-emerald-50/40 p-4 border border-emerald-100 rounded-lg space-y-2">
                <h4 className="font-bold text-emerald-900 text-sm flex items-center space-x-1">
                  <FileText className="w-4 h-4" />
                  <span>Procédure 2 : Rédaction d'une Fiche de Consultation</span>
                </h4>
                <p>
                  Une fois le dossier déverrouillé, cliquez sur <strong>Nouvelle Visite</strong>.
                  Renseignez soigneusement le diagnostic clinique retenu, ainsi que la prescription
                  d'ordonnance complète (médicaments, posologie et durée du traitement).
                </p>
              </div>

              <div className="bg-emerald-50/40 p-4 border border-emerald-100 rounded-lg space-y-2">
                <h4 className="font-bold text-emerald-900 text-sm flex items-center space-x-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Procédure 3 : Assistance IA Clinique</span>
                </h4>
                <p>
                  L'<strong>Assistant IA Clinique</strong> est accessible à tout moment dans la
                  barre de navigation. Il est spécialement paramétré pour vous aider à :
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Formuler des hypothèses de diagnostics différentiels basées sur des symptômes
                    complexes.
                  </li>
                  <li>
                    Rédiger des fiches d'explications diététiques claires (régimes sans sel,
                    conseils diabète).
                  </li>
                  <li>Générer des structures d'ordonnances types.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TOPIC 3: PHARMACIE */}
        {activeTopic === "pharmacie" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-display">
                Guide de Gestion de la Pharmacie
              </h2>
              <p className="text-xs text-slate-500">
                Mouvements de stocks, inventaire et alertes de péremption.
              </p>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-600 font-sans">
              <div className="bg-emerald-50/40 p-4 border border-emerald-100 rounded-lg space-y-2">
                <h4 className="font-bold text-emerald-900 text-sm flex items-center space-x-1">
                  <Pill className="w-4 h-4" />
                  <span>Procédure 1 : Contrôle du Stock Critique</span>
                </h4>
                <p>
                  L'onglet <strong>Stocks & Factures</strong> (rubrique pharmacie) affiche la liste
                  complète des médicaments enregistrés en pharmacie. Un voyant rouge/orange et une
                  mention <strong>Seuil Alerte !</strong> s'activent automatiquement dès que la
                  quantité d'un produit descend sous son seuil de sécurité minimum. Passez commande
                  auprès de la centrale d'achats dès que ce signal retentit.
                </p>
              </div>

              <div className="bg-emerald-50/40 p-4 border border-emerald-100 rounded-lg space-y-2">
                <h4 className="font-bold text-emerald-900 text-sm flex items-center space-x-1">
                  <RefreshCw className="w-4 h-4 text-emerald-600" />
                  <span>Procédure 2 : Entrée et Sortie de Médicaments</span>
                </h4>
                <p>Utilisez les boutons d'ajustement rapide :</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>+10</strong> : Enregistre l'arrivée d'une livraison de 10 boîtes/flacons
                    en stock.
                  </li>
                  <li>
                    <strong>-1</strong> : Enregistre la dispensation d'une boîte de médicament
                    prescrits à un patient.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TOPIC 4: COMPTABILITE */}
        {activeTopic === "compta" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-display">
                Guide Comptabilité et Facturation
              </h2>
              <p className="text-xs text-slate-500">
                Émission de reçus officiels, mobiles et prises en charge d'assurance.
              </p>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-600 font-sans">
              <div className="bg-emerald-50/40 p-4 border border-emerald-100 rounded-lg space-y-2">
                <h4 className="font-bold text-emerald-900 text-sm flex items-center space-x-1">
                  <CreditCard className="w-4 h-4" />
                  <span>Procédure 1 : Enregistrement d'un Encaissement</span>
                </h4>
                <p>
                  Dans l'onglet <strong>Stocks & Factures</strong> (rubrique Facturation), cliquez
                  sur le bouton <strong>+ (Ajouter une facture)</strong>. Sélectionnez le patient
                  concerné, le mode de règlement (Espèces, Wave / Mobile Money, Assurance), puis
                  ajoutez les lignes d'actes ou articles fournis. Cliquez sur{" "}
                  <strong>Valider</strong> pour archiver la facture dans le registre.
                </p>
              </div>

              <div className="bg-emerald-50/40 p-4 border border-emerald-100 rounded-lg space-y-2">
                <h4 className="font-bold text-emerald-900 text-sm flex items-center space-x-1">
                  <FileText className="w-4 h-4" />
                  <span>Procédure 2 : Impression des Reçus de Soins</span>
                </h4>
                <p>
                  Sélectionnez une facture dans le registre pour afficher son reçu officiel
                  imprimable avec tampon de validation et code-barres. Vous pouvez cliquer sur le
                  bouton <strong>Imprimer le reçu</strong> pour l'exporter en PDF ou l'imprimer
                  directement via l'imprimante thermique de la caisse.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
