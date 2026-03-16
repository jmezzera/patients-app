import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md animate-shimmer", className)}
      {...props}
    />
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-white p-6 shadow-sm", className)}>
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4 rounded", i === 0 ? "w-32" : "w-20")}
        />
      ))}
    </div>
  );
}

export function PatientCardSkeleton() {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm border-l-4 border-l-muted">
      <div className="flex items-center gap-2">
        <Skeleton className="h-2.5 w-2.5 rounded-full" />
        <Skeleton className="h-5 w-36" />
      </div>
      <Skeleton className="mt-2 h-3.5 w-48" />
    </div>
  );
}
