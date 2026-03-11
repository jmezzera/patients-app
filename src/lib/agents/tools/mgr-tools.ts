import { tool } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import type { SessionActor } from "@/lib/authz";

export function createMgrTools(actor: SessionActor) {
  const { orgId, id: actorId, role } = actor;
  const isDoctor = role === Role.DOCTOR;

  return {
    listMyPatients: tool({
      description:
        "List patients in the practice. Doctors see only their assigned patients; managers see all patients in the org.",
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
            ...(isDoctor ? { assignedDoctorId: actorId } : {}),
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
            isActive: p.isActive,
            nutritionPlan: p.nutritionPlan?.name ?? null,
            assignedDoctor: p.assignedDoctor?.displayName ?? null,
            links: { detail: `/patients/${p.id}` },
          })),
        };
      },
    }),

    getMyAppointments: tool({
      description:
        "Fetch appointments for the doctor (or all appointments for a manager). Supports date range filtering. Useful for 'how many appointments do I have tomorrow?' type questions.",
      inputSchema: z.object({
        from: z
          .string()
          .optional()
          .describe("Start of date range, ISO date string (e.g. '2025-03-12T00:00:00Z')"),
        to: z
          .string()
          .optional()
          .describe("End of date range, ISO date string (e.g. '2025-03-12T23:59:59Z')"),
        status: z
          .enum(["BOOKED", "COMPLETED", "CANCELLED"])
          .optional()
          .describe("Filter by appointment status"),
        limit: z.number().int().min(1).max(50).optional().describe("Max records (default 20)"),
      }),
      execute: async ({ from, to, status, limit = 20 }) => {
        const appointments = await db.appointment.findMany({
          where: {
            orgId,
            ...(isDoctor ? { doctorId: actorId } : {}),
            ...(status ? { status } : {}),
            ...(from || to
              ? {
                  scheduledAt: {
                    ...(from ? { gte: new Date(from) } : {}),
                    ...(to ? { lte: new Date(to) } : {}),
                  },
                }
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

    getLatestAppointmentSummary: tool({
      description:
        "Fetch the most recent completed appointment, including clinical notes and recorded metrics. Optionally filter by patient name.",
      inputSchema: z.object({
        patientName: z
          .string()
          .optional()
          .describe("Filter by patient name (partial, case-insensitive)"),
      }),
      execute: async ({ patientName }) => {
        // Find most recent completed appointment for this doctor/org
        const appointment = await db.appointment.findFirst({
          where: {
            orgId,
            status: "COMPLETED",
            ...(isDoctor ? { doctorId: actorId } : {}),
            ...(patientName
              ? {
                  participants: {
                    some: {
                      patient: {
                        OR: [
                          { firstName: { contains: patientName, mode: "insensitive" } },
                          { lastName: { contains: patientName, mode: "insensitive" } },
                        ],
                      },
                    },
                  },
                }
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
          orderBy: { completedAt: "desc" },
        });

        if (!appointment) {
          return { summary: null, note: "No completed appointments found." };
        }

        return {
          id: appointment.id,
          scheduledAt: appointment.scheduledAt.toISOString(),
          completedAt: appointment.completedAt?.toISOString() ?? null,
          doctor: appointment.doctor.displayName,
          patients: appointment.participants.map((p) => `${p.patient.firstName} ${p.patient.lastName}`),
          notes: appointment.notes.map((n) => ({
            content: n.content,
            author: n.author.displayName,
            isPublic: n.isPublic,
            date: n.createdAt.toISOString().slice(0, 10),
          })),
          metrics: appointment.metrics.map((m) => ({
            metric: m.metricType.name,
            unit: m.metricType.unit ?? "",
            value: m.value,
          })),
          links: { detail: `/appointments/${appointment.id}` },
        };
      },
    }),

    getPatientMetricTrend: tool({
      description:
        "Fetch the measurement history for a specific metric for a given patient. Useful for trend analysis questions like 'how has patient X's weight changed?'",
      inputSchema: z.object({
        patientName: z
          .string()
          .describe("Patient name to search for (partial, case-insensitive)"),
        metricName: z
          .string()
          .describe("Metric name to fetch (e.g. 'Weight', 'Blood Pressure')"),
        limit: z.number().int().min(1).max(50).optional().describe("Max records (default 20)"),
      }),
      execute: async ({ patientName, metricName, limit = 20 }) => {
        // Find matching patient(s)
        const patients = await db.patient.findMany({
          where: {
            orgId,
            ...(isDoctor ? { assignedDoctorId: actorId } : {}),
            OR: [
              { firstName: { contains: patientName, mode: "insensitive" } },
              { lastName: { contains: patientName, mode: "insensitive" } },
            ],
          },
          select: { id: true, firstName: true, lastName: true },
          take: 3,
        });

        if (patients.length === 0) {
          return { entries: [], note: `No patient found matching "${patientName}".` };
        }

        const patient = patients[0];
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
