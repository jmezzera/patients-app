"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Props = {
  patientId: string;
  existingAppointments?: Array<{
    id: string;
    scheduledAt: Date | string;
    completedAt?: Date | string | null;
  }>;
};

export function ScheduleAppointmentForm({ patientId, existingAppointments = [] }: Props) {
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date());
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const scheduledAt = useMemo(() => {
    if (!scheduledDate || !scheduledTime) {
      return "";
    }

    const [hours, minutes] = scheduledTime.split(":");
    const date = new Date(scheduledDate);
    date.setHours(Number(hours), Number(minutes), 0, 0);
    return date.toISOString();
  }, [scheduledDate, scheduledTime]);

  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage(null);

        const response = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId, scheduledAt }),
        });

        setSaving(false);
        setMessage(response.ok ? "Appointment scheduled" : "Could not schedule appointment");
      }}
    >
      <label className="grid gap-1 text-sm">
        Appointment date
        <DatePicker
          value={scheduledDate}
          onChange={setScheduledDate}
          placeholder="Pick appointment date"
        />
      </label>
      <label className="grid gap-1 text-sm">
        Appointment time
        <Input
          type="time"
          required
          value={scheduledTime}
          onChange={(event) => setScheduledTime(event.target.value)}
        />
      </label>
      <Button disabled={saving || !scheduledAt}>{saving ? "Scheduling..." : "Schedule"}</Button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      <div className="pt-2">
        <p className="text-xs font-medium text-muted-foreground">Upcoming for this patient</p>
        {existingAppointments.length === 0 ? (
          <p className="mt-1 text-xs text-muted-foreground">No appointments scheduled yet.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {existingAppointments.slice(0, 6).map((appointment) => (
              <li key={appointment.id} className="flex items-center justify-between rounded border px-2 py-1">
                <span className="text-xs">
                  {new Date(appointment.scheduledAt).toLocaleString()}
                </span>
                <Badge variant={appointment.completedAt ? "default" : "outline"}>
                  {appointment.completedAt ? "Completed" : "Scheduled"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </form>
  );
}
