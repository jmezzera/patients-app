import { NextResponse } from "next/server";
import { z } from "zod";
import { AppointmentStatus } from "@prisma/client";
import { getSessionActor } from "@/lib/authz";
import { updateAppointmentStatus } from "@/lib/repos/appointments";

const schema = z.object({
  status: z.nativeEnum(AppointmentStatus),
});

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Props) {
  try {
    const actor = await getSessionActor();
    const { id } = await params;
    const body = schema.parse(await request.json());

    const appointment = await updateAppointmentStatus(actor, id, body.status);
    return NextResponse.json({ appointment });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
