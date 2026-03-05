import Link from "next/link";
import { AppointmentStatus, Role } from "@prisma/client";
import { getSessionActor } from "@/lib/authz";
import { listAppointments } from "@/lib/repos/appointments";
import { listPatients } from "@/lib/repos/patients";
import { db } from "@/lib/db";
import { AppointmentsCalendar } from "@/components/appointments/appointments-calendar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateAppointmentForm } from "@/components/forms/create-appointment-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function statusBadge(status: AppointmentStatus) {
  if (status === AppointmentStatus.COMPLETED) return <Badge>Completed</Badge>;
  if (status === AppointmentStatus.CANCELLED)
    return <Badge className="border-red-300 bg-red-100 text-red-700">Cancelled</Badge>;
  return <Badge variant="outline">Booked</Badge>;
}

function patientLabel(participants: { patient: { firstName: string; lastName: string } }[]) {
  if (participants.length === 0) return "—";
  const first = participants[0].patient;
  const label = `${first.firstName} ${first.lastName}`;
  return participants.length > 1 ? `${label} +${participants.length - 1}` : label;
}

export default async function AppointmentsPage() {
  const actor = await getSessionActor();

  const [appointments, patients, doctors] = await Promise.all([
    listAppointments(actor),
    listPatients(actor),
    db.user.findMany({
      where: { orgId: actor.orgId, role: Role.DOCTOR },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
    }),
  ]);

  const calendarRows = appointments.map((a) => ({
    id: a.id,
    scheduledAt: a.scheduledAt,
    completedAt: a.completedAt,
    label: patientLabel(a.participants),
  }));

  const defaultDoctorId = actor.role === Role.DOCTOR ? actor.id : undefined;

  return (
    <main className="container space-y-4 py-8">
      <AppointmentsCalendar title="Appointments calendar" appointments={calendarRows} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Appointments</CardTitle>
          <CreateAppointmentForm
            patients={patients}
            doctors={doctors}
            defaultDoctorId={defaultDoctorId}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient(s)</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Link href={`/appointments/${a.id}`} className="underline">
                      {patientLabel(a.participants)}
                    </Link>
                  </TableCell>
                  <TableCell>{a.doctor.displayName}</TableCell>
                  <TableCell>{new Date(a.scheduledAt).toLocaleString()}</TableCell>
                  <TableCell>{statusBadge(a.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
