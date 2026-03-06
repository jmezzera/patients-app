import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionActor } from "@/lib/authz";
import {
  getAppointmentStats,
  getPatientStats,
  getAppointmentTimeSeries,
  listDoctors,
} from "@/lib/repos/stats";

const querySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export async function GET(request: Request) {
  try {
    const actor = await getSessionActor();
    const { searchParams } = new URL(request.url);

    const parsed = querySchema.safeParse({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid date parameters" }, { status: 400 });
    }

    const from = parsed.data.from ?? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const to = parsed.data.to ?? new Date();

    const doctorId = searchParams.get("doctorId") ?? undefined;

    const [appointmentStats, patientStats, timeSeries, doctors] = await Promise.all([
      getAppointmentStats(actor, { from, to, doctorId }),
      getPatientStats(actor, { doctorId }),
      getAppointmentTimeSeries(actor, { from, to, doctorId }),
      listDoctors(actor).catch(() => []), // managers only; swallow for doctors
    ]);

    return NextResponse.json({ appointmentStats, patientStats, timeSeries, doctors });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
