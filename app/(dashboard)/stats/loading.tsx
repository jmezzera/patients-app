import { Skeleton, CardSkeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/layout/page-shell";

export default function StatsLoading() {
  return (
    <PageShell>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Date range controls */}
      <div className="rounded-xl border bg-white shadow-sm p-5 sm:p-6">
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Chart skeleton */}
      <div className="rounded-xl border bg-white shadow-sm p-5 sm:p-6">
        <div className="space-y-2 mb-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </div>
    </PageShell>
  );
}
