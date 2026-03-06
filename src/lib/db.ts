import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// In development we store the client on globalThis to survive hot-reloads, but
// we recreate it whenever the module is reloaded after a `prisma generate` run
// by checking for the generated client hash. Simplest safe approach: always
// assign a fresh client to global on every module evaluation.
const client = new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = client;
}

export const db = client;
