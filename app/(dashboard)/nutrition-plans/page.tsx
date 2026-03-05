import { getSessionActor } from "@/lib/authz";
import { listNutritionPlans } from "@/lib/repos/nutrition-plans";
import { NutritionPlansManager } from "@/components/admin/nutrition-plans-manager";

export default async function NutritionPlansPage() {
  const actor = await getSessionActor();
  const plans = await listNutritionPlans(actor);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Nutrition plans</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the nutrition plans available to assign to patients.
        </p>
      </div>
      <NutritionPlansManager plans={plans} />
    </main>
  );
}
