"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditPatientRecordForm } from "@/components/forms/edit-patient-record-form";

type NutritionPlan = { id: string; name: string };
type Doctor = { id: string; displayName: string };
type ScheduleSlot = { id: string; dayOfWeek: number; startTime: string; endTime: string };

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Props = {
  patientId: string;
  fullName: string;
  phone?: string | null;
  assignedDoctor?: string | null;
  nutritionPlan?: string | null;
  clinicalSummary?: string | null;
  color?: string | null;
  scheduleSlots?: ScheduleSlot[];
  canEdit?: boolean;
  nutritionPlans: NutritionPlan[];
  doctors: Doctor[];
  defaults: {
    phone?: string | null;
    nutritionPlanId?: string | null;
    clinicalSummary?: string | null;
    assignedDoctorId?: string | null;
    color?: string | null;
  };
};

export function PatientInfoCard({
  patientId,
  fullName,
  phone,
  assignedDoctor,
  nutritionPlan,
  clinicalSummary,
  color,
  scheduleSlots = [],
  canEdit = false,
  nutritionPlans,
  doctors,
  defaults,
}: Props) {
  const [editing, setEditing] = useState(false);
  const t = useTranslations("patient.profile");
  const td = useTranslations("patients.detail");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          {color && (
            <span
              className="inline-block h-4 w-4 rounded-full ring-2 ring-white shadow-sm"
              style={{ backgroundColor: color }}
            />
          )}
          <CardTitle>{t("title")}</CardTitle>
        </div>
        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setEditing((v) => !v)}
            title={editing ? td("cancelEdit") : td("editInfo")}
          >
            {editing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {editing ? (
          <EditPatientRecordForm
            patientId={patientId}
            nutritionPlans={nutritionPlans}
            doctors={doctors}
            defaults={defaults}
            onSuccess={() => setEditing(false)}
          />
        ) : (
          <dl className="grid gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-muted-foreground">{t("name")}</dt>
              <dd className="mt-0.5 font-semibold">{fullName}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">{t("phone")}</dt>
              <dd className="mt-0.5">{phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">{t("assignedDoctor")}</dt>
              <dd className="mt-0.5">{assignedDoctor ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">{t("nutritionPlan")}</dt>
              <dd className="mt-0.5">{nutritionPlan ?? "—"}</dd>
            </div>
            {clinicalSummary && (
              <div className="sm:col-span-2">
                <dt className="font-medium text-muted-foreground">{t("clinicalSummary")}</dt>
                <dd className="mt-0.5 whitespace-pre-line">{clinicalSummary}</dd>
              </div>
            )}
          </dl>
        )}

        {!editing && scheduleSlots.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {td("schedulePreference")}
            </p>
            <ul className="space-y-1 text-sm">
              {scheduleSlots.map((s) => (
                <li key={s.id} className="flex items-center gap-3">
                  <span className="w-10 font-medium">{DAY_NAMES[s.dayOfWeek]}</span>
                  <span className="text-muted-foreground">
                    {s.startTime} – {s.endTime}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
