"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Check, CircleAlert, Loader2, Eye, EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { saveFaq, deleteFaq, reorderItem } from "@/app/admin/collections";

export interface FaqRow {
  id: string;
  question: Record<string, string>;
  answer: Record<string, string>;
  is_published: boolean;
  sort: number;
}

const LANGS = ["en", "pt", "fr", "es", "kr"] as const;

type Notice = { kind: "ok" | "error"; message: string } | null;

const blank = (): FaqRow => ({
  id: "",
  question: { en: "" },
  answer: { en: "" },
  is_published: true,
  sort: 999,
});

export function FaqsManager({ faqs }: { faqs: FaqRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<FaqRow | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  function move(id: string, direction: "up" | "down") {
    startTransition(async () => {
      const r = await reorderItem("faqs", id, direction);
      if (!r.ok) setNotice({ kind: "error", message: r.error ?? "Could not reorder." });
      else router.refresh();
    });
  }

  function remove(id: string) {
    setConfirmId(null);
    startTransition(async () => {
      const r = await deleteFaq(id);
      if (r.ok) {
        setNotice({ kind: "ok", message: "FAQ deleted." });
        router.refresh();
      } else {
        setNotice({ kind: "error", message: r.error ?? "Could not delete." });
      }
    });
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {faqs.length} question{faqs.length === 1 ? "" : "s"}
        </p>
        <button
          onClick={() => setEditing(blank())}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-105"
        >
          <Plus className="h-4 w-4" /> Add FAQ
        </button>
      </div>

      {notice && (
        <p
          className={cn(
            "mb-4 flex items-start gap-2 rounded-[22px] border p-4 text-sm",
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

      {faqs.length === 0 ? (
        <p className="rounded-[22px] border border-border bg-card p-10 text-center text-muted-foreground">
          No FAQs yet. Add your first question above.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {faqs.map((f, i) => (
            <li
              key={f.id}
              className="flex items-start gap-3 rounded-[22px] border border-border bg-card p-4"
            >
              <span className="flex flex-none flex-col gap-0.5">
                <button
                  onClick={() => move(f.id, "up")}
                  disabled={i === 0 || busy}
                  className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition hover:bg-muted disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => move(f.id, "down")}
                  disabled={i === faqs.length - 1 || busy}
                  className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition hover:bg-muted disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </span>

              <button onClick={() => setEditing(f)} className="min-w-0 flex-1 text-left">
                <span className="flex items-center gap-2">
                  <span className="truncate font-semibold">{f.question.en || "(untitled)"}</span>
                  {!f.is_published && (
                    <span className="flex-none rounded-full bg-muted px-2 py-0.5 text-[0.68rem] font-bold uppercase text-muted-foreground">
                      Hidden
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                  {f.answer.en}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {LANGS.filter((l) => f.question[l]?.trim()).length}/5 languages
                </span>
              </button>

              {confirmId === f.id ? (
                <span className="flex flex-none items-center gap-1.5">
                  <button
                    onClick={() => remove(f.id)}
                    disabled={busy}
                    className="rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-medium"
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmId(f.id)}
                  disabled={busy}
                  className="grid h-8 w-8 flex-none place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <FaqModal
          faq={editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setNotice({ kind: "ok", message });
            router.refresh();
          }}
          onError={(message) => setNotice({ kind: "error", message })}
        />
      )}
    </div>
  );
}

function FaqModal({
  faq,
  onClose,
  onSaved,
  onError,
}: {
  faq: FaqRow;
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [question, setQuestion] = useState<Record<string, string>>({ ...faq.question });
  const [answer, setAnswer] = useState<Record<string, string>>({ ...faq.answer });
  const [published, setPublished] = useState(faq.is_published);
  const [lang, setLang] = useState<string>("en");
  const [busy, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const r = await saveFaq(faq.id || null, {
        question,
        answer,
        is_published: published,
        sort: faq.sort,
      });
      if (r.ok) onSaved(faq.id ? "FAQ updated." : "FAQ added.");
      else onError(r.error ?? "Could not save.");
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[22px] border border-border bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 font-display text-xl font-bold">
          {faq.id ? "Edit FAQ" : "New FAQ"}
        </h2>

        <div className="mb-3 flex gap-1">
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-bold uppercase transition",
                lang === l
                  ? "bg-primary text-primary-foreground"
                  : question[l]?.trim()
                    ? "bg-muted text-muted-foreground"
                    : "bg-muted/50 text-muted-foreground/50"
              )}
            >
              {l}
            </button>
          ))}
        </div>

        <label className="mb-1.5 block text-sm font-semibold">Question</label>
        <input
          value={question[lang] ?? ""}
          onChange={(e) => setQuestion({ ...question, [lang]: e.target.value })}
          className="mb-4 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary"
        />

        <label className="mb-1.5 block text-sm font-semibold">Answer</label>
        <textarea
          value={answer[lang] ?? ""}
          onChange={(e) => setAnswer({ ...answer, [lang]: e.target.value })}
          rows={5}
          className="mb-4 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary"
        />

        {lang !== "en" && (
          <p className="mb-4 text-xs text-muted-foreground">
            Leave blank to show the English text to visitors in this language.
          </p>
        )}

        <button
          onClick={() => setPublished((v) => !v)}
          className="mb-5 flex items-center gap-2 text-sm font-medium"
        >
          {published ? (
            <Eye className="h-4 w-4 text-primary" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
          {published ? "Visible on the website" : "Hidden from visitors"}
        </button>

        <div className="flex gap-2.5">
          <button
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-105 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save
          </button>
          <button
            onClick={onClose}
            className="rounded-full border border-border px-4 py-2.5 text-sm font-medium transition hover:border-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
