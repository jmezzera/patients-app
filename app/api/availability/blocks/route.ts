import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionActor } from "@/lib/authz";
import { listCalendarBlocks, createCalendarBlock } from "@/lib/repos/availability";

const schema = z.object({
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  reason: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const actor = await getSessionActor();
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId") ?? actor.id;
    const blocks = await listCalendarBlocks(actor, doctorId);
    return NextResponse.json({ blocks });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getSessionActor();
    const body = schema.parse(await request.json());
    const block = await createCalendarBlock(actor, {
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
      reason: body.reason,
    });
    return NextResponse.json({ block }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
