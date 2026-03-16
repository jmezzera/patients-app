"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Loader2, CalendarPlus } from "lucide-react";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type ScheduleSlot = { dayOfWeek: number; startTime: string; endTime: string };
type Patient = { id: string; firstName: string; lastName: string; color?: string | null; scheduleSlots?: ScheduleSlot[] };
type Doctor = { id: string; displayName: string };

type Props = {
  patients: Patient[];
  doctors: Doctor[];
  defaultDoctorId?: string;
  defaultPatientIds?: string[];
};

function ScheduleHints({ patients, selectedIds }: { patients: Patient[]; selectedIds: string[] }) {
  const selected = patients.filter((p) => selectedIds.includes(p.id) && (p.scheduleSlots?.length ?? 0) > 0);
  if (selected.length === 0) return null;

  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-2.5 text-xs space-y-1.5 animate-slide-down">
      <p className="font-semibold text-muted-foreground">Patient schedule preferences</p>
      {selected.map((p) => (
        <div key={p.id}>
          <span className="font-medium">{p.firstName} {p.lastName}:</span>{" "}
          <span className="text-muted-foreground">
            {p.scheduleSlots!.map((s) => `${DAY_NAMES[s.dayOfWeek]} ${s.startTime}–${s.endTime}`).join(", ")}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CreateAppointmentForm({ patients, doctors, defaultDoctorId, defaultPatientIds }: Props) {
  const router = useRouter();
  const t = useTranslations("appointments.form");
  const tc = useTranslations("common");

  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>(defaultPatientIds ?? []);
  const [doctorId, setDoctorId] = useState(defaultDoctorId ?? doctors[0]?.id ?? "");
  const [scheduledAt, setScheduledAt] = useState("");

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function handleClose() {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
      setError(null);
      setSelectedPatientIds(defaultPatientIds ?? []);
      setScheduledAt("");
      setDoctorId(defaultDoctorId ?? doctors[0]?.id ?? "");
    }, 150);
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

    handleClose();
    router.refresh();
  }

  const canSubmit = !!scheduledAt && selectedPatientIds.length > 0 && !!doctorId;

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <CalendarPlus className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t("button")}</span>
        <span className="sm:hidden"><Plus className="h-3.5 w-3.5" /></span>
      </Button>

      {open && (
        <div
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 ${
            closing ? "opacity-0" : "animate-fade-backdrop"
          }`}
          style={{ transition: "opacity 0.15s ease" }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

          {/* Dialog */}
          <div
            className={`relative w-full sm:max-w-md rounded-t-2xl sm:rounded-xl border bg-background shadow-xl ${
              closing ? "opacity-0 translate-y-2" : "animate-scale-in"
            }`}
            style={{ transition: "opacity 0.15s ease, transform 0.15s ease" }}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-base font-semibold">{t("title")}</h2>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 px-5 py-4 max-h-[70vh] overflow-y-auto">
              {/* Doctor */}
              {doctors.length > 1 && (
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium">{t("doctor")}</label>
                  <select
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border bg-background px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
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
                <div className="max-h-48 overflow-y-auto rounded-lg border divide-y">
                  {patients.map((p) => {
                    const checked = selectedPatientIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-muted/50 ${
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

              {/* Schedule hints */}
              <ScheduleHints patients={patients} selectedIds={selectedPatientIds} />

              {/* Date & time */}
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">{t("dateAndTime")}</label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="rounded-lg"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 animate-slide-down">{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t px-5 py-3">
              <Button variant="outline" onClick={handleClose}>
                {tc("cancel")}
              </Button>
              <Button onClick={submit} disabled={saving || !canSubmit} className="gap-1.5">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {saving ? t("creating") : t("createAppointment")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
