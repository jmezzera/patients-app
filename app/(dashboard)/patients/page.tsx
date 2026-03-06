import Link from "next/link";
import { Role } from "@prisma/client";
import { getSessionActor } from "@/lib/authz";
import { listPatients } from "@/lib/repos/patients";
import { listNutritionPlans } from "@/lib/repos/nutrition-plans";
import { db } from "@/lib/db";
import { CreatePatientForm } from "@/components/forms/create-patient-form";

export default async function PatientsPage() {
  const actor = await getSessionActor();

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
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Patients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {patients.length} active profiles in your clinic workspace.
          </p>
        </div>
        <CreatePatientForm doctors={doctors} nutritionPlans={nutritionPlans} />
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {patients.map((patient) => (
          <li
            key={patient.id}
            className="rounded-xl border bg-white p-4 shadow-sm"
            style={{ borderLeftColor: patient.color ?? "#e2e8f0", borderLeftWidth: 4 }}
          >
            <Link
              className="flex items-center gap-2 text-base font-medium hover:underline"
              href={`/patients/${patient.id}`}
            >
              <span
                className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: patient.color ?? "#cbd5e1" }}
              />
              {patient.firstName} {patient.lastName}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              {patient.assignedDoctor?.displayName ?? "No doctor assigned"}
              {patient.nutritionPlan ? ` · ${patient.nutritionPlan.name}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
