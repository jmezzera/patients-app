"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = { patientId: string };

export function AddPatientNoteForm({ patientId }: Props) {
  const router = useRouter();
  const t = useTranslations("patients.detail.noteForm");
  const tc = useTranslations("common");
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
        placeholder={t("placeholder")}
        rows={3}
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          {t("visibleToPatient")}
        </label>
        <Button
          size="sm"
          variant="outline"
          disabled={saving || !content.trim()}
          onClick={submit}
        >
          {saving ? tc("saving") : t("addNote")}
        </Button>
      </div>
    </div>
  );
}
