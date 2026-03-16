"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "../../../app/api/uploadthing/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2, AlertCircle, FileText, X, Loader2 } from "lucide-react";

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
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleFile = useCallback(async (file: File) => {
    setFileLabel(file.name);
    setFileSize(formatFileSize(file.size));
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
    }
  }, [startUpload, patientId, appointmentId]);

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function reset() {
    setStatus("idle");
    setFileLabel(null);
    setFileSize(null);
    setError(null);
    setSuccess(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center
          transition-all duration-200 cursor-pointer
          ${dragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : status === "error"
              ? "border-red-300 bg-red-50/50"
              : status === "success"
                ? "border-green-300 bg-green-50/50"
                : "border-muted-foreground/20 bg-muted/30 hover:border-primary/40 hover:bg-muted/50"
          }
          ${isUploading ? "pointer-events-none" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,image/*"
          disabled={isUploading}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />

        {status === "idle" && (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Drop a file here or <span className="text-primary underline underline-offset-2">browse</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">PDF or images, max 8MB</p>
            </div>
          </>
        )}

        {status === "uploading" && (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </div>
            <div>
              <p className="text-sm font-medium">Uploading...</p>
              {fileLabel && (
                <p className="mt-1 text-xs text-muted-foreground truncate max-w-[200px]">
                  {fileLabel} {fileSize && `(${fileSize})`}
                </p>
              )}
            </div>
            {/* Progress bar */}
            <div className="w-full max-w-[200px] h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  animation: "progress-indeterminate 1.5s ease-in-out infinite",
                  width: "25%",
                }}
              />
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-700">{success}</p>
              {fileLabel && (
                <p className="mt-1 text-xs text-muted-foreground truncate max-w-[200px]">
                  {fileLabel}
                </p>
              )}
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-700">{error}</p>
              {fileLabel && (
                <p className="mt-1 text-xs text-muted-foreground truncate max-w-[200px]">
                  {fileLabel}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      {(status === "success" || status === "error") && (
        <div className="flex items-center justify-between animate-fade-in">
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
          <Button type="button" variant="ghost" size="sm" onClick={() => router.refresh()}>
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Refresh files
          </Button>
        </div>
      )}
    </div>
  );
}
