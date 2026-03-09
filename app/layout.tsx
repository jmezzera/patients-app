import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { AppShell } from "@/components/layout/app-shell";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Jami Clinic SoR",
  description: "System of record for nutrition care",
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
        <body className="antialiased">
          <NextIntlClientProvider messages={messages}>
            <AppShell>{children}</AppShell>
            <SpeedInsights />
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
