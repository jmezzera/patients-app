import Link from "next/link";
import { notFound } from "next/navigation";
import { AppointmentStatus } from "@prisma/client";
import { getSessionActor } from "@/lib/authz";
import { getPatientProfile } from "@/lib/repos/patients";
import { ProfileCard } from "@/components/patient/profile-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function InternalUserProfilePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">My profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Usuarios internos todavia no tienen perfil
      </p>
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

  if (!actor.patientId) {
    return <InternalUserProfilePage />;
  }

  const patient = await getPatientProfile(actor, actor.patientId);
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
        <h1 className="text-3xl font-semibold tracking-tight">My profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Personal details and nutrition goals shared with your care team.
        </p>
      </div>

      <ProfileCard
        fullName={`${patient.firstName} ${patient.lastName}`}
        nutritionPlan={patient.nutritionPlan?.name}
        assignedDoctor={patient.assignedDoctor?.displayName}
        clinicalSummary={patient.clinicalSummary}
        phone={patient.phone}
      />

      <Card>
        <CardHeader>
          <CardTitle>My appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {appointments.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-md border p-2">
                  <div>
                    <p className="font-medium">{new Date(a.scheduledAt).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{a.doctor.displayName}</p>
                  </div>
                  {a.status === AppointmentStatus.COMPLETED ? (
                    <Badge>Completed</Badge>
                  ) : (
                    <Badge variant="outline">Booked</Badge>
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
            <CardTitle>Notes from your doctor</CardTitle>
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
          View measurement trends →
        </Link>
      </p>
    </main>
  );
}
