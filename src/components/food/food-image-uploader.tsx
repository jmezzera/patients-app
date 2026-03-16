"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "../../../app/api/uploadthing/core";
import { Camera, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

type Props = {
  patientId: string;
};

export function FoodImageUploader({ patientId }: Props) {
  const router = useRouter();
  const t = useTranslations("food.upload");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing("foodImageUploader", {
    onClientUploadComplete: (response) => {
      setError(null);
      setSuccess(t("success"));
      setStatus("success");
      router.refresh();
    },
    onUploadError: (uploadError) => {
      setSuccess(null);
      setError(uploadError.message || t("failed"));
      setStatus("error");
    },
  });

  const handleFile = useCallback(
    async (file: File) => {
      setFileLabel(file.name);
      setError(null);
      setSuccess(null);
      setStatus("uploading");

      try {
        const result = await startUpload([file], { patientId });
        if (!result || result.length === 0) {
          setError(t("notUploaded"));
          setStatus("error");
        }
      } catch {
        setError(t("failed"));
        setStatus("error");
      }
    },
    [startUpload, patientId, t],
  );

  function reset() {
    setStatus("idle");
    setFileLabel(null);
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center
          transition-all duration-200 cursor-pointer
          ${
            dragOver
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
          accept="image/*"
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
              <Camera className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {t("dropOrBrowse")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t("hint")}</p>
            </div>
          </>
        )}

        {status === "uploading" && (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </div>
            <div>
              <p className="text-sm font-medium">{t("uploading")}</p>
              {fileLabel && (
                <p className="mt-1 text-xs text-muted-foreground truncate max-w-[200px]">
                  {fileLabel}
                </p>
              )}
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-green-700">{success}</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-sm font-medium text-red-700">{error}</p>
          </>
        )}
      </div>

      {(status === "success" || status === "error") && (
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
          {t("clear")}
        </button>
      )}
    </div>
  );
}
