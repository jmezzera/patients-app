"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
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

export type MeasurementRowData = {
  id: string;
  measuredAt: string; // ISO string
  value: string;
  metricType: { name: string; unit: string | null };
  source: string;
  appointmentId: string | null;
  notes: string | null;
};

type SourceFilter = "all" | "patient_self" | "doctor_visit";

const PAGE_SIZE = 10;

type Props = {
  rows: MeasurementRowData[];
  showAppointmentLinks?: boolean;
};

export function MeasurementTableClient({ rows, showAppointmentLinks = false }: Props) {
  const t = useTranslations("patient.measurements.table");

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.metricType.name.toLowerCase().includes(q)) return false;
      if (sourceFilter !== "all" && r.source !== sourceFilter) return false;
      return true;
    });
  }, [rows, search, sourceFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(0);
  }

  function handleSource(s: SourceFilter) {
    setSourceFilter(s);
    setPage(0);
  }

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 pl-8 text-sm"
            placeholder={t("filterByMetric")}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5">
          {(["all", "patient_self", "doctor_visit"] as SourceFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => handleSource(s)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                sourceFilter === s
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? t("sourceAll") : s === "patient_self" ? t("self") : t("doctor")}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs">{t("date")}</TableHead>
              <TableHead className="text-xs">{t("metric")}</TableHead>
              <TableHead className="text-xs">{t("value")}</TableHead>
              <TableHead className="text-xs">{t("source")}</TableHead>
              {showAppointmentLinks && <TableHead className="text-xs">{t("appointment")}</TableHead>}
              <TableHead className="text-xs">{t("notes")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showAppointmentLinks ? 6 : 5}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  {t("noResults")}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow key={row.id} className="align-top text-sm">
                  <TableCell className="text-muted-foreground">
                    {new Date(row.measuredAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">{row.metricType.name}</TableCell>
                  <TableCell>
                    {row.value}
                    {row.metricType.unit ? (
                      <span className="ml-1 text-xs text-muted-foreground">{row.metricType.unit}</span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={row.source === "patient_self" ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {row.source === "patient_self" ? t("self") : t("doctor")}
                    </Badge>
                  </TableCell>
                  {showAppointmentLinks && (
                    <TableCell>
                      {row.appointmentId ? (
                        <Link
                          className="text-xs underline text-muted-foreground hover:text-foreground"
                          href={`/appointments/${row.appointmentId}`}
                        >
                          {t("view")}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="max-w-[180px] truncate text-muted-foreground">
                    {row.notes ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {filtered.length === 0
            ? "0 results"
            : `${safePage * PAGE_SIZE + 1}–${Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={safePage === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="px-2">
            {safePage + 1} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
