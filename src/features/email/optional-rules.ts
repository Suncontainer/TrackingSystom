import type { EmailType } from "@/db/schema";

export const optionalEmailTypes = [
  "REVIEW_REQUEST",
  "SATISFACTION_SURVEY",
  "MAINTENANCE_RECOMMENDATION",
  "WARRANTY_REMINDER",
  "PROMOTIONAL"
] as const satisfies readonly EmailType[];

export type OptionalEmailType = (typeof optionalEmailTypes)[number];

export const optionalEmailDefinitions = {
  MAINTENANCE_RECOMMENDATION: {
    label: "Wartungsempfehlung",
    preferenceKey: "maintenanceRecommendationAllowed",
    preview: "Empfehlung fuer Wartung oder Pflege nach Lieferung.",
    subject: "Wartungsempfehlung - Sun Container",
    templateKey: "maintenance-recommendation"
  },
  PROMOTIONAL: {
    label: "Promotion",
    preferenceKey: "promotionalEmailAllowed",
    preview: "Marketing bleibt im MVP deaktiviert.",
    subject: "Sun Container",
    templateKey: "promotional"
  },
  REVIEW_REQUEST: {
    label: "Bewertungsanfrage",
    preferenceKey: "reviewRequestAllowed",
    preview: "Kurze Bitte um Bewertung nach abgeschlossener Lieferung.",
    subject: "Ihre Bewertung fuer Sun Container",
    templateKey: "review-request"
  },
  SATISFACTION_SURVEY: {
    label: "Zufriedenheitsumfrage",
    preferenceKey: "satisfactionSurveyAllowed",
    preview: "Kurze Rueckfrage zur Zufriedenheit nach Lieferung.",
    subject: "Ihre Erfahrung mit Sun Container",
    templateKey: "satisfaction-survey"
  },
  WARRANTY_REMINDER: {
    label: "Garantie-Erinnerung",
    preferenceKey: "warrantyReminderAllowed",
    preview: "Freundliche Erinnerung an relevante Garantieinformationen.",
    subject: "Garantie-Erinnerung - Sun Container",
    templateKey: "warranty-reminder"
  }
} as const;

export function isOptionalEmailEligible(input: {
  emailType: OptionalEmailType;
  lastDeliveredOrderId: string | null;
  preferenceAllowed: boolean;
  suppressed: boolean;
}) {
  if (input.emailType === "PROMOTIONAL") {
    return false;
  }

  return input.preferenceAllowed && !input.suppressed && Boolean(input.lastDeliveredOrderId);
}
