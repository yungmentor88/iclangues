import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { PublishPanel } from "@/components/admin/publish-panel";

/**
 * Review & publish (spec §7/§22).
 *
 * Drafts are invisible to visitors until published here. The frontend reads
 * only published_* columns, so nothing on this screen can leak to the public
 * site before the owner presses Publish.
 */

export const dynamic = "force-dynamic";

interface PendingRow {
  entity: string;
  entity_id: string;
  label: string | null;
  updated_at: string;
}

export default async function PublishPage() {
  let pending: PendingRow[] = [];
  let loadFailed = false;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("pending_changes")
        .select("entity, entity_id, label, updated_at")
        .order("updated_at", { ascending: false });
      if (error) loadFailed = true;
      else pending = (data ?? []) as PendingRow[];
    } catch {
      loadFailed = true;
    }
  } else {
    loadFailed = true;
  }

  return (
    <div>
      <Link
        href="/admin"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Review</p>
        <h1 className="mt-1.5 font-display text-3xl font-bold sm:text-4xl">Publish changes</h1>
        <p className="mt-2 text-muted-foreground">
          Everything below is saved as a draft. Visitors won&rsquo;t see it until you publish.
        </p>
      </header>

      {loadFailed ? (
        <p className="rounded-[22px] border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          Couldn&rsquo;t load your pending changes. Your drafts are safe — please refresh in a moment.
        </p>
      ) : (
        <PublishPanel pending={pending} />
      )}
    </div>
  );
}
