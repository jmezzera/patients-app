import { notFound } from "next/navigation";
import { getSessionActor } from "@/lib/authz";
import { getPatientProfile } from "@/lib/repos/patients";
import { ProfileCard } from "@/components/patient/profile-card";

async function InternalUserProfilePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">My profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Usuarios internos todavia no tienen perfil
      </p>
      <div className="mt-5">
        <ProfileCard
          fullName={`Usuario`}
          nutritionGoal={""}
          clinicalSummary={""}
          phone={""}
        />
      </div>
    </main>
  );
}

export default async function MyProfilePage() {
  const actor = await getSessionActor();

  if (!actor.patientId) {
    return <InternalUserProfilePage />
  }

  const patient = await getPatientProfile(actor, actor.patientId);
  if (!patient) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">My profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Personal details and nutrition goals shared with your care team.
      </p>
      <div className="mt-5">
        <ProfileCard
          fullName={`${patient.firstName} ${patient.lastName}`}
          nutritionGoal={patient.nutritionGoal}
          clinicalSummary={patient.clinicalSummary}
          phone={patient.phone}
        />
      </div>
    </main>
  );
}
