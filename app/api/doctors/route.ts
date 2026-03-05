import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { getSessionActor } from "@/lib/authz";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const actor = await getSessionActor();

    if (actor.role !== Role.DOCTOR && actor.role !== Role.MANAGER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const doctors = await db.user.findMany({
      where: { orgId: actor.orgId, role: Role.DOCTOR },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
    });

    return NextResponse.json({ doctors });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
