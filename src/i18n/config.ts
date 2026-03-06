/** Pure locale config — no server-only imports, safe for client and server components */
export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
