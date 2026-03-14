import { createGateway } from "@ai-sdk/gateway";
import { streamText, stepCountIs } from "ai";
import { createMgrDataTools } from "./tools/mgr-tools";
import { createDisplayTools } from "./tools/display-tools";
import { allowedTools, buildToolsPromptBlock, TOOL_REGISTRY } from "./tools/tool-registry";
import { globalBaseline, callerContext } from "./prompts/layers";
import type { SessionActor } from "@/lib/authz";
import { aiLogger } from "@/lib/ai-logger";

const gateway = createGateway({ apiKey: process.env.VERCEL_AI_TEST_KEY });
export const MGR_CHAT_MODEL = gateway("openai/gpt-4o-mini");

// ── Tool declarations for this agent ─────────────────────────────────────────
// Edit this list to control which tools the mgr agent can request.
// Role filtering is applied automatically via allowedTools().

const MGR_WANTED_TOOLS = [
  "renderPatientList",
  "renderAppointmentList",
  "listMyPatients",
  "getMyAppointments",
  "getAppointmentSummaries",
  "getPatientMetricTrend",
] as const;

// ── Static prompt sections ────────────────────────────────────────────────────

const PERSONA = `\
You are Jami, a helpful practice intelligence assistant for nutritionist practices.
You are professional, concise, and accurate. You help managers and doctors quickly access and understand their practice data.`;

const DISPLAY_DECISION_RULES = `\
DECISION RULE — trigger words for DISPLAY tools: show, list, see, browse, display, give me, what are. Examples:
- "list Sofia's appointments" → renderAppointmentList(patientName: "Sofia")
- "show me my patients" → renderPatientList
- "show me this week's appointments" → renderAppointmentList(from: ..., to: ...)
- "how many appointments tomorrow?" → getMyAppointments (reasoning, not display)
- "how many patients do I have?" → listMyPatients (reasoning, not display)

DISPLAY TOOL PARAMETER RULES:
- Call each display tool exactly ONCE per request, even when multiple patients are involved.
- Do NOT call renderAppointmentList once per patient — it shows all matching appointments in one card.
- Only set from/to when the user explicitly mentions a time period ("this week", "tomorrow", "March").
- Only set status when the user explicitly asks for BOOKED/COMPLETED/CANCELLED.
- Only set patientName when the user asks about a specific patient by name.
- NEVER pass IDs from getMyAppointments or getAppointmentSummaries as patientId — those are appointment IDs, not patient IDs.

DISPLAY TOOL TEXT RULES (strict):
1. Do NOT write any lead-in text before calling a display tool. Call the tool immediately.
2. After a display tool call, your text response MUST be one sentence only. Nothing else.
3. NEVER include names, numbers, counts, or any data in that sentence. The card already shows everything.
FORBIDDEN: "Here are your 5 patients: 1. John Smith — Active 2. ..."
CORRECT: [calls renderPatientList] "Here are your patients."`;

const GUIDELINES = `\
Guidelines:
- Always use tools to fetch real data before answering. Do not guess or invent numbers.
- When the user asks about "tomorrow", compute tomorrow's date from today and pass it as the date range.
- Links from the tool result's "links" field are relative paths like /patients/abc123. Write them exactly as-is. NEVER prepend a domain, base URL, or placeholder.
  FORBIDDEN: [Sofia Andrade](https://example.org/patients/abc123)
  CORRECT:   [Sofia Andrade](/patients/abc123)
- When a tool returns patient IDs, always pass patientId (not patientName) in any subsequent tool calls.
- ALWAYS respond in the same language the user writes in.
- Never diagnose or prescribe — your role is data retrieval and summarization.`;

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildMgrSystemPrompt(actor: SessionActor, allowed: string[]): string {
  const toolsBlock = buildToolsPromptBlock(allowed);
  const hasDisplay = allowed.some((n) => TOOL_REGISTRY[n]?.category === "display");

  return [
    PERSONA,
    `You have access to the following tools:\n\n${toolsBlock}`,
    hasDisplay ? DISPLAY_DECISION_RULES : "",
    GUIDELINES,
    globalBaseline(),
    callerContext(actor),
  ]
    .filter(Boolean)
    .join("\n\n");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type PersistedToolPart = {
  toolCallId: string;
  toolName: string;
  input: unknown;
  output: unknown;
};

// ── Factory ───────────────────────────────────────────────────────────────────

export function createMgrOrchestrator(actor: SessionActor) {
  const allowed = allowedTools(actor, MGR_WANTED_TOOLS);
  const system = buildMgrSystemPrompt(actor, allowed);

  // Build the full tool map then pick only what this role is allowed to call.
  const allTools = {
    ...createMgrDataTools(actor),
    ...createDisplayTools(actor),
  };
  const tools = Object.fromEntries(
    allowed
      .filter((name) => name in allTools)
      .map((name) => [name, allTools[name as keyof typeof allTools]]),
  );

  return {
    stream: (
      messages: Array<{ role: "user" | "assistant"; content: string }>,
      onFinish?: (result: { text: string; toolParts: PersistedToolPart[] }) => Promise<void>,
    ) =>
      streamText({
        model: MGR_CHAT_MODEL,
        system,
        tools,
        stopWhen: stepCountIs(6),
        messages,
        onFinish: onFinish
          ? async (event) => {
              const toolParts: PersistedToolPart[] = event.steps.flatMap((step) =>
                step.toolResults.map((r) => ({
                  toolCallId: r.toolCallId,
                  toolName: r.toolName,
                  input: (r as unknown as { input: unknown }).input,
                  output: (r as unknown as { output: unknown }).output,
                })),
              );
              await onFinish({ text: event.text, toolParts });
            }
          : undefined,
        experimental_telemetry: {
          isEnabled: true,
          functionId: "mgr-chat",
          integrations: [aiLogger],
        },
      }),
  };
}
