import { Role, AppointmentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { assertRole, type SessionActor } from "@/lib/authz";

export async function getAppointmentStats(
  actor: SessionActor,
  params: { from: Date; to: Date; doctorId?: string },
) {
  assertRole(actor, [Role.MANAGER, Role.DOCTOR]);

  const where = {
    orgId: actor.orgId,
    scheduledAt: { gte: params.from, lte: params.to },
    ...(params.doctorId ? { doctorId: params.doctorId } : {}),
  };

  const [total, completed, cancelled, booked] = await Promise.all([
    db.appointment.count({ where }),
    db.appointment.count({ where: { ...where, status: AppointmentStatus.COMPLETED } }),
    db.appointment.count({ where: { ...where, status: AppointmentStatus.CANCELLED } }),
    db.appointment.count({ where: { ...where, status: AppointmentStatus.BOOKED } }),
  ]);

  return { total, completed, cancelled, booked };
}

export async function getPatientStats(
  actor: SessionActor,
  params: { doctorId?: string },
) {
  assertRole(actor, [Role.MANAGER, Role.DOCTOR]);

  const where = {
    orgId: actor.orgId,
    ...(params.doctorId ? { assignedDoctorId: params.doctorId } : {}),
  };

  const total = await db.patient.count({ where });
  return { total };
}

export async function getAppointmentTimeSeries(
  actor: SessionActor,
  params: { from: Date; to: Date; doctorId?: string },
) {
  assertRole(actor, [Role.MANAGER, Role.DOCTOR]);

  const appointments = await db.appointment.findMany({
    where: {
      orgId: actor.orgId,
      scheduledAt: { gte: params.from, lte: params.to },
      ...(params.doctorId ? { doctorId: params.doctorId } : {}),
    },
    select: { scheduledAt: true, status: true },
    orderBy: { scheduledAt: "asc" },
  });

  // Group by week (ISO week string YYYY-WNN)
  const weeks = new Map<string, { completed: number; total: number }>();
  for (const appt of appointments) {
    const d = new Date(appt.scheduledAt);
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
    const key = `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
    const entry = weeks.get(key) ?? { completed: 0, total: 0 };
    entry.total++;
    if (appt.status === AppointmentStatus.COMPLETED) entry.completed++;
    weeks.set(key, entry);
  }

  return Array.from(weeks.entries()).map(([week, counts]) => ({ week, ...counts }));
}

export async function listDoctors(actor: SessionActor) {
  assertRole(actor, [Role.MANAGER, Role.DOCTOR]);

  return db.user.findMany({
    where: { orgId: actor.orgId, role: Role.DOCTOR },
    select: { id: true, displayName: true },
    orderBy: { displayName: "asc" },
  });
}
