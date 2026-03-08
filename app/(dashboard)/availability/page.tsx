import { Role } from "@prisma/client";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSessionActor } from "@/lib/authz";
import { getWeeklySchedule, listCalendarBlocks } from "@/lib/repos/availability";
import { WorkingHoursForm } from "@/components/availability/working-hours-form";
import { CalendarBlocksPanel } from "@/components/availability/calendar-blocks-panel";
import { PageShell } from "@/components/layout/page-shell";

export default async function AvailabilityPage() {
  const actor = await getSessionActor();
  const t = await getTranslations("availability");

  if (actor.role !== Role.DOCTOR) {
    notFound();
  }

  const [weeklySchedule, blocks] = await Promise.all([
    getWeeklySchedule(actor, actor.id),
    listCalendarBlocks(actor, actor.id),
  ]);

  return (
    <PageShell className="max-w-3xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <WorkingHoursForm userId={actor.id} initialSlots={weeklySchedule} />
      <CalendarBlocksPanel blocks={blocks} />
    </PageShell>
  );
}
