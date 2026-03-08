import Link from "next/link";
import { notFound } from "next/navigation";
import { AppointmentStatus } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { getSessionActor } from "@/lib/authz";
import { getPatientProfile } from "@/lib/repos/patients";
import { getWeeklySchedule } from "@/lib/repos/availability";
import { ProfileCard } from "@/components/patient/profile-card";
import { SchedulePreferenceForm } from "@/components/patient/schedule-preference-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function InternalUserProfilePage() {
  const t = await getTranslations("patient.me");
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">{t("internalTitle")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("internalSubtitle")}</p>
      <div className="mt-5">
        <ProfileCard
          fullName="Usuario"
          nutritionPlan={null}
          assignedDoctor={null}
          clinicalSummary={null}
          phone={null}
        />
      </div>
    </main>
  );
}

export default async function MyProfilePage() {
  const actor = await getSessionActor();
  const t = await getTranslations("patient.me");
  const tc = await getTranslations("common");

  if (!actor.patientId) {
    return <InternalUserProfilePage />;
  }

  const [patient, scheduleSlots] = await Promise.all([
    getPatientProfile(actor, actor.patientId),
    getWeeklySchedule(actor, actor.id),
  ]);

  if (!patient) {
    notFound();
  }

  const appointments = patient.appointmentParticipants
    .map((p) => p.appointment)
    .filter((a) => a.status !== AppointmentStatus.CANCELLED);

  const publicNotes = patient.notes.filter((n) => n.isPublic);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <ProfileCard
        fullName={`${patient.firstName} ${patient.lastName}`}
        nutritionPlan={patient.nutritionPlan?.name}
        assignedDoctor={patient.assignedDoctor?.displayName}
        clinicalSummary={patient.clinicalSummary}
        phone={patient.phone}
      />

      <SchedulePreferenceForm initialSlots={scheduleSlots} />

      <Card>
        <CardHeader>
          <CardTitle>{t("myAppointments")}</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noAppointments")}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {appointments.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-md border p-2">
                  <div>
                    <p className="font-medium">{new Date(a.scheduledAt).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{a.doctor.displayName}</p>
                  </div>
                  {a.status === AppointmentStatus.COMPLETED ? (
                    <Badge>{tc("status.completed")}</Badge>
                  ) : (
                    <Badge variant="outline">{tc("status.booked")}</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {publicNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("notesFromDoctor")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {publicNotes.map((note) => (
                <li key={note.id} className="rounded-md border bg-muted/40 p-2">
                  <p>{note.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <p className="text-sm text-muted-foreground">
        <Link href="/trends" className="underline">
          {t("viewTrends")}
        </Link>
      </p>
    </main>
  );
}
