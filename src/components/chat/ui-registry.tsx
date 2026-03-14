import type { ComponentType } from "react";
import type { ZodType, z } from "zod";
import {
  patientListResultSchema,
  appointmentListResultSchema,
} from "@/lib/agents/tools/display-tools";
import { PatientListCard } from "./cards/PatientListCard";
import { AppointmentListCard } from "./cards/AppointmentListCard";

type ComponentDef<TSchema extends ZodType> = {
  schema: TSchema;
  Component: ComponentType<{ data: z.infer<TSchema> }>;
};

/**
 * Maps display tool names to their output schema and React card component.
 * Adding a new card type = one entry here; no other file needs to change.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const UI_REGISTRY: Record<string, ComponentDef<ZodType<any>>> = {
  renderPatientList: {
    schema: patientListResultSchema,
    Component: PatientListCard,
  },
  renderAppointmentList: {
    schema: appointmentListResultSchema,
    Component: AppointmentListCard,
  },
};

/** Set of tool names that render UI cards (for filtering in chat components). */
export const DISPLAY_TOOL_NAMES = new Set(Object.keys(UI_REGISTRY));

/**
 * Render the card for a display tool call.
 * Returns null for unknown tool names — safe to call for any tool part.
 */
export function renderDisplayTool(name: string, output: unknown): React.ReactNode {
  const def = UI_REGISTRY[name];
  if (!def) return null;
  const data = def.schema.parse(output);
  return <def.Component data={data} />;
}
