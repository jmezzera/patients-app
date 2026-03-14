import type { SessionActor } from "@/lib/authz";

/**
 * Injects the current date so all agents share one source of truth.
 * Call once per request and pass the result into every prompt that needs it.
 */
export function globalBaseline(): string {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `Today is ${today}.`;
}

/**
 * Describes who the agent is speaking with.
 * Useful for role-aware tone and access decisions within the prompt.
 */
export function callerContext(actor: SessionActor): string {
  return `You are speaking with a ${actor.role.toLowerCase()} (org: ${actor.orgId}).`;
}
