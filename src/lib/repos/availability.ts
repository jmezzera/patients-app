import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { assertRole, type SessionActor } from "@/lib/authz";

// ── Shared: weekly schedule (doctors + patients) ────────────────────────────

export async function getWeeklySchedule(actor: SessionActor, userId: string) {
  assertRole(actor, [Role.MANAGER, Role.DOCTOR, Role.PATIENT]);

  // Patients can only fetch their own schedule
  if (actor.role === Role.PATIENT && actor.id !== userId) throw new Error("Forbidden");

  return db.weeklySchedule.findMany({
    where: { userId, orgId: actor.orgId },
    orderBy: { dayOfWeek: "asc" },
  });
}

export async function setWeeklySchedule(
  actor: SessionActor,
  userId: string,
  slots: Array<{ dayOfWeek: number; startTime: string; endTime: string }>,
) {
  assertRole(actor, [Role.DOCTOR, Role.PATIENT]);

  // Each role can only edit their own schedule
  if (actor.id !== userId) throw new Error("Forbidden");

  await db.weeklySchedule.deleteMany({ where: { userId, orgId: actor.orgId } });

  if (slots.length > 0) {
    await db.weeklySchedule.createMany({
      data: slots.map((s) => ({
        orgId: actor.orgId,
        userId,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    });
  }

  return db.weeklySchedule.findMany({
    where: { userId, orgId: actor.orgId },
    orderBy: { dayOfWeek: "asc" },
  });
}

// ── Doctor availability: calendar blocks ────────────────────────────────────

export async function listCalendarBlocks(actor: SessionActor, doctorId: string) {
  assertRole(actor, [Role.MANAGER, Role.DOCTOR]);

  return db.calendarBlock.findMany({
    where: { doctorId, orgId: actor.orgId, endsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
  });
}

export async function createCalendarBlock(
  actor: SessionActor,
  input: { startsAt: Date; endsAt: Date; reason?: string },
) {
  assertRole(actor, [Role.DOCTOR]);

  return db.calendarBlock.create({
    data: {
      orgId: actor.orgId,
      doctorId: actor.id,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      reason: input.reason,
    },
  });
}

export async function deleteCalendarBlock(actor: SessionActor, blockId: string) {
  assertRole(actor, [Role.DOCTOR]);

  const block = await db.calendarBlock.findFirst({
    where: { id: blockId, doctorId: actor.id, orgId: actor.orgId },
  });
  if (!block) throw new Error("Block not found");

  await db.calendarBlock.delete({ where: { id: blockId } });
}
