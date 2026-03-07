"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Patient = { id: string; firstName: string; lastName: string; color?: string | null };
type Doctor = { id: string; displayName: string };

type Props = {
  patients: Patient[];
  doctors: Doctor[];
  defaultDoctorId?: string;
};

export function CreateAppointmentForm({ patients, doctors, defaultDoctorId }: Props) {
  const router = useRouter();
  const t = useTranslations("appointments.form");
  const tc = useTranslations("common");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [doctorId, setDoctorId] = useState(defaultDoctorId ?? doctors[0]?.id ?? "");
  const [scheduledAt, setScheduledAt] = useState("");

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    setError(null);
    setSelectedPatientIds([]);
    setScheduledAt("");
    setDoctorId(defaultDoctorId ?? doctors[0]?.id ?? "");
  }

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
      body: JSON.stringify({ patientIds: selectedPatientIds, doctorId, scheduledAt: new Date(scheduledAt).toISOString() }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t("failedCreate"));
      return;
    }

    close();
    router.refresh();
  }

  const canSubmit = !!scheduledAt && selectedPatientIds.length > 0 && !!doctorId;

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        {t("button")}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div
            className="w-full max-w-md rounded-xl border bg-background shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-base font-semibold">{t("title")}</h2>
              <button
                onClick={close}
                className="rounded-sm text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 px-5 py-4">
              {/* Doctor */}
              {doctors.length > 1 && (
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium">{t("doctor")}</label>
                  <select
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    className="flex h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Patients */}
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">
                  {t("patients")}
                  {selectedPatientIds.length > 0 && (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      {selectedPatientIds.length} selected
                    </span>
                  )}
                </label>
                <div className="max-h-48 overflow-y-auto rounded-md border divide-y">
                  {patients.map((p) => {
                    const checked = selectedPatientIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-muted/50 ${
                          checked ? "bg-muted/30" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-input accent-primary"
                          checked={checked}
                          onChange={() => togglePatient(p.id)}
                        />
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: p.color ?? "#cbd5e1" }}
                        />
                        {p.firstName} {p.lastName}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Date & time */}
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">{t("dateAndTime")}</label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t px-5 py-3">
              <Button variant="outline" onClick={close}>
                {tc("cancel")}
              </Button>
              <Button onClick={submit} disabled={saving || !canSubmit}>
                {saving ? t("creating") : t("createAppointment")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
