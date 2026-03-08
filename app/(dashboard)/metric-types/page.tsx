import { getTranslations } from "next-intl/server";
import { getSessionActor } from "@/lib/authz";
import { listMetricTypes } from "@/lib/repos/metric-types";
import { MetricTypesManager } from "@/components/admin/metric-types-manager";
import { PageShell } from "@/components/layout/page-shell";

export default async function MetricTypesPage() {
  const actor = await getSessionActor();
  const t = await getTranslations("metricTypes");
  const metricTypes = await listMetricTypes(actor);

  return (
    <PageShell className="max-w-3xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <MetricTypesManager metricTypes={metricTypes} />
    </PageShell>
  );
}
