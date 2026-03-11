import { createGateway } from "@ai-sdk/gateway";
import { streamText, stepCountIs } from "ai";
import { createMgrTools } from "./tools/mgr-tools";
import type { SessionActor } from "@/lib/authz";
import { aiLogger } from "@/lib/ai-logger";

const gateway = createGateway({ apiKey: process.env.VERCEL_AI_TEST_KEY });
export const MGR_CHAT_MODEL = gateway("openai/gpt-4o-mini");

const TODAY = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const MGR_SYSTEM = `\
You are Jami, a practice intelligence assistant for nutritionists and practice managers.
You help doctors and managers explore their practice data by answering questions about patients, appointments, measurements, and trends.

You have access to the following tools:
- listMyPatients: List assigned patients (doctors) or all org patients (managers)
- getMyAppointments: Fetch appointments with optional date/status filters
- getLatestAppointmentSummary: Get details of the most recent completed appointment
- getPatientMetricTrend: Get measurement history for a specific metric for a given patient

Guidelines:
- Always use tools to fetch real data before answering. Do not guess or invent numbers.
- When the user asks about "tomorrow", compute tomorrow's date from today and pass it as the date range.
- Present data clearly using markdown: tables for lists, bold for key numbers.
- When linking to patients or appointments, use ONLY the exact relative path from the tool result's "links" field (e.g. "/patients/abc123"). Never construct or guess URLs — only use what the tool returned.
- Be concise and professional.
- Never diagnose or prescribe — your role is data retrieval and summarization.
Today is ${TODAY}.`;

export function createMgrOrchestrator(actor: SessionActor) {
  const tools = createMgrTools(actor);

  return {
    stream: (
      messages: Array<{ role: "user" | "assistant"; content: string }>,
      onFinish?: (result: { text: string }) => Promise<void>,
    ) =>
      streamText({
        model: MGR_CHAT_MODEL,
        system: MGR_SYSTEM,
        tools,
        stopWhen: stepCountIs(6),
        messages,
        onFinish,
        experimental_telemetry: {
          isEnabled: true,
          functionId: "mgr-chat",
          integrations: [aiLogger],
        },
      }),
  };
}
