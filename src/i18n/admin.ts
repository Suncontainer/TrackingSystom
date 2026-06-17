import type { AppLocale } from "./types";

export const ADMIN_LOCALE_COOKIE = "admin_locale";

export type AdminDictionary = {
  localeName: string;
  /** Label shown on the toggle for switching to the other language. */
  switchLabel: string;
  switchToLocale: AppLocale;
  nav: {
    aria: string;
    dashboard: string;
    orders: string;
    emails: string;
    users: string;
    settings: string;
    logout: string;
    language: string;
  };
  common: {
    all: string;
    none: string;
    ok: string;
    warning: string;
    retry: string;
    applyFilters: string;
    createOrder: string;
    back: string;
    next: string;
    showAll: string;
    loadingAria: string;
  };
  errorBoundary: {
    eyebrow: string;
    title: string;
    body: string;
    retry: string;
  };
  dashboard: {
    eyebrow: string;
    title: string;
    overviewHeading: string;
    overviewIntro: string;
    periodAria: string;
    days: string;
    metricActiveOrders: string;
    metricOrderConfirmed: string;
    metricProcurement: string;
    metricInProduction: string;
    metricInTransit: string;
    metricDeliveredInPeriod: string;
    metricOverdueActive: string;
    metricDueSoon: string;
    metricEmailWarnings: string;
    overdueHeading: string;
    overdueIntro: string;
    overdueEmpty: string;
    dueSoonHeading: string;
    dueSoonIntro: string;
    dueSoonEmpty: string;
    failedEmailsHeading: string;
    failedEmailsIntro: string;
    failedEmailsEmpty: string;
    historyLink: string;
    recentChangesHeading: string;
    recentChangesIntro: string;
    recentChangesEmpty: string;
  };
  orders: {
    eyebrow: string;
    title: string;
    search: string;
    searchPlaceholder: string;
    status: string;
    salesperson: string;
    deliveryFrom: string;
    deliveryTo: string;
    archive: string;
    archiveActive: string;
    archiveArchived: string;
    archiveAll: string;
    sort: string;
    sortUpdated: string;
    sortCreated: string;
    sortEtaAsc: string;
    sortEtaDesc: string;
    overdueOnly: string;
    resultsHeading: string;
    ordersCount: string;
    colOrderNumber: string;
    colTracking: string;
    colCustomer: string;
    colStatus: string;
    colDelivery: string;
    colSales: string;
    colEmail: string;
    colUpdated: string;
    pageInfo: string;
    emptyResults: string;
  };
  emails: {
    eyebrow: string;
    title: string;
    heading: string;
    intro: string;
    colType: string;
    colRecipient: string;
    colStatus: string;
    colAttempts: string;
    colTimes: string;
    colNote: string;
    colAction: string;
    queue: string;
    sent: string;
    delivered: string;
    failed: string;
    retry: string;
    empty: string;
  };
  users: {
    eyebrow: string;
    title: string;
    placeholder: string;
  };
  settings: {
    eyebrow: string;
    title: string;
    placeholder: string;
  };
  auth: {
    intern: string;
    loginTitle: string;
    forgotTitle: string;
    resetTitle: string;
    emailLabel: string;
    passwordLabel: string;
    signIn: string;
    forgotLink: string;
    sendLink: string;
    backToLogin: string;
    newPasswordLabel: string;
    confirmPasswordLabel: string;
    savePassword: string;
    tempLogin: string;
    resetSuccess: string;
    forgotSent: string;
    forgotError: string;
    resetError: string;
    loginFallback: string;
    messages: Record<string, string>;
  };
  forms: {
    fields: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      language: string;
      assignedSalesperson: string;
      notAssigned: string;
      fallbackSalesEmail: string;
      productDescription: string;
    };
    saving: string;
    create: {
      customerModeHeading: string;
      customerModeIntro: string;
      newCustomer: string;
      existingCustomer: string;
      existingMatches: string;
      searchTerm: string;
      noFilter: string;
      archivedSuffix: string;
      noMatches: string;
      orderDataHeading: string;
      orderDataIntro: string;
      orderNumberAuto: string;
      orderNumberManual: string;
      manualOrderNumber: string;
      estimatedDelivery: string;
      initialNote: string;
      notesHeading: string;
      notesIntro: string;
      creating: string;
      submit: string;
    };
    update: {
      saveChanges: string;
    };
    statusChange: {
      newStatus: string;
      noFurtherStandard: string;
      actualDelivery: string;
      overrideReason: string;
      sendCustomerEmail: string;
      skipCustomerEmail: string;
      current: string;
      eta: string;
      mandatoryEmailNote: string;
      changing: string;
      submit: string;
    };
    deliveryDate: {
      newDate: string;
      notifyCustomer: string;
      reason: string;
      saving: string;
      submit: string;
    };
    internalNote: {
      newNote: string;
      adding: string;
      submit: string;
    };
    archive: {
      restoreReason: string;
      archiveReason: string;
      restoreSubmit: string;
      archiveSubmit: string;
    };
    customerPreview: {
      heading: string;
      order: string;
      tracking: string;
      deliveryForecast: string;
    };
    newOrderPage: {
      eyebrow: string;
      title: string;
      searchHeading: string;
      searchIntro: string;
      toOrderList: string;
      searchPlaceholder: string;
      search: string;
    };
    orderDetail: {
      eyebrow: string;
      flashCreated: string;
      flashUpdated: string;
      flashNoted: string;
      flashStatusChanged: string;
      flashDateChanged: string;
      flashArchived: string;
      flashRestored: string;
      tracking: string;
      customer: string;
      email: string;
      deliveryPlanned: string;
      sales: string;
      version: string;
      trackingLinkVersion: string;
      archive: string;
      archivedOn: string;
      active: string;
      statusChangeHeading: string;
      statusChangeIntro: string;
      noStatusPermission: string;
      deliveryDateHeading: string;
      deliveryDateIntro: string;
      noDatePermission: string;
      customerPreviewHeading: string;
      customerOrderHeading: string;
      customerOrderIntro: string;
      statusHistoryHeading: string;
      deliveryHistoryHeading: string;
      customerNotification: string;
      yes: string;
      no: string;
      noDeliveryChanges: string;
      mandatoryEmailsHeading: string;
      colType: string;
      colRecipient: string;
      colStatus: string;
      colAttempts: string;
      colCreated: string;
      noEmailHistory: string;
      internalNotesHeading: string;
      internalNoteLabel: string;
      auditHeading: string;
      archiveHeading: string;
      restoreHeading: string;
      archiveIntro: string;
      productDescription: string;
      phone: string;
      language: string;
    };
    customerDetail: {
      eyebrow: string;
      email: string;
      phone: string;
      language: string;
      updated: string;
      optionalHeading: string;
      optionalIntro: string;
      reviewRequestAllowed: string;
      satisfactionSurveyAllowed: string;
      maintenanceRecommendationAllowed: string;
      warrantyReminderAllowed: string;
      promotionDisabled: string;
      savePreferences: string;
      colTemplate: string;
      colStatus: string;
      colSoFar: string;
      colPreview: string;
      colAction: string;
      ready: string;
      blocked: string;
      confirmed: string;
      send: string;
      notAvailable: string;
      ordersHeading: string;
      colOrderNumber: string;
      colTracking: string;
      colDelivery: string;
      colUpdated: string;
    };
  };
};

export type OrderFormFieldsDict = AdminDictionary["forms"]["fields"];
export type CreateFormDict = AdminDictionary["forms"]["create"];
export type StatusChangeDict = AdminDictionary["forms"]["statusChange"];
export type DeliveryDateDict = AdminDictionary["forms"]["deliveryDate"];
export type InternalNoteDict = AdminDictionary["forms"]["internalNote"];
export type ArchiveDict = AdminDictionary["forms"]["archive"];

const de: AdminDictionary = {
  localeName: "Deutsch",
  switchLabel: "EN",
  switchToLocale: "en",
  nav: {
    aria: "Admin Navigation",
    dashboard: "Dashboard",
    orders: "Aufträge",
    emails: "E-Mails",
    users: "Benutzer",
    settings: "Einstellungen",
    logout: "Abmelden",
    language: "Sprache"
  },
  common: {
    all: "Alle",
    none: "—",
    ok: "OK",
    warning: "Warnung",
    retry: "Erneut versuchen",
    applyFilters: "Filter anwenden",
    createOrder: "Auftrag anlegen",
    back: "Zurück",
    next: "Weiter",
    showAll: "Alle anzeigen",
    loadingAria: "Admin wird geladen"
  },
  errorBoundary: {
    eyebrow: "Admin",
    title: "Die Ansicht konnte nicht geladen werden",
    body: "Bitte erneut versuchen. Falls der Fehler bleibt, prüfe die Server-Logs.",
    retry: "Erneut versuchen"
  },
  dashboard: {
    eyebrow: "Operations",
    title: "Tracking Dashboard",
    overviewHeading: "Übersicht",
    overviewIntro: "Alle Kennzahlen respektieren die Berechtigungen des angemeldeten Mitarbeiters.",
    periodAria: "Zeitraum",
    days: "Tage",
    metricActiveOrders: "Aktive Aufträge",
    metricOrderConfirmed: "Auftrag bestätigt",
    metricProcurement: "Beschaffung läuft",
    metricInProduction: "In Produktion",
    metricInTransit: "Im Transport",
    metricDeliveredInPeriod: "Geliefert",
    metricOverdueActive: "Überfällig aktiv",
    metricDueSoon: "Fällig in 7 Tagen",
    metricEmailWarnings: "E-Mail Warnungen",
    overdueHeading: "Überfällige Aufträge",
    overdueIntro: "Aktive Aufträge mit geschätzter Lieferung vor heute.",
    overdueEmpty: "Keine überfälligen aktiven Aufträge.",
    dueSoonHeading: "Fällig in 7 Tagen",
    dueSoonIntro: "Aktive Aufträge mit naher geschätzter Lieferung.",
    dueSoonEmpty: "Keine aktiven Aufträge sind in den nächsten sieben Tagen fällig.",
    failedEmailsHeading: "Fehlgeschlagene Pflicht-E-Mails",
    failedEmailsIntro: "Transaktionale E-Mails mit Bounce, Complaint, Failure oder Suppression.",
    failedEmailsEmpty: "Keine fehlgeschlagenen Pflicht-E-Mails.",
    historyLink: "Verlauf",
    recentChangesHeading: "Letzte Statusänderungen",
    recentChangesIntro: "Neueste Statusereignisse in Ihrem Berechtigungsbereich.",
    recentChangesEmpty: "Noch keine Statusänderungen vorhanden."
  },
  orders: {
    eyebrow: "Auftragsverwaltung",
    title: "Aufträge",
    search: "Suche",
    searchPlaceholder: "Auftragsnummer, Tracking, Kunde, E-Mail",
    status: "Status",
    salesperson: "Vertrieb",
    deliveryFrom: "Lieferung ab",
    deliveryTo: "Lieferung bis",
    archive: "Archiv",
    archiveActive: "Aktiv",
    archiveArchived: "Archiviert",
    archiveAll: "Alle",
    sort: "Sortierung",
    sortUpdated: "Zuletzt aktualisiert",
    sortCreated: "Zuletzt erstellt",
    sortEtaAsc: "Lieferung aufsteigend",
    sortEtaDesc: "Lieferung absteigend",
    overdueOnly: "Nur überfällige Aufträge",
    resultsHeading: "Ergebnisse",
    ordersCount: "{total} Aufträge · Seite {page} / {totalPages}",
    colOrderNumber: "Auftragsnummer",
    colTracking: "Tracking",
    colCustomer: "Kunde",
    colStatus: "Status",
    colDelivery: "Lieferung",
    colSales: "Vertrieb",
    colEmail: "E-Mail",
    colUpdated: "Aktualisiert",
    pageInfo: "Seite {page} von {totalPages}",
    emptyResults: "Keine Aufträge für diese Filter gefunden."
  },
  emails: {
    eyebrow: "Kommunikation",
    title: "E-Mail Verlauf",
    heading: "Outbox und Zustellung",
    intro: "Pflicht-E-Mails und interne Benachrichtigungen mit aktuellem Zustellstatus.",
    colType: "Typ",
    colRecipient: "Empfänger",
    colStatus: "Status",
    colAttempts: "Versuche",
    colTimes: "Zeiten",
    colNote: "Hinweis",
    colAction: "Aktion",
    queue: "Queue",
    sent: "Sent",
    delivered: "Delivered",
    failed: "Failed",
    retry: "Erneut senden",
    empty: "Noch keine E-Mail-Ereignisse vorhanden."
  },
  users: {
    eyebrow: "Berechtigungen",
    title: "Benutzerverwaltung",
    placeholder: "Noch keine Benutzerliste verfügbar."
  },
  settings: {
    eyebrow: "System",
    title: "Einstellungen",
    placeholder: "Noch keine Systemeinstellungen verfügbar."
  },
  auth: {
    intern: "Intern",
    loginTitle: "Admin Login",
    forgotTitle: "Passwort zurücksetzen",
    resetTitle: "Neues Passwort",
    emailLabel: "E-Mail-Adresse",
    passwordLabel: "Passwort",
    signIn: "Anmelden",
    forgotLink: "Passwort vergessen?",
    sendLink: "Link senden",
    backToLogin: "Zur Anmeldung",
    newPasswordLabel: "Neues Passwort",
    confirmPasswordLabel: "Passwort wiederholen",
    savePassword: "Passwort speichern",
    tempLogin: "Temporärer Login:",
    resetSuccess: "Das Passwort wurde aktualisiert. Bitte melden Sie sich erneut an.",
    forgotSent: "Wenn die Adresse berechtigt ist, wurde ein Link zum Zurücksetzen gesendet.",
    forgotError: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    resetError: "Das Passwort muss mindestens 10 Zeichen haben und beide Eingaben müssen übereinstimmen.",
    loginFallback: "Die Anmeldung konnte nicht abgeschlossen werden.",
    messages: {
      auth_required: "Bitte melden Sie sich an, um den Adminbereich zu nutzen.",
      auth_unconfigured: "Supabase Auth ist noch nicht konfiguriert.",
      callback_failed: "Der Anmeldelink konnte nicht bestätigt werden.",
      inactive: "Dieses Benutzerkonto ist deaktiviert.",
      invalid_credentials: "E-Mail-Adresse oder Passwort ist ungültig.",
      not_authorized: "Dieses Benutzerkonto hat keinen Zugriff auf diesen Bereich.",
      profile_missing: "Für diesen Login ist noch kein internes Benutzerprofil angelegt."
    }
  },
  forms: {
    fields: {
      firstName: "Vorname",
      lastName: "Nachname",
      email: "E-Mail",
      phone: "Telefon",
      language: "Sprache",
      assignedSalesperson: "Zugewiesener Vertrieb",
      notAssigned: "Nicht direkt zugewiesen",
      fallbackSalesEmail: "Fallback Vertriebs-E-Mail",
      productDescription: "Produktbeschreibung"
    },
    saving: "Speichert...",
    create: {
      customerModeHeading: "Kundenmodus",
      customerModeIntro: "Bestehenden Kunden bewusst wiederverwenden oder neuen Kunden anlegen.",
      newCustomer: "Neuer Kunde",
      existingCustomer: "Bestehender Kunde",
      existingMatches: "Bestehende Treffer",
      searchTerm: "Suchbegriff",
      noFilter: "kein Filter",
      archivedSuffix: " · archiviert",
      noMatches: "Keine passenden Bestandskunden gefunden.",
      orderDataHeading: "Auftragsdaten",
      orderDataIntro: "Tracking-Nummer wird bei der Erstellung automatisch und zufällig erzeugt.",
      orderNumberAuto: "Auftragsnummer automatisch",
      orderNumberManual: "Auftragsnummer manuell",
      manualOrderNumber: "Manuelle Auftragsnummer",
      estimatedDelivery: "Voraussichtliche Lieferung",
      initialNote: "Initiale interne Notiz",
      notesHeading: "Hinweise",
      notesIntro: "Kundenbestätigung und Vertriebsbenachrichtigung werden als Pflicht-E-Mails in die Outbox gestellt.",
      creating: "Auftrag wird erstellt...",
      submit: "Auftrag anlegen"
    },
    update: {
      saveChanges: "Änderungen speichern"
    },
    statusChange: {
      newStatus: "Neuer Status",
      noFurtherStandard: "Kein weiterer Standardstatus",
      actualDelivery: "Tatsächliche Lieferung",
      overrideReason: "Override-Grund",
      sendCustomerEmail: "Kunden-E-Mail senden",
      skipCustomerEmail: "Kunden-E-Mail nicht senden",
      current: "Aktuell",
      eta: "ETA",
      mandatoryEmailNote: "Pflicht-E-Mail wird bei Standardwechsel eingereiht.",
      changing: "Status wird geändert...",
      submit: "Status ändern"
    },
    deliveryDate: {
      newDate: "Neue Lieferprognose",
      notifyCustomer: "Kundenbenachrichtigung einreihen",
      reason: "Grund",
      saving: "Datum wird gespeichert...",
      submit: "Lieferdatum aktualisieren"
    },
    internalNote: {
      newNote: "Neue interne Notiz",
      adding: "Speichert...",
      submit: "Notiz hinzufügen"
    },
    archive: {
      restoreReason: "Restore-Grund",
      archiveReason: "Archivierungsgrund",
      restoreSubmit: "Auftrag wiederherstellen",
      archiveSubmit: "Auftrag archivieren"
    },
    customerPreview: {
      heading: "Kundenansicht",
      order: "Auftrag",
      tracking: "Tracking",
      deliveryForecast: "Lieferprognose"
    },
    newOrderPage: {
      eyebrow: "Auftrag",
      title: "Neuen Auftrag anlegen",
      searchHeading: "Bestandskunden durchsuchen",
      searchIntro: "Erst suchen, dann bei Bedarf denselben Kunden explizit wiederverwenden.",
      toOrderList: "Zur Auftragsliste",
      searchPlaceholder: "Kunde oder E-Mail suchen",
      search: "Suchen"
    },
    orderDetail: {
      eyebrow: "Auftrag",
      flashCreated: "Auftrag erstellt. Pflicht-E-Mails wurden in die Outbox eingereiht.",
      flashUpdated: "Auftrag aktualisiert.",
      flashNoted: "Interne Notiz hinzugefügt.",
      flashStatusChanged: "Status aktualisiert. Die passende Historie und E-Mail-Outbox wurden geschrieben.",
      flashDateChanged: "Lieferdatum aktualisiert.",
      flashArchived: "Auftrag archiviert und Tracking-Link-Version erhöht.",
      flashRestored: "Auftrag wiederhergestellt.",
      tracking: "Tracking",
      customer: "Kunde",
      email: "E-Mail",
      deliveryPlanned: "Lieferung geplant",
      sales: "Vertrieb",
      version: "Version",
      trackingLinkVersion: "Tracking-Link Version",
      archive: "Archiv",
      archivedOn: "Archiviert am",
      active: "Aktiv",
      statusChangeHeading: "Status ändern",
      statusChangeIntro: "Standardwechsel gehen nur einen Schritt nach vorn. Overrides sind Super-Admins vorbehalten.",
      noStatusPermission: "Keine Berechtigung für Statusänderungen.",
      deliveryDateHeading: "Lieferdatum",
      deliveryDateIntro: "Änderungen schreiben eine eigene Historie und können optional eine Kunden-E-Mail einreihen.",
      noDatePermission: "Keine Berechtigung für Lieferdatumänderungen.",
      customerPreviewHeading: "Kundenvorschau",
      customerOrderHeading: "Kunde und Auftrag",
      customerOrderIntro: "Felder in dieser Phase werden über die Auftragsversion gegen parallele Änderungen geschützt.",
      statusHistoryHeading: "Statusverlauf",
      deliveryHistoryHeading: "Lieferdatum-Historie",
      customerNotification: "Kundenbenachrichtigung",
      yes: "ja",
      no: "nein",
      noDeliveryChanges: "Noch keine Lieferdatum-Änderungen vorhanden.",
      mandatoryEmailsHeading: "Pflicht-E-Mails",
      colType: "Typ",
      colRecipient: "Empfänger",
      colStatus: "Status",
      colAttempts: "Versuche",
      colCreated: "Erstellt",
      noEmailHistory: "Noch keine E-Mail-Historie vorhanden.",
      internalNotesHeading: "Interne Notizen",
      internalNoteLabel: "Interne Notiz",
      auditHeading: "Audit",
      archiveHeading: "Auftrag archivieren",
      restoreHeading: "Auftrag wiederherstellen",
      archiveIntro: "Archivieren sperrt den öffentlichen Zugriff und erhöht die Tracking-Link-Version.",
      productDescription: "Produktbeschreibung",
      phone: "Telefon",
      language: "Sprache"
    },
    customerDetail: {
      eyebrow: "Kundenverwaltung",
      email: "E-Mail",
      phone: "Telefon",
      language: "Sprache",
      updated: "Aktualisiert",
      optionalHeading: "Optionale E-Mails",
      optionalIntro: "Alle Kategorien sind standardmäßig deaktiviert und senden erst nach bestätigter Aktion.",
      reviewRequestAllowed: "Bewertungsanfrage erlaubt",
      satisfactionSurveyAllowed: "Zufriedenheitsumfrage erlaubt",
      maintenanceRecommendationAllowed: "Wartungsempfehlung erlaubt",
      warrantyReminderAllowed: "Garantie-Erinnerung erlaubt",
      promotionDisabled: "Promotion deaktiviert",
      savePreferences: "Präferenzen speichern",
      colTemplate: "Vorlage",
      colStatus: "Status",
      colSoFar: "Bisher",
      colPreview: "Vorschau",
      colAction: "Aktion",
      ready: "Bereit",
      blocked: "Gesperrt",
      confirmed: "Bestätigt",
      send: "Senden",
      notAvailable: "Nicht verfügbar",
      ordersHeading: "Aufträge des Kunden",
      colOrderNumber: "Auftragsnummer",
      colTracking: "Tracking",
      colDelivery: "Lieferung",
      colUpdated: "Aktualisiert"
    }
  }
};

const en: AdminDictionary = {
  localeName: "English",
  switchLabel: "DE",
  switchToLocale: "de",
  nav: {
    aria: "Admin navigation",
    dashboard: "Dashboard",
    orders: "Orders",
    emails: "Emails",
    users: "Users",
    settings: "Settings",
    logout: "Sign out",
    language: "Language"
  },
  common: {
    all: "All",
    none: "—",
    ok: "OK",
    warning: "Warning",
    retry: "Try again",
    applyFilters: "Apply filters",
    createOrder: "Create order",
    back: "Back",
    next: "Next",
    showAll: "Show all",
    loadingAria: "Loading admin"
  },
  errorBoundary: {
    eyebrow: "Admin",
    title: "This view could not be loaded",
    body: "Please try again. If the error persists, check the server logs.",
    retry: "Try again"
  },
  dashboard: {
    eyebrow: "Operations",
    title: "Tracking dashboard",
    overviewHeading: "Overview",
    overviewIntro: "All metrics respect the permissions of the signed-in employee.",
    periodAria: "Period",
    days: "days",
    metricActiveOrders: "Active orders",
    metricOrderConfirmed: "Order Confirmed",
    metricProcurement: "Procurement in Progress",
    metricInProduction: "In Production",
    metricInTransit: "In Transit",
    metricDeliveredInPeriod: "Delivered",
    metricOverdueActive: "Overdue active",
    metricDueSoon: "Due in 7 days",
    metricEmailWarnings: "Email warnings",
    overdueHeading: "Overdue orders",
    overdueIntro: "Active orders with an estimated delivery before today.",
    overdueEmpty: "No overdue active orders.",
    dueSoonHeading: "Due in 7 days",
    dueSoonIntro: "Active orders with a near estimated delivery.",
    dueSoonEmpty: "No active orders are due within the next seven days.",
    failedEmailsHeading: "Failed mandatory emails",
    failedEmailsIntro: "Transactional emails with bounce, complaint, failure or suppression.",
    failedEmailsEmpty: "No failed mandatory emails.",
    historyLink: "History",
    recentChangesHeading: "Recent status changes",
    recentChangesIntro: "Latest status events within your permission scope.",
    recentChangesEmpty: "No status changes yet."
  },
  orders: {
    eyebrow: "Order management",
    title: "Orders",
    search: "Search",
    searchPlaceholder: "Order number, tracking, customer, email",
    status: "Status",
    salesperson: "Sales",
    deliveryFrom: "Delivery from",
    deliveryTo: "Delivery to",
    archive: "Archive",
    archiveActive: "Active",
    archiveArchived: "Archived",
    archiveAll: "All",
    sort: "Sort",
    sortUpdated: "Recently updated",
    sortCreated: "Recently created",
    sortEtaAsc: "Delivery ascending",
    sortEtaDesc: "Delivery descending",
    overdueOnly: "Overdue orders only",
    resultsHeading: "Results",
    ordersCount: "{total} orders · Page {page} / {totalPages}",
    colOrderNumber: "Order number",
    colTracking: "Tracking",
    colCustomer: "Customer",
    colStatus: "Status",
    colDelivery: "Delivery",
    colSales: "Sales",
    colEmail: "Email",
    colUpdated: "Updated",
    pageInfo: "Page {page} of {totalPages}",
    emptyResults: "No orders found for these filters."
  },
  emails: {
    eyebrow: "Communication",
    title: "Email history",
    heading: "Outbox and delivery",
    intro: "Mandatory emails and internal notifications with their current delivery status.",
    colType: "Type",
    colRecipient: "Recipient",
    colStatus: "Status",
    colAttempts: "Attempts",
    colTimes: "Times",
    colNote: "Note",
    colAction: "Action",
    queue: "Queue",
    sent: "Sent",
    delivered: "Delivered",
    failed: "Failed",
    retry: "Resend",
    empty: "No email events yet."
  },
  users: {
    eyebrow: "Permissions",
    title: "User management",
    placeholder: "No user list available yet."
  },
  settings: {
    eyebrow: "System",
    title: "Settings",
    placeholder: "No system settings available yet."
  },
  auth: {
    intern: "Internal",
    loginTitle: "Admin login",
    forgotTitle: "Reset password",
    resetTitle: "New password",
    emailLabel: "Email address",
    passwordLabel: "Password",
    signIn: "Sign in",
    forgotLink: "Forgot password?",
    sendLink: "Send link",
    backToLogin: "Back to login",
    newPasswordLabel: "New password",
    confirmPasswordLabel: "Repeat password",
    savePassword: "Save password",
    tempLogin: "Temporary login:",
    resetSuccess: "The password has been updated. Please sign in again.",
    forgotSent: "If the address is eligible, a reset link has been sent.",
    forgotError: "Please enter a valid email address.",
    resetError: "The password must be at least 10 characters and both entries must match.",
    loginFallback: "Sign-in could not be completed.",
    messages: {
      auth_required: "Please sign in to use the admin area.",
      auth_unconfigured: "Supabase Auth is not configured yet.",
      callback_failed: "The sign-in link could not be confirmed.",
      inactive: "This user account is deactivated.",
      invalid_credentials: "Email address or password is invalid.",
      not_authorized: "This user account has no access to this area.",
      profile_missing: "No internal user profile exists for this login yet."
    }
  },
  forms: {
    fields: {
      firstName: "First name",
      lastName: "Last name",
      email: "Email",
      phone: "Phone",
      language: "Language",
      assignedSalesperson: "Assigned sales",
      notAssigned: "Not directly assigned",
      fallbackSalesEmail: "Fallback sales email",
      productDescription: "Product description"
    },
    saving: "Saving...",
    create: {
      customerModeHeading: "Customer mode",
      customerModeIntro: "Deliberately reuse an existing customer or create a new one.",
      newCustomer: "New customer",
      existingCustomer: "Existing customer",
      existingMatches: "Existing matches",
      searchTerm: "Search term",
      noFilter: "no filter",
      archivedSuffix: " · archived",
      noMatches: "No matching existing customers found.",
      orderDataHeading: "Order data",
      orderDataIntro: "The tracking number is generated automatically and randomly on creation.",
      orderNumberAuto: "Order number automatic",
      orderNumberManual: "Order number manual",
      manualOrderNumber: "Manual order number",
      estimatedDelivery: "Estimated delivery",
      initialNote: "Initial internal note",
      notesHeading: "Notes",
      notesIntro: "The customer confirmation and sales notification are queued as mandatory emails in the outbox.",
      creating: "Creating order...",
      submit: "Create order"
    },
    update: {
      saveChanges: "Save changes"
    },
    statusChange: {
      newStatus: "New status",
      noFurtherStandard: "No further standard status",
      actualDelivery: "Actual delivery",
      overrideReason: "Override reason",
      sendCustomerEmail: "Send customer email",
      skipCustomerEmail: "Do not send customer email",
      current: "Current",
      eta: "ETA",
      mandatoryEmailNote: "A mandatory email is queued on a standard transition.",
      changing: "Changing status...",
      submit: "Change status"
    },
    deliveryDate: {
      newDate: "New delivery forecast",
      notifyCustomer: "Queue customer notification",
      reason: "Reason",
      saving: "Saving date...",
      submit: "Update delivery date"
    },
    internalNote: {
      newNote: "New internal note",
      adding: "Saving...",
      submit: "Add note"
    },
    archive: {
      restoreReason: "Restore reason",
      archiveReason: "Archive reason",
      restoreSubmit: "Restore order",
      archiveSubmit: "Archive order"
    },
    customerPreview: {
      heading: "Customer view",
      order: "Order",
      tracking: "Tracking",
      deliveryForecast: "Delivery forecast"
    },
    newOrderPage: {
      eyebrow: "Order",
      title: "Create a new order",
      searchHeading: "Search existing customers",
      searchIntro: "Search first, then explicitly reuse the same customer if needed.",
      toOrderList: "To order list",
      searchPlaceholder: "Search customer or email",
      search: "Search"
    },
    orderDetail: {
      eyebrow: "Order",
      flashCreated: "Order created. Mandatory emails were queued in the outbox.",
      flashUpdated: "Order updated.",
      flashNoted: "Internal note added.",
      flashStatusChanged: "Status updated. The matching history and email outbox were written.",
      flashDateChanged: "Delivery date updated.",
      flashArchived: "Order archived and tracking link version increased.",
      flashRestored: "Order restored.",
      tracking: "Tracking",
      customer: "Customer",
      email: "Email",
      deliveryPlanned: "Delivery planned",
      sales: "Sales",
      version: "Version",
      trackingLinkVersion: "Tracking link version",
      archive: "Archive",
      archivedOn: "Archived on",
      active: "Active",
      statusChangeHeading: "Change status",
      statusChangeIntro: "Standard transitions move forward one step only. Overrides are reserved for super admins.",
      noStatusPermission: "No permission for status changes.",
      deliveryDateHeading: "Delivery date",
      deliveryDateIntro: "Changes write their own history and can optionally queue a customer email.",
      noDatePermission: "No permission for delivery date changes.",
      customerPreviewHeading: "Customer preview",
      customerOrderHeading: "Customer and order",
      customerOrderIntro: "Fields in this phase are protected against concurrent changes via the order version.",
      statusHistoryHeading: "Status history",
      deliveryHistoryHeading: "Delivery date history",
      customerNotification: "Customer notification",
      yes: "yes",
      no: "no",
      noDeliveryChanges: "No delivery date changes yet.",
      mandatoryEmailsHeading: "Mandatory emails",
      colType: "Type",
      colRecipient: "Recipient",
      colStatus: "Status",
      colAttempts: "Attempts",
      colCreated: "Created",
      noEmailHistory: "No email history yet.",
      internalNotesHeading: "Internal notes",
      internalNoteLabel: "Internal note",
      auditHeading: "Audit",
      archiveHeading: "Archive order",
      restoreHeading: "Restore order",
      archiveIntro: "Archiving blocks public access and increases the tracking link version.",
      productDescription: "Product description",
      phone: "Phone",
      language: "Language"
    },
    customerDetail: {
      eyebrow: "Customer management",
      email: "Email",
      phone: "Phone",
      language: "Language",
      updated: "Updated",
      optionalHeading: "Optional emails",
      optionalIntro: "All categories are disabled by default and only send after a confirmed action.",
      reviewRequestAllowed: "Review request allowed",
      satisfactionSurveyAllowed: "Satisfaction survey allowed",
      maintenanceRecommendationAllowed: "Maintenance recommendation allowed",
      warrantyReminderAllowed: "Warranty reminder allowed",
      promotionDisabled: "Promotion disabled",
      savePreferences: "Save preferences",
      colTemplate: "Template",
      colStatus: "Status",
      colSoFar: "So far",
      colPreview: "Preview",
      colAction: "Action",
      ready: "Ready",
      blocked: "Blocked",
      confirmed: "Confirmed",
      send: "Send",
      notAvailable: "Not available",
      ordersHeading: "Customer orders",
      colOrderNumber: "Order number",
      colTracking: "Tracking",
      colDelivery: "Delivery",
      colUpdated: "Updated"
    }
  }
};

const adminDictionaries = { de, en } satisfies Record<AppLocale, AdminDictionary>;

export function getAdminDictionary(locale: AppLocale = "de") {
  return adminDictionaries[locale];
}
