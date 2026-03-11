import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import type { SessionActor } from "@/lib/authz";

function assertActivePatient(actor: SessionActor) {
  if (actor.role !== Role.PATIENT || !actor.patientId) {
    throw new Error("Forbidden");
  }
}

export async function listConversations(actor: SessionActor) {
  assertActivePatient(actor);
  return db.conversation.findMany({
    where: { orgId: actor.orgId, patientId: actor.patientId! },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export async function getConversation(actor: SessionActor, conversationId: string) {
  assertActivePatient(actor);
  return db.conversation.findFirst({
    where: { id: conversationId, orgId: actor.orgId, patientId: actor.patientId! },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function createConversation(actor: SessionActor) {
  assertActivePatient(actor);
  return db.conversation.create({
    data: { orgId: actor.orgId, patientId: actor.patientId! },
  });
}

export async function appendMessage(conversationId: string, role: string, content: string) {
  await db.$transaction([
    db.chatMessage.create({ data: { conversationId, role, content } }),
    db.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
  ]);
}
