import Link from "next/link";
import type { Route } from "next";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  BarChart3,
  Clock,
  Activity,
  Leaf,
  User,
  Ruler,
  TrendingUp,
} from "lucide-react";
import { db } from "@/lib/db";
import { LocaleSwitcher } from "@/components/locale-switcher";

const signInRoute = "/sign-in" as Route;
const signUpRoute = "/sign-up" as Route;

export async function AppShell({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const t = await getTranslations("nav");

  if (!userId) {
    return (
      <div className="min-h-screen bg-background">
        <header className="flex items-center justify-between border-b bg-white px-6 py-4">
          <span className="text-lg font-bold text-primary">Jamil Cesin</span>
          <div className="flex items-center gap-4 text-sm">
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

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-60 flex-shrink-0 flex-col bg-primary">
        <div className="flex h-16 items-center border-b border-white/10 px-5">
          <Link href="/dashboard" className="text-base font-bold tracking-tight text-white">
            Jamil Cesin
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {role !== Role.PATIENT ? (
            <>
              <SidebarLink href="/dashboard" icon={LayoutDashboard} label={t("dashboard")} />
              <SidebarLink href="/patients" icon={Users} label={t("patients")} />
              <SidebarLink href="/appointments" icon={CalendarDays} label={t("appointments")} />
              <SidebarLink href="/stats" icon={BarChart3} label={t("stats")} isExternal />
              {role === Role.DOCTOR && (
                <>
                  <SidebarLink href="/availability" icon={Clock} label={t("availability")} isExternal />
                  <SidebarLink href="/metric-types" icon={Activity} label={t("metrics")} isExternal />
                </>
              )}
              {role === Role.MANAGER && (
                <>
                  <SidebarLink href="/nutrition-plans" icon={Leaf} label={t("nutritionPlans")} isExternal />
                  <SidebarLink href="/metric-types" icon={Activity} label={t("metrics")} isExternal />
                </>
              )}
            </>
          ) : (
            <>
              <SidebarLink href="/me" icon={User} label={t("myProfile")} />
              <SidebarLink href="/measurements" icon={Ruler} label={t("measurements")} />
              <SidebarLink href="/trends" icon={TrendingUp} label={t("trends")} />
            </>
          )}
        </nav>

        <div className="flex items-center gap-3 border-t border-white/10 px-5 py-4">
          <UserButton />
          <LocaleSwitcher />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  isExternal,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  isExternal?: boolean;
}) {
  const cls =
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white";

  if (isExternal) {
    return (
      <a href={href} className={cls}>
        <Icon className="h-4 w-4 flex-shrink-0" />
        {label}
      </a>
    );
  }

  return (
    <Link href={href as Route} className={cls}>
      <Icon className="h-4 w-4 flex-shrink-0" />
      {label}
    </Link>
  );
}
