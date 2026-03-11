import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { UIMessage } from "ai";
import { getSessionActor } from "@/lib/authz";
import { getConversation } from "@/lib/repos/conversations";
import { ChatInterface } from "@/components/patient/chat-interface";

type Props = { params: Promise<{ conversationId: string }> };

export default async function ConversationPage({ params }: Props) {
  const { conversationId } = await params;
  const actor = await getSessionActor();

  if (!actor.patientId) {
    redirect("/me");
  }

  const conversation = await getConversation(actor, conversationId);
  if (!conversation) {
    notFound();
  }

  const initialMessages: UIMessage[] = conversation.messages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    parts: [{ type: "text" as const, text: m.content }],
  }));

  const title = conversation.title ?? new Date(conversation.createdAt).toLocaleDateString();

  return (
    <div className="mx-auto max-w-2xl flex flex-col h-[calc(100dvh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
        <Link href="/chat" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-sm font-medium truncate">{title}</h1>
      </div>

      {/* Chat */}
      <ChatInterface conversationId={conversationId} initialMessages={initialMessages} />
    </div>
  );
}
