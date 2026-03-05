/** Pure data-transformation helpers — no client directive, safe to call from server components */

export type TrendSeries = {
  key: string;
  name: string;
  unit?: string;
};

export type RadarPoint = {
  metric: string;
  value: number;
  unit?: string;
};

type MeasurementLike = {
  measuredAt: Date;
  value: { toString(): string };
  metricType: { name: string; unit: string | null };
};

/** Pivot measurement rows into recharts-compatible data + series definitions */
export function pivotMeasurements(rows: MeasurementLike[]): {
  data: Array<Record<string, string | number | null>>;
  series: TrendSeries[];
} {
  const seriesMap = new Map<string, TrendSeries>();
  const dateMap = new Map<string, Record<string, string | number | null>>();

  for (const row of rows) {
    const key = row.metricType.name.toLowerCase().replace(/\s+/g, "_");
    if (!seriesMap.has(key)) {
      seriesMap.set(key, {
        key,
        name: row.metricType.name,
        unit: row.metricType.unit ?? undefined,
      });
    }

    const date = new Date(row.measuredAt).toLocaleDateString();
    const entry = dateMap.get(date) ?? { date };
    entry[key] = parseFloat(row.value.toString());
    dateMap.set(date, entry);
  }

  return {
    data: Array.from(dateMap.values()),
    series: Array.from(seriesMap.values()),
  };
}

/** Build radar data from the latest value of each metric type (rows newest-first) */
export function buildRadarData(rows: MeasurementLike[]): RadarPoint[] {
  const latest = new Map<string, RadarPoint>();
  for (const row of rows) {
    const key = row.metricType.name;
    if (!latest.has(key)) {
      latest.set(key, {
        metric: key,
        value: parseFloat(row.value.toString()),
        unit: row.metricType.unit ?? undefined,
      });
    }
  }
  return Array.from(latest.values());
}
