import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionActor } from "@/lib/authz";
import { listNutritionPlans, createNutritionPlan } from "@/lib/repos/nutrition-plans";

const schema = z.object({ name: z.string().min(1).max(100) });

export async function GET() {
  try {
    const actor = await getSessionActor();
    const plans = await listNutritionPlans(actor);
    return NextResponse.json({ plans });
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
    const plan = await createNutritionPlan(actor, body.name);
    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
