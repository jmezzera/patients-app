import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

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
      <html lang={locale}>
        <body className="antialiased">
          <NextIntlClientProvider messages={messages}>
            <AppShell>{children}</AppShell>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
