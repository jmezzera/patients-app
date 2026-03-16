import { Skeleton, PatientCardSkeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/layout/page-shell";

export default function PatientsLoading() {
  return (
    <PageShell>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      {/* Patient cards */}
      <ul className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} style={{ animationDelay: `${i * 50}ms` }} className="animate-fade-in-up">
            <PatientCardSkeleton />
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
