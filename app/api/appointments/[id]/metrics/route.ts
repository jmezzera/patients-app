import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionActor } from "@/lib/authz";
import { addAppointmentMetrics } from "@/lib/repos/appointments";

const metricSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  unit: z.string().optional(),
});

const payloadSchema = z.object({
  metrics: z.array(metricSchema).min(1),
});

type Props = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Props) {
  try {
    const actor = await getSessionActor();
    const { id } = await params;
    const body = payloadSchema.parse(await request.json());

    const metrics = await addAppointmentMetrics(actor, {
      appointmentId: id,
      metrics: body.metrics,
    });

    return NextResponse.json({ metrics }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
