export type AppLocale = "de" | "en";

export type PublicDictionary = {
  localeName: string;
  lookup: {
    eyebrow: string;
    formAriaLabel: string;
    title: string;
    intro: string;
    identifierLabel: string;
    identifierPlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    submit: string;
    privacy: string;
    fallback: string;
    mainSite: string;
  };
  result: {
    currentStatus: string;
    estimateNotice: string;
    estimatedDelivery: string;
    eyebrow: string;
    greeting: string;
    lastUpdated: string;
    orderNumber: string;
    product: string;
    productFallback: string;
    support: string;
    summaryAriaLabel: string;
    timelineAriaLabel: string;
    trackingNumber: string;
  };
};
