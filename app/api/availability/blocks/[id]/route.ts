import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/authz";
import { deleteCalendarBlock } from "@/lib/repos/availability";

type Props = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Props) {
  try {
    const actor = await getSessionActor();
    const { id } = await params;
    await deleteCalendarBlock(actor, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
