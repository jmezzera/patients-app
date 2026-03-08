"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Activity, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadarChart } from "@/components/metrics/radar-chart";
import { TrendChart } from "@/components/metrics/trend-chart";
import { MeasurementTableClient, type MeasurementRowData } from "@/components/metrics/measurement-table-client";
import type { RawMeasurement, AppointmentMarker, TrendSeries } from "@/lib/chart-utils";

type Props = {
  rawRows: RawMeasurement[];
  trendData: Array<Record<string, string | number | null>>;
  trendSeries: TrendSeries[];
  appointmentMarkers: AppointmentMarker[];
  measurementRows: MeasurementRowData[];
};

export function MetricsSection({
  rawRows,
  trendData,
  trendSeries,
  appointmentMarkers,
  measurementRows,
}: Props) {
  const t = useTranslations("patients.detail");

  // Latest value per metric, sorted by date descending
  const latestPerMetric = useMemo(() => {
    const map = new Map<string, RawMeasurement>();
    const sorted = [...rawRows].sort(
      (a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime(),
    );
    for (const row of sorted) {
      if (!map.has(row.metricType.name)) {
        map.set(row.metricType.name, row);
      }
    }
    return Array.from(map.values());
  }, [rawRows]);

  const uniqueMetrics = latestPerMetric.length;
  const totalMeasurements = rawRows.length;

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{totalMeasurements}</span>
          <span className="text-muted-foreground">{t("measurementsCount")}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{uniqueMetrics}</span>
          <span className="text-muted-foreground">{t("metricsTracked")}</span>
        </div>
      </div>

      {/* Latest values — one chip per metric */}
      {latestPerMetric.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("latestValues")}
          </p>
          <div className="flex flex-wrap gap-2">
            {latestPerMetric.map((row) => (
              <div
                key={row.metricType.name}
                className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-sm"
              >
                <div>
                  <p className="text-xs text-muted-foreground">{row.metricType.name}</p>
                  <p className="text-lg font-bold leading-tight">
                    {row.value}
                    {row.metricType.unit && (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        {row.metricType.unit}
                      </span>
                    )}
                  </p>
                </div>
                <Badge
                  variant={row.source === "patient_self" ? "secondary" : "outline"}
                  className="self-start text-[10px]"
                >
                  {row.source === "patient_self" ? "Self" : "Dr"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts grid */}
      {rawRows.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <RadarChart rawRows={rawRows} title={t("metricSnapshot")} />
          </div>
          <div className="lg:col-span-3">
            <TrendChart
              data={trendData}
              series={trendSeries}
              title={t("historicTrends")}
              appointments={appointmentMarkers}
            />
          </div>
        </div>
      )}

      <Separator />

      {/* Filterable + paginated measurements table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("allMeasurements")}</CardTitle>
        </CardHeader>
        <CardContent>
          <MeasurementTableClient rows={measurementRows} showAppointmentLinks />
        </CardContent>
      </Card>
    </div>
  );
}
