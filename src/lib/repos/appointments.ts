import { Role, AppointmentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { assertRole, type SessionActor } from "@/lib/authz";
import { recordAuditEvent } from "@/lib/audit";

const participantInclude = {
  participants: {
    include: { patient: true },
  },
};

export async function getAppointment(actor: SessionActor, appointmentId: string) {
  if (actor.role === Role.PATIENT) {
    if (!actor.patientId) throw new Error("Forbidden");

    return db.appointment.findFirst({
      where: {
        id: appointmentId,
        orgId: actor.orgId,
        participants: { some: { patientId: actor.patientId } },
      },
      include: {
        ...participantInclude,
        doctor: { select: { id: true, displayName: true } },
        metrics: { include: { metricType: true, patient: true } },
        notes: {
          where: { isPublic: true },
          orderBy: { createdAt: "desc" },
        },
        assets: { orderBy: { createdAt: "desc" } },
      },
    });
  }

  assertRole(actor, [Role.MANAGER, Role.DOCTOR]);

  return db.appointment.findFirst({
    where: { id: appointmentId, orgId: actor.orgId },
    include: {
      ...participantInclude,
      doctor: { select: { id: true, displayName: true } },
      metrics: { include: { metricType: true, patient: true } },
      notes: { orderBy: { createdAt: "desc" } },
      assets: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function listAppointments(actor: SessionActor, doctorId?: string) {
  if (actor.role === Role.PATIENT) {
    if (!actor.patientId) throw new Error("Forbidden");

    return db.appointment.findMany({
      where: {
        orgId: actor.orgId,
        participants: { some: { patientId: actor.patientId } },
      },
      include: {
        ...participantInclude,
        doctor: { select: { id: true, displayName: true } },
      },
      orderBy: { scheduledAt: "desc" },
      take: 100,
    });
  }

  assertRole(actor, [Role.MANAGER, Role.DOCTOR]);

  const where =
    actor.role === Role.DOCTOR
      ? { orgId: actor.orgId, doctorId: actor.id }
      : { orgId: actor.orgId, ...(doctorId ? { doctorId } : {}) };

  return db.appointment.findMany({
    where,
    include: {
      ...participantInclude,
      doctor: { select: { id: true, displayName: true } },
    },
    orderBy: { scheduledAt: "desc" },
    take: 100,
  });
}

export async function createAppointment(
  actor: SessionActor,
  input: { patientIds: string[]; doctorId: string; scheduledAt: Date },
) {
  assertRole(actor, [Role.MANAGER, Role.DOCTOR]);

  if (input.patientIds.length === 0) throw new Error("At least one patient required");

  const patients = await db.patient.findMany({
    where: { id: { in: input.patientIds }, orgId: actor.orgId },
  });

  if (patients.length !== input.patientIds.length) {
    throw new Error("One or more patients not found");
  }

  const doctor = await db.user.findFirst({
    where: { id: input.doctorId, orgId: actor.orgId, role: Role.DOCTOR },
  });
  if (!doctor) throw new Error("Invalid doctor");

  const appointment = await db.appointment.create({
    data: {
      orgId: actor.orgId,
      doctorId: input.doctorId,
      scheduledAt: input.scheduledAt,
      participants: {
        create: input.patientIds.map((patientId) => ({ patientId })),
      },
    },
    include: participantInclude,
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

export async function updateAppointmentStatus(
  actor: SessionActor,
  appointmentId: string,
  status: AppointmentStatus,
) {
  assertRole(actor, [Role.MANAGER, Role.DOCTOR]);

  const before = await db.appointment.findFirst({
    where: { id: appointmentId, orgId: actor.orgId },
  });
  if (!before) throw new Error("Appointment not found");

  const completedAt =
    status === AppointmentStatus.COMPLETED ? (before.completedAt ?? new Date()) : null;

  const after = await db.appointment.update({
    where: { id: appointmentId },
    data: { status, completedAt },
  });

  await recordAuditEvent({
    orgId: actor.orgId,
    actorId: actor.id,
    action: "appointment.status_update",
    entityType: "appointment",
    entityId: appointmentId,
    beforeJson: before,
    afterJson: after,
  });

  return after;
}

export async function addAppointmentNote(
  actor: SessionActor,
  input: { patientId: string; appointmentId: string; content: string; isPublic: boolean },
) {
  assertRole(actor, [Role.DOCTOR]);

  const appointment = await db.appointment.findFirst({
    where: {
      id: input.appointmentId,
      orgId: actor.orgId,
      participants: { some: { patientId: input.patientId } },
    },
  });

  if (!appointment) throw new Error("Appointment not found for this patient");

  const note = await db.note.create({
    data: {
      orgId: actor.orgId,
      patientId: input.patientId,
      appointmentId: input.appointmentId,
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

export async function updateNoteVisibility(
  actor: SessionActor,
  noteId: string,
  isPublic: boolean,
) {
  assertRole(actor, [Role.DOCTOR]);

  const note = await db.note.findFirst({
    where: { id: noteId, orgId: actor.orgId, authorId: actor.id },
  });
  if (!note) throw new Error("Note not found");

  const updated = await db.note.update({
    where: { id: noteId },
    data: { isPublic },
  });

  await recordAuditEvent({
    orgId: actor.orgId,
    actorId: actor.id,
    action: "note.visibility_update",
    entityType: "note",
    entityId: noteId,
    beforeJson: note,
    afterJson: updated,
  });

  return updated;
}

export async function addAppointmentMetrics(
  actor: SessionActor,
  input: {
    appointmentId: string;
    metrics: Array<{ patientId: string; metricTypeId: string; value: string }>;
  },
) {
  assertRole(actor, [Role.DOCTOR]);

  const appointment = await db.appointment.findFirst({
    where: { id: input.appointmentId, orgId: actor.orgId },
    include: { participants: { select: { patientId: true } } },
  });
  if (!appointment) throw new Error("Appointment not found");

  const participantIds = new Set(appointment.participants.map((p) => p.patientId));
  for (const m of input.metrics) {
    if (!participantIds.has(m.patientId)) {
      throw new Error(`Patient ${m.patientId} is not a participant of this appointment`);
    }
  }

  const uniqueMetricTypeIds = [...new Set(input.metrics.map((m) => m.metricTypeId))];
  const foundMetricTypes = await db.metricType.findMany({
    where: { id: { in: uniqueMetricTypeIds }, orgId: actor.orgId },
    select: { id: true },
  });
  if (foundMetricTypes.length !== uniqueMetricTypeIds.length) {
    throw new Error("One or more metric types not found");
  }

  const created = await db.$transaction(
    input.metrics.map((m) =>
      db.appointmentMetric.create({
        data: {
          appointmentId: input.appointmentId,
          patientId: m.patientId,
          metricTypeId: m.metricTypeId,
          value: m.value,
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
