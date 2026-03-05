"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Block = { id: string; startsAt: Date; endsAt: Date; reason: string | null };
type Props = { blocks: Block[] };

export function CalendarBlocksPanel({ blocks: initial }: Props) {
  const [blocks, setBlocks] = useState(initial);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!startsAt || !endsAt) return;
    setSaving(true);
    const res = await fetch("/api/availability/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startsAt, endsAt, reason: reason || undefined }),
    });
    if (res.ok) {
      const { block } = await res.json();
      setBlocks((prev) => [...prev, block].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()));
      setStartsAt("");
      setEndsAt("");
      setReason("");
    }
    setSaving(false);
  }

  async function remove(id: string) {
    await fetch(`/api/availability/blocks/${id}`, { method: "DELETE" });
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blocked times</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <div className="flex gap-2">
            <div className="grid gap-1 text-sm">
              <label>From</label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div className="grid gap-1 text-sm">
              <label>To</label>
              <Input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>
          <Input
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button onClick={add} disabled={saving || !startsAt || !endsAt}>
            Add block
          </Button>
        </div>

        {blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming blocks.</p>
        ) : (
          <ul className="space-y-2">
            {blocks.map((block) => (
              <li key={block.id} className="flex items-center justify-between rounded-md border p-2">
                <div className="text-sm">
                  <p className="font-medium">
                    {new Date(block.startsAt).toLocaleString()} –{" "}
                    {new Date(block.endsAt).toLocaleString()}
                  </p>
                  {block.reason && (
                    <p className="text-xs text-muted-foreground">{block.reason}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => remove(block.id)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
