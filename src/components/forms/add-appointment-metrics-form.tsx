"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Patient = { id: string; firstName: string; lastName: string };
type MetricType = { id: string; name: string; unit: string | null };

type Props = {
  appointmentId: string;
  patients: Patient[];
  metricTypes: MetricType[];
};

type Row = { patientId: string; metricTypeId: string; value: string };

export function AddAppointmentMetricsForm({ appointmentId, patients, metricTypes }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([
    { patientId: patients[0]?.id ?? "", metricTypeId: metricTypes[0]?.id ?? "", value: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateRow(index: number, field: keyof Row, value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { patientId: patients[0]?.id ?? "", metricTypeId: metricTypes[0]?.id ?? "", value: "" },
    ]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit() {
    const valid = rows.filter((r) => r.patientId && r.metricTypeId && r.value.trim());
    if (valid.length === 0) return;

    setSaving(true);
    setError(null);

    const res = await fetch(`/api/appointments/${appointmentId}/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metrics: valid }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save metrics");
      return;
    }

    setRows([{ patientId: patients[0]?.id ?? "", metricTypeId: metricTypes[0]?.id ?? "", value: "" }]);
    router.refresh();
  }

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm";

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            value={row.patientId}
            onChange={(e) => updateRow(i, "patientId", e.target.value)}
            className={selectClass}
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
              </option>
            ))}
          </select>
          <select
            value={row.metricTypeId}
            onChange={(e) => updateRow(i, "metricTypeId", e.target.value)}
            className={selectClass}
          >
            {metricTypes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}{m.unit ? ` (${m.unit})` : ""}
              </option>
            ))}
          </select>
          <Input
            className="w-28"
            type="number"
            step="0.01"
            placeholder="Value"
            value={row.value}
            onChange={(e) => updateRow(i, "value", e.target.value)}
          />
          {rows.length > 1 && (
            <Button size="sm" variant="ghost" onClick={() => removeRow(i)}>
              ✕
            </Button>
          )}
        </div>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={addRow}>
          + Add row
        </Button>
        <Button size="sm" onClick={submit} disabled={saving}>
          {saving ? "Saving..." : "Save metrics"}
        </Button>
      </div>
    </div>
  );
}
