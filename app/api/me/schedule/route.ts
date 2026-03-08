import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionActor } from "@/lib/authz";
import { getWeeklySchedule, setWeeklySchedule } from "@/lib/repos/availability";

const schema = z.array(
  z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  }),
);

export async function GET() {
  try {
    const actor = await getSessionActor();
    const slots = await getWeeklySchedule(actor, actor.id);
    return NextResponse.json({ slots });
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
    const slots = schema.parse(await request.json());
    const saved = await setWeeklySchedule(actor, actor.id, slots);
    return NextResponse.json({ slots: saved });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
