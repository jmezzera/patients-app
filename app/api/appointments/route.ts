import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionActor } from "@/lib/authz";
import { createAppointment } from "@/lib/repos/appointments";

const schema = z.object({
  patientId: z.string().min(1),
  scheduledAt: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const actor = await getSessionActor();
    const body = schema.parse(await request.json());

    const appointment = await createAppointment(actor, {
      patientId: body.patientId,
      scheduledAt: new Date(body.scheduledAt),
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
