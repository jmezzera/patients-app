import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionActor } from "@/lib/authz";
import { listMetricTypes, createMetricType } from "@/lib/repos/metric-types";

const schema = z.object({
  name: z.string().min(1).max(100),
  unit: z.string().max(20).optional(),
  doctorOnly: z.boolean().default(false),
});

export async function GET() {
  try {
    const actor = await getSessionActor();
    const metricTypes = await listMetricTypes(actor);
    return NextResponse.json({ metricTypes });
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
    const metricType = await createMetricType(actor, body);
    return NextResponse.json({ metricType }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
