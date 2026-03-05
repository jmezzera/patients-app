import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { assertRole, type SessionActor } from "@/lib/authz";
import { recordAuditEvent } from "@/lib/audit";

export async function listNutritionPlans(actor: SessionActor) {
  assertRole(actor, [Role.MANAGER, Role.DOCTOR]);

  return db.nutritionPlan.findMany({
    where: { orgId: actor.orgId },
    orderBy: { name: "asc" },
  });
}

export async function createNutritionPlan(actor: SessionActor, name: string) {
  assertRole(actor, [Role.MANAGER]);

  const plan = await db.nutritionPlan.create({
    data: { orgId: actor.orgId, name, createdBy: actor.id },
  });

  await recordAuditEvent({
    orgId: actor.orgId,
    actorId: actor.id,
    action: "nutrition_plan.create",
    entityType: "nutrition_plan",
    entityId: plan.id,
    afterJson: plan,
  });

  return plan;
}

export async function deleteNutritionPlan(actor: SessionActor, planId: string) {
  assertRole(actor, [Role.MANAGER]);

  const plan = await db.nutritionPlan.findFirst({
    where: { id: planId, orgId: actor.orgId },
  });
  if (!plan) throw new Error("Nutrition plan not found");

  await db.nutritionPlan.delete({ where: { id: planId } });

  await recordAuditEvent({
    orgId: actor.orgId,
    actorId: actor.id,
    action: "nutrition_plan.delete",
    entityType: "nutrition_plan",
    entityId: planId,
    beforeJson: plan,
  });
}
