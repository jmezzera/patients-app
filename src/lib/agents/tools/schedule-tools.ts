import { tool } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";
import type { SessionActor } from "@/lib/authz";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function createScheduleTools(actor: SessionActor, patientId: string) {
  const { orgId } = actor;

  return {
    getUpcomingAppointments: tool({
      description:
        "Fetch upcoming BOOKED appointments for the patient, sorted soonest first. Use this to show when the patient's next visit is scheduled.",
      inputSchema: z.object({
        limit: z
          .number()
          .int()
          .min(1)
          .max(10)
          .optional()
          .describe("Max appointments to return (default 5)"),
      }),
      execute: async ({ limit = 5 }) => {
        const now = new Date();
        const participants = await db.appointmentParticipant.findMany({
          where: { patientId },
          include: {
            appointment: {
              include: { doctor: { select: { displayName: true } } },
            },
          },
          orderBy: { appointment: { scheduledAt: "asc" } },
          take: 30,
        });
        const upcoming = participants
          .filter((p) => p.appointment.status === "BOOKED" && p.appointment.scheduledAt >= now)
          .slice(0, limit);
        return {
          appointments: upcoming.map((p) => ({
            id: p.appointment.id,
            scheduledAt: p.appointment.scheduledAt.toISOString(),
            doctor: p.appointment.doctor.displayName,
            links: { appointment: `/appointments/${p.appointment.id}` },
          })),
          links: { profile: "/me" },
        };
      },
    }),

    getPatientSchedulePreferences: tool({
      description:
        "Fetch the patient's preferred days and time windows for appointments, as configured in their profile.",
      inputSchema: z.object({}),
      execute: async () => {
        const patient = await db.patient.findFirst({
          where: { id: patientId, orgId },
          select: { userId: true },
        });
        if (!patient?.userId) {
          return { schedule: [], note: "No schedule preferences configured." };
        }
        const slots = await db.weeklySchedule.findMany({
          where: { userId: patient.userId, orgId },
          orderBy: { dayOfWeek: "asc" },
        });
        return {
          schedule: slots.map((s) => ({
            day: DAY_NAMES[s.dayOfWeek],
            from: s.startTime,
            to: s.endTime,
          })),
          note: slots.length === 0 ? "No schedule preferences configured." : null,
          links: { profile: "/me" },
        };
      },
    }),

    getDoctorAvailability: tool({
      description:
        "Fetch the patient's assigned doctor's weekly working hours and any upcoming calendar blocks (periods they are NOT available). Use this to reason about when a new appointment could be scheduled.",
      inputSchema: z.object({}),
      execute: async () => {
        const patient = await db.patient.findFirst({
          where: { id: patientId, orgId },
          select: {
            assignedDoctorId: true,
            assignedDoctor: { select: { displayName: true } },
          },
        });
        if (!patient?.assignedDoctorId) {
          return { workingHours: [], calendarBlocks: [], note: "No assigned doctor." };
        }
        const [workingHours, calendarBlocks] = await Promise.all([
          db.weeklySchedule.findMany({
            where: { userId: patient.assignedDoctorId, orgId },
            orderBy: { dayOfWeek: "asc" },
          }),
          db.calendarBlock.findMany({
            where: {
              doctorId: patient.assignedDoctorId,
              orgId,
              endsAt: { gte: new Date() },
            },
            orderBy: { startsAt: "asc" },
            take: 20,
          }),
        ]);
        return {
          doctor: patient.assignedDoctor?.displayName ?? null,
          workingHours: workingHours.map((w) => ({
            day: DAY_NAMES[w.dayOfWeek],
            from: w.startTime,
            to: w.endTime,
          })),
          calendarBlocks: calendarBlocks.map((b) => ({
            from: b.startsAt.toISOString(),
            to: b.endsAt.toISOString(),
            reason: b.reason ?? null,
          })),
        };
      },
    }),
  };
}
