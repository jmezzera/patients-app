"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddAppointmentNoteForm } from "@/components/forms/add-appointment-note-form";
import { AddAppointmentMetricsForm } from "@/components/forms/add-appointment-metrics-form";
import { NoteVisibilityToggle } from "@/components/appointments/note-visibility-toggle";
import { AssetUploader } from "@/components/upload/asset-uploader";

type Patient = { id: string; firstName: string; lastName: string; color?: string | null };
type MetricType = { id: string; name: string; unit: string | null };
type Metric = {
  id: string;
  value: string | number;
  metricType: MetricType;
  patientId: string;
};
type Note = {
  id: string;
  content: string;
  isPublic: boolean;
  createdAt: Date;
  patientId: string;
};
type Asset = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  createdAt: Date;
  patientId: string | null;
};

type Props = {
  appointmentId: string;
  patients: Patient[];
  metrics: Metric[];
  notes: Note[];
  assets: Asset[];
  metricTypes: MetricType[];
  canEdit: boolean;
};

export function AppointmentPatientTabs({
  appointmentId,
  patients,
  metrics,
  notes,
  assets,
  metricTypes,
  canEdit,
}: Props) {
  if (patients.length === 0) return null;

  return (
    <Tabs defaultValue={patients[0].id}>
      <TabsList>
        {patients.map((p) => (
          <TabsTrigger key={p.id} value={p.id} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: p.color ?? "#cbd5e1" }}
            />
            {p.firstName} {p.lastName}
          </TabsTrigger>
        ))}
      </TabsList>

      {patients.map((patient) => {
        const patientMetrics = metrics.filter((m) => m.patientId === patient.id);
        const patientNotes = notes.filter((n) => n.patientId === patient.id);
        const patientAssets = assets.filter((a) => a.patientId === patient.id);

        return (
          <TabsContent key={patient.id} value={patient.id} className="mt-4 space-y-4">
            {/* Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canEdit && metricTypes.length > 0 && (
                  <AddAppointmentMetricsForm
                    appointmentId={appointmentId}
                    patients={[patient]}
                    metricTypes={metricTypes}
                  />
                )}
                {patientMetrics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No metrics recorded.</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {patientMetrics.map((m) => (
                      <li key={m.id} className="flex items-center gap-2">
                        <span className="font-medium">{m.metricType.name}</span>
                        <span>
                          {String(m.value)}
                          {m.metricType.unit ? ` ${m.metricType.unit}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canEdit && (
                  <AddAppointmentNoteForm
                    appointmentId={appointmentId}
                    patientId={patient.id}
                  />
                )}
                {patientNotes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No notes yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {patientNotes.map((note) => (
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
                )}
              </CardContent>
            </Card>

            {/* Files */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Files</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canEdit && (
                  <AssetUploader patientId={patient.id} appointmentId={appointmentId} />
                )}
                {patientAssets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No files uploaded.</p>
                ) : (
                  <ul className="space-y-2">
                    {patientAssets.map((asset) => (
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
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
