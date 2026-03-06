"use client";

import { useState } from "react";
import { AppointmentStatus } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Props = {
  appointmentId: string;
  currentStatus: AppointmentStatus;
};

export function AppointmentStatusControls({ appointmentId, currentStatus }: Props) {
  const router = useRouter();
  const t = useTranslations("appointments.detail");
  const tc = useTranslations("common");
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: AppointmentStatus) {
    setLoading(true);
    await fetch(`/api/appointments/${appointmentId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    router.refresh();
  }

  if (currentStatus === AppointmentStatus.BOOKED) {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={loading}
          onClick={() => updateStatus(AppointmentStatus.COMPLETED)}
        >
          {t("markCompleted")}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={loading}
          onClick={() => updateStatus(AppointmentStatus.CANCELLED)}
        >
          {t("cancel")}
        </Button>
      </div>
    );
  }

  if (currentStatus === AppointmentStatus.COMPLETED) {
    return <Badge>{tc("status.completed")}</Badge>;
  }

  return <Badge className="border-red-300 bg-red-100 text-red-700">{tc("status.cancelled")}</Badge>;
}
