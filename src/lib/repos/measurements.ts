import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { assertPatientScope, type SessionActor } from "@/lib/authz";
import { recordAuditEvent } from "@/lib/audit";

export async function listMeasurements(actor: SessionActor, patientId: string) {
  assertPatientScope(actor, patientId);

  return db.measurementEntry.findMany({
    where: { orgId: actor.orgId, patientId },
    include: { metricType: true, recorderUser: { select: { displayName: true } } },
    orderBy: { measuredAt: "desc" },
    take: 200,
  });
}

export async function createMeasurement(
  actor: SessionActor,
  input: {
    patientId: string;
    appointmentId?: string;
    metricTypeId: string;
    measuredAt: Date;
    value: number;
    notes?: string;
  },
) {
  if (actor.role === Role.PATIENT) {
    assertPatientScope(actor, input.patientId);

    const metricType = await db.metricType.findFirst({
      where: { id: input.metricTypeId, orgId: actor.orgId },
    });
    if (!metricType) throw new Error("Metric type not found");
    if (metricType.doctorOnly) throw new Error("This metric can only be recorded by a doctor");
  }

  if (input.appointmentId) {
    const appointment = await db.appointment.findFirst({
      where: {
        id: input.appointmentId,
        orgId: actor.orgId,
        participants: { some: { patientId: input.patientId } },
      },
    });
    if (!appointment) throw new Error("Appointment not found for measurement");
  }

  const created = await db.measurementEntry.create({
    data: {
      orgId: actor.orgId,
      source: actor.role === Role.PATIENT ? "patient_self" : "doctor_visit",
      measuredAt: input.measuredAt,
      value: input.value,
      notes: input.notes,
      patient: { connect: { id: input.patientId } },
      recorderUser: { connect: { id: actor.id } },
      metricType: { connect: { id: input.metricTypeId } },
      ...(input.appointmentId
        ? { appointment: { connect: { id: input.appointmentId } } }
        : {}),
    },
  });

  await recordAuditEvent({
    orgId: actor.orgId,
    actorId: actor.id,
    action: "measurement.create",
    entityType: "measurement",
    entityId: created.id,
    afterJson: created,
  });

  return created;
}
