import { redirect } from "next/navigation";
import { getSessionActor } from "@/lib/authz";
import { listMetricTypes } from "@/lib/repos/metric-types";
import { LogMeasurementForm } from "@/components/forms/log-measurement-form";

export default async function MeasurementsPage() {
  const actor = await getSessionActor();

  if (!actor.isActive) {
    redirect("/me");
  }
  const metricTypes = await listMetricTypes(actor);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <LogMeasurementForm metricTypes={metricTypes} />
    </main>
  );
}
