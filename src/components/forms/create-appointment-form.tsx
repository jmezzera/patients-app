"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Patient = { id: string; firstName: string; lastName: string };
type Doctor = { id: string; displayName: string };

type Props = {
  patients: Patient[];
  doctors: Doctor[];
  defaultDoctorId?: string;
};

export function CreateAppointmentForm({ patients, doctors, defaultDoctorId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>(
    patients[0] ? [patients[0].id] : [],
  );
  const [doctorId, setDoctorId] = useState(defaultDoctorId ?? doctors[0]?.id ?? "");
  const [scheduledAt, setScheduledAt] = useState("");

  function togglePatient(id: string) {
    setSelectedPatientIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  async function submit() {
    if (!scheduledAt || selectedPatientIds.length === 0 || !doctorId) return;
    setSaving(true);
    setError(null);

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientIds: selectedPatientIds,
        doctorId,
        scheduledAt,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create appointment");
      return;
    }

    setOpen(false);
    setSelectedPatientIds(patients[0] ? [patients[0].id] : []);
    setScheduledAt("");
    router.refresh();
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>New appointment</Button>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New appointment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="grid gap-1 text-sm">
          Doctor
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.displayName}</option>
            ))}
          </select>
        </label>

        <fieldset className="grid gap-1 text-sm">
          <legend className="mb-1">Patients (select one or more)</legend>
          <div className="max-h-48 overflow-y-auto space-y-1 rounded-md border p-2">
            {patients.map((p) => (
              <label key={p.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedPatientIds.includes(p.id)}
                  onChange={() => togglePatient(p.id)}
                />
                {p.firstName} {p.lastName}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="grid gap-1 text-sm">
          Date and time
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button
            onClick={submit}
            disabled={saving || !scheduledAt || selectedPatientIds.length === 0 || !doctorId}
          >
            {saving ? "Creating..." : "Create appointment"}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
