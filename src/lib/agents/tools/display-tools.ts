import { tool } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";
import type { SessionActor } from "@/lib/authz";

// ── Result schemas (exported for UI registry typing) ─────────────────────────

export const patientListResultSchema = z.object({
  total: z.number(),
  patients: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      nutritionPlan: z.string().nullable(),
      assignedDoctor: z.string().nullable(),
      links: z.object({ detail: z.string() }),
    }),
  ),
});

export const appointmentListResultSchema = z.object({
  total: z.number(),
  patientName: z.string().nullable().optional(),
  appointments: z.array(
    z.object({
      id: z.string(),
      status: z.string(),
      scheduledAt: z.string(),
      doctor: z.string(),
      patients: z.array(z.string()),
      links: z.object({ detail: z.string() }),
    }),
  ),
});

function patientNameWhere(name: string) {
  const words = name.trim().split(/\s+/);
  const clauses = words.map((word) => ({
    OR: [
      { firstName: { contains: word, mode: "insensitive" as const } },
      { lastName: { contains: word, mode: "insensitive" as const } },
    ],
  }));
  return clauses.length === 1 ? clauses[0] : { AND: clauses };
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createDisplayTools(actor: SessionActor) {
  const { orgId } = actor;

  return {
    renderPatientList: tool({
      description:
        "Fetch and DISPLAY all patients as a rich UI card. " +
        "Use this when the user wants to SEE or browse the patient list. " +
        "Do NOT use this when you need patient data for reasoning (e.g. counting, finding an ID) — use listMyPatients for that.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).optional().describe("Max records (default 50)"),
      }),
      execute: async ({ limit = 50 }) => {
        const patients = await db.patient.findMany({
          where: { orgId },
          include: {
            nutritionPlan: { select: { name: true } },
            assignedDoctor: { select: { displayName: true } },
          },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          take: limit,
        });
        return {
          total: patients.length,
          patients: patients.map((p) => ({
            id: p.id,
            name: `${p.firstName} ${p.lastName}`,
            nutritionPlan: p.nutritionPlan?.name ?? null,
            assignedDoctor: p.assignedDoctor?.displayName ?? null,
            links: { detail: `/patients/${p.id}` },
          })),
        };
      },
    }),

    renderAppointmentList: tool({
      description:
        "Fetch and DISPLAY appointments as a rich UI card. " +
        "Use this when the user wants to SEE or browse a list of appointments. " +
        "Do NOT use this when you need appointment data for reasoning — use getMyAppointments for that. " +
        "Call this tool exactly ONCE per request, even if multiple patients are involved. " +
        "IMPORTANT: Omit from/to/status/patientName unless the user explicitly mentions them.",
      inputSchema: z.object({
        from: z
          .string()
          .optional()
          .describe("Start of date range ISO string. Only set when the user mentions a time period (e.g. 'this week', 'tomorrow')."),
        to: z
          .string()
          .optional()
          .describe("End of date range ISO string. Only set when the user mentions a time period."),
        status: z
          .enum(["BOOKED", "COMPLETED", "CANCELLED"])
          .optional()
          .describe("OMIT unless the user explicitly asks for a specific status."),
        patientName: z
          .string()
          .optional()
          .describe("Patient name (partial, case-insensitive). Only set when the user asks about a specific patient."),
        limit: z.number().int().min(1).max(50).optional().describe("Max records (default 20)"),
      }),
      execute: async ({ from, to, status, patientName, limit = 20 }) => {
        let resolvedPatientName: string | null = null;
        if (patientName) {
          const p = await db.patient.findFirst({
            where: { orgId, ...patientNameWhere(patientName) },
            select: { firstName: true, lastName: true },
          });
          if (p) resolvedPatientName = `${p.firstName} ${p.lastName}`;
        }

        const appointments = await db.appointment.findMany({
          where: {
            orgId,
            ...(status ? { status } : {}),
            ...(from || to
              ? {
                  scheduledAt: {
                    ...(from ? { gte: new Date(from) } : {}),
                    ...(to ? { lte: new Date(to) } : {}),
                  },
                }
              : {}),
            ...(patientName
              ? { participants: { some: { patient: patientNameWhere(patientName) } } }
              : {}),
          },
          include: {
            doctor: { select: { displayName: true } },
            participants: {
              include: { patient: { select: { firstName: true, lastName: true } } },
            },
          },
          orderBy: { scheduledAt: "asc" },
          take: limit,
        });
        return {
          total: appointments.length,
          patientName: resolvedPatientName,
          appointments: appointments.map((a) => ({
            id: a.id,
            status: a.status,
            scheduledAt: a.scheduledAt.toISOString(),
            doctor: a.doctor.displayName,
            patients: a.participants.map((p) => `${p.patient.firstName} ${p.patient.lastName}`),
            links: { detail: `/appointments/${a.id}` },
          })),
        };
      },
    }),
  };
}
