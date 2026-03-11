import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/authz";
import { listConversations, createConversation } from "@/lib/repos/conversations";

export async function GET() {
  try {
    const actor = await getSessionActor();
    const conversations = await listConversations(actor);
    return NextResponse.json({ conversations });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const actor = await getSessionActor();
    const conversation = await createConversation(actor);
    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
