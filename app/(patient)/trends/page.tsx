import { notFound } from "next/navigation";
import { getSessionActor } from "@/lib/authz";
import { listMeasurements } from "@/lib/repos/measurements";
import { db } from "@/lib/db";
import { MeasurementTable } from "@/components/metrics/measurement-table";
import { TrendChart } from "@/components/metrics/trend-chart";
import { RadarChart } from "@/components/metrics/radar-chart";
import { pivotMeasurements, buildRadarData, type AppointmentMarker } from "@/lib/chart-utils";

export default async function TrendsPage() {
  const actor = await getSessionActor();

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
  const radarData = buildRadarData(rows);

  const appointmentMarkers: AppointmentMarker[] = participantRows.map((p) => ({
    id: p.appointment.id,
    date: new Date(p.appointment.scheduledAt).toLocaleDateString(),
  }));

  return (
    <main className="mx-auto grid max-w-5xl gap-4 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">My trends</h1>
        <p className="mt-1 text-sm text-muted-foreground">Historical measurements over time.</p>
      </div>
      <MeasurementTable rows={rows} showAppointmentLinks />
      <RadarChart data={radarData} title="Current metric snapshot" />
      <TrendChart data={data} series={series} appointments={appointmentMarkers} />
    </main>
  );
}
