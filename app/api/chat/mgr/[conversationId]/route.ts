import { getSessionActor } from "@/lib/authz";
import { getStaffConversation, appendMessage } from "@/lib/repos/conversations";
import { createMgrOrchestrator } from "@/lib/agents/mgr-orchestrator";
import { createLogger } from "@/lib/logger";

const log = createLogger("mgr-chat");

export const maxDuration = 60;

type Props = { params: Promise<{ conversationId: string }> };

export async function POST(request: Request, { params }: Props) {
  const { conversationId } = await params;

  try {
    const actor = await getSessionActor();

    const conversation = await getStaffConversation(actor, conversationId);
    if (!conversation) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    const body = await request.json();
    const incomingMessages: Array<{ role: string; parts?: Array<{ type: string; text?: string }> }> =
      body.messages ?? [];

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

    await appendMessage(conversationId, "user", userText);

    // Load full history from DB.
    // For assistant messages, extract only the text from __parts — the LLM does not
    // need to see persisted tool outputs from prior turns, and passing the raw JSON
    // causes the model to echo or hallucinate against it.
    const updated = await getStaffConversation(actor, conversationId);
    const modelMessages = (updated?.messages ?? []).map((m) => {
      if (m.role === "assistant") {
        try {
          const parsed = JSON.parse(m.content) as {
            __parts?: Array<{ type: string; text?: string }>;
          };
          if (Array.isArray(parsed.__parts)) {
            const text = parsed.__parts
              .filter((p): p is { type: "text"; text: string } =>
                p.type === "text" && typeof p.text === "string",
              )
              .map((p) => p.text)
              .join("");
            return { role: "assistant" as const, content: text };
          }
        } catch {
          // fall through to raw content
        }
      }
      return { role: m.role as "user" | "assistant", content: m.content };
    });

    const { stream } = createMgrOrchestrator(actor);
    const result = stream(modelMessages, async ({ text, toolParts }) => {
      if (!text && toolParts.length === 0) return;
      // Persist full parts so tool cards can be re-rendered on reload
      const parts = [
        ...toolParts.map((t) => ({
          type: `tool-${t.toolName}`,
          toolCallId: t.toolCallId,
          state: "output-available",
          input: t.input,
          output: t.output,
        })),
        ...(text ? [{ type: "text", text }] : []),
      ];
      await appendMessage(conversationId, "assistant", JSON.stringify({ __parts: parts }));
    });

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        const msg = error instanceof Error ? error.message : JSON.stringify(error);
        log.error("stream error", { error: msg });
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
