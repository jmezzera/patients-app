"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal } from "lucide-react";

type Props = {
  conversationId: string;
  initialMessages: UIMessage[];
};

export function ChatInterface({ conversationId, initialMessages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: `/api/chat/${conversationId}` }),
    messages: initialMessages,
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function submit() {
    const text = input.trim();
    if (!text || isLoading) return;
    sendMessage({ text, metadata: { createdAt: new Date().toISOString() } });
    setInput("");
  }

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    submit();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground pt-8">
            Ask me anything about your nutrition plan, wellness, or upcoming appointments.
          </p>
        )}
        {messages.map((msg) => {
          const text = msg.parts
            .filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join("");

          if (!text) return null;

          const rawTime = (msg.metadata as { createdAt?: string } | undefined)?.createdAt;
          const time = rawTime
            ? new Date(rawTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : null;

          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-0.5 ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {text}
              </div>
              {time && (
                <span className="text-[10px] text-muted-foreground px-1">{time}</span>
              )}
            </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-2 text-sm text-muted-foreground animate-pulse">
              Thinking…
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-start">
            <div className="bg-destructive/10 text-destructive rounded-2xl px-4 py-2 text-sm">
              Something went wrong. Please try again.
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
          rows={2}
          className="resize-none flex-1"
          disabled={isLoading}
        />
        <Button type="submit" className="h-10 w-10 p-0 shrink-0" disabled={isLoading || !input.trim()}>
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
