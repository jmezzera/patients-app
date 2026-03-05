import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { assertRole, assertPatientScope, type SessionActor } from "@/lib/authz";
import { recordAuditEvent } from "@/lib/audit";

export async function listPatients(actor: SessionActor, doctorId?: string) {
  assertRole(actor, [Role.MANAGER, Role.DOCTOR]);

  const where =
    actor.role === Role.DOCTOR
      ? { orgId: actor.orgId, assignedDoctorId: actor.id }
      : { orgId: actor.orgId, ...(doctorId ? { assignedDoctorId: doctorId } : {}) };

  return db.patient.findMany({
    where,
    include: {
      nutritionPlan: true,
      assignedDoctor: { select: { id: true, displayName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPatientProfile(actor: SessionActor, patientId: string) {
  assertPatientScope(actor, patientId);

  return db.patient.findFirst({
    where: { id: patientId, orgId: actor.orgId },
    include: {
      nutritionPlan: true,
      assignedDoctor: { select: { id: true, displayName: true } },
      measurementEntries: {
        include: { metricType: true, recorderUser: { select: { displayName: true } } },
        orderBy: { measuredAt: "desc" },
        take: 100,
      },
      appointmentParticipants: {
        include: {
          appointment: {
            include: {
              doctor: { select: { id: true, displayName: true } },
              participants: { include: { patient: true } },
            },
          },
        },
        orderBy: { appointment: { scheduledAt: "desc" } },
        take: 30,
      },
      uploadedAssets: { orderBy: { createdAt: "desc" }, take: 30 },
      notes:
        actor.role === Role.PATIENT
          ? { where: { isPublic: true }, orderBy: { createdAt: "desc" }, take: 20 }
          : { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
}

export async function updatePatientProfile(
  actor: SessionActor,
  patientId: string,
  payload: {
    nutritionPlanId?: string | null;
    clinicalSummary?: string;
    phone?: string;
    assignedDoctorId?: string | null;
  },
) {
  assertRole(actor, [Role.MANAGER, Role.DOCTOR]);

  const before = await db.patient.findFirst({ where: { id: patientId, orgId: actor.orgId } });
  if (!before) throw new Error("Patient not found");

  const after = await db.patient.update({
    where: { id: patientId },
    data: {
      nutritionPlanId: payload.nutritionPlanId,
      clinicalSummary: payload.clinicalSummary,
      phone: payload.phone,
      assignedDoctorId: payload.assignedDoctorId,
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

export async function createPatient(
  actor: SessionActor,
  payload: {
    firstName: string;
    lastName: string;
    dob?: Date;
    phone?: string;
    assignedDoctorId?: string;
    nutritionPlanId?: string;
    clinicalSummary?: string;
  },
) {
  assertRole(actor, [Role.MANAGER, Role.DOCTOR]);

  const patient = await db.patient.create({
    data: {
      orgId: actor.orgId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      dob: payload.dob,
      phone: payload.phone,
      clinicalSummary: payload.clinicalSummary,
      assignedDoctorId:
        payload.assignedDoctorId ?? (actor.role === Role.DOCTOR ? actor.id : undefined),
      nutritionPlanId: payload.nutritionPlanId,
    },
  });

  await recordAuditEvent({
    orgId: actor.orgId,
    actorId: actor.id,
    action: "patient.create",
    entityType: "patient",
    entityId: patient.id,
    afterJson: patient,
  });

  return patient;
}

export async function addPatientNote(
  actor: SessionActor,
  input: { patientId: string; content: string; isPublic: boolean },
) {
  assertRole(actor, [Role.DOCTOR]);

  const note = await db.note.create({
    data: {
      orgId: actor.orgId,
      patientId: input.patientId,
      authorId: actor.id,
      content: input.content,
      isPublic: input.isPublic,
    },
  });

  await recordAuditEvent({
    orgId: actor.orgId,
    actorId: actor.id,
    action: "note.create",
    entityType: "note",
    entityId: note.id,
    afterJson: note,
  });

  return note;
}
