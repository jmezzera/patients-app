"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Re-export so existing imports keep working
export type { TrendSeries } from "@/lib/chart-utils";
export { pivotMeasurements } from "@/lib/chart-utils";

import type { TrendSeries } from "@/lib/chart-utils";

type Props = {
  data: Array<Record<string, string | number | null>>;
  series: TrendSeries[];
  title?: string;
};

const COLORS = ["#0f172a", "#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];

export function TrendChart({ data, series, title = "Historic trends" }: Props) {
  const chartData = data.slice().reverse();

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
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
