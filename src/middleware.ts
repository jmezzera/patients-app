import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { locales, defaultLocale } from "@/i18n/config";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/uploadthing(.*)",
  "/offline",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // If the locale cookie is absent, seed it from the Clerk JWT (publicMetadata.locale).
  // This makes the preference available immediately after login on a new device without
  // requiring a Clerk API call — the JWT already carries publicMetadata.
  if (!req.cookies.get("JAMI_LOCALE")) {
    const { userId, sessionClaims } = await auth();
    if (userId) {
      const clerkLocale = (sessionClaims?.metadata as Record<string, string> | null)?.locale;
      const locale =
        clerkLocale && (locales as ReadonlyArray<string>).includes(clerkLocale)
          ? clerkLocale
          : defaultLocale;

      const res = NextResponse.next();
      res.cookies.set("JAMI_LOCALE", locale, {
        path: "/",
        maxAge: 365 * 24 * 60 * 60,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      return res;
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
