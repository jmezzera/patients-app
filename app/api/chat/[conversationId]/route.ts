import { streamText, stepCountIs } from "ai";
import { getSessionActor } from "@/lib/authz";
import { getConversation, appendMessage } from "@/lib/repos/conversations";
import { CHAT_MODEL, createOrchestrator } from "@/lib/agents/orchestrator";
import { createLogger } from "@/lib/logger";
import { aiLogger } from "@/lib/ai-logger";

const log = createLogger("chat");

export const maxDuration = 60;

type Props = { params: Promise<{ conversationId: string }> };

export async function POST(request: Request, { params }: Props) {
  const { conversationId } = await params;
  log.info("POST request", { conversationId });

  try {
    const actor = await getSessionActor();

    if (!actor.patientId) {
      log.warn("Forbidden — user has no patientId", { userId: actor.id });
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const conversation = await getConversation(actor, conversationId);
    if (!conversation) {
      log.warn("Conversation not found", { conversationId, patientId: actor.patientId });
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    const body = await request.json();
    const incomingMessages: Array<{ role: string; parts?: Array<{ type: string; text?: string }> }> =
      body.messages ?? [];

    const lastMsg = incomingMessages[incomingMessages.length - 1];
    if (!lastMsg || lastMsg.role !== "user") {
      log.warn("Invalid message — last message not from user");
      return new Response(JSON.stringify({ error: "Invalid message" }), { status: 400 });
    }

    const userText = (lastMsg.parts ?? [])
      .filter((p) => p.type === "text")
      .map((p) => p.text ?? "")
      .join("");

    if (!userText.trim()) {
      return new Response(JSON.stringify({ error: "Empty message" }), { status: 400 });
    }

    // User message content is sensitive — debug level only
    log.debug("user message", { conversationId, chars: userText.length, text: userText });

    // Save user message
    await appendMessage(conversationId, "user", userText);

    // Load full conversation history from DB (includes the message just saved)
    const updated = await getConversation(actor, conversationId);
    const modelMessages = (updated?.messages ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    log.info("starting orchestrator", { conversationId, historyLength: modelMessages.length });

    // Orchestrator: routes to nutritionist or schedule manager as needed
    const { system, tools } = createOrchestrator(actor, actor.patientId);

    const result = streamText({
      model: CHAT_MODEL,
      system,
      tools,
      stopWhen: stepCountIs(10),
      messages: modelMessages,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "patient-chat:orchestrator",
        integrations: [aiLogger],
      },
      onFinish: async ({ text }) => {
        if (text) await appendMessage(conversationId, "assistant", text);
      },
    });

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        const msg = error instanceof Error ? error.message : JSON.stringify(error);
        log.error("stream error forwarded to client", { error: msg });
        return msg;
      },
    });
  } catch (error) {
    log.error("unhandled error", { error });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected error" }),
      { status: 500 },
    );
  }
}
