import Link from "next/link";
import { AppointmentStatus, Role } from "@prisma/client";
import { getTranslations } from "next-intl/server";
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

function statusBadge(status: AppointmentStatus, labels: { completed: string; cancelled: string; booked: string }) {
  if (status === AppointmentStatus.COMPLETED) return <Badge>{labels.completed}</Badge>;
  if (status === AppointmentStatus.CANCELLED)
    return <Badge className="border-red-300 bg-red-100 text-red-700">{labels.cancelled}</Badge>;
  return <Badge variant="outline">{labels.booked}</Badge>;
}

function PatientCell({
  participants,
}: {
  participants: { patient: { firstName: string; lastName: string; color?: string | null } }[];
}) {
  if (participants.length === 0) return <span>—</span>;
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {participants.map(({ patient }, i) => (
        <span key={i} className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
            style={{ backgroundColor: patient.color ?? "#cbd5e1" }}
          />
          {patient.firstName} {patient.lastName}
        </span>
      ))}
    </span>
  );
}

export default async function AppointmentsPage() {
  const actor = await getSessionActor();
  const t = await getTranslations("appointments");
  const tc = await getTranslations("common");

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
    label:
      a.participants.length === 0
        ? "—"
        : a.participants.map((p) => `${p.patient.firstName} ${p.patient.lastName}`).join(", "),
  }));

  const defaultDoctorId = actor.role === Role.DOCTOR ? actor.id : undefined;

  return (
    <main className="container space-y-4 py-8">
      <AppointmentsCalendar title={t("calendarTitle")} appointments={calendarRows} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
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
                <TableHead>{t("tableHeaders.patients")}</TableHead>
                <TableHead>{t("tableHeaders.doctor")}</TableHead>
                <TableHead>{t("tableHeaders.scheduled")}</TableHead>
                <TableHead>{t("tableHeaders.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Link href={`/appointments/${a.id}`} className="underline">
                      <PatientCell participants={a.participants} />
                    </Link>
                  </TableCell>
                  <TableCell>{a.doctor.displayName}</TableCell>
                  <TableCell>{new Date(a.scheduledAt).toLocaleString()}</TableCell>
                  <TableCell>{statusBadge(a.status, { completed: tc("status.completed"), cancelled: tc("status.cancelled"), booked: tc("status.booked") })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
