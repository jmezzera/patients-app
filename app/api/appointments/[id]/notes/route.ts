import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionActor } from "@/lib/authz";
import { addAppointmentNote } from "@/lib/repos/appointments";

const schema = z.object({
  patientId: z.string().min(1),
  content: z.string().min(1),
});

type Props = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Props) {
  try {
    const actor = await getSessionActor();
    const { id } = await params;
    const body = schema.parse(await request.json());

    const note = await addAppointmentNote(actor, {
      appointmentId: id,
      patientId: body.patientId,
      content: body.content,
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
