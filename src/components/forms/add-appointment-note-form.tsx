"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  appointmentId: string;
  patientId: string;
};

export function AddAppointmentNoteForm({ appointmentId, patientId }: Props) {
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="grid gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        await fetch(`/api/appointments/${appointmentId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId, content, isPublic }),
        });
        setContent("");
        setSaving(false);
      }}
    >
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add appointment note…"
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
        />
        Visible to patient
      </label>
      <Button disabled={saving || !content.trim()} variant="outline">
        {saving ? "Saving…" : "Save note"}
      </Button>
    </form>
  );
}
