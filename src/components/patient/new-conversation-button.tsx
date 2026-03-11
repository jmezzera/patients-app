"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  variant?: "default" | "outline";
  label?: string;
};

export function NewConversationButton({ variant = "default", label = "New chat" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/chat/conversations", { method: "POST" });
      const { conversation } = await res.json();
      router.push(`/chat/${conversation.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant={variant} size="sm" onClick={handleClick} disabled={loading}>
      <Plus className="h-4 w-4 mr-1" />
      {loading ? "Creating…" : label}
    </Button>
  );
}
