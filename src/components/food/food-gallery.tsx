"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

export type FoodImage = {
  id: string;
  fileUrl: string;
  fileName: string;
  createdAt: string;
};

type Props = {
  images: FoodImage[];
};

export function FoodGallery({ images }: Props) {
  const t = useTranslations("food");
  const [selected, setSelected] = useState<FoodImage | null>(null);

  if (images.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noImages")}</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setSelected(img)}
            className="group relative aspect-square overflow-hidden rounded-lg border bg-muted/30 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Image
              src={img.fileUrl}
              alt={img.fileName}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="truncate text-xs text-white">
                {new Date(img.createdAt).toLocaleDateString()}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelected(null)}
        >
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative max-h-[85vh] max-w-[85vw]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={selected.fileUrl}
              alt={selected.fileName}
              width={900}
              height={900}
              className="max-h-[85vh] w-auto rounded-lg object-contain"
            />
            <div className="mt-2 text-center">
              <p className="text-sm text-white/80">{selected.fileName}</p>
              <p className="text-xs text-white/60">
                {new Date(selected.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
