import Link from "next/link";
import { notFound } from "next/navigation";
import { Role, AppointmentStatus } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { getSessionActor } from "@/lib/authz";
import { getPatientProfile } from "@/lib/repos/patients";
import { listNutritionPlans } from "@/lib/repos/nutrition-plans";
import { db } from "@/lib/db";
import { ProfileCard } from "@/components/patient/profile-card";
import { MeasurementTable } from "@/components/metrics/measurement-table";
import { TrendChart } from "@/components/metrics/trend-chart";
import { RadarChart } from "@/components/metrics/radar-chart";
import { pivotMeasurements, type AppointmentMarker, type RawMeasurement } from "@/lib/chart-utils";
import { EditPatientRecordForm } from "@/components/forms/edit-patient-record-form";
import { AddPatientNoteForm } from "@/components/forms/add-patient-note-form";
import { AppointmentsCalendar } from "@/components/appointments/appointments-calendar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { params: Promise<{ id: string }> };

export default async function PatientDetailPage({ params }: Props) {
  const actor = await getSessionActor();
  const { id } = await params;
  const t = await getTranslations("patients.detail");
  const tc = await getTranslations("common");

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

  type ApptItem = {
    id: string; scheduledAt: Date; completedAt: Date | null; status: AppointmentStatus;
    doctor: { displayName: string };
    participants: { patient: { id: string; firstName: string; lastName: string; color: string | null; dob: Date | null; nutritionPlanId: string | null } }[];
  };
  const appointments = patient.appointmentParticipants.map((p) => p.appointment as unknown as ApptItem);
  const { data: trendData, series: trendSeries } = pivotMeasurements(patient.measurementEntries);

  const rawRows: RawMeasurement[] = patient.measurementEntries.map((e) => ({
    measuredAt: e.measuredAt.toISOString(),
    value: parseFloat(e.value.toString()),
    source: e.source as "doctor_visit" | "patient_self",
    metricType: {
      name: e.metricType.name,
      unit: e.metricType.unit,
      doctorOnly: e.metricType.doctorOnly,
    },
  }));

  const appointmentMarkers: AppointmentMarker[] = appointments.map((a) => ({
    id: a.id,
    date: new Date(a.scheduledAt).toLocaleDateString(),
    label: a.doctor.displayName,
  }));

  const calendarRows = appointments.map((a) => ({
    id: a.id,
    scheduledAt: a.scheduledAt,
    completedAt: a.completedAt,
    status: a.status,
    doctorName: a.doctor.displayName,
    participants: a.participants.map((ap) => ({
      patientId: ap.patient.id,
      firstName: ap.patient.firstName,
      lastName: ap.patient.lastName,
      color: ap.patient.color ?? null,
      dob: ap.patient.dob ?? null,
      nutritionPlanId: ap.patient.nutritionPlanId ?? null,
      nutritionPlanName: null,
    })),
  }));

  const publicNotes = patient.notes.filter((n) => n.isPublic);
  const internalNotes = patient.notes.filter((n) => !n.isPublic);
  const canEdit = actor.role === Role.DOCTOR || actor.role === Role.MANAGER;

  return (
    <main className="mx-auto grid max-w-5xl gap-4 p-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

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
            <CardTitle>{t("updateRecord")}</CardTitle>
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
                color: patient.color,
              }}
            />
          </CardContent>
        </Card>
      )}

      <AppointmentsCalendar appointments={calendarRows} />

      <Card>
        <CardHeader>
          <CardTitle>{t("appointments")}</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noAppointments")}</p>
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
                    <Badge>{tc("status.completed")}</Badge>
                  ) : a.status === AppointmentStatus.CANCELLED ? (
                    <Badge className="border-red-300 bg-red-100 text-red-700">{tc("status.cancelled")}</Badge>
                  ) : (
                    <Badge variant="outline">{tc("status.booked")}</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("publicNotes")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {canEdit && <AddPatientNoteForm patientId={patient.id} />}
          {publicNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noPublicNotes")}</p>
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
          <CardTitle>{t("internalNotes")}</CardTitle>
        </CardHeader>
        <CardContent>
          {internalNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noInternalNotes")}</p>
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
          <CardTitle>{t("uploadedFiles")}</CardTitle>
        </CardHeader>
        <CardContent>
          {patient.uploadedAssets.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noFiles")}</p>
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
                        {tc("linkedAppointment")}
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
                      {tc("open")}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <MeasurementTable rows={patient.measurementEntries} showAppointmentLinks />
      <RadarChart rawRows={rawRows} title={t("metricSnapshot")} />
      <TrendChart data={trendData} series={trendSeries} title={t("historicTrends")} appointments={appointmentMarkers} />
    </main>
  );
}
