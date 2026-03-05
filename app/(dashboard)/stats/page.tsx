import { Role } from "@prisma/client";
import { getSessionActor } from "@/lib/authz";
import {
  getAppointmentStats,
  getPatientStats,
  getAppointmentTimeSeries,
  listDoctors,
} from "@/lib/repos/stats";
import { StatsView } from "@/components/stats/stats-view";

export default async function StatsPage() {
  const actor = await getSessionActor();

  // Default: last 90 days
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 90);

  const [appointmentStats, patientStats, timeSeries, doctors] = await Promise.all([
    getAppointmentStats(actor, { from, to }),
    getPatientStats(actor, {}),
    getAppointmentTimeSeries(actor, { from, to }),
    actor.role === Role.MANAGER ? listDoctors(actor) : Promise.resolve([]),
  ]);

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Stats</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Appointment volume and patient trends over the selected period.
        </p>
      </div>
      <StatsView
        initial={{ appointmentStats, patientStats, timeSeries, doctors }}
        isManager={actor.role === Role.MANAGER}
      />
    </main>
  );
}
