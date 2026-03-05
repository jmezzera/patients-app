"use client";

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
export type { RadarPoint } from "@/lib/chart-utils";
export { buildRadarData } from "@/lib/chart-utils";

import type { RadarPoint } from "@/lib/chart-utils";

type Props = {
  data: RadarPoint[];
  title?: string;
};

export function RadarChart({ data, title = "Metric snapshot" }: Props) {
  if (data.length < 3) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsRadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
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
      </CardContent>
    </Card>
  );
}
