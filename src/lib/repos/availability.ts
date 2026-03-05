import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { assertRole, type SessionActor } from "@/lib/authz";

export async function getWorkingHours(actor: SessionActor, doctorId: string) {
  assertRole(actor, [Role.MANAGER, Role.DOCTOR]);

  return db.workingHours.findMany({
    where: { doctorId, orgId: actor.orgId },
    orderBy: { dayOfWeek: "asc" },
  });
}

export async function setWorkingHours(
  actor: SessionActor,
  doctorId: string,
  hours: Array<{ dayOfWeek: number; startTime: string; endTime: string }>,
) {
  assertRole(actor, [Role.DOCTOR]);

  // Doctors can only edit their own hours
  if (actor.id !== doctorId) throw new Error("Forbidden");

  // Replace full weekly schedule
  await db.workingHours.deleteMany({ where: { doctorId, orgId: actor.orgId } });

  if (hours.length > 0) {
    await db.workingHours.createMany({
      data: hours.map((h) => ({
        orgId: actor.orgId,
        doctorId,
        dayOfWeek: h.dayOfWeek,
        startTime: h.startTime,
        endTime: h.endTime,
      })),
    });
  }

  return db.workingHours.findMany({
    where: { doctorId, orgId: actor.orgId },
    orderBy: { dayOfWeek: "asc" },
  });
}

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
