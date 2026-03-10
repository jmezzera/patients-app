"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  patientId: string;
  isActive: boolean;
};

export function ActivatePatientToggle({ patientId, isActive }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/patients/${patientId}/activate`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      {isActive ? (
        <Badge className="border-green-300 bg-green-100 text-green-700">Active</Badge>
      ) : (
        <Badge className="border-red-300 bg-red-100 text-red-700">Inactive</Badge>
      )}
      <Button variant="outline" size="sm" onClick={toggle} disabled={loading}>
        {isActive ? "Deactivate" : "Activate"}
      </Button>
    </div>
  );
}
