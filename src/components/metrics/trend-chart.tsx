"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
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

type Props = {
  data: Array<Record<string, string | number | null>>;
  series: TrendSeries[];
  title?: string;
  appointments?: AppointmentMarker[];
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
}: Props) {
  const router = useRouter();
  const chartData = data.slice().reverse();
  const [hovered, setHovered] = useState<HoveredMarker | null>(null);

  const handleEnter = useCallback((e: React.MouseEvent, appt: AppointmentMarker) => {
    setHovered({ appt, x: e.clientX, y: e.clientY });
  }, []);

  const handleLeave = useCallback(() => setHovered(null), []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full rounded-lg border bg-gradient-to-b from-slate-50 to-white p-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                {series.map((s, i) => (
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
              {series.map((s, i) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.unit ? `${s.name} (${s.unit})` : s.name}
                  stroke={COLORS[i % COLORS.length]}
                  fill={`url(#grad-${s.key})`}
                  strokeWidth={2}
                  connectNulls
                />
              ))}
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
            </AreaChart>
          </ResponsiveContainer>
        </div>

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
