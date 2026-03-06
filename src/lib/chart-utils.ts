/** Pure data-transformation helpers — no client directive, safe to call from server components */

export type TrendSeries = {
  key: string;
  name: string;
  unit?: string;
  doctorOnly?: boolean;
  source?: "doctor_visit" | "patient_self";
};

export type RadarPoint = {
  metric: string;
  value: number;
  unit?: string;
};

export type AppointmentMarker = {
  id: string;
  /** Same toLocaleDateString() format used by the chart x-axis */
  date: string;
  label?: string;
};

/** Serialisable measurement row — safe to pass from server → client components */
export type RawMeasurement = {
  measuredAt: string; // ISO datetime string
  value: number;
  source: "doctor_visit" | "patient_self";
  metricType: { name: string; unit: string | null; doctorOnly: boolean };
};

type MeasurementLike = {
  measuredAt: Date;
  value: { toString(): string };
  source?: string;
  metricType: { name: string; unit: string | null; doctorOnly?: boolean };
};

/** Pivot measurement rows into recharts-compatible data + series definitions.
 *  When a metric has both doctor_visit and patient_self rows, they are split
 *  into separate series (`{key}_dr` / `{key}_pt`). Otherwise a single series
 *  is created (falling back to the unsuffixed key for backwards compat). */
export function pivotMeasurements(rows: MeasurementLike[]): {
  data: Array<Record<string, string | number | null>>;
  series: TrendSeries[];
} {
  // First pass: discover which base metrics have multiple sources
  const sourcesPerMetric = new Map<string, Set<string>>();
  for (const row of rows) {
    const key = row.metricType.name.toLowerCase().replace(/\s+/g, "_");
    const src = row.source ?? "doctor_visit";
    const set = sourcesPerMetric.get(key) ?? new Set();
    set.add(src);
    sourcesPerMetric.set(key, set);
  }

  const seriesMap = new Map<string, TrendSeries>();
  const dateMap = new Map<string, Record<string, string | number | null>>();

  for (const row of rows) {
    const baseKey = row.metricType.name.toLowerCase().replace(/\s+/g, "_");
    const src = row.source ?? "doctor_visit";
    const hasBothSources = (sourcesPerMetric.get(baseKey)?.size ?? 0) > 1;

    const key = hasBothSources
      ? `${baseKey}_${src === "doctor_visit" ? "dr" : "pt"}`
      : baseKey;

    if (!seriesMap.has(key)) {
      const suffix = hasBothSources
        ? src === "doctor_visit"
          ? " (Dr.)"
          : " (Self)"
        : "";
      seriesMap.set(key, {
        key,
        name: `${row.metricType.name}${suffix}`,
        unit: row.metricType.unit ?? undefined,
        doctorOnly: row.metricType.doctorOnly ?? false,
        source: src as "doctor_visit" | "patient_self",
      });
    }

    const date = new Date(row.measuredAt).toLocaleDateString();
    const ts = new Date(row.measuredAt).getTime();
    const entry = dateMap.get(date) ?? { date, _ts: ts };
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

/**
 * Build radar data from serialisable raw rows, optionally filtered to
 * measurements on or before `asOfTs` (ms epoch timestamp).
 */
export function buildRadarDataAsOf(rows: RawMeasurement[], asOfTs?: number): RadarPoint[] {
  const filtered = asOfTs
    ? rows.filter((r) => new Date(r.measuredAt).getTime() <= asOfTs)
    : rows;

  // Sort newest-first so the first occurrence per metric = the most recent value
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime(),
  );

  const latest = new Map<string, RadarPoint>();
  for (const row of sorted) {
    if (!latest.has(row.metricType.name)) {
      latest.set(row.metricType.name, {
        metric: row.metricType.name,
        value: row.value,
        unit: row.metricType.unit ?? undefined,
      });
    }
  }
  return Array.from(latest.values());
}
