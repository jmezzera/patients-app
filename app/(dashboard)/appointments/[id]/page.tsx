import { notFound } from "next/navigation";
import { Role, AppointmentStatus } from "@prisma/client";
import { getSessionActor } from "@/lib/authz";
import { getAppointment } from "@/lib/repos/appointments";
import { listMetricTypes } from "@/lib/repos/metric-types";
import { AssetUploader } from "@/components/upload/asset-uploader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentStatusControls } from "@/components/appointments/appointment-status-controls";
import { AddAppointmentNoteForm } from "@/components/forms/add-appointment-note-form";
import { AddAppointmentMetricsForm } from "@/components/forms/add-appointment-metrics-form";
import { NoteVisibilityToggle } from "@/components/appointments/note-visibility-toggle";

type Props = { params: Promise<{ id: string }> };

export default async function AppointmentDetailPage({ params }: Props) {
  const actor = await getSessionActor();
  const { id } = await params;
  const [appointment, metricTypes] = await Promise.all([
    getAppointment(actor, id),
    listMetricTypes(actor),
  ]);

  if (!appointment) notFound();

  const canEdit = actor.role === Role.DOCTOR || actor.role === Role.MANAGER;
  const firstParticipant = appointment.participants[0]?.patient;

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Appointment</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Doctor: {appointment.doctor.displayName} ·{" "}
            {new Date(appointment.scheduledAt).toLocaleString()}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {appointment.participants.map((p) => (
              <Badge key={p.patientId} variant="secondary">
                {p.patient.firstName} {p.patient.lastName}
              </Badge>
            ))}
          </div>
        </div>
        {canEdit && (
          <AppointmentStatusControls
            appointmentId={appointment.id}
            currentStatus={appointment.status}
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {canEdit && appointment.participants.length > 0 && metricTypes.length > 0 && (
            <AddAppointmentMetricsForm
              appointmentId={appointment.id}
              patients={appointment.participants.map((p) => p.patient)}
              metricTypes={metricTypes}
            />
          )}
          <ul className="space-y-1 text-sm">
            {appointment.metrics.map((metric) => (
              <li key={metric.id} className="flex items-center gap-2">
                <span className="font-medium">{metric.metricType.name}</span>
                <span>
                  {metric.value}
                  {metric.metricType.unit ? ` ${metric.metricType.unit}` : ""}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {metric.patient.firstName} {metric.patient.lastName}
                </Badge>
              </li>
            ))}
          </ul>
          {appointment.metrics.length === 0 && (
            <p className="text-sm text-muted-foreground">No metrics recorded.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {canEdit && firstParticipant && (
            <AddAppointmentNoteForm
              appointmentId={appointment.id}
              patientId={firstParticipant.id}
            />
          )}
          <ul className="space-y-2 text-sm">
            {appointment.notes.map((note) => (
              <li key={note.id} className="rounded-md border bg-muted/40 p-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant={note.isPublic ? "outline" : "secondary"}>
                      {note.isPublic ? "Public" : "Internal"}
                    </Badge>
                    {canEdit && (
                      <NoteVisibilityToggle noteId={note.id} isPublic={note.isPublic} />
                    )}
                  </div>
                </div>
                <p>{note.content}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Files</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {canEdit && firstParticipant && (
            <AssetUploader patientId={firstParticipant.id} appointmentId={appointment.id} />
          )}
          {appointment.assets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No files uploaded.</p>
          ) : (
            <ul className="space-y-2">
              {appointment.assets.map((asset) => (
                <li
                  key={asset.id}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{asset.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(asset.fileSize / 1024)} KB ·{" "}
                      {new Date(asset.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <a
                    href={asset.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm underline"
                  >
                    Open
                  </a>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
