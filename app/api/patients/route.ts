import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionActor } from "@/lib/authz";
import { createPatient } from "@/lib/repos/patients";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  dob: z.string().optional(),
  assignedDoctorId: z.string().optional(),
  nutritionPlanId: z.string().optional(),
  clinicalSummary: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const actor = await getSessionActor();
    const body = schema.parse(await request.json());

    const patient = await createPatient(actor, {
      ...body,
      dob: body.dob ? new Date(body.dob) : undefined,
    });

    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
