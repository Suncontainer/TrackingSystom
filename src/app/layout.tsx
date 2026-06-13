import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { siteConfig } from "@/config/site";

import "./globals.css";

const inter = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "../../node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2",
      weight: "600",
      style: "normal"
    },
    {
      path: "../../node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2",
      weight: "700",
      style: "normal"
    }
  ],
  variable: "--font-inter",
  display: "swap"
});

const montserrat = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/montserrat/files/montserrat-latin-600-normal.woff2",
      weight: "600",
      style: "normal"
    },
    {
      path: "../../node_modules/@fontsource/montserrat/files/montserrat-latin-700-normal.woff2",
      weight: "700",
      style: "normal"
    },
    {
      path: "../../node_modules/@fontsource/montserrat/files/montserrat-latin-800-normal.woff2",
      weight: "800",
      style: "normal"
    }
  ],
  variable: "--font-montserrat",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.appUrl),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: "Private Sun Container customer order tracking portal.",
  robots: {
    index: false,
    follow: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffcc00"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${inter.variable} ${montserrat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
