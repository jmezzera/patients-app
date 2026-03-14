import Link from "next/link";
import type { Route } from "next";
import type { z } from "zod";
import { Badge } from "@/components/ui/badge";
import type { appointmentListResultSchema } from "@/lib/agents/tools/display-tools";

type Props = {
  data: z.infer<typeof appointmentListResultSchema>;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }: { status: string }) {
  if (status === "BOOKED") return <Badge variant="secondary">Booked</Badge>;
  if (status === "COMPLETED") return <Badge variant="outline">Completed</Badge>;
  return (
    <Badge variant="outline" className="border-red-300 bg-red-100 text-red-700">
      Cancelled
    </Badge>
  );
}

export function AppointmentListCard({ data }: Props) {
  return (
    <div className="w-full max-w-2xl rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">Appointments</span>
          {data.patientName && (
            <>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{data.patientName}</span>
            </>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{data.total} total</span>
      </div>

      {/* List */}
      <div className="divide-y">
        {data.appointments.map((appt) => (
          <Link
            key={appt.id}
            href={appt.links.detail as Route}
            className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
          >
            {/* Date block */}
            <div className="shrink-0 text-center w-12">
              <div className="text-xs font-semibold text-primary leading-none">
                {formatDate(appt.scheduledAt).split(" ")[0]}
              </div>
              <div className="text-lg font-bold leading-tight">
                {new Date(appt.scheduledAt).getDate()}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {formatTime(appt.scheduledAt)}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium truncate">
                  {appt.patients.join(", ")}
                </span>
                <StatusBadge status={appt.status} />
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{appt.doctor}</div>
            </div>
          </Link>
        ))}
      </div>

      {data.appointments.length === 0 && (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          No appointments found
        </div>
      )}
    </div>
  );
}
