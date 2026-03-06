"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Re-export so existing imports keep working
export type { TrendSeries, AppointmentMarker } from "@/lib/chart-utils";
export { pivotMeasurements } from "@/lib/chart-utils";

import type { TrendSeries, AppointmentMarker } from "@/lib/chart-utils";

type Timeframe = "1W" | "1M" | "3M" | "All";
const TIMEFRAME_OPTIONS: Timeframe[] = ["1W", "1M", "3M", "All"];
const TIMEFRAME_DAYS: Record<Timeframe, number | null> = {
  "1W": 7,
  "1M": 30,
  "3M": 90,
  All: null,
};

type Props = {
  data: Array<Record<string, string | number | null>>;
  series: TrendSeries[];
  title?: string;
  appointments?: AppointmentMarker[];
  /** When true, hides doctorOnly series (PATIENT role view) */
  isPatient?: boolean;
};

const COLORS = ["#0f172a", "#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];

type HoveredMarker = { appt: AppointmentMarker; x: number; y: number };

function ApptDot({
  viewBox,
  appt,
  onEnter,
  onLeave,
  onClick,
}: {
  viewBox?: { x: number; y: number; height: number };
  appt: AppointmentMarker;
  onEnter: (e: React.MouseEvent, appt: AppointmentMarker) => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  if (!viewBox) return null;
  return (
    <circle
      cx={viewBox.x}
      cy={viewBox.y + 6}
      r={5}
      fill="#6366f1"
      stroke="white"
      strokeWidth={2}
      style={{ cursor: "pointer" }}
      onMouseEnter={(e) => onEnter(e, appt)}
      onMouseLeave={onLeave}
      onClick={onClick}
    />
  );
}

export function TrendChart({
  data,
  series,
  title = "Historic trends",
  appointments = [],
  isPatient = false,
}: Props) {
  const router = useRouter();
  const [hovered, setHovered] = useState<HoveredMarker | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("All");

  // Series visible to this role
  const visibleSeries = useMemo(
    () => series.filter((s) => !isPatient || !s.doctorOnly),
    [series, isPatient],
  );

  // Track which series are enabled (all on by default)
  const [enabledKeys, setEnabledKeys] = useState<Set<string>>(
    () => new Set(visibleSeries.map((s) => s.key)),
  );

  const toggleKey = useCallback((key: string) => {
    setEnabledKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Filter data by selected timeframe (uses _ts added by pivotMeasurements)
  const chartData = useMemo(() => {
    const reversed = data.slice().reverse(); // oldest → newest for display
    const days = TIMEFRAME_DAYS[timeframe];
    if (!days) return reversed;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return reversed.filter((d) => typeof d._ts === "number" && (d._ts as number) >= cutoff);
  }, [data, timeframe]);

  const handleEnter = useCallback((e: React.MouseEvent, appt: AppointmentMarker) => {
    setHovered({ appt, x: e.clientX, y: e.clientY });
  }, []);

  const handleLeave = useCallback(() => setHovered(null), []);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center gap-1">
            {TIMEFRAME_OPTIONS.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  timeframe === tf
                    ? "bg-slate-900 text-white"
                    : "text-muted-foreground hover:bg-slate-100"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full rounded-lg border bg-gradient-to-b from-slate-50 to-white p-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                {visibleSeries.map((s, i) => (
                  <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.35} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis tickLine={false} axisLine={false} width={42} />
              <Tooltip
                contentStyle={{ borderRadius: 10, borderColor: "#e2e8f0" }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Legend />
              {visibleSeries.map((s, i) =>
                enabledKeys.has(s.key) ? (
                  <Area
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.unit ? `${s.name} (${s.unit})` : s.name}
                    stroke={COLORS[i % COLORS.length]}
                    fill={s.source === "patient_self" ? "none" : `url(#grad-${s.key})`}
                    fillOpacity={s.source === "patient_self" ? 0 : 1}
                    strokeWidth={s.source === "patient_self" ? 1.5 : 2}
                    strokeDasharray={s.source === "patient_self" ? "5 3" : undefined}
                    dot={s.source === "patient_self" ? { r: 2, fill: COLORS[i % COLORS.length] } : false}
                    connectNulls
                  />
                ) : null,
              )}
              {appointments.map((appt) => (
                <ReferenceLine
                  key={appt.id}
                  x={appt.date}
                  stroke="#6366f1"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                  label={(props: { viewBox?: { x: number; y: number; height: number } }) => (
                    <ApptDot
                      viewBox={props.viewBox}
                      appt={appt}
                      onEnter={handleEnter}
                      onLeave={handleLeave}
                      onClick={() => router.push(`/appointments/${appt.id}`)}
                    />
                  )}
                />
              ))}
              {chartData.length > 1 && (
                <Brush dataKey="date" height={22} stroke="#e2e8f0" travellerWidth={6} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Series toggles — shown only when there is more than one visible series */}
        {visibleSeries.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-4">
            {visibleSeries.map((s, i) => (
              <label
                key={s.key}
                className="flex cursor-pointer select-none items-center gap-1.5 text-xs"
              >
                <input
                  type="checkbox"
                  checked={enabledKeys.has(s.key)}
                  onChange={() => toggleKey(s.key)}
                  className="accent-indigo-600"
                />
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-muted-foreground">{s.name}</span>
              </label>
            ))}
          </div>
        )}

        {hovered && (
          <div
            className="pointer-events-none fixed z-50 rounded-lg border bg-white px-3 py-2 shadow-lg"
            style={{ top: hovered.y - 76, left: hovered.x - 64 }}
          >
            <p className="text-xs font-semibold text-indigo-600">Appointment</p>
            <p className="text-xs text-muted-foreground">{hovered.appt.date}</p>
            {hovered.appt.label && (
              <p className="text-xs text-muted-foreground">{hovered.appt.label}</p>
            )}
            <p className="mt-1 text-xs text-indigo-400">Click to open →</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
