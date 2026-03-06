"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { locales, type Locale } from "@/i18n/config";

export async function setLocaleAction(locale: Locale) {
  if (!locales.includes(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set("JAMI_LOCALE", locale, {
    path: "/",
    maxAge: 365 * 24 * 60 * 60, // 1 year
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  // Persist to Clerk so the preference survives on new devices/browsers
  const { userId } = await auth();
  if (userId) {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { locale },
    });
  }

  revalidatePath("/", "layout");
}
