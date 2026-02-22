"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "../../../app/api/uploadthing/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

type AssetUploaderProps = {
  patientId: string;
  appointmentId?: string;
  onComplete?: (assetId: string) => void;
};

export function AssetUploader({ patientId, appointmentId, onComplete }: AssetUploaderProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [fileLabel, setFileLabel] = useState<string | null>(null);

  const { startUpload, isUploading } = useUploadThing("patientPlanUploader", {
    onClientUploadComplete: (response) => {
      const id = response?.[0]?.serverData?.uploadedAssetId;
      setError(null);
      setSuccess(id ? "File uploaded successfully" : "Upload completed");
      setStatus("success");
      if (id && onComplete) {
        onComplete(id);
      }
      router.refresh();
    },
    onUploadError: (uploadError) => {
      setSuccess(null);
      setError(uploadError.message || "Upload failed");
      setStatus("error");
    },
  });

  return (
    <label className="grid gap-2 rounded border p-3 text-sm">
      <span className="font-medium">Upload nutrition/measurement plan</span>
      <input
        type="file"
        accept=".pdf,image/*"
        disabled={isUploading}
        onChange={async (event) => {
          const inputElement = event.currentTarget;
          const file = event.target.files?.[0];
          if (file) {
            setFileLabel(file.name);
            setError(null);
            setSuccess(null);
            setStatus("uploading");

            try {
              const result = await startUpload([file], { patientId, appointmentId });
              if (!result || result.length === 0) {
                setError("File was not uploaded. Check file type/size and permissions.");
                setStatus("error");
              }
            } catch (uploadError) {
              setError(
                uploadError instanceof Error
                  ? uploadError.message
                  : "Upload failed. Please try again.",
              );
              setStatus("error");
            } finally {
              inputElement.value = "";
            }
          }
        }}
      />
      <p className="text-xs text-muted-foreground">Accepted types: PDF and images. Max size: 8MB.</p>
      <p className="text-xs text-muted-foreground">Only doctors/managers can upload plan files.</p>
      <div className="flex items-center gap-2">
        <Badge variant="outline">
          {status === "idle" && "Idle"}
          {status === "uploading" && "Uploading"}
          {status === "success" && "Uploaded"}
          {status === "error" && "Error"}
        </Badge>
        {fileLabel ? <span className="text-xs text-muted-foreground">{fileLabel}</span> : null}
      </div>
      {isUploading ? <span className="text-xs text-muted-foreground">Uploading file...</span> : null}
      {success ? <span className="text-xs text-emerald-600">{success}</span> : null}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.refresh()}>
          Refresh files
        </Button>
      </div>
    </label>
  );
}
