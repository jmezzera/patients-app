"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppointmentStatus } from "@prisma/client";
import {
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  startOfDay, endOfDay,
  isWithinInterval,
} from "date-fns";
import type { View } from "react-big-calendar";
import { AppointmentsCalendar, type ViewAppointment } from "./appointments-calendar";
import { CreateAppointmentForm } from "@/components/forms/create-appointment-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ScheduleSlot = { dayOfWeek: number; startTime: string; endTime: string };
type Patient = { id: string; firstName: string; lastName: string; color?: string | null; scheduleSlots?: ScheduleSlot[] };
type Doctor = { id: string; displayName: string };

const VIEWS: { key: View; label: string }[] = [
  { key: "month", label: "Month" },
  { key: "week", label: "Week" },
  { key: "day", label: "Day" },
];

function getViewRange(view: View, date: Date) {
  if (view === "month") return { start: startOfMonth(date), end: endOfMonth(date) };
  if (view === "week") return { start: startOfWeek(date), end: endOfWeek(date) };
  return { start: startOfDay(date), end: endOfDay(date) };
}

function statusBadge(status: AppointmentStatus) {
  if (status === AppointmentStatus.COMPLETED) return <Badge>Completed</Badge>;
  if (status === AppointmentStatus.CANCELLED)
    return <Badge className="border-red-300 bg-red-100 text-red-700">Cancelled</Badge>;
  return <Badge variant="outline">Booked</Badge>;
}

type Props = {
  appointments: ViewAppointment[];
  patients: Patient[];
  doctors: Doctor[];
  defaultDoctorId?: string;
  defaultPatientIds?: string[];
};

export function PatientAppointmentsPanel({
  appointments,
  patients,
  doctors,
  defaultDoctorId,
  defaultPatientIds,
}: Props) {
  const [view, setView] = useState<View>("month");
  const [calendarDate, setCalendarDate] = useState(new Date());

  function navigate(direction: "prev" | "next" | "today") {
    if (direction === "today") { setCalendarDate(new Date()); return; }
    const d = new Date(calendarDate);
    if (view === "month") d.setMonth(d.getMonth() + (direction === "next" ? 1 : -1));
    else if (view === "week") d.setDate(d.getDate() + (direction === "next" ? 7 : -7));
    else d.setDate(d.getDate() + (direction === "next" ? 1 : -1));
    setCalendarDate(d);
  }

  const periodAppointments = useMemo(() => {
    const range = getViewRange(view, calendarDate);
    return appointments.filter((a) =>
      isWithinInterval(new Date(a.scheduledAt), range),
    );
  }, [appointments, view, calendarDate]);

  const periodLabel = calendarDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Appointments</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {/* Month navigation */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => navigate("prev")}>‹</Button>
              <Button variant="outline" size="sm" className="h-8" onClick={() => navigate("today")}>Today</Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => navigate("next")}>›</Button>
              <span className="min-w-[130px] text-center text-sm text-muted-foreground">{periodLabel}</span>
            </div>
            {/* View toggle */}
            <div className="flex rounded-md border">
              {VIEWS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`px-3 py-1 text-sm transition-colors first:rounded-l-md last:rounded-r-md ${
                    view === key ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {/* Schedule */}
            <CreateAppointmentForm
              patients={patients}
              doctors={doctors}
              defaultDoctorId={defaultDoctorId}
              defaultPatientIds={defaultPatientIds}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <AppointmentsCalendar
          appointments={appointments}
          view={view}
          onViewChange={setView}
          date={calendarDate}
          onDateChange={setCalendarDate}
        />

        {periodAppointments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No appointments this period.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {periodAppointments
              .slice()
              .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
              .map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-md border p-2">
                  <div>
                    <Link href={`/appointments/${a.id}`} className="font-medium underline">
                      {new Date(a.scheduledAt).toLocaleString()}
                    </Link>
                    <p className="text-xs text-muted-foreground">{a.doctorName}</p>
                  </div>
                  {statusBadge(a.status)}
                </li>
              ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
