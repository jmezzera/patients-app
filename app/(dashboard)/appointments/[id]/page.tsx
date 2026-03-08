import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { getSessionActor } from "@/lib/authz";
import { getAppointment } from "@/lib/repos/appointments";
import { listMetricTypes } from "@/lib/repos/metric-types";
import { AppointmentStatusControls } from "@/components/appointments/appointment-status-controls";
import { AppointmentPatientTabs } from "@/components/appointments/appointment-patient-tabs";
import { PageShell } from "@/components/layout/page-shell";

type Props = { params: Promise<{ id: string }> };

export default async function AppointmentDetailPage({ params }: Props) {
  const actor = await getSessionActor();
  const t = await getTranslations("appointments.detail");
  const { id } = await params;
  const [appointment, metricTypes] = await Promise.all([
    getAppointment(actor, id),
    listMetricTypes(actor),
  ]);

  if (!appointment) notFound();

  const canEdit = actor.role === Role.DOCTOR || actor.role === Role.MANAGER;

  return (
    <PageShell className="max-w-4xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("doctor")}: {appointment.doctor.displayName} ·{" "}
            {new Date(appointment.scheduledAt).toLocaleString()}
          </p>
        </div>
        {canEdit && (
          <AppointmentStatusControls
            appointmentId={appointment.id}
            currentStatus={appointment.status}
          />
        )}
      </div>

      <AppointmentPatientTabs
        appointmentId={appointment.id}
        patients={appointment.participants.map((p) => p.patient)}
        metrics={appointment.metrics.map((m) => ({
          id: m.id,
          value: m.value,
          metricType: m.metricType,
          patientId: m.patientId,
        }))}
        notes={appointment.notes}
        assets={appointment.assets}
        metricTypes={metricTypes}
        canEdit={canEdit}
      />
    </PageShell>
  );
}
