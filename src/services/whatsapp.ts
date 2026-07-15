import { Appointment } from "../types";

/**
 * Service modulaire de gestion des confirmations de rendez-vous par WhatsApp.
 * Conçu pour permettre une transition transparente vers l'API WhatsApp Business officielle
 * sans modifier l'interface utilisateur.
 */

/**
 * Formate le numéro de téléphone pour WhatsApp.
 * Supprime les caractères non numériques et ajoute l'indicatif pays si manquant.
 * Spécifique pour la Côte d'Ivoire (+225) avec la numérotation à 10 chiffres (01, 05, 07, etc.).
 */
export function formatPhoneNumberForWhatsApp(phone: string): string {
  // Supprimer tout sauf les chiffres
  let cleaned = phone.replace(/\D/g, "");

  // Si le numéro commence par un 0 (ex: 0707123456) et fait 10 chiffres (nouveau plan CI), on ajoute 225
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = "225" + cleaned;
  }

  // Si le numéro fait 10 chiffres sans indicatif (ex: 77123456 sous l'ancien plan ou s'il commence sans 0),
  // on s'assure d'avoir l'indicatif 225
  if (cleaned.length === 10 && !cleaned.startsWith("225")) {
    cleaned = "225" + cleaned;
  }

  return cleaned;
}

/**
 * Génère le message de rappel pré-rédigé pour un rendez-vous.
 */
export function generateConfirmationMessage(
  patientName: string,
  dateFormatted: string,
  time: string
): string {
  return `Bonjour ${patientName},

Nous vous rappelons que vous avez un rendez-vous à la Clinique Santé Plus CI demain (${dateFormatted}) à ${time}.

Merci de confirmer votre présence.

En cas d'empêchement, veuillez nous prévenir afin que nous puissions reprogrammer votre rendez-vous.

Merci et à bientôt.

Clinique Santé Plus CI`;
}

/**
 * Envoie la confirmation par WhatsApp.
 * Actuellement, cette fonction génère l'URL de redirection wa.me et l'ouvre sur le client.
 * Évolution future : Remplacer l'ouverture locale par un appel Fetch/Axios vers l'API officielle
 * WhatsApp Business, retournant { success: true, method: "api" } une fois l'appel réseau complété.
 */
export async function sendWhatsAppConfirmation(
  appointment: Appointment,
  senderName: string
): Promise<{ success: boolean; url?: string; method: "client-redirect" | "api" }> {
  try {
    const formattedPhone = formatPhoneNumberForWhatsApp(appointment.patientPhone);
    
    // Formatage de la date en français pour un affichage convivial
    const dateObj = new Date(appointment.date);
    const dateFormatted = dateObj.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const message = generateConfirmationMessage(
      appointment.patientName,
      dateFormatted,
      appointment.time
    );

    // Encode le message pour l'URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

    // === MODULE DE REDIRECTION CLIENT (Méthode Actuelle) ===
    // Ouvre WhatsApp dans un nouvel onglet ou l'application locale
    window.open(whatsappUrl, "_blank");

    // === ZONE DE RE-RÉDACTION POUR API WHATSAPP BUSINESS FUTURE ===
    /*
    // Exemple d'intégration future avec l'API officielle :
    const response = await fetch("https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages", {
      method: "POST",
      headers: {
        "Authorization": "Bearer YOUR_ACCESS_TOKEN",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: "confirmation_rendezvous",
          language: { code: "fr" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: appointment.patientName },
                { type: "text", text: dateFormatted },
                { type: "text", text: appointment.time }
              ]
            }
          ]
        }
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || "Erreur API");
    return { success: true, method: "api" };
    */

    return {
      success: true,
      url: whatsappUrl,
      method: "client-redirect",
    };
  } catch (error) {
    console.error("Erreur lors de l'envoi de la confirmation WhatsApp :", error);
    return { success: false, method: "client-redirect" };
  }
}
