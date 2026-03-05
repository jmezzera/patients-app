import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type MeasurementRow = {
  id: string;
  measuredAt: Date;
  value: { toString(): string };
  metricType: { name: string; unit: string | null };
  source: string;
  appointmentId: string | null;
  notes: string | null;
};

type Props = {
  rows: MeasurementRow[];
  showAppointmentLinks?: boolean;
};

export function MeasurementTable({ rows, showAppointmentLinks = false }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Measurements</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Metric</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Source</TableHead>
              {showAppointmentLinks ? <TableHead>Appointment</TableHead> : null}
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="align-top">
                <TableCell>{new Date(row.measuredAt).toLocaleDateString()}</TableCell>
                <TableCell>{row.metricType.name}</TableCell>
                <TableCell>
                  {row.value.toString()}
                  {row.metricType.unit ? ` ${row.metricType.unit}` : ""}
                </TableCell>
                <TableCell>
                  <Badge variant={row.source === "patient_self" ? "secondary" : "outline"}>
                    {row.source === "patient_self" ? "Self" : "Doctor"}
                  </Badge>
                </TableCell>
                {showAppointmentLinks ? (
                  <TableCell>
                    {row.appointmentId ? (
                      <Link className="underline" href={`/appointments/${row.appointmentId}`}>
                        View
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                ) : null}
                <TableCell>{row.notes ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
