"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function MeasurementsPage() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [measuredDate, setMeasuredDate] = useState<Date | undefined>(new Date());

  const measuredAtValue = useMemo(() => {
    if (!measuredDate) {
      return "";
    }

    const year = measuredDate.getFullYear();
    const month = String(measuredDate.getMonth() + 1).padStart(2, "0");
    const day = String(measuredDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, [measuredDate]);

  async function onSubmit(formData: FormData) {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      measuredAt: String(formData.get("measuredAt")),
      weightKg: formData.get("weightKg") ? Number(formData.get("weightKg")) : undefined,
      bodyFatPct: formData.get("bodyFatPct") ? Number(formData.get("bodyFatPct")) : undefined,
      waistCm: formData.get("waistCm") ? Number(formData.get("waistCm")) : undefined,
      notes: String(formData.get("notes") || ""),
    };

    const response = await fetch("/api/measurements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setError("Unable to save measurement");
    } else {
      setSuccess("Measurement saved");
    }

    setSaving(false);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Track measurements</CardTitle>
          <CardDescription>
            Log your measurements and keep your care team updated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3"
            action={async (formData) => {
              await onSubmit(formData);
            }}
          >
            <label className="grid gap-1 text-sm">
              Date
              <DatePicker
                value={measuredDate}
                onChange={setMeasuredDate}
                placeholder="Pick measurement date"
              />
              <input type="hidden" name="measuredAt" value={measuredAtValue} />
            </label>
            <label className="grid gap-1 text-sm">
              Weight (kg)
              <Input name="weightKg" type="number" step="0.01" />
            </label>
            <label className="grid gap-1 text-sm">
              Body fat (%)
              <Input name="bodyFatPct" type="number" step="0.01" />
            </label>
            <label className="grid gap-1 text-sm">
              Waist (cm)
              <Input name="waistCm" type="number" step="0.01" />
            </label>
            <label className="grid gap-1 text-sm">
              Notes
              <Textarea name="notes" />
            </label>
            <Button disabled={saving || !measuredAtValue}>
              {saving ? "Saving measurement..." : "Save measurement"}
            </Button>
            {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
