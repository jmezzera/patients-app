import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProfileCardProps = {
  fullName: string;
  nutritionPlan?: string | null;
  assignedDoctor?: string | null;
  clinicalSummary?: string | null;
  phone?: string | null;
};

export async function ProfileCard({
  fullName,
  nutritionPlan,
  assignedDoctor,
  clinicalSummary,
  phone,
}: ProfileCardProps) {
  const t = await getTranslations("patient.profile");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="font-medium">{t("name")}</dt>
            <dd>{fullName}</dd>
          </div>
          <div>
            <dt className="font-medium">{t("phone")}</dt>
            <dd>{phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium">{t("assignedDoctor")}</dt>
            <dd>{assignedDoctor ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium">{t("nutritionPlan")}</dt>
            <dd>{nutritionPlan ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium">{t("clinicalSummary")}</dt>
            <dd>{clinicalSummary ?? "—"}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
