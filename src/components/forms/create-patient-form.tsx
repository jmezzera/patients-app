"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Doctor = { id: string; displayName: string };
type NutritionPlan = { id: string; name: string };

type Props = {
  doctors: Doctor[];
  nutritionPlans: NutritionPlan[];
  onCreated?: () => void;
};

export function CreatePatientForm({ doctors, nutritionPlans, onCreated }: Props) {
  const router = useRouter();
  const t = useTranslations("patients.form");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [assignedDoctorId, setAssignedDoctorId] = useState(doctors[0]?.id ?? "");
  const [nutritionPlanId, setNutritionPlanId] = useState("");
  const [clinicalSummary, setClinicalSummary] = useState("");

  async function submit() {
    if (!firstName.trim() || !lastName.trim()) return;
    setSaving(true);
    setError(null);

    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        phone: phone || undefined,
        dob: dob || undefined,
        assignedDoctorId: assignedDoctorId || undefined,
        nutritionPlanId: nutritionPlanId || undefined,
        clinicalSummary: clinicalSummary || undefined,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t("failedCreate"));
      return;
    }

    setOpen(false);
    setFirstName("");
    setLastName("");
    setPhone("");
    setDob("");
    setClinicalSummary("");
    onCreated?.();
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>{t("button")}</Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            {t("firstName")}
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            {t("lastName")}
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            {t("phone")}
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            {t("dob")}
            <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </label>
        </div>
        <label className="grid gap-1 text-sm">
          {t("assignedDoctor")}
          <select
            value={assignedDoctorId}
            onChange={(e) => setAssignedDoctorId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="">{tc("noneOption")}</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.displayName}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          {t("nutritionPlan")}
          <select
            value={nutritionPlanId}
            onChange={(e) => setNutritionPlanId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="">{tc("noneOption")}</option>
            {nutritionPlans.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          {t("clinicalSummary")}
          <Textarea value={clinicalSummary} onChange={(e) => setClinicalSummary(e.target.value)} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={submit} disabled={saving || !firstName.trim() || !lastName.trim()}>
            {saving ? t("creating") : t("createPatient")}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {tc("cancel")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
