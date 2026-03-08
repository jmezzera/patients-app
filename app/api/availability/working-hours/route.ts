import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionActor } from "@/lib/authz";
import { getWeeklySchedule, setWeeklySchedule } from "@/lib/repos/availability";
import { Role } from "@prisma/client";

const schema = z.object({
  userId: z.string().min(1),
  slots: z.array(
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
    const userId =
      actor.role === Role.DOCTOR ? actor.id : (searchParams.get("userId") ?? actor.id);
    const slots = await getWeeklySchedule(actor, userId);
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
    const body = schema.parse(await request.json());
    const slots = await setWeeklySchedule(actor, body.userId, body.slots);
    return NextResponse.json({ slots });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
