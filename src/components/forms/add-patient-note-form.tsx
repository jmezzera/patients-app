"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = { patientId: string };

export function AddPatientNoteForm({ patientId }: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!content.trim()) return;
    setSaving(true);
    await fetch(`/api/patients/${patientId}/internal-notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, isPublic }),
    });
    setContent("");
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a note about this patient..."
        rows={3}
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          Visible to patient
        </label>
        <Button
          size="sm"
          variant="outline"
          disabled={saving || !content.trim()}
          onClick={submit}
        >
          {saving ? "Saving..." : "Add note"}
        </Button>
      </div>
    </div>
  );
}
