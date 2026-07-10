import React, { useState, useRef, useEffect } from "react";
import { UserRole } from "../types";
import { Sparkles, Send, Brain, Bot, HelpCircle, Activity, HeartPulse, RefreshCw } from "lucide-react";

interface AssistantIAViewProps {
  currentUserRole: UserRole;
}

interface ChatMessage {
  sender: "user" | "ia";
  text: string;
  timestamp: string;
  isSimulated?: boolean;
}

export default function AssistantIAView({ currentUserRole }: AssistantIAViewProps) {
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "ia",
      text: `Bonjour ! Je suis votre Assistant IA clinique interne. Mon rôle est de vous accompagner dans vos tâches quotidiennes à la Clinique Santé Plus. 

Je me suis automatiquement adapté à votre rôle d'activité en tant que **${currentUserRole}** ! Saisissez votre question ou utilisez l'un des modèles de tâches cliniques ci-dessous pour démarrer.`,
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Personalized clinical prompt helpers based on user role
  const getPromptHelpers = (role: UserRole) => {
    switch (role) {
      case UserRole.MEDECIN:
        return [
          { label: "Orienter un diagnostic", prompt: "Donner des orientations diagnostiques et une liste de diagnostics différentiels préliminaires pour un patient d'Abidjan souffrant de fièvre aiguë, céphalées intenses et frissons depuis 3 jours." },
          { label: "Canevas Compte-Rendu", prompt: "Rédiger un modèle vide et propre de compte-rendu d'examen clinique général pour un dossier médical." },
          { label: "Conseils Hypertension", prompt: "Rédiger une fiche de conseils d'hygiène de vie et d'alimentation (régime hyposodé) claire pour un patient ivoirien nouvellement hypertendu." }
        ];
      case UserRole.ACCUEIL:
        return [
          { label: "SMS excuses retard", prompt: "Rédiger un SMS poli et rassurant pour informer les patients d'un retard de 30 minutes de leur médecin consultant." },
          { label: "Réponse plainte d'attente", prompt: "Rédiger une lettre d'excuses officielle chaleureuse en réponse à un patient mécontent du temps d'attente à l'accueil." },
          { label: "Script rappel WhatsApp", prompt: "Rédiger un script de conversation téléphonique d'accueil chaleureux pour confirmer les rendez-vous du lendemain." }
        ];
      case UserRole.COMPTABLE:
        return [
          { label: "Relance facture en attente", prompt: "Rédiger un courriel de relance courtois mais ferme pour un dossier d'assurance santé tiers-payant en retard de paiement." },
          { label: "Explication Tiers-Payant", prompt: "Expliquer de façon simple au personnel d'accueil le mécanisme de fonctionnement et d'encaissement d'une facture sous le régime du Tiers-Payant d'assurance." }
        ];
      case UserRole.PHARMACIE:
        return [
          { label: "Fiche conseils Coartem", prompt: "Rédiger une notice explicative simplifiée et bienveillante pour expliquer la prise du traitement antipaludéen Coartem (Artéméther/Luméfantrine) à un patient âgé." },
          { label: "Conseils conservation sirops", prompt: "Rédiger une liste de conseils pratiques à placarder à la pharmacie concernant les règles de conservation des antibiotiques pédiatriques reconstitués." }
        ];
      default:
        return [
          { label: "Conseils de santé publique", prompt: "Rédiger un court dépliant de sensibilisation sur la prévention du paludisme et de la dengue en saison des pluies en Côte d'Ivoire." },
          { label: "Formuler un e-mail", prompt: "Rédiger un e-mail professionnel interne pour inviter tout le personnel de la clinique à la réunion de transformation numérique." }
        ];
    }
  };

  const prompts = getPromptHelpers(currentUserRole);

  // Get Custom instructions for Gemini based on role
  const getSystemInstruction = (role: UserRole) => {
    const base = "Vous êtes l'assistant IA de la Clinique Santé Plus en Côte d'Ivoire. Soyez rigoureux, poli, écrivez dans un français soigné et compréhensible pour des non-techniques. Adoptez un ton professionnel et clinique.";
    
    switch (role) {
      case UserRole.MEDECIN:
        return `${base} Vous vous adressez à un médecin. Fournissez des explications scientifiquement fondées, des orientations cliniques claires, structurez des ordonnances et aidez à la rédaction de synthèses médicales. Mentionnez des rappels de sécurité (contre-indications).`;
      case UserRole.ACCUEIL:
        return `${base} Vous vous adressez au secrétariat / accueil de la clinique. Aidez à formuler des correspondances, à apaiser les tensions, à rédiger des rappels d'examens ou de rendez-vous cordiaux et rassurants.`;
      case UserRole.COMPTABLE:
        return `${base} Vous vous adressez à la comptabilité de la clinique. Soyez synthétique, rigoureux sur les termes financiers et financiers médicaux (mutuelles, tiers-payant, remboursements).`;
      case UserRole.PHARMACIE:
        return `${base} Vous vous adressez au pharmacien de garde. Aidez à rédiger des fiches d'explications de prise de médicaments simplifiées, à détailler des posologies usuelles ou à formuler des avertissements de sécurité importants.`;
      default:
        return base;
    }
  };

  // Submit Message handler
  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMsg: ChatMessage = {
      sender: "user",
      text: messageText,
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: messageText,
          systemInstruction: getSystemInstruction(currentUserRole)
        })
      });

      if (!response.ok) {
        throw new Error("HTTP-Error " + response.status);
      }

      const data = await response.json();
      
      const iaMsg: ChatMessage = {
        sender: "ia",
        text: data.text,
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        isSimulated: data.isSimulated
      };

      setMessages((prev) => [...prev, iaMsg]);
    } catch (err: any) {
      console.error("AI Error:", err);
      
      // Fallback UI display in case of complete endpoint error
      const errorMsg: ChatMessage = {
        sender: "ia",
        text: "Une erreur de communication est survenue avec l'assistant clinique. Si vous êtes hors-ligne ou si le serveur n'est pas encore démarré, assurez-vous d'utiliser le mode connecté. Voici un conseil simulé par défaut : Reposez-vous bien, restez hydraté et consultez les dossiers patients !",
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        isSimulated: true
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in max-w-7xl mx-auto h-[calc(100vh-200px)] min-h-[500px]">
      
      {/* Left panel prompt library (1 Col) */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4 lg:col-span-1 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-emerald-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Brain className="w-5 h-5 text-emerald-600" />
              <span>Tâches Intelligentes</span>
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">Modèles de prompts cliniques pré-paramétrés pour votre rôle de <strong>{currentUserRole}</strong>.</p>
          </div>

          <div className="space-y-2.5">
            {prompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputMessage(p.prompt);
                  handleSendMessage(p.prompt);
                }}
                className="w-full text-left p-3 bg-emerald-50/40 hover:bg-emerald-50 border border-emerald-100/50 hover:border-emerald-200 rounded-lg text-xs font-semibold text-emerald-900 transition-all flex items-start space-x-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-[10px] text-slate-500 leading-relaxed space-y-2 mt-4">
          <div className="font-bold text-slate-700 flex items-center space-x-1">
            <Bot className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sécurité & IA éthique</span>
          </div>
          <p>
            Toutes les réponses de l'IA sont fournies à titre indicatif d'aide à la décision. L'avis final de santé d'un praticien agréé de la clinique reste requis.
          </p>
        </div>
      </div>

      {/* Main Chat Area (3 Cols) */}
      <div className="lg:col-span-3 bg-white border border-slate-100 rounded-xl shadow-xs flex flex-col justify-between overflow-hidden">
        
        {/* Chat topbar status */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="relative">
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">IA Interne Santé Plus</h3>
              <p className="text-[10px] text-emerald-700 font-medium">Spécialiste de Soutien Clinique Adapté • {currentUserRole}</p>
            </div>
          </div>
          
          <button
            onClick={() => {
              setMessages([
                {
                  sender: "ia",
                  text: `Session réinitialisée. Bonjour ! Je suis votre Assistant IA clinique interne adapté à votre rôle d'activité en tant que **${currentUserRole}**. Posez-moi une question ci-dessous.`,
                  timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                }
              ]);
            }}
            className="text-[10px] text-slate-500 hover:text-emerald-700 font-bold flex items-center space-x-1 hover:underline"
            title="Effacer l'historique"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Effacer la conversation</span>
          </button>
        </div>

        {/* Chat message listing list */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[420px]">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                msg.sender === "user" 
                  ? "bg-slate-200 text-slate-700" 
                  : "bg-emerald-600 text-white"
              }`}>
                {msg.sender === "user" ? "Moi" : "IA"}
              </div>

              {/* Message text card */}
              <div className={`space-y-1 max-w-[80%] ${msg.sender === "user" ? "text-right" : ""}`}>
                <div className={`text-xs p-3 rounded-xl inline-block leading-relaxed font-sans text-left shadow-xs ${
                  msg.sender === "user"
                    ? "bg-emerald-600 text-white rounded-tr-none"
                    : "bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none"
                }`}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                  
                  {msg.isSimulated && (
                    <span className="block mt-2 text-[9px] font-bold text-amber-700 uppercase bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 inline-block">
                      Simulé (Variables locales)
                    </span>
                  )}
                </div>
                
                <span className="block text-[8px] text-slate-400 font-mono">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shrink-0 animate-pulse">
                IA
              </div>
              <div className="bg-slate-50 border border-slate-100 text-slate-500 text-xs px-4 py-3 rounded-xl rounded-tl-none shadow-xs flex items-center space-x-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>L'assistant clinique réfléchit...</span>
              </div>
            </div>
          )}

          <div ref={scrollRef}></div>
        </div>

        {/* Input box bottom */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputMessage);
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder={`Saisissez une demande d'aide clinique (${currentUserRole})...`}
              value={inputMessage}
              disabled={isLoading}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 text-xs border border-slate-200 bg-slate-50 px-4 py-3 rounded-lg focus:outline-emerald-600"
            />
            
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
