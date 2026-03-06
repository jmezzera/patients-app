import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { hasLocale } from "next-intl";
import { locales, defaultLocale, type Locale } from "@/i18n/config";

// Re-export so callers that previously imported from here still work
export { locales, defaultLocale, type Locale } from "@/i18n/config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get("JAMI_LOCALE")?.value;

  let locale: Locale;

  if (fromCookie && hasLocale(locales, fromCookie)) {
    locale = fromCookie;
  } else {
    // Fall back to Clerk publicMetadata.locale (from JWT — no extra API call)
    const { sessionClaims } = await auth();
    const clerkLocale = (sessionClaims?.metadata as Record<string, string> | null)?.locale;
    locale =
      clerkLocale && hasLocale(locales, clerkLocale) ? clerkLocale : defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
