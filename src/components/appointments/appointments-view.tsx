"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AppointmentStatus } from "@prisma/client";
import {
  differenceInYears,
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  startOfDay, endOfDay,
  isWithinInterval,
} from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
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

const EMPTY_FILTERS: Filters = {
  patientIds: [],
  nutritionPlanId: "",
  statuses: DEFAULT_STATUSES,
  minAge: "",
  maxAge: "",
};

function statusBadge(status: AppointmentStatus, labels: Record<AppointmentStatus, string>) {
  if (status === AppointmentStatus.COMPLETED) return <Badge>{labels.COMPLETED}</Badge>;
  if (status === AppointmentStatus.CANCELLED)
    return <Badge className="border-red-300 bg-red-100 text-red-700">{labels.CANCELLED}</Badge>;
  return <Badge variant="outline">{labels.BOOKED}</Badge>;
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
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: p.color ?? "#cbd5e1" }}
          />
          <span className="underline underline-offset-2 decoration-muted-foreground/30 hover:decoration-foreground">
            {p.firstName} {p.lastName}
          </span>
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
  const t = useTranslations("appointments.view");
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
      ? t("allPatients")
      : selectedIds.length === 1
        ? (() => {
            const p = patients.find((p) => p.id === selectedIds[0]);
            return p ? `${p.firstName} ${p.lastName}` : `1 patient`;
          })()
        : `${selectedIds.length} patients`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-9 min-w-[130px] items-center justify-between gap-2 rounded-lg border bg-background px-3 text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring ${
          open ? "ring-2 ring-ring" : ""
        } ${selectedIds.length === 0 ? "text-muted-foreground" : "font-medium"}`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 opacity-50 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[240px] rounded-xl border bg-popover shadow-lg animate-slide-down">
          <div className="p-2.5">
            <input
              autoFocus
              type="text"
              placeholder={t("searchPatients")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="max-h-52 overflow-y-auto px-1.5 pb-1.5">
            {filteredPatients.map((p) => {
              const checked = selectedIds.includes(p.id);
              return (
                <label
                  key={p.id}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted/50 ${
                    checked ? "bg-muted/40" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(p.id)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: p.color ?? "#cbd5e1" }}
                  />
                  {p.firstName} {p.lastName}
                </label>
              );
            })}
            {filteredPatients.length === 0 && (
              <p className="px-3 py-3 text-sm text-muted-foreground">{t("noPatientsFound")}</p>
            )}
          </div>
          {selectedIds.length > 0 && (
            <div className="border-t px-3 py-2">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("clearSelection")}
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
  const t = useTranslations("appointments.view");
  const tc = useTranslations("common.status");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const STATUS_LABELS: Record<AppointmentStatus, string> = {
    BOOKED: tc("booked"),
    COMPLETED: tc("completed"),
    CANCELLED: tc("cancelled"),
  };

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
      ? t("allStatuses")
      : selected.length === 0
        ? t("noStatuses")
        : selected.map((s) => STATUS_LABELS[s]).join(", ");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-9 min-w-[120px] items-center justify-between gap-2 rounded-lg border bg-background px-3 text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring ${
          open ? "ring-2 ring-ring" : ""
        } ${
          selected.length === DEFAULT_STATUSES.length &&
          selected.every((s) => DEFAULT_STATUSES.includes(s))
            ? "text-muted-foreground"
            : "font-medium"
        }`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 opacity-50 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[180px] rounded-xl border bg-popover shadow-lg animate-slide-down">
          <div className="p-1.5">
            {ALL_STATUSES.map((s) => {
              const checked = selected.includes(s);
              return (
                <label
                  key={s}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted/50 ${
                    checked ? "bg-muted/40" : ""
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
  const t = useTranslations("appointments");
  const tv = useTranslations("appointments.view");
  const tc = useTranslations("common.status");

  const STATUS_LABELS: Record<AppointmentStatus, string> = {
    BOOKED: tc("booked"),
    COMPLETED: tc("completed"),
    CANCELLED: tc("cancelled"),
  };

  const VIEWS: { key: View; label: string }[] = [
    { key: "month", label: tv("month") },
    { key: "week", label: tv("week") },
    { key: "day", label: tv("day") },
  ];

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
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
      {/* Toolbar */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Top row: nav + views + CTA */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-4">
          {/* Calendar navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("prev")}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("today")} className="h-8 px-2.5 text-xs font-semibold">
              {tv("today")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("next")}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* View toggle + filter toggle + CTA */}
          <div className="flex items-center gap-2">
            {/* View switcher */}
            <div className="flex rounded-lg border bg-muted/30 p-0.5">
              {VIEWS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
                    view === key
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Filter toggle */}
            <Button
              variant={anyFilter ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltersOpen((o) => !o)}
              className="h-8 gap-1.5"
            >
              <Filter className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{anyFilter ? `${filtered.length}/${appointments.length}` : tv("filters")}</span>
              {anyFilter && <span className="sm:hidden text-xs">{filtered.length}</span>}
            </Button>

            <CreateAppointmentForm patients={patients} doctors={doctors} defaultDoctorId={defaultDoctorId} />
          </div>
        </div>

        {/* Expandable filter row */}
        {filtersOpen && (
          <div className="border-t bg-muted/20 px-3 py-3 sm:px-4 animate-slide-down">
            <div className="flex flex-wrap items-center gap-2">
              <PatientCombobox
                patients={patients}
                selectedIds={filters.patientIds}
                onChange={(ids) => setFilters((prev) => ({ ...prev, patientIds: ids }))}
              />

              <select
                value={filters.nutritionPlanId}
                onChange={set("nutritionPlanId")}
                className="h-9 rounded-lg border bg-background px-2.5 text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{tv("allPlans")}</option>
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
                  placeholder={tv("minAge")}
                  value={filters.minAge}
                  onChange={set("minAge")}
                  className="h-9 w-[60px] rounded-lg text-sm"
                />
                <span className="text-muted-foreground text-xs">–</span>
                <Input
                  type="number"
                  min={0}
                  max={120}
                  placeholder={tv("maxAge")}
                  value={filters.maxAge}
                  onChange={set("maxAge")}
                  className="h-9 w-[60px] rounded-lg text-sm"
                />
              </div>

              {anyFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="h-8 gap-1 text-xs"
                >
                  <X className="h-3 w-3" />
                  {tv("clear")}
                </Button>
              )}
            </div>
          </div>
        )}
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
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {/* Mobile card list */}
        <div className="sm:hidden divide-y">
          {filtered.map((a) => (
            <Link
              key={a.id}
              href={`/appointments/${a.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/30 active:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex shrink-0 gap-0.5">
                    {a.participants.slice(0, 3).map((p) => (
                      <span
                        key={p.patientId}
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: p.color ?? "#cbd5e1" }}
                      />
                    ))}
                  </span>
                  <span className="truncate text-sm font-medium">
                    {a.participants.map((p) => `${p.firstName} ${p.lastName}`).join(", ") || "—"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {a.doctorName} · {new Date(a.scheduledAt).toLocaleDateString()}
                </p>
              </div>
              {statusBadge(a.status, STATUS_LABELS)}
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {tv("noResults")}
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tableHeaders.patients")}</TableHead>
                <TableHead>{t("tableHeaders.doctor")}</TableHead>
                <TableHead>{t("tableHeaders.scheduled")}</TableHead>
                <TableHead>{t("tableHeaders.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id} className="group">
                  <TableCell>
                    <PatientCell participants={a.participants} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{a.doctorName}</TableCell>
                  <TableCell>
                    <Link
                      href={`/appointments/${a.id}`}
                      className="text-sm underline underline-offset-2 decoration-muted-foreground/30 hover:decoration-foreground transition-colors"
                    >
                      {new Date(a.scheduledAt).toLocaleString()}
                    </Link>
                  </TableCell>
                  <TableCell>{statusBadge(a.status, STATUS_LABELS)}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    {tv("noResults")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
