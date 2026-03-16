import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/layout/page-shell";

export default function AppointmentsLoading() {
  return (
    <PageShell className="max-w-none">
      {/* Toolbar skeleton */}
      <div className="rounded-xl border bg-white shadow-sm p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-14 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>
      </div>

      {/* Calendar skeleton */}
      <div className="rounded-xl border bg-white shadow-sm p-3 sm:p-4">
        <Skeleton className="h-[320px] sm:h-[420px] md:h-[480px] w-full rounded-lg" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
