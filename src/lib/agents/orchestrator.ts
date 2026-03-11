import { createGateway } from "@ai-sdk/gateway";
import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";
import { createNutritionistTools } from "./tools/nutritionist-tools";
import { createScheduleTools } from "./tools/schedule-tools";
import type { SessionActor } from "@/lib/authz";

const gateway = createGateway({ apiKey: process.env.VERCEL_AI_TEST_KEY });

// The model used for every LLM call — swap to "openai/gpt-4o" for higher quality.
export const CHAT_MODEL = gateway("openai/gpt-4o-mini");

// ─── Worker system prompts ────────────────────────────────────────────────────
// Static: agents fetch patient-specific context via their own tools.

const TODAY = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const NUTRITIONIST_SYSTEM = `\
You are a clinical data retrieval agent for a nutrition practice.
Your job is to look up accurate information about the patient from the database and return a clear, factual summary.
Use your tools to fetch the data you need (profile, measurements, notes, appointments) before answering.
You have access to full appointment history including past and completed appointments — use getAppointments to retrieve them.
Do not guess or invent clinical details — only report what the tools return.
Return a concise plain-text summary suitable for the orchestrator to include in a patient-facing response.
Today is ${TODAY}.`;

const SCHEDULE_SYSTEM = `\
You are a scheduling assistant for a nutrition practice.
Your job is to look up appointment availability and scheduling preferences for the patient.
Use your tools to check upcoming appointments, the patient's weekly preferences, and the doctor's working hours and calendar blocks.
When reasoning about scheduling windows, account for the doctor's working hours minus any calendar blocks.
Return a concise plain-text summary with specific dates and times where possible.
If no upcoming appointments exist, clearly state that and suggest the patient contact the practice.
Today is ${TODAY}.`;

// ─── Orchestrator system prompt ───────────────────────────────────────────────

const ORCHESTRATOR_SYSTEM = `\
You are Jami, a helpful wellness assistant for patients of a nutrition practice.
You have two specialist agents you can delegate to:

- askNutritionist: handles questions about health, nutrition, diet, measurement history, clinical notes, and appointment history (past/completed appointments).
- askScheduleManager: handles questions about UPCOMING (future/booked) appointments, scheduling new appointments, doctor availability, and the patient's time preferences.

Routing rules — follow these strictly:
- Past or completed appointments → always askNutritionist
- Upcoming or future appointments, scheduling, availability → askScheduleManager
- Health, diet, measurements, clinical notes → askNutritionist
- "Last appointment", "previous visit", "most recent appointment" → askNutritionist
- "Next appointment", "upcoming visit", "when is my next" → askScheduleManager
- Questions spanning both domains (e.g. "what should I discuss at my next appointment?") → call both.

After receiving the agents' responses, synthesize them into a single, warm, patient-facing reply.

Formatting guidelines:
- Use markdown. Embed links to relevant pages when referencing data (e.g. [your measurements](/measurements), [your profile](/me)).
- Be warm, concise, and encouraging.
- Never diagnose conditions or prescribe treatments.
- For urgent health concerns, direct the patient to contact their nutritionist directly.
Today is ${TODAY}.`;

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createOrchestrator(actor: SessionActor, patientId: string) {
  const nutritionistTools = createNutritionistTools(actor, patientId);
  const scheduleTools = createScheduleTools(actor, patientId);

  const tools = {
    askNutritionist: tool({
      description:
        "Delegate questions about the patient's nutrition plan, clinical notes, measurement history, or past appointments to the nutritionist specialist.",
      inputSchema: z.object({
        question: z
          .string()
          .describe("The specific question to answer from the patient's clinical/nutrition context."),
      }),
      execute: async ({ question }) => {
        const { text } = await generateText({
          model: CHAT_MODEL,
          system: NUTRITIONIST_SYSTEM,
          messages: [{ role: "user", content: question }],
          tools: nutritionistTools,
          stopWhen: stepCountIs(4),
        });
        return text;
      },
    }),

    askScheduleManager: tool({
      description:
        "Delegate questions about upcoming appointments, scheduling options, or doctor availability to the schedule manager specialist.",
      inputSchema: z.object({
        question: z
          .string()
          .describe("The specific scheduling or appointment question to answer."),
      }),
      execute: async ({ question }) => {
        const { text } = await generateText({
          model: CHAT_MODEL,
          system: SCHEDULE_SYSTEM,
          messages: [{ role: "user", content: question }],
          tools: scheduleTools,
          stopWhen: stepCountIs(4),
        });
        return text;
      },
    }),
  };

  return { system: ORCHESTRATOR_SYSTEM, tools };
}
