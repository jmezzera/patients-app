"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-sm">
              From
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-40"
              />
            </label>
            <label className="grid gap-1 text-sm">
              To
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-40"
              />
            </label>
            {isManager && doctors.length > 0 && (
              <label className="grid gap-1 text-sm">
                Doctor
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">All doctors</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.displayName}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <Button variant="outline" onClick={fetchStats} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total appointments</CardDescription>
            <CardTitle className="text-3xl">{appointmentStats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl">{appointmentStats.completed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completion rate</CardDescription>
            <CardTitle className="text-3xl">{completionRate}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total patients</CardDescription>
            <CardTitle className="text-3xl">{patientStats.total}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appointment volume</CardTitle>
          <CardDescription>Weekly appointments over the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {timeSeries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data for this period.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Completed"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
