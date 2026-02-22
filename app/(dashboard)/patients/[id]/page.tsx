import { notFound } from "next/navigation";
import { getSessionActor } from "@/lib/authz";
import { getPatientProfile } from "@/lib/repos/patients";
import { ProfileCard } from "@/components/patient/profile-card";
import { MeasurementTable } from "@/components/metrics/measurement-table";
import { TrendChart } from "@/components/metrics/trend-chart";
import { AddInternalNoteForm } from "@/components/forms/add-internal-note-form";
import { EditPatientRecordForm } from "@/components/forms/edit-patient-record-form";
import { ScheduleAppointmentForm } from "@/components/forms/schedule-appointment-form";
import { AppointmentsCalendar } from "@/components/appointments/appointments-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type Props = { params: Promise<{ id: string }> };

export default async function PatientDetailPage({ params }: Props) {
  const actor = await getSessionActor();
  const { id } = await params;

  const patient = await getPatientProfile(actor, id);
  if (!patient) {
    notFound();
  }

  const trendRows = patient.measurementEntries.map((row) => ({
    date: new Date(row.measuredAt).toLocaleDateString(),
    weightKg: row.weightKg ? Number(row.weightKg) : null,
    bodyFatPct: row.bodyFatPct ? Number(row.bodyFatPct) : null,
  }));

  return (
    <main className="mx-auto grid max-w-5xl gap-4 p-6">
      <h1 className="text-2xl font-semibold">Patient detail</h1>
      <ProfileCard
        fullName={`${patient.firstName} ${patient.lastName}`}
        phone={patient.phone}
        nutritionGoal={patient.nutritionGoal}
        clinicalSummary={patient.clinicalSummary}
      />
      <Card>
        <CardHeader>
          <CardTitle>Update patient record</CardTitle>
        </CardHeader>
        <CardContent>
          <EditPatientRecordForm
            patientId={patient.id}
            defaults={{
              phone: patient.phone,
              nutritionGoal: patient.nutritionGoal,
              clinicalSummary: patient.clinicalSummary,
            }}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Schedule appointment</CardTitle>
        </CardHeader>
        <CardContent>
          <ScheduleAppointmentForm
            patientId={patient.id}
            existingAppointments={patient.appointments.map((appointment) => ({
              id: appointment.id,
              scheduledAt: appointment.scheduledAt,
              completedAt: appointment.completedAt,
            }))}
          />
        </CardContent>
      </Card>
      <AppointmentsCalendar
        title="Patient appointment calendar"
        appointments={patient.appointments.map((appointment) => ({
          id: appointment.id,
          scheduledAt: appointment.scheduledAt,
          completedAt: appointment.completedAt,
          label: `${patient.firstName} ${patient.lastName}`,
        }))}
      />
      <Card>
        <CardHeader>
          <CardTitle>Uploaded files</CardTitle>
        </CardHeader>
        <CardContent>
          {patient.uploadedAssets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No files uploaded for this patient yet.</p>
          ) : (
            <ul className="space-y-2">
              {patient.uploadedAssets.map((asset) => (
                <li key={asset.id} className="flex items-center justify-between gap-2 rounded-md border p-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{asset.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(asset.createdAt).toLocaleString()}
                    </p>
                    {asset.appointmentId ? (
                      <Link className="text-xs underline" href={`/appointments/${asset.appointmentId}`}>
                        Linked appointment
                      </Link>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{asset.kind}</Badge>
                    <a href={asset.fileUrl} target="_blank" rel="noreferrer" className="text-sm underline">
                      Open
                    </a>
                  </div>
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
        <div className="mt-1">
          <AddInternalNoteForm patientId={patient.id} />
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {(patient.internalNotes ?? []).map((note) => (
            <li key={note.id} className="rounded-md border bg-muted/40 p-2">
              {note.content}
            </li>
          ))}
        </ul>
        </CardContent>
      </Card>
      <MeasurementTable
        rows={patient.measurementEntries}
        showAppointmentLinks
      />
      <TrendChart rows={trendRows} />
    </main>
  );
}
