import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { UIMessage } from "ai";
import { Role } from "@prisma/client";
import { getSessionActor } from "@/lib/authz";
import { getStaffConversation } from "@/lib/repos/conversations";
import { MgrChat } from "@/components/mgr/mgr-chat";

type Props = { params: Promise<{ conversationId: string }> };

export default async function StaffConversationPage({ params }: Props) {
  const { conversationId } = await params;
  const actor = await getSessionActor();

  if (actor.role !== Role.DOCTOR && actor.role !== Role.MANAGER) {
    redirect("/dashboard");
  }

  const conversation = await getStaffConversation(actor, conversationId);
  if (!conversation) notFound();

  const initialMessages: UIMessage[] = conversation.messages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    parts: [{ type: "text" as const, text: m.content }],
    metadata: { createdAt: m.createdAt.toISOString() },
  }));

  const title = conversation.title ?? new Date(conversation.createdAt).toLocaleDateString();

  return (
    <div className="mx-auto max-w-3xl flex flex-col h-[calc(100dvh-4rem)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
        <a href="/assistant" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </a>
        <h1 className="text-sm font-medium truncate">{title}</h1>
      </div>
      <MgrChat conversationId={conversationId} initialMessages={initialMessages} />
    </div>
  );
}
