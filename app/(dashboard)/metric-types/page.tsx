import { getSessionActor } from "@/lib/authz";
import { listMetricTypes } from "@/lib/repos/metric-types";
import { MetricTypesManager } from "@/components/admin/metric-types-manager";

export default async function MetricTypesPage() {
  const actor = await getSessionActor();
  const metricTypes = await listMetricTypes(actor);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Metric types</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define the measurement types used for patient tracking.
        </p>
      </div>
      <MetricTypesManager metricTypes={metricTypes} />
    </main>
  );
}
