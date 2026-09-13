"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { ChevronDown, Check, CircleAlert, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { describeSection, collectImages, type EditorField } from "@/lib/section-fields";
import { saveUiString, saveSectionValue, saveSectionImage, listMedia } from "@/app/admin/actions";

/** One image the owner can pick from the media library. */
interface MediaChoice {
  id: string;
  filename: string;
  url: string;
}

/**
 * One collapsible section of a page, rendered as labelled fields.
 *
 * The owner sees "Headline", "Button text", "Subheading" — never the
 * underlying ui_strings key or the JSON path. Each translatable field has a
 * tab per language, with English required as the fallback.
 *
 * Saving is per-field and explicit: a field shows Saving / Saved / an error,
 * and a failure never clears what was typed (spec §25).
 */

const LANGS = [
  { code: "en", label: "EN" },
  { code: "pt", label: "PT" },
  { code: "fr", label: "FR" },
  { code: "es", label: "ES" },
  { code: "kr", label: "KR" },
] as const;

type Status = { state: "idle" | "saving" | "saved" | "error"; message?: string };

export function SectionEditor({
  sectionId,
  label,
  sectionType,
  content,
  strings,
  hasUnpublished,
}: {
  sectionId: string;
  label: string;
  sectionType: string;
  content: Record<string, unknown>;
  strings: Record<string, Record<string, string>>;
  hasUnpublished: boolean;
}) {
  const [open, setOpen] = useState(false);
  const fields = describeSection(content);
  const images = collectImages(content);

  return (
    <section className="overflow-hidden rounded-[22px] border border-border bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-muted/40"
        aria-expanded={open}
      >
        <span className="flex-1">
          <span className="flex items-center gap-2">
            <span className="font-display text-lg font-bold">{label}</span>
            {hasUnpublished && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-amber-700">
                Draft
              </span>
            )}
          </span>
          <span className="text-sm text-muted-foreground">
            {fields.length} field{fields.length === 1 ? "" : "s"}
            {images.length > 0 && ` · ${images.length} image${images.length === 1 ? "" : "s"}`}
          </span>
        </span>
        <ChevronDown className={cn("h-5 w-5 flex-none text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-5 border-t border-border p-5">
          {fields.length === 0 && images.length === 0 && (
            <p className="text-sm text-muted-foreground">
              This section has no editable text. Its layout is set in the design.
            </p>
          )}

          {fields.map((field, i) => (
            <Field
              key={`${field.stringKey ?? field.path?.join(".")}-${i}`}
              field={field}
              sectionId={sectionId}
              initial={
                field.source === "ui_string"
                  ? strings[field.stringKey as string] ?? { en: "" }
                  : readPath(content, field.path ?? [])
              }
            />
          ))}

          {images.map((img) => (
            <ImageField
              key={img.path.join(".")}
              sectionId={sectionId}
              label={img.label}
              src={img.src}
              path={img.path}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/** Read a value at a JSON path; returns an i18n object or a {en: string} shim. */
function readPath(content: Record<string, unknown>, path: string[]): Record<string, string> {
  let node: any = content;
  for (const p of path) {
    if (node == null) return { en: "" };
    node = node[p];
  }
  if (node && typeof node === "object" && typeof node.en === "string") return node;
  return { en: typeof node === "string" ? node : "" };
}

function Field({
  field,
  sectionId,
  initial,
}: {
  field: EditorField;
  sectionId: string;
  initial: Record<string, string>;
}) {
  const [values, setValues] = useState<Record<string, string>>({ ...initial });
  const [lang, setLang] = useState<string>("en");
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [pending, startTransition] = useTransition();

  // A link or plain path value has no translations — edit it directly.
  const translatable = field.kind !== "url";

  function save() {
    setStatus({ state: "saving" });
    startTransition(async () => {
      const result =
        field.source === "ui_string"
          ? await saveUiString(field.stringKey as string, values)
          : await saveSectionValue(sectionId, field.path ?? [], translatable ? values : values.en);

      setStatus(
        result.ok
          ? { state: "saved" }
          : { state: "error", message: result.error ?? "Could not save." }
      );
    });
  }

  const multiline = field.kind === "textarea";

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-semibold">
          {field.label}
          {field.hint && (
            <span className="ml-2 font-normal text-muted-foreground">{field.hint}</span>
          )}
        </label>

        {translatable && (
          <div className="flex gap-1">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[0.7rem] font-bold transition",
                  lang === l.code
                    ? "bg-primary text-primary-foreground"
                    : values[l.code]?.trim()
                      ? "bg-muted text-muted-foreground hover:text-foreground"
                      : "bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground"
                )}
                title={values[l.code]?.trim() ? "Translated" : "Not translated yet"}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {multiline ? (
        <textarea
          value={values[lang] ?? ""}
          onChange={(e) => setValues({ ...values, [lang]: e.target.value })}
          onBlur={save}
          rows={3}
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary"
        />
      ) : (
        <input
          type="text"
          value={translatable ? values[lang] ?? "" : values.en ?? ""}
          onChange={(e) =>
            setValues(translatable ? { ...values, [lang]: e.target.value } : { en: e.target.value })
          }
          onBlur={save}
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary"
        />
      )}

      <div className="mt-1 min-h-[1.25rem] text-xs">
        {(status.state === "saving" || pending) && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving…
          </span>
        )}
        {status.state === "saved" && !pending && (
          <span className="flex items-center gap-1 text-primary">
            <Check className="h-3 w-3" /> Saved as draft
          </span>
        )}
        {status.state === "error" && (
          <span className="flex items-center gap-1 text-destructive">
            <CircleAlert className="h-3 w-3" /> {status.message}
          </span>
        )}
        {translatable && lang !== "en" && !values[lang]?.trim() && status.state === "idle" && (
          <span className="text-muted-foreground">
            Not translated — visitors see the English text.
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Shows the image a section uses and lets the owner swap it for one from the
 * media library — no filenames or paths to type (spec §8).
 */
function ImageField({
  sectionId,
  label,
  src,
  path,
}: {
  sectionId: string;
  label: string;
  src: string;
  path: string[];
}) {
  const [current, setCurrent] = useState(src);
  const [picking, setPicking] = useState(false);
  const [choices, setChoices] = useState<MediaChoice[] | null>(null);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [pending, startTransition] = useTransition();

  function openPicker() {
    setPicking(true);
    if (choices === null) {
      startTransition(async () => {
        const r = await listMedia();
        setChoices(r.items ?? []);
      });
    }
  }

  function choose(item: MediaChoice) {
    setPicking(false);
    setStatus({ state: "saving" });
    startTransition(async () => {
      const r = await saveSectionImage(sectionId, path, item.url);
      if (r.ok) {
        setCurrent(item.url);
        setStatus({ state: "saved" });
      } else {
        setStatus({ state: "error", message: r.error ?? "Could not change the image." });
      }
    });
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold">{label}</p>
      <div className="flex items-center gap-3.5 rounded-xl border border-border bg-background p-3">
        <div className="relative h-16 w-24 flex-none overflow-hidden rounded-lg bg-muted">
          {current ? (
            <Image src={current} alt="" fill className="object-cover" sizes="96px" />
          ) : (
            <span className="grid h-full place-items-center text-muted-foreground">
              <ImageIcon className="h-5 w-5" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-muted-foreground">{current}</p>
          <button
            onClick={openPicker}
            disabled={pending}
            className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition hover:border-primary hover:text-primary disabled:opacity-60"
          >
            <ImageIcon className="h-3.5 w-3.5" /> Replace image
          </button>
        </div>
      </div>

      <div className="mt-1 min-h-[1.25rem] text-xs">
        {(status.state === "saving" || pending) && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving…
          </span>
        )}
        {status.state === "saved" && !pending && (
          <span className="flex items-center gap-1 text-primary">
            <Check className="h-3 w-3" /> Saved as draft
          </span>
        )}
        {status.state === "error" && (
          <span className="flex items-center gap-1 text-destructive">
            <CircleAlert className="h-3 w-3" /> {status.message}
          </span>
        )}
      </div>

      {picking && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={() => setPicking(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[22px] border border-border bg-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 font-display text-xl font-bold">Choose an image</h3>

            {choices === null ? (
              <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading your media…
              </p>
            ) : choices.length === 0 ? (
              <p className="rounded-xl border border-border bg-background p-6 text-center text-sm text-muted-foreground">
                No images uploaded yet. Go to <strong>Media</strong> in the sidebar to upload some,
                then come back here.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {choices.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => choose(c)}
                    className="overflow-hidden rounded-xl border border-border bg-background text-left transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
                  >
                    <span className="relative block aspect-[4/3] bg-muted">
                      <Image src={c.url} alt={c.filename} fill className="object-cover" sizes="200px" />
                    </span>
                    <span className="block truncate p-2 text-xs">{c.filename}</span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setPicking(false)}
              className="mt-4 rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:border-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
