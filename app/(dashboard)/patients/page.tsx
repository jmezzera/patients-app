import Link from "next/link";
import { Role } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { getSessionActor } from "@/lib/authz";
import { listPatients } from "@/lib/repos/patients";
import { listNutritionPlans } from "@/lib/repos/nutrition-plans";
import { db } from "@/lib/db";
import { CreatePatientForm } from "@/components/forms/create-patient-form";
import { PageShell } from "@/components/layout/page-shell";

export default async function PatientsPage() {
  const actor = await getSessionActor();
  const t = await getTranslations("patients");

  const [patients, nutritionPlans, doctors] = await Promise.all([
    listPatients(actor),
    listNutritionPlans(actor),
    db.user.findMany({
      where: { orgId: actor.orgId, role: Role.DOCTOR },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
    }),
  ]);

  return (
    <PageShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("subtitle", { count: patients.length })}
          </p>
        </div>
        <CreatePatientForm doctors={doctors} nutritionPlans={nutritionPlans} />
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {patients.map((patient, i) => (
          <li
            key={patient.id}
            className={`group rounded-xl border bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-fade-in-up`}
            style={{
              borderLeftColor: patient.color ?? "#e2e8f0",
              borderLeftWidth: 4,
              animationDelay: `${Math.min(i * 40, 300)}ms`,
            }}
          >
            <Link
              className="flex items-center gap-2.5 text-base font-medium transition-colors group-hover:text-primary"
              href={`/patients/${patient.id}`}
            >
              <span
                className="inline-block h-3 w-3 flex-shrink-0 rounded-full ring-2 ring-white shadow-sm"
                style={{ backgroundColor: patient.color ?? "#cbd5e1" }}
              />
              {patient.firstName} {patient.lastName}
            </Link>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {patient.assignedDoctor?.displayName ?? t("noDoctorAssigned")}
              {patient.nutritionPlan ? ` · ${patient.nutritionPlan.name}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
