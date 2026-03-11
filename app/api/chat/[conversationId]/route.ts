import { createGateway } from "@ai-sdk/gateway";
import { streamText } from "ai";

const gateway = createGateway({ apiKey: process.env.VERCEL_AI_API_KEY });
import { getSessionActor } from "@/lib/authz";
import { getConversation, appendMessage } from "@/lib/repos/conversations";
import { getPatientProfile } from "@/lib/repos/patients";

export const maxDuration = 30;

type Props = { params: Promise<{ conversationId: string }> };

function buildSystemPrompt(
  patient: NonNullable<Awaited<ReturnType<typeof getPatientProfile>>>,
): string {
  const lines = [
    `You are a helpful nutrition and wellness assistant for ${patient.firstName} ${patient.lastName}.`,
    `You are part of a nutritionist practice platform. Help the patient with questions about their nutrition plan, wellness habits, measurements, and upcoming appointments.`,
    "",
    "Patient context:",
    `- Name: ${patient.firstName} ${patient.lastName}`,
  ];

  if (patient.nutritionPlan) {
    lines.push(`- Nutrition Plan: ${patient.nutritionPlan.name}`);
  }

  if (patient.clinicalSummary) {
    lines.push(`- Clinical Notes: ${patient.clinicalSummary}`);
  }

  const recent = patient.measurementEntries.slice(0, 5);
  if (recent.length > 0) {
    lines.push("- Recent measurements:");
    for (const m of recent) {
      const unit = m.metricType?.unit ?? "";
      const date = new Date(m.measuredAt).toLocaleDateString();
      lines.push(`  • ${m.metricType?.name ?? "Unknown"}: ${m.value} ${unit} (${date})`);
    }
  }

  lines.push(
    "",
    "Guidelines:",
    "- Be supportive, encouraging, and concise.",
    "- Do not provide medical diagnoses or replace professional medical advice.",
    "- For specific health concerns, remind the patient to speak with their healthcare provider.",
  );

  return lines.join("\n");
}

export async function POST(request: Request, { params }: Props) {
  try {
    const { conversationId } = await params;
    const actor = await getSessionActor();

    if (!actor.patientId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const conversation = await getConversation(actor, conversationId);
    if (!conversation) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    const body = await request.json();
    const incomingMessages: Array<{ role: string; parts?: Array<{ type: string; text?: string }> }> =
      body.messages ?? [];

    // Extract text from the last user message sent by the client
    const lastMsg = incomingMessages[incomingMessages.length - 1];
    if (!lastMsg || lastMsg.role !== "user") {
      return new Response(JSON.stringify({ error: "Invalid message" }), { status: 400 });
    }

    const userText = (lastMsg.parts ?? [])
      .filter((p) => p.type === "text")
      .map((p) => p.text ?? "")
      .join("");

    if (!userText.trim()) {
      return new Response(JSON.stringify({ error: "Empty message" }), { status: 400 });
    }

    // Save user message to DB
    await appendMessage(conversationId, "user", userText);

    // Reload conversation with the new message included
    const updated = await getConversation(actor, conversationId);
    const modelMessages = (updated?.messages ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const patient = await getPatientProfile(actor, actor.patientId);
    if (!patient) {
      return new Response(JSON.stringify({ error: "Patient not found" }), { status: 404 });
    }

    const result = streamText({
      model: gateway("openai/gpt-4o-mini"),
      system: buildSystemPrompt(patient),
      messages: modelMessages,
      onFinish: async ({ text }) => {
        await appendMessage(conversationId, "assistant", text);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected error" }),
      { status: 500 },
    );
  }
}
