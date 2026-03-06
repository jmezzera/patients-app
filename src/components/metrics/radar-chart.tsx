"use client";

import { useState, useMemo } from "react";
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Re-export so existing imports keep working
export type { RadarPoint, RawMeasurement } from "@/lib/chart-utils";
export { buildRadarData, buildRadarDataAsOf } from "@/lib/chart-utils";

import type { RawMeasurement } from "@/lib/chart-utils";
import { buildRadarDataAsOf } from "@/lib/chart-utils";

type Props = {
  rawRows: RawMeasurement[];
  title?: string;
};

/** Returns sorted ms-epoch timestamps, one per calendar day (using the latest ts that day) */
function uniqueDayTimestamps(rows: RawMeasurement[]): number[] {
  const dayMap = new Map<string, number>();
  for (const r of rows) {
    const d = new Date(r.measuredAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const ts = d.getTime();
    const existing = dayMap.get(key);
    if (!existing || ts > existing) dayMap.set(key, ts);
  }
  return [...dayMap.values()].sort((a, b) => a - b);
}

export function RadarChart({ rawRows, title = "Metric snapshot" }: Props) {
  const dayTimestamps = useMemo(() => uniqueDayTimestamps(rawRows), [rawRows]);

  const [sliderIndex, setSliderIndex] = useState(() => Math.max(0, dayTimestamps.length - 1));

  const asOfTs = useMemo(() => {
    if (dayTimestamps.length === 0) return undefined;
    const d = new Date(dayTimestamps[Math.min(sliderIndex, dayTimestamps.length - 1)]);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }, [dayTimestamps, sliderIndex]);

  const radarData = useMemo(() => buildRadarDataAsOf(rawRows, asOfTs), [rawRows, asOfTs]);

  if (dayTimestamps.length === 0) return null;

  const clampedIndex = Math.min(sliderIndex, dayTimestamps.length - 1);
  const isLatest = clampedIndex >= dayTimestamps.length - 1;
  const selectedLabel = new Date(dayTimestamps[clampedIndex]).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const firstLabel = new Date(dayTimestamps[0]).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const lastLabel = new Date(dayTimestamps[dayTimestamps.length - 1]).toLocaleDateString(
    undefined,
    { month: "short", day: "numeric", year: "numeric" },
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle>{title}</CardTitle>
          <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
            {isLatest ? "Latest" : selectedLabel}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {dayTimestamps.length > 1 && (
          <div className="mb-4 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{firstLabel}</span>
              <span>{lastLabel}</span>
            </div>
            <input
              type="range"
              min={0}
              max={dayTimestamps.length - 1}
              value={sliderIndex}
              onChange={(e) => setSliderIndex(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>
        )}

        {radarData.length < 3 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Not enough metrics for this date (need ≥ 3).
          </p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsRadarChart
                data={radarData}
                margin={{ top: 8, right: 24, bottom: 8, left: 24 }}
              >
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, _, props) => [
                    `${value}${props.payload.unit ? ` ${props.payload.unit}` : ""}`,
                    props.payload.metric,
                  ]}
                />
                <Radar
                  dataKey="value"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RechartsRadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
