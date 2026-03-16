"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type AppointmentStats = { total: number; completed: number; cancelled: number; booked: number };
type PatientStats = { total: number };
type TimeSeriesRow = { week: string; total: number; completed: number };
type Doctor = { id: string; displayName: string };

type ApiResponse = {
  appointmentStats: AppointmentStats;
  patientStats: PatientStats;
  timeSeries: TimeSeriesRow[];
  doctors: Doctor[];
};

type Props = {
  initial: ApiResponse;
  isManager: boolean;
};

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function StatsView({ initial, isManager }: Props) {
  const t = useTranslations("stats");
  const tc = useTranslations("common");
  const defaultTo = new Date();
  const defaultFrom = new Date();
  defaultFrom.setDate(defaultTo.getDate() - 90);

  const [from, setFrom] = useState(toDateStr(defaultFrom));
  const [to, setTo] = useState(toDateStr(defaultTo));
  const [doctorId, setDoctorId] = useState("");
  const [data, setData] = useState<ApiResponse>(initial);
  const [loading, setLoading] = useState(false);

  async function fetchStats() {
    setLoading(true);
    const params = new URLSearchParams({ from, to });
    if (doctorId) params.set("doctorId", doctorId);
    const res = await fetch(`/api/stats?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, doctorId]);

  const { appointmentStats, patientStats, timeSeries, doctors } = data;

  const completionRate =
    appointmentStats.total > 0
      ? Math.round((appointmentStats.completed / appointmentStats.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Date range controls */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">{t("dateRange.from")}</span>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-36 sm:w-40"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">{t("dateRange.to")}</span>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-36 sm:w-40"
              />
            </label>
            {isManager && doctors.length > 0 && (
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">{t("dateRange.doctor")}</span>
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className="flex h-10 rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{t("dateRange.allDoctors")}</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.displayName}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <Button variant="outline" onClick={fetchStats} disabled={loading} className="gap-1.5">
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {loading ? tc("loading") : tc("refresh")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className={`grid gap-3 grid-cols-2 md:grid-cols-4 ${loading ? "animate-pulse-soft" : ""}`}>
        <Card className="animate-fade-in-up stagger-1">
          <CardHeader className="pb-2">
            <CardDescription>{t("cards.totalAppointments")}</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{appointmentStats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="animate-fade-in-up stagger-2">
          <CardHeader className="pb-2">
            <CardDescription>{t("cards.completed")}</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{appointmentStats.completed}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="animate-fade-in-up stagger-3">
          <CardHeader className="pb-2">
            <CardDescription>{t("cards.completionRate")}</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{completionRate}%</CardTitle>
          </CardHeader>
        </Card>
        <Card className="animate-fade-in-up stagger-4">
          <CardHeader className="pb-2">
            <CardDescription>{t("cards.totalPatients")}</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{patientStats.total}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Chart */}
      <Card className="animate-fade-in-up stagger-5">
        <CardHeader>
          <CardTitle>{t("chart.title")}</CardTitle>
          <CardDescription>{t("chart.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {timeSeries.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("chart.noData")}</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(124 16% 85%)" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: "hsl(124 8% 46%)" }}
                  axisLine={{ stroke: "hsl(124 16% 85%)" }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "hsl(124 8% 46%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(124 16% 85%)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: "13px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Line
                  type="monotone"
                  dataKey="total"
                  name={t("series.total")}
                  stroke="#3a6b3c"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name={t("series.completed")}
                  stroke="#9dc73a"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
