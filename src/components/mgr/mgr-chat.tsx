"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart, getToolName, type UIMessage } from "ai";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal, Check, Loader2, ChevronDown } from "lucide-react";

const MD_COMPONENTS: React.ComponentProps<typeof Markdown>["components"] = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  h1: ({ children }) => <h1 className="text-base font-semibold mb-1">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-semibold mb-1">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-medium mb-1">{children}</h3>,
  code: ({ children }) => <code className="bg-black/5 rounded px-1 font-mono text-xs">{children}</code>,
  a: ({ href, children }) => {
    const isRelative = href?.startsWith("/");
    return isRelative ? (
      <Link href={href! as Route} className="text-primary underline underline-offset-2 hover:opacity-80">{children}</Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:opacity-80">{children}</a>
    );
  },
  table: ({ children }) => <table className="w-full text-xs mt-1">{children}</table>,
  th: ({ children }) => <th className="text-left font-medium pb-1 pr-2">{children}</th>,
  td: ({ children }) => <td className="py-0.5 pr-2 border-t border-border">{children}</td>,
};

// ── Tool call display ────────────────────────────────────────────────────────

type ToolPart = Parameters<typeof getToolName>[0];

function ToolGroup({ parts, labels }: { parts: ToolPart[]; labels: Record<string, string> }) {
  const allDone = parts.every((p) => p.state === "output-available");
  const [expanded, setExpanded] = useState(!allDone);

  // Auto-expand while any tool is still running
  useEffect(() => {
    if (!allDone) setExpanded(true);
  }, [allDone]);

  // Single tool — simple inline row, no collapse chrome
  if (parts.length === 1) {
    const name = getToolName(parts[0]);
    const label = labels[name] ?? name;
    const done = parts[0].state === "output-available";
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {done ? (
          <Check className="h-3 w-3 text-green-500 shrink-0" />
        ) : (
          <Loader2 className="h-3 w-3 animate-spin shrink-0" />
        )}
        <span className={done ? "opacity-60" : ""}>{label}</span>
      </div>
    );
  }

  // Multiple tools — group by tool name and show collapsible summary
  const groups = parts.reduce<Record<string, ToolPart[]>>((acc, part) => {
    const name = getToolName(part);
    (acc[name] ??= []).push(part);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-0.5">
      {/* Summary header — always visible */}
      <button
        onClick={() => setExpanded((e) => !e)}
        disabled={!allDone}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none"
      >
        {allDone ? (
          <Check className="h-3 w-3 text-green-500 shrink-0" />
        ) : (
          <Loader2 className="h-3 w-3 animate-spin shrink-0" />
        )}
        <span className={allDone ? "opacity-60" : ""}>
          {allDone ? `${parts.length} queries complete` : "Querying data\u2026"}
        </span>
        {allDone && (
          <ChevronDown
            className={`h-3 w-3 opacity-40 transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {/* Expandable breakdown by tool name */}
      {expanded && (
        <div className="pl-4 border-l border-border/40 flex flex-col gap-0.5 mt-0.5">
          {Object.entries(groups).map(([name, groupParts]) => {
            const label = labels[name] ?? name;
            const groupDone = groupParts.every((p) => p.state === "output-available");
            const count = groupParts.length;
            return (
              <div key={name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {groupDone ? (
                  <Check className="h-2.5 w-2.5 text-green-500 shrink-0" />
                ) : (
                  <Loader2 className="h-2.5 w-2.5 animate-spin shrink-0" />
                )}
                <span className={groupDone ? "opacity-50" : ""}>{label}</span>
                {count > 1 && (
                  <span className="opacity-30 tabular-nums">×{count}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

type Props = {
  conversationId: string;
  initialMessages: UIMessage[];
};

export function MgrChat({ conversationId, initialMessages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const t = useTranslations("assistant");
  const tc = useTranslations("chat");

  const SUGGESTED_QUESTIONS = [
    t("suggested.patients"),
    t("suggested.appointments"),
    t("suggested.summary"),
    t("suggested.weight"),
  ];

  const TOOL_LABELS: Record<string, string> = {
    listMyPatients: t("tools.listMyPatients"),
    getMyAppointments: t("tools.getMyAppointments"),
    getAppointmentSummaries: t("tools.getAppointmentSummaries"),
    getLatestAppointmentSummary: t("tools.getLatestAppointmentSummary"),
    getPatientMetricTrend: t("tools.getPatientMetricTrend"),
  };

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: `/api/chat/mgr/${conversationId}` }),
    messages: initialMessages,
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function submit(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || isLoading) return;
    sendMessage({ text: msg, metadata: { createdAt: new Date().toISOString() } });
    if (!text) setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  // Show "Thinking…" only before the assistant has started responding
  const lastMsg = messages[messages.length - 1];
  const showThinking = isLoading && (!lastMsg || lastMsg.role === "user");

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-4 pt-8">
            <p className="text-center text-sm text-muted-foreground">
              {t("emptyState")}
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => submit(q)}
                  disabled={isLoading}
                  className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const textParts = msg.parts.filter(
            (p): p is { type: "text"; text: string } => p.type === "text",
          );
          const toolParts = msg.parts.filter(isToolUIPart);
          const text = textParts.map((p) => p.text).join("");

          const rawTime = (msg.metadata as { createdAt?: string } | undefined)?.createdAt;
          const time = rawTime
            ? new Date(rawTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : null;

          if (msg.role === "user") {
            if (!text) return null;
            return (
              <div key={msg.id} className="flex flex-col gap-0.5 items-end">
                <div className="max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap bg-primary text-primary-foreground">
                  {text}
                </div>
                {time && <span className="text-[10px] text-muted-foreground px-1">{time}</span>}
              </div>
            );
          }

          // Assistant message
          if (!text && toolParts.length === 0) return null;

          return (
            <div key={msg.id} className="flex flex-col gap-1.5 items-start">
              {/* Tool call group */}
              {toolParts.length > 0 && (
                <ToolGroup parts={toolParts as ToolPart[]} labels={TOOL_LABELS} />
              )}

              {/* Response text */}
              {text && (
                <div className="max-w-[80%] rounded-2xl px-4 py-2 text-sm bg-muted text-foreground">
                  <Markdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{text}</Markdown>
                </div>
              )}

              {time && <span className="text-[10px] text-muted-foreground px-1">{time}</span>}
            </div>
          );
        })}

        {showThinking && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-2 text-sm text-muted-foreground animate-pulse">
              {tc("thinking")}
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="bg-destructive/10 text-destructive rounded-2xl px-4 py-2 text-sm">
              {tc("error")}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="border-t p-4 flex gap-2 items-end"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("placeholder")}
          rows={2}
          className="resize-none flex-1"
          disabled={isLoading}
        />
        <Button
          type="submit"
          className="h-10 w-10 p-0 shrink-0"
          disabled={isLoading || !input.trim()}
        >
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
