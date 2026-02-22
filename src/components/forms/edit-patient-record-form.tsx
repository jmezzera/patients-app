"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  patientId: string;
  defaults: {
    phone?: string | null;
    nutritionGoal?: string | null;
    clinicalSummary?: string | null;
  };
};

export function EditPatientRecordForm({ patientId, defaults }: Props) {
  const [phone, setPhone] = useState(defaults.phone ?? "");
  const [nutritionGoal, setNutritionGoal] = useState(defaults.nutritionGoal ?? "");
  const [clinicalSummary, setClinicalSummary] = useState(defaults.clinicalSummary ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage(null);

        const response = await fetch(`/api/patients/${patientId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: phone || undefined,
            nutritionGoal: nutritionGoal || undefined,
            clinicalSummary: clinicalSummary || undefined,
          }),
        });

        setSaving(false);
        setMessage(response.ok ? "Patient record updated" : "Unable to update patient record");
      }}
    >
      <label className="grid gap-1 text-sm">
        Phone
        <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
      </label>
      <label className="grid gap-1 text-sm">
        Nutrition goal
        <Input value={nutritionGoal} onChange={(event) => setNutritionGoal(event.target.value)} />
      </label>
      <label className="grid gap-1 text-sm">
        Clinical summary
        <Textarea value={clinicalSummary} onChange={(event) => setClinicalSummary(event.target.value)} />
      </label>
      <Button disabled={saving} variant="outline">
        {saving ? "Saving..." : "Update record"}
      </Button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </form>
  );
}
