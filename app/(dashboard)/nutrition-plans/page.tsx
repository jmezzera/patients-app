import { getTranslations } from "next-intl/server";
import { getSessionActor } from "@/lib/authz";
import { listNutritionPlans } from "@/lib/repos/nutrition-plans";
import { NutritionPlansManager } from "@/components/admin/nutrition-plans-manager";
import { PageShell } from "@/components/layout/page-shell";

export default async function NutritionPlansPage() {
  const actor = await getSessionActor();
  const t = await getTranslations("nutritionPlans");
  const plans = await listNutritionPlans(actor);

  return (
    <PageShell className="max-w-3xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <NutritionPlansManager plans={plans} />
    </PageShell>
  );
}
