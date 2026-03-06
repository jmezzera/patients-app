"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type MetricType = { id: string; name: string; unit: string | null; doctorOnly: boolean };

type Props = { metricTypes: MetricType[] };

export function MetricTypesManager({ metricTypes: initial }: Props) {
  const t = useTranslations("metricTypes");
  const [types, setTypes] = useState(initial);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [doctorOnly, setDoctorOnly] = useState(false);
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/metric-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, unit: unit || undefined, doctorOnly }),
    });
    if (res.ok) {
      const { metricType } = await res.json();
      setTypes((prev) => [...prev, metricType].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setUnit("");
      setDoctorOnly(false);
    }
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <div className="flex gap-2">
            <Input
              placeholder={t("namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder={t("unitPlaceholder")}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-32"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={doctorOnly}
              onChange={(e) => setDoctorOnly(e.target.checked)}
            />
            {t("doctorOnly")}
          </label>
          <Button onClick={create} disabled={saving || !name.trim()}>
            {t("addMetricType")}
          </Button>
        </div>

        {types.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noMetricTypes")}</p>
        ) : (
          <ul className="space-y-2">
            {types.map((mt) => (
              <li key={mt.id} className="flex items-center justify-between rounded-md border p-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{mt.name}</span>
                  {mt.unit && <span className="text-xs text-muted-foreground">({mt.unit})</span>}
                  {mt.doctorOnly && (
                    <Badge variant="outline" className="text-xs">
                      {t("doctorOnlyBadge")}
                    </Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
