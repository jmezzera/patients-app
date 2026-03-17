import { NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import { getSessionActor } from "@/lib/authz";
import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

type Props = { params: Promise<{ id: string }> };

const postSchema = z.object({
  content: z.string().min(1).max(500),
});

/** GET /api/assets/:id/comments — list comments for an asset */
export async function GET(_request: Request, { params }: Props) {
  try {
    const actor = await getSessionActor();
    const { id } = await params;

    const asset = await db.uploadedAsset.findFirst({
      where: { id, orgId: actor.orgId },
    });
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Patients can only see their own assets
    if (actor.role === Role.PATIENT && actor.patientId !== asset.patientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const comments = await db.assetComment.findMany({
      where: { assetId: id },
      include: { author: { select: { id: true, displayName: true, role: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}

/** POST /api/assets/:id/comments — add a comment to an asset */
export async function POST(request: Request, { params }: Props) {
  try {
    const actor = await getSessionActor();
    const { id } = await params;
    const body = postSchema.parse(await request.json());

    const asset = await db.uploadedAsset.findFirst({
      where: { id, orgId: actor.orgId },
    });
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Patients can only comment on their own assets
    if (actor.role === Role.PATIENT && actor.patientId !== asset.patientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const comment = await db.assetComment.create({
      data: {
        orgId: actor.orgId,
        assetId: id,
        authorId: actor.id,
        content: body.content,
      },
      include: { author: { select: { id: true, displayName: true, role: true } } },
    });

    await recordAuditEvent({
      orgId: actor.orgId,
      actorId: actor.id,
      action: "asset_comment.create",
      entityType: "asset_comment",
      entityId: comment.id,
      afterJson: comment,
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
