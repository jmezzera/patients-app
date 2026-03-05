import Link from "next/link";
import type { Route } from "next";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";

const signInRoute = "/sign-in" as Route;
const signUpRoute = "/sign-up" as Route;

export async function AppShell({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

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
                      Dashboard
                    </Link>
                    <Link href="/patients" className="hover:text-foreground">
                      Patients
                    </Link>
                    <Link href="/appointments" className="hover:text-foreground">
                      Appointments
                    </Link>
                    <a href="/stats" className="hover:text-foreground">
                      Stats
                    </a>
                    {role === Role.DOCTOR && (
                      <>
                        <a href="/availability" className="hover:text-foreground">
                          Availability
                        </a>
                        <a href="/metric-types" className="hover:text-foreground">
                          Metrics
                        </a>
                      </>
                    )}
                    {role === Role.MANAGER && (
                      <>
                        <a href="/nutrition-plans" className="hover:text-foreground">
                          Nutrition plans
                        </a>
                        <a href="/metric-types" className="hover:text-foreground">
                          Metrics
                        </a>
                      </>
                    )}
                  </>
                ) : null}
                {role === Role.PATIENT ? (
                  <>
                    <Link href="/me" className="hover:text-foreground">
                      My profile
                    </Link>
                    <Link href="/measurements" className="hover:text-foreground">
                      Measurements
                    </Link>
                    <Link href="/trends" className="hover:text-foreground">
                      Trends
                    </Link>
                  </>
                ) : null}
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <Link href={signInRoute} className="hover:text-foreground">
                  Sign in
                </Link>
                <Link
                  href={signUpRoute}
                  className="rounded-md border px-3 py-1.5 text-foreground hover:bg-muted"
                >
                  Create account
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
