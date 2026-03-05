import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionActor } from "@/lib/authz";
import { updateNoteVisibility } from "@/lib/repos/appointments";

const schema = z.object({ isPublic: z.boolean() });

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Props) {
  try {
    const actor = await getSessionActor();
    const { id } = await params;
    const body = schema.parse(await request.json());

    const note = await updateNoteVisibility(actor, id, body.isPublic);
    return NextResponse.json({ note });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
