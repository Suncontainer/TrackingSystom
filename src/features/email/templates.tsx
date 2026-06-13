import { Body, Container, Head, Hr, Html, Preview, Section, Text } from "@react-email/components";
import { render as renderReactEmail } from "@react-email/render";
import type { ReactNode } from "react";

import type { EmailType } from "@/db/schema";
import { siteConfig } from "@/config/site";
import type { AppLocale } from "@/i18n/types";

export type EmailTemplateVariables = {
  currentEstimatedDeliveryDate?: string;
  customerEmail?: string;
  customerName?: string;
  estimatedDeliveryDate?: string;
  newDate?: string;
  orderAdminUrl?: string;
  orderNumber?: string;
  previousDate?: string;
  productDescription?: string | null;
  secureTrackingUrl?: string;
  trackingNumber?: string;
};

type TemplateDefinition = {
  html: string;
  subject: string;
  text: string;
};

type TemplateProps = {
  children: ReactNode;
  locale: AppLocale;
  preview: string;
  title: string;
};

function formatDate(value: string | undefined, locale: AppLocale) {
  if (!value) {
    return locale === "de" ? "Noch nicht festgelegt" : "Not set yet";
  }

  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { dateStyle: "medium" }).format(new Date(value));
}

function Layout({ children, locale, preview, title }: TemplateProps) {
  return (
    <Html lang={locale}>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#faf9f4", color: "#2f2f2b", fontFamily: "Arial, sans-serif", margin: 0 }}>
        <Container style={{ backgroundColor: "#ffffff", border: "1px solid #e5e1d8", margin: "24px auto", padding: "28px", width: "560px" }}>
          <Text style={{ color: "#8d6500", fontSize: "13px", fontWeight: 700, margin: "0 0 14px", textTransform: "uppercase" }}>
            Sun Container
          </Text>
          <Text style={{ fontSize: "24px", fontWeight: 700, lineHeight: "32px", margin: "0 0 18px" }}>{title}</Text>
          <Section>{children}</Section>
          <Hr style={{ borderColor: "#e5e1d8", margin: "24px 0" }} />
          <Text style={{ color: "#686760", fontSize: "13px", lineHeight: "20px", margin: 0 }}>
            {locale === "de"
              ? `Antworten gehen an ${siteConfig.supportEmail}.`
              : `Replies go to ${siteConfig.supportEmail}.`}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function paragraph(value: string) {
  return <Text style={{ fontSize: "15px", lineHeight: "24px", margin: "0 0 12px" }}>{value}</Text>;
}

function link(url: string | undefined, label: string) {
  if (!url) {
    return null;
  }

  return (
    <Text style={{ margin: "18px 0" }}>
      <a href={url} style={{ backgroundColor: "#f5c842", color: "#23231f", display: "inline-block", fontWeight: 700, padding: "12px 16px", textDecoration: "none" }}>
        {label}
      </a>
    </Text>
  );
}

async function render(title: string, preview: string, locale: AppLocale, children: ReactNode, text: string, subject: string) {
  const html = await renderReactEmail(
    <Layout locale={locale} preview={preview} title={title}>
      {children}
    </Layout>,
    { pretty: false }
  );

  return { html, subject, text } satisfies TemplateDefinition;
}

function renderOrderReceived(locale: AppLocale, variables: EmailTemplateVariables) {
  const subject = locale === "de" ? "Auftragsbestätigung - Sun Container" : "Order Confirmation - Sun Container";
  const title = locale === "de" ? "Ihr Auftrag wurde erfasst" : "Your order has been received";
  const trackingLabel = locale === "de" ? "Auftrag ansehen" : "View order";
  const text = [
    `${title}`,
    `${variables.customerName ?? ""}`,
    `${variables.orderNumber ?? ""}`,
    `${variables.trackingNumber ?? ""}`,
    `${formatDate(variables.estimatedDeliveryDate ?? variables.currentEstimatedDeliveryDate, locale)}`,
    variables.secureTrackingUrl ?? ""
  ].filter(Boolean).join("\n");

  return render(
    title,
    subject,
    locale,
    <>
      {paragraph(locale === "de" ? `Hallo ${variables.customerName ?? ""}, Ihr Auftrag wurde aufgenommen.` : `Hello ${variables.customerName ?? ""}, your order has been created.`)}
      {paragraph(`${locale === "de" ? "Auftrag" : "Order"}: ${variables.orderNumber ?? "-"}`)}
      {paragraph(`${locale === "de" ? "Tracking" : "Tracking"}: ${variables.trackingNumber ?? "-"}`)}
      {paragraph(`${locale === "de" ? "Voraussichtliche Lieferung" : "Estimated delivery"}: ${formatDate(variables.estimatedDeliveryDate ?? variables.currentEstimatedDeliveryDate, locale)}`)}
      {link(variables.secureTrackingUrl, trackingLabel)}
    </>,
    text,
    subject
  );
}

function renderStatus(locale: AppLocale, variables: EmailTemplateVariables, status: EmailType) {
  const copy = {
    DELIVERED: {
      de: ["Lieferbestätigung - Sun Container", "Ihr Auftrag wurde geliefert"],
      en: ["Delivery Confirmation", "Your order has been delivered"]
    },
    IN_TRANSIT: {
      de: ["Ihr Auftrag ist unterwegs", "Ihr Auftrag ist unterwegs"],
      en: ["Your Order Is On The Way", "Your order is on the way"]
    },
    PRODUCTION_STARTED: {
      de: ["Die Produktion Ihres Auftrags hat begonnen", "Die Produktion hat begonnen"],
      en: ["Production Started", "Production has started"]
    }
  } as const;
  const selected = status === "DELIVERED" ? copy.DELIVERED : status === "IN_TRANSIT" ? copy.IN_TRANSIT : copy.PRODUCTION_STARTED;
  const [subject, title] = selected[locale];
  const text = [title, variables.customerName ?? "", variables.orderNumber ?? "", formatDate(variables.currentEstimatedDeliveryDate, locale), variables.secureTrackingUrl ?? ""]
    .filter(Boolean)
    .join("\n");

  return render(
    title,
    subject,
    locale,
    <>
      {paragraph(locale === "de" ? `Hallo ${variables.customerName ?? ""},` : `Hello ${variables.customerName ?? ""},`)}
      {paragraph(title)}
      {paragraph(`${locale === "de" ? "Auftrag" : "Order"}: ${variables.orderNumber ?? "-"}`)}
      {status !== "DELIVERED"
        ? paragraph(`${locale === "de" ? "Voraussichtliche Lieferung" : "Estimated delivery"}: ${formatDate(variables.currentEstimatedDeliveryDate, locale)}`)
        : null}
      {link(variables.secureTrackingUrl, locale === "de" ? "Status ansehen" : "View status")}
    </>,
    text,
    subject
  );
}

function renderSalesperson(locale: AppLocale, variables: EmailTemplateVariables) {
  const subject = `New tracked order - ${variables.orderNumber ?? ""}`;
  const text = [
    "New tracked order",
    variables.customerName ?? "",
    variables.customerEmail ?? "",
    variables.orderNumber ?? "",
    variables.trackingNumber ?? "",
    variables.productDescription ?? "",
    variables.orderAdminUrl ?? ""
  ].filter(Boolean).join("\n");

  return render(
    "New tracked order",
    subject,
    locale,
    <>
      {paragraph(`Customer: ${variables.customerName ?? "-"}`)}
      {paragraph(`Email: ${variables.customerEmail ?? "-"}`)}
      {paragraph(`Order: ${variables.orderNumber ?? "-"}`)}
      {paragraph(`Tracking: ${variables.trackingNumber ?? "-"}`)}
      {paragraph(`Product: ${variables.productDescription ?? "-"}`)}
      {link(variables.orderAdminUrl, "Open admin order")}
    </>,
    text,
    subject
  );
}

function renderDeliveryDate(locale: AppLocale, variables: EmailTemplateVariables) {
  const subject = locale === "de" ? "Aktualisierte Lieferzeit - Sun Container" : "Updated delivery date - Sun Container";
  const title = locale === "de" ? "Lieferdatum aktualisiert" : "Delivery date updated";
  const text = [title, variables.orderNumber ?? "", formatDate(variables.previousDate, locale), formatDate(variables.newDate, locale), variables.secureTrackingUrl ?? ""]
    .filter(Boolean)
    .join("\n");

  return render(
    title,
    subject,
    locale,
    <>
      {paragraph(`${locale === "de" ? "Auftrag" : "Order"}: ${variables.orderNumber ?? "-"}`)}
      {paragraph(`${locale === "de" ? "Bisher" : "Previous"}: ${formatDate(variables.previousDate, locale)}`)}
      {paragraph(`${locale === "de" ? "Neu" : "New"}: ${formatDate(variables.newDate, locale)}`)}
      {link(variables.secureTrackingUrl, locale === "de" ? "Status ansehen" : "View status")}
    </>,
    text,
    subject
  );
}

export async function renderEmailTemplate(input: {
  emailType: EmailType;
  locale: AppLocale;
  templateVariables: EmailTemplateVariables;
}) {
  switch (input.emailType) {
    case "ORDER_RECEIVED":
      return renderOrderReceived(input.locale, input.templateVariables);
    case "PRODUCTION_STARTED":
    case "IN_TRANSIT":
    case "DELIVERED":
      return renderStatus(input.locale, input.templateVariables, input.emailType);
    case "SALESPERSON_NEW_ORDER":
      return renderSalesperson(input.locale, input.templateVariables);
    case "DELIVERY_DATE_UPDATED":
      return renderDeliveryDate(input.locale, input.templateVariables);
    default:
      throw new Error(`Template not implemented for ${input.emailType}.`);
  }
}
