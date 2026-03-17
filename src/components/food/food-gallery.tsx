"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { X, Send, MessageCircle, Loader2 } from "lucide-react";

export type FoodComment = {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; displayName: string; role: string };
};

export type FoodImage = {
  id: string;
  fileUrl: string;
  fileName: string;
  createdAt: string;
  comments: FoodComment[];
};

type Props = {
  images: FoodImage[];
  canComment?: boolean;
};

export function FoodGallery({ images, canComment = true }: Props) {
  const t = useTranslations("food");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (images.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noImages")}</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img, idx) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setSelectedIdx(idx)}
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
              <div className="flex items-center justify-between">
                <p className="truncate text-xs text-white">
                  {new Date(img.createdAt).toLocaleDateString()}
                </p>
                {img.comments.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-white/80">
                    <MessageCircle className="h-3 w-3" />
                    {img.comments.length}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedIdx !== null && (
        <FoodLightbox
          images={images}
          currentIdx={selectedIdx}
          onChangeIdx={setSelectedIdx}
          onClose={() => setSelectedIdx(null)}
          canComment={canComment}
        />
      )}
    </>
  );
}

// ─── Lightbox with comments ──────────────────────────────────────────────────

type LightboxProps = {
  images: FoodImage[];
  currentIdx: number;
  onChangeIdx: (idx: number) => void;
  onClose: () => void;
  canComment: boolean;
};

function FoodLightbox({ images, currentIdx, onChangeIdx, onClose, canComment }: LightboxProps) {
  const t = useTranslations("food.comments");
  const router = useRouter();
  const image = images[currentIdx];
  const [comments, setComments] = useState<FoodComment[]>(image.comments);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync comments when navigating between images
  useEffect(() => {
    setComments(images[currentIdx].comments);
    setNewComment("");
  }, [currentIdx, images]);

  // Auto-scroll to bottom of comments
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIdx > 0) onChangeIdx(currentIdx - 1);
      if (e.key === "ArrowRight" && currentIdx < images.length - 1) onChangeIdx(currentIdx + 1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIdx, images.length, onClose, onChangeIdx]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = newComment.trim();
      if (!text || sending) return;

      setSending(true);
      try {
        const res = await fetch(`/api/assets/${image.id}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        });
        if (!res.ok) throw new Error("Failed");
        const { comment } = await res.json();
        setComments((prev) => [...prev, comment]);
        setNewComment("");
        router.refresh();
      } catch {
        // silently fail — user can retry
      } finally {
        setSending(false);
      }
    },
    [newComment, sending, image.id, router],
  );

  const roleColor = (role: string) => {
    if (role === "DOCTOR") return "text-blue-600";
    if (role === "MANAGER") return "text-purple-600";
    return "text-emerald-600";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Nav arrows */}
      {currentIdx > 0 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChangeIdx(currentIdx - 1); }}
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
      )}
      {currentIdx < images.length - 1 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChangeIdx(currentIdx + 1); }}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      )}

      {/* Content: image + comments panel */}
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image side */}
        <div className="relative flex aspect-square items-center justify-center bg-black sm:w-1/2 sm:min-h-[450px]">
          <Image
            src={image.fileUrl}
            alt={image.fileName}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </div>

        {/* Comments side */}
        <div className="flex min-h-0 flex-1 flex-col sm:w-1/2">
          {/* Header */}
          <div className="border-b px-4 py-3">
            <p className="text-sm font-medium text-foreground">{image.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(image.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Comment list */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {comments.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("noComments")}
              </p>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="group">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-sm font-semibold ${roleColor(c.author.role)}`}>
                        {c.author.displayName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{c.content}</p>
                  </div>
                ))}
                <div ref={commentsEndRef} />
              </div>
            )}
          </div>

          {/* Comment input */}
          {canComment && (
            <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t px-4 py-3">
              <input
                ref={inputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t("placeholder")}
                maxLength={500}
                disabled={sending}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || sending}
                className="flex items-center justify-center rounded-full p-1.5 text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d`;
  return new Date(dateStr).toLocaleDateString();
}
