import Link from "next/link";
import type { Route } from "next";
import { auth } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Sidebar, type NavItem } from "@/components/layout/sidebar";

const signInRoute = "/sign-in" as Route;
const signUpRoute = "/sign-up" as Route;

export async function AppShell({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const t = await getTranslations("nav");

  if (!userId) {
    return (
      <div className="min-h-screen bg-background">
        <header className="flex items-center justify-between border-b bg-white px-4 py-4 md:px-6">
          <span className="text-lg font-bold text-primary">Jamil Cesin</span>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href={signInRoute}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("signIn")}
            </Link>
            <Link
              href={signUpRoute}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              {t("createAccount")}
            </Link>
            <LocaleSwitcher />
          </div>
        </header>
        {children}
      </div>
    );
  }

  const localUser = await db.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });
  const role = localUser?.role ?? null;

  const navItems: NavItem[] = role !== Role.PATIENT
    ? [
        { href: "/dashboard", icon: "LayoutDashboard", label: t("dashboard") },
        { href: "/patients", icon: "Users", label: t("patients") },
        { href: "/appointments", icon: "CalendarDays", label: t("appointments") },
        { href: "/stats", icon: "BarChart3", label: t("stats"), isExternal: true },
        ...(role === Role.DOCTOR
          ? [
              { href: "/availability", icon: "Clock", label: t("availability"), isExternal: true },
              { href: "/metric-types", icon: "Activity", label: t("metrics"), isExternal: true },
            ]
          : []),
        ...(role === Role.MANAGER
          ? [
              { href: "/nutrition-plans", icon: "Leaf", label: t("nutritionPlans"), isExternal: true },
              { href: "/metric-types", icon: "Activity", label: t("metrics"), isExternal: true },
            ]
          : []),
      ]
    : [
        { href: "/me", icon: "User", label: t("myProfile") },
        { href: "/measurements", icon: "Ruler", label: t("measurements") },
        { href: "/trends", icon: "TrendingUp", label: t("trends") },
      ];

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      <Sidebar navItems={navItems} />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
