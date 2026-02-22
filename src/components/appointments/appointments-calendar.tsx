"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { isSameDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CalendarAppointment = {
  id: string;
  scheduledAt: Date | string;
  completedAt?: Date | string | null;
  label: string;
};

type Props = {
  title: string;
  appointments: CalendarAppointment[];
};

export function AppointmentsCalendar({ title, appointments }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const normalizedAppointments = useMemo(
    () =>
      appointments.map((appointment) => ({
        ...appointment,
        scheduledAt: new Date(appointment.scheduledAt),
        completedAt: appointment.completedAt ? new Date(appointment.completedAt) : null,
      })),
    [appointments],
  );

  const selectedItems = useMemo(() => {
    if (!selectedDate) {
      return [];
    }
    return normalizedAppointments.filter((appointment) =>
      isSameDay(appointment.scheduledAt, selectedDate),
    );
  }, [normalizedAppointments, selectedDate]);

  const appointmentDays = useMemo(
    () => normalizedAppointments.map((appointment) => appointment.scheduledAt),
    [normalizedAppointments],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-[auto_1fr]">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          modifiers={{ hasAppointment: appointmentDays }}
          modifiersClassNames={{ hasAppointment: "bg-blue-50 text-blue-700 font-semibold" }}
        />
        <div>
          <p className="text-sm font-medium">
            {selectedDate ? selectedDate.toLocaleDateString() : "Select a date"}
          </p>
          {selectedItems.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No appointments on this date.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {selectedItems.map((appointment) => (
                <li key={appointment.id} className="rounded-md border p-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{appointment.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {appointment.scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <Badge variant={appointment.completedAt ? "default" : "outline"}>
                      {appointment.completedAt ? "Completed" : "Scheduled"}
                    </Badge>
                  </div>
                  <Link className="mt-2 inline-block text-xs underline" href={`/appointments/${appointment.id}`}>
                    Open appointment
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
