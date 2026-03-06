"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { setLocaleAction } from "@/lib/actions/locale";
import { locales, type Locale } from "@/i18n/config";

const LABELS: Record<Locale, string> = { en: "EN", es: "ES" };

export function LocaleSwitcher() {
  const currentLocale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();

  function handleSelect(locale: Locale) {
    if (locale === currentLocale) return;
    startTransition(() => {
      setLocaleAction(locale);
    });
  }

  return (
    <div
      className="flex items-center rounded-md border text-xs font-medium overflow-hidden"
      aria-label="Language"
    >
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          disabled={isPending}
          onClick={() => handleSelect(locale)}
          className={`px-2 py-1 transition-colors ${
            locale === currentLocale
              ? "bg-slate-900 text-white"
              : "text-muted-foreground hover:bg-slate-100"
          }`}
        >
          {LABELS[locale]}
        </button>
      ))}
    </div>
  );
}
