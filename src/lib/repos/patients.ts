import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { assertPatientScope, assertRole, type SessionActor } from "@/lib/authz";
import { recordAuditEvent } from "@/lib/audit";

export async function listPatients(actor: SessionActor) {
  assertRole(actor, [Role.MANAGER, Role.DOCTOR]);

  return db.patient.findMany({
    where: { orgId: actor.orgId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPatientProfile(actor: SessionActor, patientId: string) {
  assertPatientScope(actor, patientId);

  return db.patient.findFirst({
    where: {
      id: patientId,
      orgId: actor.orgId,
    },
    include: {
      measurementEntries: {
        orderBy: { measuredAt: "desc" },
        take: 50,
      },
      appointments: {
        orderBy: { scheduledAt: "desc" },
        take: 30,
      },
      uploadedAssets: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      doctorNotes: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      internalNotes:
        actor.role === Role.PATIENT
          ? false
          : {
              orderBy: { createdAt: "desc" },
              take: 20,
            },
    },
  });
}

export async function updatePatientProfile(
  actor: SessionActor,
  patientId: string,
  payload: {
    nutritionGoal?: string;
    clinicalSummary?: string;
    phone?: string;
  },
) {
  assertRole(actor, [Role.MANAGER, Role.DOCTOR]);

  const before = await db.patient.findFirst({ where: { id: patientId, orgId: actor.orgId } });
  if (!before) {
    throw new Error("Patient not found");
  }

  const after = await db.patient.update({
    where: { id: patientId },
    data: {
      nutritionGoal: payload.nutritionGoal,
      clinicalSummary: payload.clinicalSummary,
      phone: payload.phone,
    },
  });

  await recordAuditEvent({
    orgId: actor.orgId,
    actorId: actor.id,
    action: "patient.update",
    entityType: "patient",
    entityId: patientId,
    beforeJson: before,
    afterJson: after,
  });

  return after;
}
