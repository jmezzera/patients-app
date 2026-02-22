import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { assertRole, type SessionActor } from "@/lib/authz";
import { recordAuditEvent } from "@/lib/audit";

export async function addInternalNote(
  actor: SessionActor,
  input: { patientId: string; content: string },
) {
  assertRole(actor, [Role.MANAGER, Role.DOCTOR]);

  const note = await db.internalNote.create({
    data: {
      orgId: actor.orgId,
      patientId: input.patientId,
      authorId: actor.id,
      content: input.content,
    },
  });

  await recordAuditEvent({
    orgId: actor.orgId,
    actorId: actor.id,
    action: "internal_note.create",
    entityType: "internal_note",
    entityId: note.id,
    afterJson: note,
  });

  return note;
}
