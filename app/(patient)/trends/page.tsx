import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSessionActor } from "@/lib/authz";
import { listMeasurements } from "@/lib/repos/measurements";
import { db } from "@/lib/db";
import { MeasurementTable } from "@/components/metrics/measurement-table";
import { TrendChart } from "@/components/metrics/trend-chart";
import { RadarChart } from "@/components/metrics/radar-chart";
import { pivotMeasurements, type AppointmentMarker, type RawMeasurement } from "@/lib/chart-utils";

export default async function TrendsPage() {
  const actor = await getSessionActor();
  const t = await getTranslations("patient.trends");

  if (!actor.patientId) {
    notFound();
  }

  const [rows, participantRows] = await Promise.all([
    listMeasurements(actor, actor.patientId),
    db.appointmentParticipant.findMany({
      where: { patientId: actor.patientId, appointment: { orgId: actor.orgId } },
      include: { appointment: { select: { id: true, scheduledAt: true } } },
      orderBy: { appointment: { scheduledAt: "desc" } },
      take: 50,
    }),
  ]);

  const { data, series } = pivotMeasurements(rows);

  const rawRows: RawMeasurement[] = rows.map((r) => ({
    measuredAt: r.measuredAt.toISOString(),
    value: parseFloat(r.value.toString()),
    source: r.source as "doctor_visit" | "patient_self",
    metricType: {
      name: r.metricType.name,
      unit: r.metricType.unit,
      doctorOnly: r.metricType.doctorOnly,
    },
  }));

  const appointmentMarkers: AppointmentMarker[] = participantRows.map((p) => ({
    id: p.appointment.id,
    date: new Date(p.appointment.scheduledAt).toLocaleDateString(),
  }));

  return (
    <main className="mx-auto grid max-w-5xl gap-4 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <MeasurementTable rows={rows} showAppointmentLinks />
      <RadarChart rawRows={rawRows} title={t("metricSnapshot")} />
      <TrendChart data={data} series={series} title={t("historicTrends")} appointments={appointmentMarkers} isPatient />
    </main>
  );
}
