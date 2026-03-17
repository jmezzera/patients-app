import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { AppShell } from "@/components/layout/app-shell";
import { RegisterSW } from "@/components/pwa/register-sw";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Jami Clinic SoR",
  description: "System of record for nutrition care",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Jami Clinic",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <ClerkProvider>
      <html lang={locale} className={jakarta.variable}>
        <head>
          <meta name="theme-color" content="#16a34a" />
          <link rel="apple-touch-icon" href="/icon-192.png" />
        </head>
        <body className="antialiased">
          <NextIntlClientProvider messages={messages}>
            <AppShell>{children}</AppShell>
            <RegisterSW />
            <SpeedInsights />
            <Analytics />
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
