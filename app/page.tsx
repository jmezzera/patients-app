import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const signInRoute = "/sign-in" as Route;
const signUpRoute = "/sign-up" as Route;

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <Card className="rounded-2xl">
        <CardHeader>
        <p className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          Nutrition System of Record
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Jami Care Platform
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          Record appointment outcomes, upload nutrition plans, and track patient
          measurement trends in one secure workspace.
        </p>
        </CardHeader>

        <CardContent>
          <div className="mt-2 flex flex-wrap gap-3">
            {userId ? (
              <>
                <Button asChild>
                  <Link href="/dashboard">Open dashboard</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/patients/me">View patient portal</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild>
                  <Link href={signInRoute}>Sign in</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={signUpRoute}>Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Clinician workflow</CardTitle>
            <CardDescription>
            Capture appointment metrics, external plan files, and chart notes.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Patient tracking</CardTitle>
            <CardDescription>
            Patients self-report measurements and review progress trends.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Secure records</CardTitle>
            <CardDescription>
            Role-aware access plus audit events for every write operation.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </main>
  );
}


// async function PublicDashboard() {}
