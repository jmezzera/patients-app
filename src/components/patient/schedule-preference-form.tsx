"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ScheduleSlot = { dayOfWeek: number; startTime: string; endTime: string };
type Props = { initialSlots: ScheduleSlot[] };

export function SchedulePreferenceForm({ initialSlots }: Props) {
  const t = useTranslations("patient.schedulePreference");
  const td = useTranslations("availability");
  const [slots, setSlots] = useState<ScheduleSlot[]>(initialSlots);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(day: number) {
    setSlots((prev) => {
      const exists = prev.find((s) => s.dayOfWeek === day);
      if (exists) return prev.filter((s) => s.dayOfWeek !== day);
      return [...prev, { dayOfWeek: day, startTime: "09:00", endTime: "18:00" }].sort(
        (a, b) => a.dayOfWeek - b.dayOfWeek,
      );
    });
  }

  function update(day: number, field: "startTime" | "endTime", value: string) {
    setSlots((prev) =>
      prev.map((s) => (s.dayOfWeek === day ? { ...s, [field]: value } : s)),
    );
  }

  async function save() {
    setSaving(true);
    await fetch("/api/me/schedule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slots),
    });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        {([0, 1, 2, 3, 4, 5, 6] as const).map((idx) => {
          const entry = slots.find((s) => s.dayOfWeek === idx);
          return (
            <div key={idx} className="flex items-center gap-3">
              <label className="flex w-32 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!entry}
                  onChange={() => toggle(idx)}
                />
                {td(`days.${idx}`)}
              </label>
              {entry ? (
                <>
                  <Input
                    type="time"
                    value={entry.startTime}
                    onChange={(e) => update(idx, "startTime", e.target.value)}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">{td("workingHours.to")}</span>
                  <Input
                    type="time"
                    value={entry.endTime}
                    onChange={(e) => update(idx, "endTime", e.target.value)}
                    className="w-32"
                  />
                </>
              ) : (
                <span className="text-sm text-muted-foreground">{td("workingHours.off")}</span>
              )}
            </div>
          );
        })}
        <Button onClick={save} disabled={saving}>
          {saved ? t("saved") : saving ? t("saving") : t("save")}
        </Button>
      </CardContent>
    </Card>
  );
}
