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

type TrendPoint = {
  date: string;
  weightKg: number | null;
  bodyFatPct: number | null;
};

type TrendChartProps = {
  rows: TrendPoint[];
};

export function TrendChart({ rows }: TrendChartProps) {
  const data = rows.slice().reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historic trends</CardTitle>
      </CardHeader>
      <CardContent>
      <div className="h-80 w-full rounded-lg border bg-gradient-to-b from-slate-50 to-white p-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0f172a" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fatGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.35} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis yAxisId="left" tickLine={false} axisLine={false} width={42} />
            <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} width={42} />
            <Tooltip
              contentStyle={{ borderRadius: 10, borderColor: "#e2e8f0" }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="weightKg"
              name="Weight (kg)"
              stroke="#0f172a"
              fill="url(#weightGradient)"
              strokeWidth={2}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="bodyFatPct"
              name="Body fat (%)"
              stroke="#6366f1"
              fill="url(#fatGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      </CardContent>
    </Card>
  );
}
