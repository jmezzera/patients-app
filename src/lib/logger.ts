type Level = "debug" | "info" | "warn" | "error";

const LEVELS: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };

const rawLevel = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug");
const minLevel: number = LEVELS[(rawLevel as Level) ?? "info"] ?? LEVELS.info;

function emit(level: Level, ns: string, msg: string, data?: unknown) {
  if (LEVELS[level] < minLevel) return;

  const entry: Record<string, unknown> = {
    time: new Date().toISOString(),
    level,
    ns,
    msg,
  };
  if (data !== undefined) entry.data = data;

  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export type Logger = ReturnType<typeof createLogger>;

export function createLogger(namespace: string) {
  return {
    debug: (msg: string, data?: unknown) => emit("debug", namespace, msg, data),
    info: (msg: string, data?: unknown) => emit("info", namespace, msg, data),
    warn: (msg: string, data?: unknown) => emit("warn", namespace, msg, data),
    error: (msg: string, data?: unknown) => emit("error", namespace, msg, data),
  };
}
