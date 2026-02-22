import { notFound } from "next/navigation";
import { getSessionActor } from "@/lib/authz";
import { getAppointment } from "@/lib/repos/appointments";
import { Role } from "@prisma/client";
import { AddAppointmentMetricForm } from "@/components/forms/add-appointment-metric-form";
import { AddAppointmentNoteForm } from "@/components/forms/add-appointment-note-form";
import { AssetUploader } from "@/components/upload/asset-uploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = { params: Promise<{ id: string }> };

export default async function AppointmentDetailPage({ params }: Props) {
  const actor = await getSessionActor();
  const { id } = await params;
  const appointment = await getAppointment(actor, id);
  const canEdit = actor.role === Role.DOCTOR || actor.role === Role.MANAGER;

  if (!appointment) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">Appointment</h1>
      <p className="mt-2 text-sm">
        Patient: {appointment.patient.firstName} {appointment.patient.lastName}
      </p>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Metrics</CardTitle>
        </CardHeader>
        <CardContent>
        {canEdit ? (
          <div className="mt-1">
            <AddAppointmentMetricForm appointmentId={appointment.id} />
          </div>
        ) : null}
        <ul className="mt-2 space-y-1 text-sm">
          {appointment.metrics.map((metric) => (
            <li key={metric.id}>
              {metric.key}: {metric.value}
              {metric.unit ? ` ${metric.unit}` : ""}
            </li>
          ))}
        </ul>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Doctor notes</CardTitle>
        </CardHeader>
        <CardContent>
        {canEdit ? (
          <div className="mt-1">
            <AddAppointmentNoteForm
              appointmentId={appointment.id}
              patientId={appointment.patientId}
            />
          </div>
        ) : null}
        <ul className="mt-2 space-y-2 text-sm">
          {appointment.notes.map((note) => (
            <li key={note.id} className="rounded-md border bg-muted/40 p-2">
              {note.content}
            </li>
          ))}
        </ul>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Plan files</CardTitle>
        </CardHeader>
        <CardContent>
        {canEdit ? (
          <div className="mt-1">
            <AssetUploader
              patientId={appointment.patientId}
              appointmentId={appointment.id}
            />
          </div>
        ) : null}
        <div className="mt-4">
          <h3 className="text-sm font-medium">Previously uploaded files</h3>
          {appointment.assets.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No files uploaded for this appointment yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {appointment.assets.map((asset) => (
                <li key={asset.id} className="flex items-center justify-between rounded-md border p-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{asset.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(asset.fileSize / 1024)} KB · {new Date(asset.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Plan</Badge>
                    <a href={asset.fileUrl} target="_blank" rel="noreferrer" className="text-sm underline">
                      Open
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        </CardContent>
      </Card>
    </main>
  );
}
