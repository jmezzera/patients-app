"use client";

import "react-big-calendar/lib/css/react-big-calendar.css";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addMinutes } from "date-fns";
import { AppointmentStatus } from "@prisma/client";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: {},
});

export type ViewParticipant = {
  patientId: string;
  firstName: string;
  lastName: string;
  color: string | null;
  dob: Date | null;
  nutritionPlanId: string | null;
  nutritionPlanName: string | null;
};

export type ViewAppointment = {
  id: string;
  scheduledAt: Date;
  completedAt: Date | null;
  status: AppointmentStatus;
  doctorName: string;
  participants: ViewParticipant[];
};

type RbcEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: ViewAppointment;
};

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  COMPLETED: "#16a34a",
  CANCELLED: "#ef4444",
  BOOKED: "#3b82f6",
};

function AppointmentEvent({ event }: { event: RbcEvent }) {
  const { resource } = event;
  const nutritionPlanName = resource.participants[0]?.nutritionPlanName ?? null;
  return (
    <div className="flex items-start gap-1 overflow-hidden text-xs leading-tight">
      <span className="flex shrink-0 flex-wrap gap-0.5 pt-0.5">
        {resource.participants.map((p) => (
          <span
            key={p.patientId}
            className="h-2 w-2 shrink-0 rounded-full ring-1 ring-white/50"
            style={{ backgroundColor: p.color ?? "#cbd5e1" }}
          />
        ))}
      </span>
      <div className="min-w-0">
        <div className="truncate font-medium">{event.title}</div>
        {nutritionPlanName && (
          <div className="truncate opacity-75">{nutritionPlanName}</div>
        )}
      </div>
    </div>
  );
}

type Props = {
  appointments: ViewAppointment[];
  view?: View;
  onViewChange?: (v: View) => void;
  date?: Date;
  onDateChange?: (d: Date) => void;
};

export function AppointmentsCalendar({
  appointments,
  view: viewProp,
  onViewChange,
  date: dateProp,
  onDateChange,
}: Props) {
  const router = useRouter();
  const [internalView, setInternalView] = useState<View>("month");
  const [internalDate, setInternalDate] = useState(new Date());

  const view = viewProp ?? internalView;
  const date = dateProp ?? internalDate;

  function handleViewChange(v: View) {
    setInternalView(v);
    onViewChange?.(v);
  }

  function handleDateChange(d: Date) {
    setInternalDate(d);
    onDateChange?.(d);
  }

  const events = useMemo<RbcEvent[]>(
    () =>
      appointments.map((a) => ({
        id: a.id,
        title:
          a.participants.length === 0
            ? "—"
            : a.participants.map((p) => `${p.firstName} ${p.lastName}`).join(", "),
        start: new Date(a.scheduledAt),
        end: addMinutes(new Date(a.scheduledAt), 60),
        resource: {
          ...a,
          scheduledAt: new Date(a.scheduledAt),
          completedAt: a.completedAt ? new Date(a.completedAt) : null,
        },
      })),
    [appointments],
  );

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm animate-fade-in">
      <div className="h-[320px] sm:h-[420px] md:h-[480px] [&_.rbc-toolbar]:hidden p-2 sm:p-3">
        <Calendar
          localizer={localizer}
          events={events}
          view={view}
          onView={handleViewChange}
          date={date}
          onNavigate={handleDateChange}
          components={{ event: AppointmentEvent as never }}
          onSelectEvent={(event) => router.push(`/appointments/${event.id}`)}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: STATUS_COLORS[event.resource.status],
              border: "none",
              borderRadius: "6px",
            },
          })}
        />
      </div>
    </div>
  );
}
