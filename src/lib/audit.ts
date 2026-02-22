import { db } from "@/lib/db";

type AuditInput = {
  orgId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson?: unknown;
  afterJson?: unknown;
};

export async function recordAuditEvent(input: AuditInput) {
  await db.auditEvent.create({
    data: {
      orgId: input.orgId,
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      beforeJson: input.beforeJson as object | undefined,
      afterJson: input.afterJson as object | undefined,
    },
  });
}
