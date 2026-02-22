import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { assertRole, type SessionActor } from "@/lib/authz";
import { recordAuditEvent } from "@/lib/audit";

export async function getAppointment(actor: SessionActor, appointmentId: string) {
  if (actor.role === Role.PATIENT) {
    if (!actor.patientId) {
      throw new Error("Forbidden");
    }

    return db.appointment.findFirst({
      where: { id: appointmentId, orgId: actor.orgId, patientId: actor.patientId },
      include: {
        patient: true,
        metrics: true,
        notes: { orderBy: { createdAt: "desc" } },
        assets: { orderBy: { createdAt: "desc" } },
      },
    });
  }

  assertRole(actor, [Role.MANAGER, Role.DOCTOR]);

  return db.appointment.findFirst({
    where: { id: appointmentId, orgId: actor.orgId },
    include: {
      patient: true,
      metrics: true,
      notes: { orderBy: { createdAt: "desc" } },
      assets: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function listAppointments(actor: SessionActor) {
  assertRole(actor, [Role.MANAGER, Role.DOCTOR]);

  return db.appointment.findMany({
    where: { orgId: actor.orgId },
    include: { patient: true },
    orderBy: { scheduledAt: "desc" },
    take: 100,
  });
}

export async function createAppointment(
  actor: SessionActor,
  input: { patientId: string; scheduledAt: Date },
) {
  assertRole(actor, [Role.MANAGER, Role.DOCTOR]);

  const patient = await db.patient.findFirst({
    where: { id: input.patientId, orgId: actor.orgId },
  });

  if (!patient) {
    throw new Error("Patient not found");
  }

  const appointment = await db.appointment.create({
    data: {
      orgId: actor.orgId,
      patientId: input.patientId,
      scheduledAt: input.scheduledAt,
    },
  });

  await recordAuditEvent({
    orgId: actor.orgId,
    actorId: actor.id,
    action: "appointment.create",
    entityType: "appointment",
    entityId: appointment.id,
    afterJson: appointment,
  });

  return appointment;
}

export async function addAppointmentNote(
  actor: SessionActor,
  input: {
    patientId: string;
    appointmentId: string;
    content: string;
  },
) {
  assertRole(actor, [Role.MANAGER, Role.DOCTOR]);

  const appointment = await db.appointment.findFirst({
    where: {
      id: input.appointmentId,
      orgId: actor.orgId,
      patientId: input.patientId,
    },
  });

  if (!appointment) {
    throw new Error("Appointment not found for this patient");
  }

  const note = await db.doctorNote.create({
    data: {
      orgId: actor.orgId,
      patientId: input.patientId,
      appointmentId: input.appointmentId,
      authorId: actor.id,
      content: input.content,
    },
  });

  await recordAuditEvent({
    orgId: actor.orgId,
    actorId: actor.id,
    action: "doctor_note.create",
    entityType: "doctor_note",
    entityId: note.id,
    afterJson: note,
  });

  return note;
}

export async function addAppointmentMetrics(
  actor: SessionActor,
  input: {
    appointmentId: string;
    metrics: Array<{ key: string; value: string; unit?: string }>;
  },
) {
  assertRole(actor, [Role.MANAGER, Role.DOCTOR]);

  const appointment = await db.appointment.findFirst({
    where: {
      id: input.appointmentId,
      orgId: actor.orgId,
    },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  const created = await db.$transaction(
    input.metrics.map((metric) =>
      db.appointmentMetric.create({
        data: {
          appointmentId: input.appointmentId,
          key: metric.key,
          value: metric.value,
          unit: metric.unit,
        },
      }),
    ),
  );

  await recordAuditEvent({
    orgId: actor.orgId,
    actorId: actor.id,
    action: "appointment_metric.batch_create",
    entityType: "appointment",
    entityId: input.appointmentId,
    afterJson: created,
  });

  return created;
}
