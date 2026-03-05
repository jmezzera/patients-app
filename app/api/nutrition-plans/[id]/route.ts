import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/authz";
import { deleteNutritionPlan } from "@/lib/repos/nutrition-plans";

type Props = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Props) {
  try {
    const actor = await getSessionActor();
    const { id } = await params;
    await deleteNutritionPlan(actor, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
