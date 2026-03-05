"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

type Plan = { id: string; name: string };

type Props = { plans: Plan[] };

export function NutritionPlansManager({ plans: initialPlans }: Props) {
  const router = useRouter();
  const [plans, setPlans] = useState(initialPlans);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/nutrition-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const { plan } = await res.json();
      setPlans((prev) => [...prev, plan].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
    }
    setSaving(false);
  }

  async function remove(id: string) {
    await fetch(`/api/nutrition-plans/${id}`, { method: "DELETE" });
    setPlans((prev) => prev.filter((p) => p.id !== id));
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plans</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Plan name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
          />
          <Button onClick={create} disabled={saving || !name.trim()}>
            Add
          </Button>
        </div>
        {plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">No nutrition plans yet.</p>
        ) : (
          <ul className="space-y-2">
            {plans.map((plan) => (
              <li key={plan.id} className="flex items-center justify-between rounded-md border p-2">
                <span className="text-sm font-medium">{plan.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => remove(plan.id)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
