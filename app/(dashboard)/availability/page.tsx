import { Role } from "@prisma/client";
import { notFound } from "next/navigation";
import { getSessionActor } from "@/lib/authz";
import { getWorkingHours, listCalendarBlocks } from "@/lib/repos/availability";
import { WorkingHoursForm } from "@/components/availability/working-hours-form";
import { CalendarBlocksPanel } from "@/components/availability/calendar-blocks-panel";

export default async function AvailabilityPage() {
  const actor = await getSessionActor();

  if (actor.role !== Role.DOCTOR) {
    notFound();
  }

  const [workingHours, blocks] = await Promise.all([
    getWorkingHours(actor, actor.id),
    listCalendarBlocks(actor, actor.id),
  ]);

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Availability</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set your weekly working hours and block off unavailable times.
        </p>
      </div>
      <WorkingHoursForm doctorId={actor.id} initialHours={workingHours} />
      <CalendarBlocksPanel blocks={blocks} />
    </main>
  );
}
