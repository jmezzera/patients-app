"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  appointmentId: string;
};

export function AddAppointmentMetricForm({ appointmentId }: Props) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="grid gap-2 md:grid-cols-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        await fetch(`/api/appointments/${appointmentId}/metrics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metrics: [{ key, value, unit: unit || undefined }] }),
        });
        setKey("");
        setValue("");
        setUnit("");
        setSaving(false);
      }}
    >
      <Input
        placeholder="Metric key"
        value={key}
        onChange={(event) => setKey(event.target.value)}
      />
      <Input
        placeholder="Value"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <Input
        placeholder="Unit"
        value={unit}
        onChange={(event) => setUnit(event.target.value)}
      />
      <Button disabled={saving || !key || !value} variant="outline">
        {saving ? "Saving..." : "Add metric"}
      </Button>
    </form>
  );
}
