import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { assertPatientScope, type SessionActor } from "@/lib/authz";
import { recordAuditEvent } from "@/lib/audit";

export async function listMeasurements(actor: SessionActor, patientId: string) {
  assertPatientScope(actor, patientId);

  return db.measurementEntry.findMany({
    where: {
      orgId: actor.orgId,
      patientId,
    },
    orderBy: { measuredAt: "desc" },
    take: 200,
  });
}

export async function createMeasurement(
  actor: SessionActor,
  input: {
    patientId: string;
    appointmentId?: string;
    measuredAt: Date;
    weightKg?: number;
    bodyFatPct?: number;
    waistCm?: number;
    notes?: string;
  },
) {
  if (actor.role === Role.PATIENT) {
    assertPatientScope(actor, input.patientId);
  }

  if (input.appointmentId) {
    const appointment = await db.appointment.findFirst({
      where: {
        id: input.appointmentId,
        orgId: actor.orgId,
        patientId: input.patientId,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found for measurement");
    }
  }

  const created = await db.measurementEntry.create({
    data: {
      orgId: actor.orgId,
      source: actor.role === Role.PATIENT ? "patient_self" : "doctor_visit",
      measuredAt: input.measuredAt,
      weightKg: input.weightKg,
      bodyFatPct: input.bodyFatPct,
      waistCm: input.waistCm,
      notes: input.notes,
      patient: {
        connect: { id: input.patientId },
      },
      recorderUser: {
        connect: { id: actor.id },
      },
      ...(input.appointmentId
        ? {
            appointment: {
              connect: { id: input.appointmentId },
            },
          }
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
