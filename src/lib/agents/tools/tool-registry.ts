import { Role } from "@prisma/client";

type ToolMeta = {
  /** Roles that may invoke this tool. */
  roles: Role[];
  /** How the tool is used — drives prompt grouping and conditional rules. */
  category: "data" | "display";
  /** Short label used when generating the tool list section of a system prompt. */
  label: string;
};

/**
 * Central registry mapping every tool name to its role requirements and category.
 * Add an entry here whenever you introduce a new tool — the prompt builder and
 * orchestrators derive their tool lists from this source of truth.
 */
export const TOOL_REGISTRY: Record<string, ToolMeta> = {
  // ── Shared display tools (MANAGER + DOCTOR) ────────────────────────────────
  renderPatientList: {
    roles: [Role.MANAGER, Role.DOCTOR],
    category: "display",
    label: "render patient list as a UI card",
  },
  renderAppointmentList: {
    roles: [Role.MANAGER, Role.DOCTOR],
    category: "display",
    label: "render appointment list as a UI card",
  },

  // ── Manager / Doctor data tools ────────────────────────────────────────────
  listMyPatients: {
    roles: [Role.MANAGER, Role.DOCTOR],
    category: "data",
    label: "list patients for reasoning (counts, ID lookups)",
  },
  getMyAppointments: {
    roles: [Role.MANAGER, Role.DOCTOR],
    category: "data",
    label: "fetch appointments for reasoning (counts, date filters)",
  },
  getAppointmentSummaries: {
    roles: [Role.MANAGER, Role.DOCTOR],
    category: "data",
    label: "fetch appointments with full notes and metrics",
  },
  getPatientMetricTrend: {
    roles: [Role.MANAGER, Role.DOCTOR],
    category: "data",
    label: "get measurement history for a specific patient metric",
  },

  // ── Patient data tools ─────────────────────────────────────────────────────
  getPatientProfile: {
    roles: [Role.PATIENT],
    category: "data",
    label: "get patient profile",
  },
  getMeasurements: {
    roles: [Role.PATIENT],
    category: "data",
    label: "get patient measurements",
  },
  getClinicalNotes: {
    roles: [Role.PATIENT],
    category: "data",
    label: "get clinical notes",
  },
  getAppointments: {
    roles: [Role.PATIENT],
    category: "data",
    label: "get appointment history",
  },
  getUpcomingAppointments: {
    roles: [Role.PATIENT],
    category: "data",
    label: "get upcoming appointments",
  },
  getPatientSchedulePreferences: {
    roles: [Role.PATIENT],
    category: "data",
    label: "get schedule preferences",
  },
  getDoctorAvailability: {
    roles: [Role.PATIENT],
    category: "data",
    label: "get doctor availability",
  },
};

/**
 * Filter a declared list of tool names to those permitted for the actor's role.
 * Orchestrators call this to derive the final tool set at request time.
 */
export function allowedTools(actor: { role: Role }, wanted: readonly string[]): string[] {
  return wanted.filter((name) => TOOL_REGISTRY[name]?.roles.includes(actor.role));
}

/**
 * Build the "You have access to the following tools:" block for a system prompt,
 * grouping by category (DATA / DISPLAY).  Pass the result of `allowedTools()`.
 */
export function buildToolsPromptBlock(toolNames: string[]): string {
  const data = toolNames.filter((n) => TOOL_REGISTRY[n]?.category === "data");
  const display = toolNames.filter((n) => TOOL_REGISTRY[n]?.category === "display");
  const lines: string[] = [];

  if (data.length) {
    lines.push(
      `DATA tools — use ONLY when you need data to reason, count, or answer a specific question:\n` +
        data.map((n) => `- ${n}: ${TOOL_REGISTRY[n].label}`).join("\n"),
    );
  }
  if (display.length) {
    lines.push(
      `DISPLAY tools — call when the user wants to SEE or browse a list. They render a visual card in the UI:\n` +
        display.map((n) => `- ${n}: ${TOOL_REGISTRY[n].label}`).join("\n"),
    );
  }

  return lines.join("\n\n");
}
