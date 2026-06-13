export const siteConfig = {
  name: "Sun Container Tracking",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  mainSiteUrl: process.env.NEXT_PUBLIC_MAIN_SITE_URL ?? "https://suncontainer.de",
  supportEmail: process.env.EMAIL_REPLY_TO ?? "info@suncontainer.de",
  defaultLocale: "de"
} as const;
