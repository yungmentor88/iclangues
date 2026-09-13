"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Upload, Loader2, Check, CircleAlert, Trash2, Search, X, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { compressImage, formatBytes } from "@/lib/image-compress";
import { uploadMedia, updateMediaMeta, deleteMedia } from "@/app/admin/actions";

export interface MediaItem {
  id: string;
  storage_path: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  alt_text: Record<string, string> | null;
  description: string | null;
  created_at: string;
}

const LANGS = ["en", "pt", "fr", "es", "kr"] as const;

type Notice = { kind: "ok" | "error"; message: string } | null;

export function MediaLibrary({
  items,
  publicBase,
}: {
  items: MediaItem[];
  publicBase: string;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, startTransition] = useTransition();

  function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setNotice(null);

    startTransition(async () => {
      let savedBytes = 0;

      for (const original of Array.from(files)) {
        // Resize and re-encode before upload. This keeps the bucket small and
        // means files arrive well under the server-action body limit. Falls
        // back to the original file if compression isn't possible.
        const { file, originalBytes, compressed } = await compressImage(original);
        if (compressed) savedBytes += originalBytes - file.size;

        const fd = new FormData();
        fd.set("file", file);

        // A server action can fail to return at all — most commonly when the
        // request body exceeds the platform limit, in which case the upload
        // is rejected before our code runs. Guard against that rather than
        // reading `.ok` of undefined and crashing the whole screen.
        let r;
        try {
          r = await uploadMedia(fd);
        } catch {
          r = undefined;
        }

        if (!r) {
          setNotice({
            kind: "error",
            message: `Couldn't upload ${file.name} (${formatBytes(file.size)}). The file may be too large — try one under 10 MB.`,
          });
          return;
        }
        if (!r.ok) {
          setNotice({ kind: "error", message: r.error ?? "Upload failed." });
          return;
        }
      }

      setNotice({
        kind: "ok",
        message:
          savedBytes > 0
            ? `Uploaded ${files.length} file${files.length === 1 ? "" : "s"} — optimised, saving ${formatBytes(savedBytes)}.`
            : `Uploaded ${files.length} file${files.length === 1 ? "" : "s"}.`,
      });
      router.refresh();
    });
  }

  const filtered = query.trim()
    ? items.filter((i) => i.filename.toLowerCase().includes(query.trim().toLowerCase()))
    : items;

  return (
    <div>
      {/* Upload target */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          upload(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-[22px] border-2 border-dashed p-8 text-center transition",
          dragging ? "border-primary bg-primary/5" : "border-border bg-card"
        )}
      >
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
          {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
        </span>
        <p className="mt-3.5 font-display text-lg font-bold">
          {busy ? "Uploading…" : "Drop images here"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          JPG, PNG, WebP, AVIF, GIF, SVG or PDF · up to 10 MB each
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Large photos are resized and optimised automatically — upload straight from your camera
          or phone.
        </p>
        <button
          onClick={() => fileInput.current?.click()}
          disabled={busy}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-105 disabled:opacity-60"
        >
          <Upload className="h-4 w-4" /> Choose files
        </button>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml,application/pdf"
          onChange={(e) => upload(e.target.files)}
          className="hidden"
        />
      </div>

      {notice && (
        <p
          className={cn(
            "mt-4 flex items-start gap-2 rounded-[22px] border p-4 text-sm",
            notice.kind === "ok"
              ? "border-primary/30 bg-primary/5 text-primary"
              : "border-destructive/30 bg-destructive/5 text-destructive"
          )}
        >
          {notice.kind === "ok" ? (
            <Check className="mt-0.5 h-4 w-4 flex-none" />
          ) : (
            <CircleAlert className="mt-0.5 h-4 w-4 flex-none" />
          )}
          {notice.message}
        </p>
      )}

      {/* Search */}
      {items.length > 0 && (
        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by filename…"
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-primary"
          />
        </div>
      )}

      {/* Grid */}
      {items.length === 0 ? (
        <p className="mt-6 rounded-[22px] border border-border bg-card p-10 text-center text-muted-foreground">
          No files yet. Upload your first image above.
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-6 rounded-[22px] border border-border bg-card p-10 text-center text-muted-foreground">
          Nothing matches &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="group overflow-hidden rounded-[18px] border border-border bg-card text-left transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="relative block aspect-[4/3] bg-muted">
                {item.mime_type.startsWith("image/") ? (
                  <Image
                    src={`${publicBase}${item.storage_path}`}
                    alt={item.alt_text?.en ?? item.filename}
                    fill
                    className="object-cover"
                    sizes="(max-width:640px) 50vw, 25vw"
                  />
                ) : (
                  <span className="grid h-full place-items-center text-muted-foreground">
                    <FileText className="h-8 w-8" />
                  </span>
                )}
              </span>
              <span className="block p-3">
                <span className="block truncate text-sm font-medium">{item.filename}</span>
                <span className="block text-xs text-muted-foreground">
                  {formatBytes(item.size_bytes)}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <DetailModal
          item={selected}
          publicBase={publicBase}
          onClose={() => setSelected(null)}
          onChanged={() => {
            setSelected(null);
            router.refresh();
          }}
          onNotice={setNotice}
        />
      )}
    </div>
  );
}

function DetailModal({
  item,
  publicBase,
  onClose,
  onChanged,
  onNotice,
}: {
  item: MediaItem;
  publicBase: string;
  onClose: () => void;
  onChanged: () => void;
  onNotice: (n: Notice) => void;
}) {
  const [alt, setAlt] = useState<Record<string, string>>({ ...(item.alt_text ?? {}) });
  const [lang, setLang] = useState<string>("en");
  const [description, setDescription] = useState(item.description ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const r = await updateMediaMeta(item.id, alt, description);
      if (r.ok) {
        onNotice({ kind: "ok", message: "Details saved." });
        onChanged();
      } else {
        onNotice({ kind: "error", message: r.error ?? "Could not save." });
      }
    });
  }

  function remove() {
    startTransition(async () => {
      const r = await deleteMedia(item.id);
      if (r.ok) {
        onNotice({ kind: "ok", message: `Deleted ${item.filename}.` });
        onChanged();
      } else {
        onNotice({ kind: "error", message: r.error ?? "Could not delete." });
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[22px] border border-border bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="font-display text-xl font-bold">File details</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-xl bg-muted">
          {item.mime_type.startsWith("image/") ? (
            <Image
              src={`${publicBase}${item.storage_path}`}
              alt={item.alt_text?.en ?? item.filename}
              fill
              className="object-contain"
              sizes="512px"
            />
          ) : (
            <span className="grid h-full place-items-center text-muted-foreground">
              <FileText className="h-10 w-10" />
            </span>
          )}
        </div>

        <p className="truncate text-sm font-semibold">{item.filename}</p>
        <p className="mb-4 text-xs text-muted-foreground">
          {formatBytes(item.size_bytes)} · {item.mime_type} · added{" "}
          {new Date(item.created_at).toLocaleDateString()}
        </p>

        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label className="text-sm font-semibold">
            Alt text
            <span className="ml-2 font-normal text-muted-foreground">
              Describes the image for screen readers
            </span>
          </label>
          <div className="flex gap-1">
            {LANGS.map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[0.7rem] font-bold uppercase transition",
                  lang === l
                    ? "bg-primary text-primary-foreground"
                    : alt[l]?.trim()
                      ? "bg-muted text-muted-foreground"
                      : "bg-muted/50 text-muted-foreground/50"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <input
          value={alt[lang] ?? ""}
          onChange={(e) => setAlt({ ...alt, [lang]: e.target.value })}
          className="mb-4 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary"
        />

        <label className="mb-1.5 block text-sm font-semibold">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="mb-5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary"
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-105 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save details
          </button>

          {confirmDelete ? (
            <>
              <button
                onClick={remove}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition hover:brightness-105 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" /> Yes, delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-full border border-border px-4 py-2.5 text-sm font-medium transition hover:border-foreground"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-medium transition hover:border-destructive hover:text-destructive disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
        </div>

        {confirmDelete && (
          <p className="mt-3 text-sm text-destructive">
            If this image is used on a page, the delete will be refused and you&rsquo;ll be told where.
          </p>
        )}
      </div>
    </div>
  );
}
