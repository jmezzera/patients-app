import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionActor } from "@/lib/authz";
import { updatePatientProfile } from "@/lib/repos/patients";

const schema = z.object({
  nutritionGoal: z.string().optional(),
  clinicalSummary: z.string().optional(),
  phone: z.string().optional(),
});

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Props) {
  try {
    const actor = await getSessionActor();
    const { id } = await params;
    const body = schema.parse(await request.json());

    const patient = await updatePatientProfile(actor, id, body);
    return NextResponse.json({ patient });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
