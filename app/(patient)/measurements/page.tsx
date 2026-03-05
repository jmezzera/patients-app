import { getSessionActor } from "@/lib/authz";
import { listMetricTypes } from "@/lib/repos/metric-types";
import { LogMeasurementForm } from "@/components/forms/log-measurement-form";

export default async function MeasurementsPage() {
  const actor = await getSessionActor();
  const metricTypes = await listMetricTypes(actor);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <LogMeasurementForm metricTypes={metricTypes} />
    </main>
  );
}
