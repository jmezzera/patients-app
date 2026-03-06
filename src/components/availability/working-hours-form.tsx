"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type WorkingHour = { dayOfWeek: number; startTime: string; endTime: string };
type Props = { doctorId: string; initialHours: WorkingHour[] };

function blankSchedule(): WorkingHour[] {
  return [1, 2, 3, 4, 5].map((d) => ({ dayOfWeek: d, startTime: "09:00", endTime: "18:00" }));
}

export function WorkingHoursForm({ doctorId, initialHours }: Props) {
  const t = useTranslations("availability");
  const [hours, setHours] = useState<WorkingHour[]>(
    initialHours.length > 0 ? initialHours : blankSchedule(),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(day: number) {
    setHours((prev) => {
      const exists = prev.find((h) => h.dayOfWeek === day);
      if (exists) return prev.filter((h) => h.dayOfWeek !== day);
      return [...prev, { dayOfWeek: day, startTime: "09:00", endTime: "18:00" }].sort(
        (a, b) => a.dayOfWeek - b.dayOfWeek,
      );
    });
  }

  function update(day: number, field: "startTime" | "endTime", value: string) {
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === day ? { ...h, [field]: value } : h)),
    );
  }

  async function save() {
    setSaving(true);
    await fetch("/api/availability/working-hours", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorId, hours }),
    });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("workingHours.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {([0, 1, 2, 3, 4, 5, 6] as const).map((idx) => {
          const entry = hours.find((h) => h.dayOfWeek === idx);
          return (
            <div key={idx} className="flex items-center gap-3">
              <label className="flex w-32 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!entry}
                  onChange={() => toggle(idx)}
                />
                {t(`days.${idx}`)}
              </label>
              {entry ? (
                <>
                  <Input
                    type="time"
                    value={entry.startTime}
                    onChange={(e) => update(idx, "startTime", e.target.value)}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">{t("workingHours.to")}</span>
                  <Input
                    type="time"
                    value={entry.endTime}
                    onChange={(e) => update(idx, "endTime", e.target.value)}
                    className="w-32"
                  />
                </>
              ) : (
                <span className="text-sm text-muted-foreground">{t("workingHours.off")}</span>
              )}
            </div>
          );
        })}
        <Button onClick={save} disabled={saving}>
          {saved ? t("workingHours.saved") : saving ? t("workingHours.saving") : t("workingHours.saveSchedule")}
        </Button>
      </CardContent>
    </Card>
  );
}
