import Link from "next/link";
import { getSessionActor } from "@/lib/authz";
import { listAppointments } from "@/lib/repos/appointments";
import { AppointmentsCalendar } from "@/components/appointments/appointments-calendar";
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

export default async function AppointmentsPage() {
  const actor = await getSessionActor();
  const appointments = await listAppointments(actor);
  const calendarRows = appointments.map((appointment) => ({
    id: appointment.id,
    scheduledAt: appointment.scheduledAt,
    completedAt: appointment.completedAt,
    label: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
  }));

  return (
    <main className="container space-y-4 py-8">
      <AppointmentsCalendar title="Appointments calendar" appointments={calendarRows} />
      <Card>
        <CardHeader>
          <CardTitle>Scheduled appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <Link href={`/appointments/${appointment.id}`} className="underline">
                      {appointment.patient.firstName} {appointment.patient.lastName}
                    </Link>
                  </TableCell>
                  <TableCell>{new Date(appointment.scheduledAt).toLocaleString()}</TableCell>
                  <TableCell>
                    {appointment.completedAt ? (
                      <Badge>Completed</Badge>
                    ) : (
                      <Badge variant="outline">Scheduled</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
