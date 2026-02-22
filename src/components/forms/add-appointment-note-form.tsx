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
          body: JSON.stringify({ patientId, content }),
        });
        setContent("");
        setSaving(false);
      }}
    >
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Add post-appointment note"
      />
      <Button disabled={saving || !content.trim()} variant="outline">
        {saving ? "Saving..." : "Save note"}
      </Button>
    </form>
  );
}
