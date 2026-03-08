"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AppointmentStatus } from "@prisma/client";
import {
  differenceInYears,
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  startOfDay, endOfDay,
  isWithinInterval,
} from "date-fns";
import { ChevronDown } from "lucide-react";
import type { View } from "react-big-calendar";
import { AppointmentsCalendar, ViewAppointment } from "./appointments-calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateAppointmentForm } from "@/components/forms/create-appointment-form";

type NutritionPlan = { id: string; name: string };
type ScheduleSlot = { dayOfWeek: number; startTime: string; endTime: string };
type Patient = { id: string; firstName: string; lastName: string; color?: string | null; scheduleSlots?: ScheduleSlot[] };
type Doctor = { id: string; displayName: string };

type Filters = {
  patientIds: string[];
  nutritionPlanId: string;
  statuses: AppointmentStatus[];
  minAge: string;
  maxAge: string;
};

const ALL_STATUSES = [AppointmentStatus.BOOKED, AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED];
const DEFAULT_STATUSES: AppointmentStatus[] = [AppointmentStatus.BOOKED, AppointmentStatus.COMPLETED];
const STATUS_LABELS: Record<AppointmentStatus, string> = {
  BOOKED: "Booked",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const EMPTY_FILTERS: Filters = {
  patientIds: [],
  nutritionPlanId: "",
  statuses: DEFAULT_STATUSES,
  minAge: "",
  maxAge: "",
};

const VIEWS: { key: View; label: string }[] = [
  { key: "month", label: "Month" },
  { key: "week", label: "Week" },
  { key: "day", label: "Day" },
];

function statusBadge(status: AppointmentStatus) {
  if (status === AppointmentStatus.COMPLETED) return <Badge>Completed</Badge>;
  if (status === AppointmentStatus.CANCELLED)
    return <Badge className="border-red-300 bg-red-100 text-red-700">Cancelled</Badge>;
  return <Badge variant="outline">Booked</Badge>;
}

function PatientCell({
  participants,
}: {
  participants: { patientId: string; firstName: string; lastName: string; color: string | null }[];
}) {
  if (participants.length === 0) return <span>—</span>;
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {participants.map((p) => (
        <Link
          key={p.patientId}
          href={`/patients/${p.patientId}`}
          className="flex items-center gap-1 underline hover:text-foreground"
        >
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: p.color ?? "#cbd5e1" }}
          />
          {p.firstName} {p.lastName}
        </Link>
      ))}
    </span>
  );
}

function isActive(filters: Filters) {
  const statusesChanged =
    filters.statuses.length !== DEFAULT_STATUSES.length ||
    !filters.statuses.every((s) => DEFAULT_STATUSES.includes(s));
  return (
    filters.patientIds.length > 0 ||
    filters.nutritionPlanId !== "" ||
    statusesChanged ||
    filters.minAge !== "" ||
    filters.maxAge !== ""
  );
}

function getViewRange(view: View, date: Date): { start: Date; end: Date } {
  if (view === "month") return { start: startOfMonth(date), end: endOfMonth(date) };
  if (view === "week") return { start: startOfWeek(date), end: endOfWeek(date) };
  return { start: startOfDay(date), end: endOfDay(date) };
}

function applyFilters(
  appointments: ViewAppointment[],
  filters: Filters,
  view: View,
  calendarDate: Date,
): ViewAppointment[] {
  const now = new Date();
  const range = getViewRange(view, calendarDate);
  return appointments.filter((a) => {
    if (!isWithinInterval(new Date(a.scheduledAt), range)) return false;
    if (filters.patientIds.length > 0) {
      const match = a.participants.some((p) => filters.patientIds.includes(p.patientId));
      if (!match) return false;
    }

    if (filters.nutritionPlanId) {
      const match = a.participants.some((p) => p.nutritionPlanId === filters.nutritionPlanId);
      if (!match) return false;
    }

    if (filters.statuses.length > 0 && !filters.statuses.includes(a.status)) return false;

    if (filters.minAge || filters.maxAge) {
      const min = filters.minAge ? parseInt(filters.minAge, 10) : null;
      const max = filters.maxAge ? parseInt(filters.maxAge, 10) : null;
      const match = a.participants.some((p) => {
        if (!p.dob) return false;
        const age = differenceInYears(now, new Date(p.dob));
        if (min !== null && age < min) return false;
        if (max !== null && age > max) return false;
        return true;
      });
      if (!match) return false;
    }

    return true;
  });
}

function PatientCombobox({
  patients,
  selectedIds,
  onChange,
}: {
  patients: Patient[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredPatients = patients.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()),
  );

  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]);
  }

  const label =
    selectedIds.length === 0
      ? "All patients"
      : selectedIds.length === 1
        ? (() => {
            const p = patients.find((p) => p.id === selectedIds[0]);
            return p ? `${p.firstName} ${p.lastName}` : "1 patient";
          })()
        : `${selectedIds.length} patients`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-8 min-w-[130px] items-center justify-between gap-2 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
          selectedIds.length === 0 ? "text-muted-foreground" : ""
        }`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[220px] rounded-md border bg-popover shadow-md">
          <div className="p-2">
            <input
              autoFocus
              type="text"
              placeholder="Search patients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="max-h-48 divide-y overflow-y-auto">
            {filteredPatients.map((p) => {
              const checked = selectedIds.includes(p.id);
              return (
                <label
                  key={p.id}
                  className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 ${
                    checked ? "bg-muted/30" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(p.id)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: p.color ?? "#cbd5e1" }}
                  />
                  {p.firstName} {p.lastName}
                </label>
              );
            })}
            {filteredPatients.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">No patients found</p>
            )}
          </div>
          {selectedIds.length > 0 && (
            <div className="border-t p-2">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusMultiselect({
  selected,
  onChange,
}: {
  selected: AppointmentStatus[];
  onChange: (statuses: AppointmentStatus[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggle(s: AppointmentStatus) {
    onChange(selected.includes(s) ? selected.filter((x) => x !== s) : [...selected, s]);
  }

  const label =
    selected.length === ALL_STATUSES.length
      ? "All statuses"
      : selected.length === 0
        ? "No statuses"
        : selected.map((s) => STATUS_LABELS[s]).join(", ");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-8 min-w-[120px] items-center justify-between gap-2 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
          selected.length === DEFAULT_STATUSES.length &&
          selected.every((s) => DEFAULT_STATUSES.includes(s))
            ? "text-muted-foreground"
            : ""
        }`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-md border bg-popover shadow-md">
          <div className="divide-y">
            {ALL_STATUSES.map((s) => {
              const checked = selected.includes(s);
              return (
                <label
                  key={s}
                  className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 ${
                    checked ? "bg-muted/30" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(s)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  {STATUS_LABELS[s]}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type Props = {
  appointments: ViewAppointment[];
  nutritionPlans: NutritionPlan[];
  patients: Patient[];
  doctors: Doctor[];
  defaultDoctorId?: string;
};

export function AppointmentsView({
  appointments,
  nutritionPlans,
  patients,
  doctors,
  defaultDoctorId,
}: Props) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [view, setView] = useState<View>(() =>
    typeof window !== "undefined" && window.innerWidth < 640 ? "day" : "month"
  );
  const [calendarDate, setCalendarDate] = useState(new Date());

  const filtered = useMemo(
    () => applyFilters(appointments, filters, view, calendarDate),
    [appointments, filters, view, calendarDate],
  );

  function set(key: keyof Omit<Filters, "patientIds" | "statuses">) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFilters((prev) => ({ ...prev, [key]: e.target.value }));
  }

  function navigate(direction: "prev" | "next" | "today") {
    if (direction === "today") { setCalendarDate(new Date()); return; }
    const d = new Date(calendarDate);
    if (view === "month") d.setMonth(d.getMonth() + (direction === "next" ? 1 : -1));
    else if (view === "week") d.setDate(d.getDate() + (direction === "next" ? 7 : -7));
    else d.setDate(d.getDate() + (direction === "next" ? 1 : -1));
    setCalendarDate(d);
  }

  const anyFilter = isActive(filters);

  return (
    <div className="space-y-4">
      {/* Filter toolbar */}
      <div className="flex flex-col gap-2 rounded-lg border bg-card p-3">
        {/* Row 1: filters */}
        <div className="flex flex-wrap items-center gap-2">
          <PatientCombobox
            patients={patients}
            selectedIds={filters.patientIds}
            onChange={(ids) => setFilters((prev) => ({ ...prev, patientIds: ids }))}
          />

          <select
            value={filters.nutritionPlanId}
            onChange={set("nutritionPlanId")}
            className="h-8 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All plans</option>
            {nutritionPlans.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <StatusMultiselect
            selected={filters.statuses}
            onChange={(statuses) => setFilters((prev) => ({ ...prev, statuses }))}
          />

          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={0}
              max={120}
              placeholder="Min age"
              value={filters.minAge}
              onChange={set("minAge")}
              className="h-8 w-[60px] text-sm"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              min={0}
              max={120}
              placeholder="Max age"
              value={filters.maxAge}
              onChange={set("maxAge")}
              className="h-8 w-[60px] text-sm"
            />
          </div>

          {anyFilter && (
            <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)} className="h-8">
              Clear
            </Button>
          )}
          {anyFilter && (
            <span className="text-xs text-muted-foreground">
              {filtered.length} of {appointments.length}
            </span>
          )}
        </div>

        {/* Row 2: calendar nav + view toggle + CTA */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => navigate("prev")}>‹</Button>
            <Button variant="outline" size="sm" onClick={() => navigate("today")}>Today</Button>
            <Button variant="outline" size="sm" onClick={() => navigate("next")}>›</Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-md border">
              {VIEWS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`px-3 py-1 text-sm transition-colors first:rounded-l-md last:rounded-r-md ${
                    view === key ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <CreateAppointmentForm patients={patients} doctors={doctors} defaultDoctorId={defaultDoctorId} />
          </div>
        </div>
      </div>

      {/* Calendar */}
      <AppointmentsCalendar
        appointments={filtered}
        view={view}
        onViewChange={setView}
        date={calendarDate}
        onDateChange={setCalendarDate}
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patients</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  <PatientCell participants={a.participants} />
                </TableCell>
                <TableCell>{a.doctorName}</TableCell>
                <TableCell>
                  <Link href={`/appointments/${a.id}`} className="underline hover:text-foreground">
                    {new Date(a.scheduledAt).toLocaleString()}
                  </Link>
                </TableCell>
                <TableCell>{statusBadge(a.status)}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No appointments match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
