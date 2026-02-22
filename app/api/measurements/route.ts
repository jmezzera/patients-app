import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionActor } from "@/lib/authz";
import { createMeasurement } from "@/lib/repos/measurements";

const payloadSchema = z.object({
  measuredAt: z.string().min(1),
  weightKg: z.number().optional(),
  bodyFatPct: z.number().optional(),
  waistCm: z.number().optional(),
  notes: z.string().optional(),
  patientId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const actor = await getSessionActor();
    const body = await request.json();
    const parsed = payloadSchema.parse(body);

    const patientId = parsed.patientId ?? actor.patientId;

    if (!patientId) {
      return NextResponse.json({ error: "No patient scope" }, { status: 400 });
    }

    const measurement = await createMeasurement(actor, {
      patientId,
      measuredAt: new Date(parsed.measuredAt),
      weightKg: parsed.weightKg,
      bodyFatPct: parsed.bodyFatPct,
      waistCm: parsed.waistCm,
      notes: parsed.notes,
    });

    return NextResponse.json({ measurement }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
