import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-5xl p-4 md:p-6 space-y-6 animate-fade-in-up", className)}>
      {children}
    </div>
  );
}
