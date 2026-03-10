import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionActor } from "@/lib/authz";
import { setPatientActive } from "@/lib/repos/patients";

const schema = z.object({ isActive: z.boolean() });

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Props) {
  try {
    const actor = await getSessionActor();
    const { id } = await params;
    const { isActive } = schema.parse(await request.json());

    const patient = await setPatientActive(actor, id, isActive);
    return NextResponse.json({ patient });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
