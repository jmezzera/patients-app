/**
 * Test harness for the manager/doctor agent.
 *
 * Usage:
 *   pnpm agent:test                                    # runs built-in query suite (independent turns)
 *   pnpm agent:test "query"                            # single query
 *   pnpm agent:test --doctor "Dr. Name" "query"        # pick doctor by display name
 *   pnpm agent:test --doctor-id <id> "query"           # pick doctor by exact DB id
 *   pnpm agent:test --multi-turn "turn1" "turn2" ...   # chained conversation
 *
 * Env: loads .env.local automatically.
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { createMgrOrchestrator } from "@/lib/agents/mgr-orchestrator";
import type { SessionActor } from "@/lib/authz";

// ── Default query suite ──────────────────────────────────────────────────────

const DEFAULT_QUERIES = [
  "How many patients do I have?",
  "What appointments do I have this week?",
  "Show me the latest completed appointment summary.",
];

// ── CLI arg parsing ──────────────────────────────────────────────────────────

function parseArgs(): {
  doctorName?: string;
  doctorId?: string;
  multiTurn: boolean;
  queries: string[];
} {
  const args = process.argv.slice(2);
  let doctorName: string | undefined;
  let doctorId: string | undefined;
  let multiTurn = false;
  const queries: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--doctor" && args[i + 1]) {
      doctorName = args[++i];
    } else if (args[i] === "--doctor-id" && args[i + 1]) {
      doctorId = args[++i];
    } else if (args[i] === "--multi-turn") {
      multiTurn = true;
    } else {
      queries.push(args[i]);
    }
  }

  return { doctorName, doctorId, multiTurn, queries };
}

// ── Formatting helpers ───────────────────────────────────────────────────────

const DIVIDER = "═".repeat(72);
const THIN = "─".repeat(72);

function pretty(val: unknown): string {
  return JSON.stringify(val, null, 2);
}

// ── Single turn ──────────────────────────────────────────────────────────────

type Message = { role: "user" | "assistant"; content: string };

async function runTurn(
  actor: SessionActor,
  history: Message[],
  query: string,
  turnLabel: string,
): Promise<string> {
  const messages: Message[] = [...history, { role: "user", content: query }];

  console.log(`\n${DIVIDER}`);
  console.log(`${turnLabel}: ${query}`);
  console.log(DIVIDER);

  const orchestrator = createMgrOrchestrator(actor);
  const result = orchestrator.stream(messages);

  let stepNum = 0;

  for await (const chunk of result.fullStream) {
    switch (chunk.type) {
      case "tool-call":
        console.log(`\n[TOOL CALL] ${chunk.toolName}  (id: ${chunk.toolCallId})`);
        console.log("  Input:");
        for (const line of pretty(chunk.input).split("\n")) {
          console.log(`    ${line}`);
        }
        break;

      case "tool-result":
        console.log(`[TOOL RESULT] ${chunk.toolName}`);
        console.log("  Output:");
        for (const line of pretty(chunk.output).split("\n")) {
          console.log(`    ${line}`);
        }
        console.log(THIN);
        break;

      case "step-finish":
        stepNum++;
        console.log(
          `[STEP ${stepNum}] finish=${chunk.finishReason}  ` +
            `prompt=${chunk.usage.promptTokens}  ` +
            `completion=${chunk.usage.completionTokens}  ` +
            `total=${chunk.usage.totalTokens}`,
        );
        break;

      case "error":
        console.error("[ERROR]", chunk.error);
        break;
    }
  }

  const finalText = await result.text;
  console.log("\n[FINAL RESPONSE]\n");
  console.log(finalText);
  console.log();
  return finalText;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  const { doctorName, doctorId, multiTurn, queries } = parseArgs();

  const doctor = await db.user.findFirst({
    where: {
      role: Role.DOCTOR,
      ...(doctorId
        ? { id: doctorId }
        : doctorName
          ? { displayName: { contains: doctorName, mode: "insensitive" } }
          : {}),
    },
    include: { patientProfile: true },
  });

  if (!doctor) {
    const hint = doctorId
      ? `id "${doctorId}"`
      : doctorName
        ? `name "${doctorName}"`
        : "any doctor";
    console.error(`No doctor found matching ${hint}. Run pnpm db:seed first.`);
    process.exit(1);
  }

  const actor: SessionActor = {
    id: doctor.id,
    clerkId: doctor.clerkId,
    orgId: doctor.orgId,
    role: doctor.role,
    patientId: doctor.patientProfile?.id ?? null,
    isActive: true,
  };

  console.log(`\nActor : ${doctor.displayName} (${doctor.role})`);
  console.log(`OrgId : ${doctor.orgId}`);
  console.log(`UserId: ${doctor.id}\n`);

  const turns = queries.length > 0 ? queries : DEFAULT_QUERIES;

  if (multiTurn) {
    // Chain turns — each assistant reply is added to history
    const history: Message[] = [];
    for (let i = 0; i < turns.length; i++) {
      const reply = await runTurn(actor, history, turns[i], `TURN ${i + 1}`);
      history.push({ role: "user", content: turns[i] });
      history.push({ role: "assistant", content: reply });
    }
  } else {
    // Independent turns — fresh context each time
    for (const q of turns) {
      await runTurn(actor, [], q, "QUERY");
    }
  }

  await db.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
