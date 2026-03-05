import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProfileCardProps = {
  fullName: string;
  nutritionPlan?: string | null;
  assignedDoctor?: string | null;
  clinicalSummary?: string | null;
  phone?: string | null;
};

export function ProfileCard({
  fullName,
  nutritionPlan,
  assignedDoctor,
  clinicalSummary,
  phone,
}: ProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient profile</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="font-medium">Name</dt>
            <dd>{fullName}</dd>
          </div>
          <div>
            <dt className="font-medium">Phone</dt>
            <dd>{phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium">Assigned doctor</dt>
            <dd>{assignedDoctor ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium">Nutrition plan</dt>
            <dd>{nutritionPlan ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium">Clinical summary</dt>
            <dd>{clinicalSummary ?? "—"}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
