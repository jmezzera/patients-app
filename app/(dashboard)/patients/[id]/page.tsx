import Link from "next/link";
import { notFound } from "next/navigation";
import { Role, AppointmentStatus } from "@prisma/client";
import { getSessionActor } from "@/lib/authz";
import { getPatientProfile } from "@/lib/repos/patients";
import { listNutritionPlans } from "@/lib/repos/nutrition-plans";
import { db } from "@/lib/db";
import { ProfileCard } from "@/components/patient/profile-card";
import { MeasurementTable } from "@/components/metrics/measurement-table";
import { TrendChart } from "@/components/metrics/trend-chart";
import { RadarChart } from "@/components/metrics/radar-chart";
import { pivotMeasurements, buildRadarData } from "@/lib/chart-utils";
import { EditPatientRecordForm } from "@/components/forms/edit-patient-record-form";
import { AddPatientNoteForm } from "@/components/forms/add-patient-note-form";
import { AppointmentsCalendar } from "@/components/appointments/appointments-calendar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { params: Promise<{ id: string }> };

export default async function PatientDetailPage({ params }: Props) {
  const actor = await getSessionActor();
  const { id } = await params;

  const [patient, nutritionPlans, doctors] = await Promise.all([
    getPatientProfile(actor, id),
    listNutritionPlans(actor),
    db.user.findMany({
      where: { orgId: actor.orgId, role: Role.DOCTOR },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
    }),
  ]);

  if (!patient) notFound();

  const appointments = patient.appointmentParticipants.map((p) => p.appointment);
  const { data: trendData, series: trendSeries } = pivotMeasurements(patient.measurementEntries);
  const radarData = buildRadarData(patient.measurementEntries);

  const calendarRows = appointments.map((a) => ({
    id: a.id,
    scheduledAt: a.scheduledAt,
    completedAt: a.completedAt,
    label: `${patient.firstName} ${patient.lastName}`,
  }));

  const publicNotes = patient.notes.filter((n) => n.isPublic);
  const internalNotes = patient.notes.filter((n) => !n.isPublic);
  const canEdit = actor.role === Role.DOCTOR || actor.role === Role.MANAGER;

  return (
    <main className="mx-auto grid max-w-5xl gap-4 p-6">
      <h1 className="text-2xl font-semibold">Patient detail</h1>

      <ProfileCard
        fullName={`${patient.firstName} ${patient.lastName}`}
        phone={patient.phone}
        nutritionPlan={patient.nutritionPlan?.name ?? null}
        assignedDoctor={patient.assignedDoctor?.displayName ?? null}
        clinicalSummary={patient.clinicalSummary}
      />

      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Update patient record</CardTitle>
          </CardHeader>
          <CardContent>
            <EditPatientRecordForm
              patientId={patient.id}
              nutritionPlans={nutritionPlans}
              doctors={doctors}
              defaults={{
                phone: patient.phone,
                nutritionPlanId: patient.nutritionPlanId,
                assignedDoctorId: patient.assignedDoctorId,
                clinicalSummary: patient.clinicalSummary,
              }}
            />
          </CardContent>
        </Card>
      )}

      <AppointmentsCalendar title="Appointment calendar" appointments={calendarRows} />

      <Card>
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {appointments.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-md border p-2">
                  <div>
                    <Link href={`/appointments/${a.id}`} className="font-medium underline">
                      {new Date(a.scheduledAt).toLocaleString()}
                    </Link>
                    <p className="text-xs text-muted-foreground">{a.doctor.displayName}</p>
                  </div>
                  {a.status === AppointmentStatus.COMPLETED ? (
                    <Badge>Completed</Badge>
                  ) : a.status === AppointmentStatus.CANCELLED ? (
                    <Badge className="border-red-300 bg-red-100 text-red-700">Cancelled</Badge>
                  ) : (
                    <Badge variant="outline">Booked</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Public notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {canEdit && <AddPatientNoteForm patientId={patient.id} />}
          {publicNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No public notes.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {publicNotes.map((note) => (
                <li key={note.id} className="rounded-md border bg-muted/40 p-2">
                  {note.content}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Internal notes</CardTitle>
        </CardHeader>
        <CardContent>
          {internalNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No internal notes.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {internalNotes.map((note) => (
                <li key={note.id} className="rounded-md border bg-amber-50 p-2">
                  {note.content}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded files</CardTitle>
        </CardHeader>
        <CardContent>
          {patient.uploadedAssets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No files uploaded.</p>
          ) : (
            <ul className="space-y-2">
              {patient.uploadedAssets.map((asset) => (
                <li
                  key={asset.id}
                  className="flex items-center justify-between gap-2 rounded-md border p-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{asset.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(asset.createdAt).toLocaleString()}
                    </p>
                    {asset.appointmentId && (
                      <Link
                        className="text-xs underline"
                        href={`/appointments/${asset.appointmentId}`}
                      >
                        Linked appointment
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{asset.kind}</Badge>
                    <a
                      href={asset.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm underline"
                    >
                      Open
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <MeasurementTable rows={patient.measurementEntries} showAppointmentLinks />
      <RadarChart data={radarData} title="Metric snapshot (latest values)" />
      <TrendChart data={trendData} series={trendSeries} />
    </main>
  );
}
