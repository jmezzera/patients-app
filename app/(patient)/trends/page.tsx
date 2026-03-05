import { notFound } from "next/navigation";
import { getSessionActor } from "@/lib/authz";
import { listMeasurements } from "@/lib/repos/measurements";
import { MeasurementTable } from "@/components/metrics/measurement-table";
import { TrendChart } from "@/components/metrics/trend-chart";
import { RadarChart } from "@/components/metrics/radar-chart";
import { pivotMeasurements, buildRadarData } from "@/lib/chart-utils";

export default async function TrendsPage() {
  const actor = await getSessionActor();

  if (!actor.patientId) {
    notFound();
  }

  const rows = await listMeasurements(actor, actor.patientId);
  const { data, series } = pivotMeasurements(rows);
  const radarData = buildRadarData(rows);

  return (
    <main className="mx-auto grid max-w-5xl gap-4 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">My trends</h1>
        <p className="mt-1 text-sm text-muted-foreground">Historical measurements over time.</p>
      </div>
      <MeasurementTable rows={rows} showAppointmentLinks />
      <RadarChart data={radarData} title="Current metric snapshot" />
      <TrendChart data={data} series={series} />
    </main>
  );
}
