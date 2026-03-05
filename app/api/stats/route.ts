import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/authz";
import {
  getAppointmentStats,
  getPatientStats,
  getAppointmentTimeSeries,
  listDoctors,
} from "@/lib/repos/stats";

export async function GET(request: Request) {
  try {
    const actor = await getSessionActor();
    const { searchParams } = new URL(request.url);

    const from = searchParams.get("from")
      ? new Date(searchParams.get("from")!)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // default 90 days

    const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();

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
