import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare, Plus } from "lucide-react";
import { getSessionActor } from "@/lib/authz";
import { listConversations } from "@/lib/repos/conversations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewConversationButton } from "@/components/patient/new-conversation-button";

export default async function ChatListPage() {
  const actor = await getSessionActor();

  if (!actor.patientId) {
    redirect("/me");
  }

  const conversations = await listConversations(actor);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Chats</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask your nutrition assistant anything.
          </p>
        </div>
        <NewConversationButton />
      </div>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No conversations yet.</p>
            <NewConversationButton variant="outline" label="Start your first chat" />
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {conversations.map((c) => {
            const preview = c.messages[0]?.content;
            const title = c.title ?? new Date(c.createdAt).toLocaleDateString();
            return (
              <li key={c.id}>
                <Link
                  href={`/chat/${c.id}`}
                  className="flex items-start gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{title}</p>
                    {preview && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{preview}</p>
                    )}
                  </div>
                  <span className="ml-auto text-xs text-muted-foreground shrink-0">
                    {new Date(c.updatedAt).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
