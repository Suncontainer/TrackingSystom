import type { AppLocale } from "./types";

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
    metricOrderReceived: string;
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
};

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
    metricOrderReceived: "Auftrag eingegangen",
    metricInProduction: "In Produktion",
    metricInTransit: "Unterwegs",
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
    metricOrderReceived: "Order received",
    metricInProduction: "In production",
    metricInTransit: "In transit",
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
  }
};

const adminDictionaries = { de, en } satisfies Record<AppLocale, AdminDictionary>;

export function getAdminDictionary(locale: AppLocale = "de") {
  return adminDictionaries[locale];
}
