"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type NutritionPlan = { id: string; name: string };
type Doctor = { id: string; displayName: string };

type Props = {
  patientId: string;
  nutritionPlans: NutritionPlan[];
  doctors: Doctor[];
  defaults: {
    phone?: string | null;
    nutritionPlanId?: string | null;
    clinicalSummary?: string | null;
    assignedDoctorId?: string | null;
  };
};

export function EditPatientRecordForm({ patientId, nutritionPlans, doctors, defaults }: Props) {
  const router = useRouter();
  const [phone, setPhone] = useState(defaults.phone ?? "");
  const [nutritionPlanId, setNutritionPlanId] = useState(defaults.nutritionPlanId ?? "");
  const [assignedDoctorId, setAssignedDoctorId] = useState(defaults.assignedDoctorId ?? "");
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
            nutritionPlanId: nutritionPlanId || null,
            assignedDoctorId: assignedDoctorId || null,
            clinicalSummary: clinicalSummary || undefined,
          }),
        });

        setSaving(false);
        if (response.ok) {
          setMessage("Patient record updated");
          router.refresh();
        } else {
          setMessage("Unable to update patient record");
        }
      }}
    >
      <label className="grid gap-1 text-sm">
        Phone
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <label className="grid gap-1 text-sm">
        Assigned doctor
        <select
          value={assignedDoctorId}
          onChange={(e) => setAssignedDoctorId(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="">— None —</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.displayName}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Nutrition plan
        <select
          value={nutritionPlanId}
          onChange={(e) => setNutritionPlanId(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="">— None —</option>
          {nutritionPlans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Clinical summary
        <Textarea
          value={clinicalSummary}
          onChange={(e) => setClinicalSummary(e.target.value)}
        />
      </label>
      <Button disabled={saving} variant="outline">
        {saving ? "Saving..." : "Update record"}
      </Button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </form>
  );
}
