"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  noteId: string;
  isPublic: boolean;
};

export function NoteVisibilityToggle({ noteId, isPublic: initialIsPublic }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/notes/${noteId}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !initialIsPublic }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button size="sm" variant="ghost" disabled={loading} onClick={toggle} className="h-6 px-2 text-xs">
      {initialIsPublic ? "Make internal" : "Make public"}
    </Button>
  );
}
