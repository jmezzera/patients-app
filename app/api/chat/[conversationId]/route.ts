import { streamText, stepCountIs } from "ai";
import { getSessionActor } from "@/lib/authz";
import { getConversation, appendMessage } from "@/lib/repos/conversations";
import { CHAT_MODEL, createOrchestrator } from "@/lib/agents/orchestrator";

export const maxDuration = 60;

type Props = { params: Promise<{ conversationId: string }> };

export async function POST(request: Request, { params }: Props) {
  const { conversationId } = await params;
  console.log(`[chat] POST /api/chat/${conversationId}`);

  try {
    const actor = await getSessionActor();

    if (!actor.patientId) {
      console.warn(`[chat] Forbidden — user has no patientId`);
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const conversation = await getConversation(actor, conversationId);
    if (!conversation) {
      console.warn(`[chat] Conversation ${conversationId} not found for patient ${actor.patientId}`);
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    const body = await request.json();
    const incomingMessages: Array<{ role: string; parts?: Array<{ type: string; text?: string }> }> =
      body.messages ?? [];

    const lastMsg = incomingMessages[incomingMessages.length - 1];
    if (!lastMsg || lastMsg.role !== "user") {
      console.warn(`[chat] Invalid message — last message not from user`);
      return new Response(JSON.stringify({ error: "Invalid message" }), { status: 400 });
    }

    const userText = (lastMsg.parts ?? [])
      .filter((p) => p.type === "text")
      .map((p) => p.text ?? "")
      .join("");

    if (!userText.trim()) {
      return new Response(JSON.stringify({ error: "Empty message" }), { status: 400 });
    }

    console.log(`[chat] User message (${userText.length} chars): "${userText.slice(0, 80)}${userText.length > 80 ? "…" : ""}"`);

    // Save user message
    await appendMessage(conversationId, "user", userText);

    // Load full conversation history from DB (includes the message just saved)
    const updated = await getConversation(actor, conversationId);
    const modelMessages = (updated?.messages ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    console.log(`[chat] History: ${modelMessages.length} messages — starting orchestrator`);

    // Orchestrator: routes to nutritionist or schedule manager as needed
    const { system, tools } = createOrchestrator(actor, actor.patientId);

    const result = streamText({
      model: CHAT_MODEL,
      system,
      tools,
      stopWhen: stepCountIs(10),
      messages: modelMessages,
      onError: ({ error }) => {
        console.error(`[chat] streamText error:`, error);
      },
      onStepFinish: ({ stepNumber, toolCalls, toolResults, text, finishReason }) => {
        if (toolCalls.length) {
          for (const tc of toolCalls) {
            console.log(`[chat] Step ${stepNumber} tool call: ${tc.toolName}`, JSON.stringify(tc.input).slice(0, 200));
          }
        }
        if (toolResults.length) {
          for (const tr of toolResults) {
            const preview = JSON.stringify("output" in tr ? tr.output : tr).slice(0, 200);
            console.log(`[chat] Step ${stepNumber} tool result [${tr.toolName}]: ${preview}`);
          }
        }
        if (text) {
          console.log(`[chat] Step ${stepNumber} text (${finishReason}): "${text.slice(0, 120)}${text.length > 120 ? "…" : ""}"`);
        }
      },
      onFinish: async ({ text, usage, finishReason }) => {
        console.log(`[chat] Finished — reason=${finishReason} tokens=${JSON.stringify(usage)}`);
        if (text) await appendMessage(conversationId, "assistant", text);
      },
    });

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        const msg = error instanceof Error ? error.message : JSON.stringify(error);
        console.error(`[chat] Stream error forwarded to client:`, msg);
        return msg;
      },
    });
  } catch (error) {
    console.error(`[chat] Error:`, error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected error" }),
      { status: 500 },
    );
  }
}
