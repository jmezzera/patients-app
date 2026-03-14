import Link from "next/link";
import type { Route } from "next";
import type { z } from "zod";
import type { patientListResultSchema } from "@/lib/agents/tools/display-tools";

type Props = {
  data: z.infer<typeof patientListResultSchema>;
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function PatientListCard({ data }: Props) {
  return (
    <div className="w-full max-w-2xl rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <span className="text-sm font-medium">Patients</span>
        <span className="text-xs text-muted-foreground">{data.total} total</span>
      </div>

      {/* Patient grid */}
      <div className="divide-y">
        {data.patients.map((patient) => (
          <Link
            key={patient.id}
            href={patient.links.detail as Route}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
          >
            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
              {initials(patient.name)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{patient.name}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {patient.assignedDoctor && (
                  <span className="text-xs text-muted-foreground truncate">
                    {patient.assignedDoctor}
                  </span>
                )}
                {patient.assignedDoctor && patient.nutritionPlan && (
                  <span className="text-xs text-muted-foreground">·</span>
                )}
                {patient.nutritionPlan && (
                  <span className="text-xs text-muted-foreground truncate">
                    {patient.nutritionPlan}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {data.patients.length === 0 && (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">No patients found</div>
      )}
    </div>
  );
}
