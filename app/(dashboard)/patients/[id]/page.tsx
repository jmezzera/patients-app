import Link from "next/link";
import { notFound } from "next/navigation";
import { Role, AppointmentStatus } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { getSessionActor } from "@/lib/authz";
import { getPatientProfile, listPatients } from "@/lib/repos/patients";
import { listNutritionPlans } from "@/lib/repos/nutrition-plans";
import { db } from "@/lib/db";
import { PatientInfoCard } from "@/components/patient/patient-info-card";
import { ActivatePatientToggle } from "@/components/patient/activate-patient-toggle";
import { PatientProfileTabs } from "@/components/patient/patient-profile-tabs";
import { MetricsSection } from "@/components/patient/metrics-section";
import { AddPatientNoteForm } from "@/components/forms/add-patient-note-form";
import { PatientAppointmentsPanel } from "@/components/appointments/patient-appointments-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { FoodGallery, type FoodImage } from "@/components/food/food-gallery";
import { pivotMeasurements, type AppointmentMarker, type RawMeasurement } from "@/lib/chart-utils";
import type { MeasurementRowData } from "@/components/metrics/measurement-table-client";

type Props = { params: Promise<{ id: string }> };

export default async function PatientDetailPage({ params }: Props) {
  const actor = await getSessionActor();
  const { id } = await params;
  const t = await getTranslations("patients.detail");
  const tc = await getTranslations("common");

  const [patient, nutritionPlans, doctors, allPatients] = await Promise.all([
    getPatientProfile(actor, id),
    listNutritionPlans(actor),
    db.user.findMany({
      where: { orgId: actor.orgId, role: Role.DOCTOR },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
    }),
    listPatients(actor),
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

  const measurementRows: MeasurementRowData[] = patient.measurementEntries.map((e) => ({
    id: e.id,
    measuredAt: e.measuredAt.toISOString(),
    value: e.value.toString(),
    metricType: { name: e.metricType.name, unit: e.metricType.unit },
    source: e.source,
    appointmentId: e.appointmentId,
    notes: e.notes,
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

  const patientOptions = allPatients.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    color: p.color,
    scheduleSlots: p.user?.weeklySchedule ?? [],
  }));

  const publicNotes = patient.notes.filter((n) => n.isPublic);
  const internalNotes = patient.notes.filter((n) => !n.isPublic);
  const canEdit = actor.role === Role.DOCTOR || actor.role === Role.MANAGER;

  const scheduleSlots = patient.user?.weeklySchedule ?? [];

  // ── Tab content ──────────────────────────────────────────────────────────────

  const profileTab = (
    <>
      <PatientInfoCard
        patientId={patient.id}
        fullName={`${patient.firstName} ${patient.lastName}`}
        phone={patient.phone}
        assignedDoctor={patient.assignedDoctor?.displayName ?? null}
        nutritionPlan={patient.nutritionPlan?.name ?? null}
        clinicalSummary={patient.clinicalSummary}
        color={patient.color}
        scheduleSlots={scheduleSlots}
        canEdit={canEdit}
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

      {/* Notes — public and private in one card */}
      <Card>
        <CardHeader>
          <CardTitle>{t("notes")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {canEdit && <AddPatientNoteForm patientId={patient.id} />}
          {patient.notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noPublicNotes")}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {patient.notes.map((note) =>
                note.isPublic ? (
                  <li key={note.id} className="rounded-md border bg-muted/40 p-2.5">
                    {note.content}
                  </li>
                ) : (
                  <li
                    key={note.id}
                    className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2.5"
                  >
                    <span className="mt-0.5 text-amber-500" title={t("internalNote")}>
                      🔒
                    </span>
                    <span>{note.content}</span>
                  </li>
                ),
              )}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );

  const appointmentsTab = (
    <div className="space-y-4">
      <PatientAppointmentsPanel
        appointments={calendarRows}
        patients={canEdit ? patientOptions : []}
        doctors={doctors}
        defaultDoctorId={actor.role === Role.DOCTOR ? actor.id : patient.assignedDoctorId ?? undefined}
        defaultPatientIds={[patient.id]}
      />

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
    </div>
  );

  const metricsTab = (
    <MetricsSection
      rawRows={rawRows}
      trendData={trendData}
      trendSeries={trendSeries}
      appointmentMarkers={appointmentMarkers}
      measurementRows={measurementRows}
    />
  );

  const foodImages: FoodImage[] = patient.uploadedAssets
    .filter((a) => a.kind === "food")
    .map((a) => ({
      id: a.id,
      fileUrl: a.fileUrl,
      fileName: a.fileName,
      createdAt: a.createdAt.toISOString(),
      comments: a.comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        author: { id: c.author.id, displayName: c.author.displayName, role: c.author.role },
      })),
    }));

  const tf = await getTranslations("food");

  const foodDiaryTab = (
    <Card>
      <CardHeader>
        <CardTitle>{tf("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <FoodGallery images={foodImages} />
      </CardContent>
    </Card>
  );

  return (
    <PageShell>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {patient.color && (
            <span
              className="inline-block h-5 w-5 flex-shrink-0 rounded-full ring-2 ring-white shadow"
              style={{ backgroundColor: patient.color }}
            />
          )}
          <h1 className="text-2xl font-semibold">
            {patient.firstName} {patient.lastName}
          </h1>
        </div>
        {canEdit && (
          <ActivatePatientToggle patientId={patient.id} isActive={patient.isActive} />
        )}
      </div>

      <PatientProfileTabs
        profileTab={profileTab}
        appointmentsTab={appointmentsTab}
        metricsTab={metricsTab}
        foodDiaryTab={foodDiaryTab}
        labels={{
          profile: t("tabs.profile"),
          appointments: t("tabs.appointments"),
          metrics: t("tabs.metrics"),
          foodDiary: tf("title"),
        }}
      />
    </PageShell>
  );
}
