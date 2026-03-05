import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionActor } from "@/lib/authz";
import { addPatientNote } from "@/lib/repos/patients";

const schema = z.object({
  content: z.string().min(1),
  isPublic: z.boolean().default(false),
});

type Props = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Props) {
  try {
    const actor = await getSessionActor();
    const { id } = await params;
    const body = schema.parse(await request.json());

    const note = await addPatientNote(actor, {
      patientId: id,
      content: body.content,
      isPublic: body.isPublic,
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
