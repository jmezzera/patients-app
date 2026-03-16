import { Skeleton, CardSkeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/layout/page-shell";

export default function DashboardLoading() {
  return (
    <PageShell>
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton className="col-span-2 md:col-span-1" />
      </div>

      {/* Recent appointments table skeleton */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="p-5 sm:p-6 space-y-1.5">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="px-5 sm:px-6 pb-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
