"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  patientId: string;
};

export function AddInternalNoteForm({ patientId }: Props) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="grid gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        await fetch(`/api/patients/${patientId}/internal-notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        setContent("");
        setSaving(false);
      }}
    >
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Doctor-only internal note"
      />
      <Button disabled={saving || !content.trim()} variant="outline">
        {saving ? "Saving..." : "Save internal note"}
      </Button>
    </form>
  );
}
