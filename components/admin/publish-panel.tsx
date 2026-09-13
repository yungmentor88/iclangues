"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CircleCheck, CircleAlert, Loader2, Rocket, Undo2, FileText, Type,
} from "lucide-react";
import { publishAll, discardDrafts } from "@/app/admin/actions";

/**
 * Publish / discard controls.
 *
 * Discard is destructive, so it requires an explicit second confirmation
 * (spec §24). Publish is not destructive — it only makes drafts visible —
 * so a single press is enough.
 */

interface PendingRow {
  entity: string;
  entity_id: string;
  label: string | null;
  updated_at: string;
}

type Result = { kind: "none" } | { kind: "ok"; message: string } | { kind: "error"; message: string };

const ENTITY_LABEL: Record<string, { label: string; icon: typeof Type }> = {
  ui_string: { label: "Text", icon: Type },
  page_section: { label: "Section", icon: FileText },
};

export function PublishPanel({ pending }: { pending: PendingRow[] }) {
  const router = useRouter();
  const [result, setResult] = useState<Result>({ kind: "none" });
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [busy, startTransition] = useTransition();

  function doPublish() {
    setResult({ kind: "none" });
    startTransition(async () => {
      const r = await publishAll();
      if (r.ok) {
        setResult({
          kind: "ok",
          message:
            typeof r.count === "number"
              ? `Published ${r.count} change${r.count === 1 ? "" : "s"}. Your website is live.`
              : "Your changes are live.",
        });
        router.refresh();
      } else {
        setResult({ kind: "error", message: r.error ?? "Publishing failed." });
      }
    });
  }

  function doDiscard() {
    setResult({ kind: "none" });
    setConfirmDiscard(false);
    startTransition(async () => {
      const r = await discardDrafts();
      if (r.ok) {
        setResult({ kind: "ok", message: "Drafts discarded — back to what's live." });
        router.refresh();
      } else {
        setResult({ kind: "error", message: r.error ?? "Could not discard drafts." });
      }
    });
  }

  if (pending.length === 0) {
    return (
      <div className="rounded-[22px] border border-border bg-card p-10 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
          <CircleCheck className="h-7 w-7" />
        </span>
        <p className="mt-4 font-display text-xl font-bold">Everything is published</p>
        <p className="mt-1.5 text-muted-foreground">
          You have no unpublished drafts. Edit a page and your changes will appear here.
        </p>
        {result.kind === "ok" && (
          <p className="mt-4 text-sm font-medium text-primary">{result.message}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-amber-300 bg-amber-50/60 p-5">
        <p className="font-display text-lg font-bold">
          {pending.length} unpublished change{pending.length === 1 ? "" : "s"}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Publishing makes all of them visible on your website at once.
        </p>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <button
            onClick={doPublish}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-105 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            {busy ? "Publishing…" : "Publish all changes"}
          </button>

          {confirmDiscard ? (
            <span className="inline-flex items-center gap-2">
              <button
                onClick={doDiscard}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition hover:brightness-105 disabled:opacity-60"
              >
                <Undo2 className="h-4 w-4" /> Yes, discard everything
              </button>
              <button
                onClick={() => setConfirmDiscard(false)}
                className="rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:border-foreground"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmDiscard(true)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:border-destructive hover:text-destructive disabled:opacity-60"
            >
              <Undo2 className="h-4 w-4" /> Discard drafts
            </button>
          )}
        </div>

        {confirmDiscard && (
          <p className="mt-3 text-sm text-destructive">
            This throws away all {pending.length} draft change{pending.length === 1 ? "" : "s"} and
            cannot be undone.
          </p>
        )}
      </div>

      {result.kind === "ok" && (
        <p className="flex items-center gap-2 rounded-[22px] border border-primary/30 bg-primary/5 p-4 text-sm font-medium text-primary">
          <CircleCheck className="h-4 w-4 flex-none" /> {result.message}
        </p>
      )}
      {result.kind === "error" && (
        <p className="flex items-start gap-2 rounded-[22px] border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <CircleAlert className="mt-0.5 h-4 w-4 flex-none" /> {result.message}
        </p>
      )}

      <ul className="divide-y divide-border overflow-hidden rounded-[22px] border border-border bg-card">
        {pending.map((p) => {
          const meta = ENTITY_LABEL[p.entity] ?? { label: p.entity, icon: FileText };
          const Icon = meta.icon;
          return (
            <li key={`${p.entity}-${p.entity_id}`} className="flex items-center gap-3.5 px-5 py-3.5">
              <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {p.label || p.entity_id}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {meta.label} · edited {new Date(p.updated_at).toLocaleString()}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
