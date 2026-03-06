import Link from "next/link";
import type { Route } from "next";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { LocaleSwitcher } from "@/components/locale-switcher";

const signInRoute = "/sign-in" as Route;
const signUpRoute = "/sign-up" as Route;

export async function AppShell({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const t = await getTranslations("nav");

  let role: Role | null = null;
  if (userId) {
    const localUser = await db.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });
    role = localUser?.role ?? null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-white/75 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Jami Care
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            {userId ? (
              <>
                {role !== Role.PATIENT ? (
                  <>
                    <Link href="/dashboard" className="hover:text-foreground">
                      {t("dashboard")}
                    </Link>
                    <Link href="/patients" className="hover:text-foreground">
                      {t("patients")}
                    </Link>
                    <Link href="/appointments" className="hover:text-foreground">
                      {t("appointments")}
                    </Link>
                    <a href="/stats" className="hover:text-foreground">
                      {t("stats")}
                    </a>
                    {role === Role.DOCTOR && (
                      <>
                        <a href="/availability" className="hover:text-foreground">
                          {t("availability")}
                        </a>
                        <a href="/metric-types" className="hover:text-foreground">
                          {t("metrics")}
                        </a>
                      </>
                    )}
                    {role === Role.MANAGER && (
                      <>
                        <a href="/nutrition-plans" className="hover:text-foreground">
                          {t("nutritionPlans")}
                        </a>
                        <a href="/metric-types" className="hover:text-foreground">
                          {t("metrics")}
                        </a>
                      </>
                    )}
                  </>
                ) : null}
                {role === Role.PATIENT ? (
                  <>
                    <Link href="/me" className="hover:text-foreground">
                      {t("myProfile")}
                    </Link>
                    <Link href="/measurements" className="hover:text-foreground">
                      {t("measurements")}
                    </Link>
                    <Link href="/trends" className="hover:text-foreground">
                      {t("trends")}
                    </Link>
                  </>
                ) : null}
                <LocaleSwitcher />
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <Link href={signInRoute} className="hover:text-foreground">
                  {t("signIn")}
                </Link>
                <Link
                  href={signUpRoute}
                  className="rounded-md border px-3 py-1.5 text-foreground hover:bg-muted"
                >
                  {t("createAccount")}
                </Link>
                <LocaleSwitcher />
              </>
            )}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
