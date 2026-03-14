import { tool } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";
import type { SessionActor } from "@/lib/authz";

/**
 * Builds a Prisma patient name filter that works for both single words ("Sofia")
 * and full names ("Sofia Andrade"). Each word must appear in either firstName or
 * lastName (case-insensitive), and all words must match (AND).
 */
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

export function createMgrDataTools(actor: SessionActor) {
  const { orgId } = actor;

  return {
    listMyPatients: tool({
      description:
        "List all patients in the practice org.",
      inputSchema: z.object({
        activeOnly: z
          .boolean()
          .optional()
          .describe("If true, return only active patients (default: all)"),
        limit: z.number().int().min(1).max(100).optional().describe("Max records (default 50)"),
      }),
      execute: async ({ activeOnly, limit = 50 }) => {
        const patients = await db.patient.findMany({
          where: {
            orgId,
            ...(activeOnly ? { isActive: true } : {}),
          },
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

    getMyAppointments: tool({
      description:
        "Fetch all appointments in the org. Supports date range, status, and patient filtering. " +
        "Use for questions like 'how many appointments do I have tomorrow?', 'when is patient X's next appointment?', or 'show me all appointments for patient X'. " +
        "Prefer patientId over patientName when you already know the patient's ID.",
      inputSchema: z.object({
        from: z
          .string()
          .optional()
          .describe("Start of date range ISO string. OMIT unless the user explicitly mentions a time period."),
        to: z
          .string()
          .optional()
          .describe("End of date range ISO string. OMIT unless the user explicitly mentions a time period."),
        status: z
          .enum(["BOOKED", "COMPLETED", "CANCELLED"])
          .optional()
          .describe("OMIT unless the user explicitly asks for a specific status. Omitting returns all statuses."),
        patientId: z
          .string()
          .optional()
          .describe("Exact patient ID from a prior tool result. NEVER guess or invent this value."),
        patientName: z
          .string()
          .optional()
          .describe("Patient name (partial, case-insensitive). Use when patientId is unknown."),
        limit: z.number().int().min(1).max(50).optional().describe("Max records (default 20)"),
      }),
      execute: async ({ from, to, status, patientId, patientName, limit = 20 }) => {
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
            ...(patientId
              ? { participants: { some: { patientId } } }
              : patientName
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

    getAppointmentSummaries: tool({
      description:
        "Fetch appointments with full detail (notes and metrics). " +
        "Use for: 'how many appointments last month?', 'what happened in March?', 'show appointments for patient X'. " +
        "IMPORTANT: When the user asks for the 'last N appointments' or 'most recent appointments', do NOT set a from/to date — " +
        "just set limit=N and omit date params so the query searches all time. " +
        "Only add from/to when the user explicitly refers to a specific time period. " +
        "Prefer patientId over patientName when you already know the patient's ID. " +
        "Defaults to COMPLETED status.",
      inputSchema: z.object({
        from: z
          .string()
          .optional()
          .describe("Start of date range, ISO date string (e.g. '2025-03-01T00:00:00Z')"),
        to: z
          .string()
          .optional()
          .describe("End of date range, ISO date string (e.g. '2025-03-31T23:59:59Z')"),
        status: z
          .enum(["BOOKED", "COMPLETED", "CANCELLED"])
          .optional()
          .describe("Filter by appointment status (default: COMPLETED)"),
        patientId: z
          .string()
          .optional()
          .describe("Filter by exact patient ID — use this when you already know the ID"),
        patientName: z
          .string()
          .optional()
          .describe("Filter by patient name (partial, case-insensitive) — only use when patientId is unknown"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe("Max records to return (default 20)"),
      }),
      execute: async ({ from, to, status = "COMPLETED", patientId, patientName, limit = 20 }) => {
        const appointments = await db.appointment.findMany({
          where: {
            orgId,
            status,
            ...(from || to
              ? {
                  scheduledAt: {
                    ...(from ? { gte: new Date(from) } : {}),
                    ...(to ? { lte: new Date(to) } : {}),
                  },
                }
              : {}),
            ...(patientId
              ? { participants: { some: { patientId } } }
              : patientName
                ? { participants: { some: { patient: patientNameWhere(patientName) } } }
                : {}),
          },
          include: {
            doctor: { select: { displayName: true } },
            participants: {
              include: { patient: { select: { firstName: true, lastName: true, id: true } } },
            },
            notes: {
              include: { author: { select: { displayName: true } } },
              orderBy: { createdAt: "desc" },
            },
            metrics: {
              include: { metricType: { select: { name: true, unit: true } } },
            },
          },
          orderBy: { scheduledAt: "desc" },
          take: limit,
        });

        return {
          total: appointments.length,
          appointments: appointments.map((a) => ({
            id: a.id,
            status: a.status,
            scheduledAt: a.scheduledAt.toISOString(),
            completedAt: a.completedAt?.toISOString() ?? null,
            doctor: a.doctor.displayName,
            patients: a.participants.map((p) => `${p.patient.firstName} ${p.patient.lastName}`),
            notes: a.notes.map((n) => ({
              content: n.content,
              author: n.author.displayName,
              isPublic: n.isPublic,
              date: n.createdAt.toISOString().slice(0, 10),
            })),
            metrics: a.metrics.map((m) => ({
              metric: m.metricType.name,
              unit: m.metricType.unit ?? "",
              value: m.value,
            })),
            links: { detail: `/appointments/${a.id}` },
          })),
        };
      },
    }),

    getPatientMetricTrend: tool({
      description:
        "Fetch the measurement history for a specific metric for a given patient. Useful for trend analysis questions like 'how has patient X's weight changed?'. " +
        "Prefer patientId over patientName when you already know the patient's ID.",
      inputSchema: z.object({
        patientId: z
          .string()
          .optional()
          .describe("Exact patient ID — use this when you already know the ID"),
        patientName: z
          .string()
          .optional()
          .describe("Patient name to search for (partial, case-insensitive) — only use when patientId is unknown"),
        metricName: z
          .string()
          .describe("Metric name to fetch (e.g. 'Weight', 'Blood Pressure')"),
        limit: z.number().int().min(1).max(50).optional().describe("Max records (default 20)"),
      }),
      execute: async ({ patientId, patientName, metricName, limit = 20 }) => {
        let patient: { id: string; firstName: string; lastName: string } | null = null;

        if (patientId) {
          patient = await db.patient.findFirst({
            where: { id: patientId, orgId },
            select: { id: true, firstName: true, lastName: true },
          });
        } else if (patientName) {
          const patients = await db.patient.findMany({
            where: { orgId, ...patientNameWhere(patientName) },
            select: { id: true, firstName: true, lastName: true },
            take: 3,
          });
          patient = patients[0] ?? null;
        }

        if (!patient) {
          return { entries: [], note: `No patient found matching "${patientId ?? patientName}".` };
        }
        const entries = await db.measurementEntry.findMany({
          where: {
            orgId,
            patientId: patient.id,
            metricType: { name: { contains: metricName, mode: "insensitive" } },
          },
          include: { metricType: { select: { name: true, unit: true } } },
          orderBy: { measuredAt: "asc" },
          take: limit,
        });

        return {
          patient: `${patient.firstName} ${patient.lastName}`,
          metric: metricName,
          entries: entries.map((e) => ({
            value: e.value.toString(),
            unit: e.metricType.unit ?? "",
            measuredAt: e.measuredAt.toISOString().slice(0, 10),
          })),
          links: { trends: `/patients/${patient.id}` },
        };
      },
    }),
  };
}
