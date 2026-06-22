import type { PublicDictionary } from "./types";

export const de = {
  localeName: "Deutsch",
  lookup: {
    eyebrow: "Kundenportal",
    formAriaLabel: "Auftragssuche",
    title: "Auftrag verfolgen",
    intro:
      "Prüfen Sie den aktuellen Status Ihres Sun Container Auftrags mit Ihrer Bestell- oder Trackingnummer.",
    identifierLabel: "Auftrags- oder Trackingnummer",
    identifierPlaceholder: "z. B. SC-2026-000001",
    emailLabel: "E-Mail-Adresse",
    emailPlaceholder: "name@firma.de",
    submit: "Status prüfen",
    privacy: "Datenschutz",
    fallback: "Kontakt: info@suncontainer.de",
    mainSite: "Zur Hauptwebsite"
  },
  result: {
    currentStatus: "Aktueller Status",
    estimateNotice: "Lieferdaten sind aktuelle Schätzungen und können sich im weiteren Verlauf ändern.",
    estimatedDelivery: "Voraussichtliche Lieferung",
    eyebrow: "Sendungsstatus",
    greeting: "Hallo {name}, hier ist der aktuelle Status Ihres Auftrags.",
    lastUpdated: "Zuletzt aktualisiert",
    orderNumber: "Auftragsnummer",
    product: "Produkt",
    productFallback: "Sun Container Auftrag",
    support: "Support",
    summaryAriaLabel: "Auftragszusammenfassung",
    timelineAriaLabel: "Fortschritt",
    trackingNumber: "Trackingnummer",
    productImages: "Produktbilder"
  },
  tokenError: {
    eyebrow: "Tracking",
    title: "Tracking-Link nicht verfügbar",
    body: "Bitte nutzen Sie die manuelle Auftragssuche.",
    cta: "Zur Auftragssuche"
  }
} satisfies PublicDictionary;
