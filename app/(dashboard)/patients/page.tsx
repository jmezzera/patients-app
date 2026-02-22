import Link from "next/link";
import { getSessionActor } from "@/lib/authz";
import { listPatients } from "@/lib/repos/patients";

export default async function PatientsPage() {
  const actor = await getSessionActor();
  const patients = await listPatients(actor);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Patients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {patients.length} active profiles in your clinic workspace.
          </p>
        </div>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {patients.map((patient) => (
          <li key={patient.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <Link className="text-base font-medium hover:underline" href={`/patients/${patient.id}`}>
              {patient.firstName} {patient.lastName}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">Open chart and trends</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
