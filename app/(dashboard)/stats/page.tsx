import { Role } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { getSessionActor } from "@/lib/authz";
import {
  getAppointmentStats,
  getPatientStats,
  getAppointmentTimeSeries,
  listDoctors,
} from "@/lib/repos/stats";
import { StatsView } from "@/components/stats/stats-view";
import { PageShell } from "@/components/layout/page-shell";

export default async function StatsPage() {
  const actor = await getSessionActor();
  const t = await getTranslations("stats");

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
    <PageShell>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <StatsView
        initial={{ appointmentStats, patientStats, timeSeries, doctors }}
        isManager={actor.role === Role.MANAGER}
      />
    </PageShell>
  );
}
