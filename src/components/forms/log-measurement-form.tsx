"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("patient.measurements.form");
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

  const selectedType = metricTypes.find((mt) => mt.id === metricTypeId);

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
      setError(data.error ?? t("failedSave"));
    } else {
      setSuccess(t("saved"));
    }

    setSaving(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3"
          action={async (formData) => {
            await onSubmit(formData);
          }}
        >
          <label className="grid gap-1 text-sm">
            {t("date")}
            <DatePicker
              value={measuredDate}
              onChange={setMeasuredDate}
              placeholder={t("datePlaceholder")}
            />
            <input type="hidden" name="measuredAt" value={measuredAtValue} />
          </label>

          <label className="grid gap-1 text-sm">
            {t("metricType")}
            <select
              name="metricTypeId"
              value={metricTypeId}
              onChange={(e) => setMetricTypeId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {metricTypes.map((mt) => (
                <option key={mt.id} value={mt.id}>
                  {mt.name}{mt.unit ? ` (${mt.unit})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            {t("value")}{selectedType?.unit ? ` (${selectedType.unit})` : ""}
            <Input name="value" type="number" step="0.01" required />
          </label>

          <label className="grid gap-1 text-sm">
            {t("notes")}
            <Textarea name="notes" />
          </label>

          <Button disabled={saving || !measuredAtValue || !metricTypeId}>
            {saving ? t("saving") : t("save")}
          </Button>
          {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
