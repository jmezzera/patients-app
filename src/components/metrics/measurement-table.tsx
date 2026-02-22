import Link from "next/link";
import { MeasurementEntry } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type MeasurementTableProps = {
  rows: MeasurementEntry[];
  showAppointmentLinks?: boolean;
};

export function MeasurementTable({ rows, showAppointmentLinks = false }: MeasurementTableProps) {
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
              <TableHead>Weight (kg)</TableHead>
              <TableHead>Body fat (%)</TableHead>
              <TableHead>Waist (cm)</TableHead>
              {showAppointmentLinks ? <TableHead>Appointment</TableHead> : null}
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="align-top">
                <TableCell>{new Date(row.measuredAt).toLocaleDateString()}</TableCell>
                <TableCell>{row.weightKg?.toString() ?? "—"}</TableCell>
                <TableCell>{row.bodyFatPct?.toString() ?? "—"}</TableCell>
                <TableCell>{row.waistCm?.toString() ?? "—"}</TableCell>
                {showAppointmentLinks ? (
                  <TableCell>
                    {row.appointmentId ? (
                      <Link className="underline" href={`/appointments/${row.appointmentId}`}>
                        View appointment
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
