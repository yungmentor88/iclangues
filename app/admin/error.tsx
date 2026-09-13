"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CircleAlert, RotateCw, ArrowLeft } from "lucide-react";

/**
 * Error boundary for /admin/*.
 *
 * Without this, any thrown error unmounts the tree and Next shows the
 * generic "Application error: a client-side exception has occurred", with
 * the real cause only in the browser console. That is useless to a
 * non-technical owner and hard to diagnose remotely.
 *
 * This surfaces the actual message and digest on screen so it can be read
 * and reported without opening devtools.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Also log it, so it appears in the browser console and in Vercel's
    // function logs when the failure happens during a server render.
    console.error("[admin] unhandled error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-10">
      <div className="rounded-[22px] border border-destructive/30 bg-destructive/5 p-6">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <CircleAlert className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">
          None of your content was changed. The details below help pinpoint the cause.
        </p>

        <div className="mt-5 rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Error message
          </p>
          <p className="mt-1 break-words font-mono text-sm text-foreground">
            {error?.message || "(no message provided)"}
          </p>

          {error?.digest && (
            <>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Digest
              </p>
              <p className="mt-1 font-mono text-sm text-foreground">{error.digest}</p>
            </>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-105"
          >
            <RotateCw className="h-4 w-4" /> Try again
          </button>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium transition hover:border-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
