import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionActor } from "@/lib/authz";
import { createMeasurement } from "@/lib/repos/measurements";

const schema = z.object({
  patientId: z.string().optional(),
  metricTypeId: z.string().min(1),
  measuredAt: z.string().min(1),
  value: z.number(),
  notes: z.string().optional(),
  appointmentId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const actor = await getSessionActor();
    const body = schema.parse(await request.json());

    const patientId = body.patientId ?? actor.patientId;
    if (!patientId) {
      return NextResponse.json({ error: "No patient scope" }, { status: 400 });
    }

    const measurement = await createMeasurement(actor, {
      patientId,
      metricTypeId: body.metricTypeId,
      measuredAt: new Date(body.measuredAt),
      value: body.value,
      notes: body.notes,
      appointmentId: body.appointmentId,
    });

    return NextResponse.json({ measurement }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
