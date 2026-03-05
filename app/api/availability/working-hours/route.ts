import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionActor } from "@/lib/authz";
import { getWorkingHours, setWorkingHours } from "@/lib/repos/availability";

const schema = z.object({
  doctorId: z.string().min(1),
  hours: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/),
    }),
  ),
});

export async function GET(request: Request) {
  try {
    const actor = await getSessionActor();
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId") ?? actor.id;
    const hours = await getWorkingHours(actor, doctorId);
    return NextResponse.json({ hours });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const actor = await getSessionActor();
    const body = schema.parse(await request.json());
    const hours = await setWorkingHours(actor, body.doctorId, body.hours);
    return NextResponse.json({ hours });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
