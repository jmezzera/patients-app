import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { assertRole, type SessionActor } from "@/lib/authz";
import { recordAuditEvent } from "@/lib/audit";

export async function listMetricTypes(actor: SessionActor) {
  // Patients see only non-doctor-only types
  const where =
    actor.role === Role.PATIENT
      ? { orgId: actor.orgId, doctorOnly: false }
      : { orgId: actor.orgId };

  return db.metricType.findMany({ where, orderBy: { name: "asc" } });
}

export async function createMetricType(
  actor: SessionActor,
  input: { name: string; unit?: string; doctorOnly: boolean },
) {
  assertRole(actor, [Role.DOCTOR]);

  const metricType = await db.metricType.create({
    data: {
      orgId: actor.orgId,
      name: input.name,
      unit: input.unit,
      doctorOnly: input.doctorOnly,
      createdBy: actor.id,
    },
  });

  await recordAuditEvent({
    orgId: actor.orgId,
    actorId: actor.id,
    action: "metric_type.create",
    entityType: "metric_type",
    entityId: metricType.id,
    afterJson: metricType,
  });

  return metricType;
}
