import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProfileCardProps = {
  fullName: string;
  nutritionGoal?: string | null;
  clinicalSummary?: string | null;
  phone?: string | null;
};

export function ProfileCard({
  fullName,
  nutritionGoal,
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
          <dt className="font-medium">Nutrition goal</dt>
          <dd>{nutritionGoal ?? "—"}</dd>
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
