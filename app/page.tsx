import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureFlagBanner } from "@/components/feature-flag-banner";

const signInRoute = "/sign-in" as Route;
const signUpRoute = "/sign-up" as Route;

export default async function HomePage() {
  const { userId } = await auth();
  const t = await getTranslations("home");

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <FeatureFlagBanner />
      <Card className="rounded-2xl mt-4">
        <CardHeader>
        <p className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          {t("tagline")}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          {t("description")}
        </p>
        </CardHeader>

        <CardContent>
          <div className="mt-2 flex flex-wrap gap-3">
            {userId ? (
              <>
                <Button asChild>
                  <Link href="/dashboard">{t("openDashboard")}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/patients/me">{t("viewPortal")}</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild>
                  <Link href={signInRoute}>{t("signIn")}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={signUpRoute}>{t("signUp")}</Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t("features.clinician.title")}</CardTitle>
            <CardDescription>
              {t("features.clinician.description")}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t("features.patient.title")}</CardTitle>
            <CardDescription>
              {t("features.patient.description")}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t("features.secure.title")}</CardTitle>
            <CardDescription>
              {t("features.secure.description")}
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </main>
  );
}
