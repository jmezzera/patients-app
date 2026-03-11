import { tool } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";
import type { SessionActor } from "@/lib/authz";

export function createNutritionistTools(actor: SessionActor, patientId: string) {
  const { orgId } = actor;

  return {
    getPatientProfile: tool({
      description:
        "Fetch the patient's basic profile: name, date of birth, sex, assigned nutritionist, current nutrition plan, and clinical summary.",
      inputSchema: z.object({}),
      execute: async () => {
        const patient = await db.patient.findFirst({
          where: { id: patientId, orgId },
          include: {
            nutritionPlan: { select: { id: true, name: true } },
            assignedDoctor: { select: { id: true, displayName: true } },
          },
        });
        if (!patient) throw new Error("Patient not found");
        return {
          name: `${patient.firstName} ${patient.lastName}`,
          dob: patient.dob?.toISOString() ?? null,
          sex: patient.sex,
          clinicalSummary: patient.clinicalSummary ?? null,
          nutritionPlan: patient.nutritionPlan?.name ?? null,
          assignedDoctor: patient.assignedDoctor?.displayName ?? null,
          links: { profile: "/me" },
        };
      },
    }),

    getMeasurements: tool({
      description:
        "Fetch the patient's measurement history. Optionally filter by metric name (case-insensitive). Returns records sorted most-recent first.",
      inputSchema: z.object({
        metricName: z
          .string()
          .optional()
          .describe('Filter by metric name, e.g. "Weight", "Blood Pressure"'),
        limit: z.number().int().min(1).max(50).optional().describe("Max records to return (default 20)"),
      }),
      execute: async ({ metricName, limit = 20 }) => {
        const entries = await db.measurementEntry.findMany({
          where: {
            patientId,
            orgId,
            ...(metricName
              ? { metricType: { name: { contains: metricName, mode: "insensitive" } } }
              : {}),
          },
          include: { metricType: { select: { name: true, unit: true } } },
          orderBy: { measuredAt: "desc" },
          take: limit,
        });
        return {
          measurements: entries.map((e) => ({
            metric: e.metricType.name,
            unit: e.metricType.unit ?? "",
            value: e.value.toString(),
            measuredAt: e.measuredAt.toISOString().slice(0, 10),
            source: e.source,
            notes: e.notes ?? null,
          })),
          links: { measurements: "/measurements", trends: "/trends" },
        };
      },
    }),

    getClinicalNotes: tool({
      description:
        "Fetch public clinical notes written by the patient's healthcare providers. Returns the most recent notes.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(20).optional().describe("Max notes to return (default 10)"),
      }),
      execute: async ({ limit = 10 }) => {
        const notes = await db.note.findMany({
          where: { patientId, orgId, isPublic: true },
          include: { author: { select: { displayName: true } } },
          orderBy: { createdAt: "desc" },
          take: limit,
        });
        return {
          notes: notes.map((n) => ({
            content: n.content,
            author: n.author.displayName,
            date: n.createdAt.toISOString().slice(0, 10),
            relatedAppointmentId: n.appointmentId ?? null,
          })),
          links: { profile: "/me" },
        };
      },
    }),

    getAppointments: tool({
      description:
        "Fetch the patient's appointments. Optionally filter by status (BOOKED, COMPLETED, CANCELLED). Returns most recent first.",
      inputSchema: z.object({
        status: z
          .enum(["BOOKED", "COMPLETED", "CANCELLED"])
          .optional()
          .describe("Filter by appointment status"),
        limit: z.number().int().min(1).max(20).optional().describe("Max records to return (default 10)"),
      }),
      execute: async ({ status, limit = 10 }) => {
        const participants = await db.appointmentParticipant.findMany({
          where: { patientId },
          include: {
            appointment: {
              include: { doctor: { select: { displayName: true } } },
            },
          },
          orderBy: { appointment: { scheduledAt: "desc" } },
          take: status ? 50 : limit,
        });
        const results = (
          status
            ? participants.filter((p) => p.appointment.status === status).slice(0, limit)
            : participants
        ).map((p) => ({
          id: p.appointment.id,
          status: p.appointment.status,
          scheduledAt: p.appointment.scheduledAt.toISOString(),
          completedAt: p.appointment.completedAt?.toISOString() ?? null,
          doctor: p.appointment.doctor.displayName,
          links: { appointment: `/appointments/${p.appointment.id}` },
        }));
        return { appointments: results, links: { profile: "/me" } };
      },
    }),
  };
}
