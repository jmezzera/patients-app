"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type MetricType = {
  id: string;
  name: string;
  unit: string | null;
};

type Props = {
  metricTypes: MetricType[];
};

export function LogMeasurementForm({ metricTypes }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [measuredDate, setMeasuredDate] = useState<Date | undefined>(new Date());
  const [metricTypeId, setMetricTypeId] = useState(metricTypes[0]?.id ?? "");

  const measuredAtValue = useMemo(() => {
    if (!measuredDate) return "";
    const year = measuredDate.getFullYear();
    const month = String(measuredDate.getMonth() + 1).padStart(2, "0");
    const day = String(measuredDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, [measuredDate]);

  const selectedType = metricTypes.find((t) => t.id === metricTypeId);

  async function onSubmit(formData: FormData) {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      measuredAt: String(formData.get("measuredAt")),
      metricTypeId: String(formData.get("metricTypeId")),
      value: Number(formData.get("value")),
      notes: String(formData.get("notes") || ""),
    };

    const response = await fetch("/api/measurements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Unable to save measurement");
    } else {
      setSuccess("Measurement saved");
    }

    setSaving(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Track measurements</CardTitle>
        <CardDescription>Log your measurements and keep your care team updated.</CardDescription>
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
            Metric type
            <select
              name="metricTypeId"
              value={metricTypeId}
              onChange={(e) => setMetricTypeId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {metricTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.unit ? ` (${t.unit})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            Value{selectedType?.unit ? ` (${selectedType.unit})` : ""}
            <Input name="value" type="number" step="0.01" required />
          </label>

          <label className="grid gap-1 text-sm">
            Notes
            <Textarea name="notes" />
          </label>

          <Button disabled={saving || !measuredAtValue || !metricTypeId}>
            {saving ? "Saving measurement..." : "Save measurement"}
          </Button>
          {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
