import { Role } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { getSessionActor } from "@/lib/authz";
import { listAppointments } from "@/lib/repos/appointments";
import { listPatients } from "@/lib/repos/patients";
import { db } from "@/lib/db";
import { AppointmentsView } from "@/components/appointments/appointments-view";
import type { ViewAppointment } from "@/components/appointments/appointments-calendar";

export default async function AppointmentsPage() {
  const actor = await getSessionActor();
  const t = await getTranslations("appointments");

  const [appointments, patients, doctors] = await Promise.all([
    listAppointments(actor),
    listPatients(actor),
    db.user.findMany({
      where: { orgId: actor.orgId, role: Role.DOCTOR },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
    }),
  ]);

  // Build patient lookup for nutritionPlanName enrichment
  const patientMap = new Map(patients.map((p) => [p.id, p]));

  const viewAppointments: ViewAppointment[] = appointments.map((a) => ({
    id: a.id,
    scheduledAt: a.scheduledAt,
    completedAt: a.completedAt,
    status: a.status,
    doctorName: a.doctor.displayName,
    participants: a.participants.map(({ patient }) => {
      const enriched = patientMap.get(patient.id);
      return {
        patientId: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        color: patient.color ?? null,
        dob: patient.dob ?? null,
        nutritionPlanId: patient.nutritionPlanId ?? null,
        nutritionPlanName: enriched?.nutritionPlan?.name ?? null,
      };
    }),
  }));

  // Unique nutrition plans across all patients
  const nutritionPlanMap = new Map<string, { id: string; name: string }>();
  for (const p of patients) {
    if (p.nutritionPlan) {
      nutritionPlanMap.set(p.nutritionPlan.id, p.nutritionPlan);
    }
  }
  const nutritionPlans = [...nutritionPlanMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const defaultDoctorId = actor.role === Role.DOCTOR ? actor.id : undefined;

  return (
    <main className="container space-y-4 px-4 py-6 md:px-6 md:py-8">
      <AppointmentsView
        appointments={viewAppointments}
        nutritionPlans={nutritionPlans}
        patients={patients}
        doctors={doctors}
        defaultDoctorId={defaultDoctorId}

      />
    </main>
  );
}
