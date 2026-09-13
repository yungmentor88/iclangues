import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { FaqsManager, type FaqRow } from "@/components/admin/faqs-manager";

/** FAQ collection (spec §13). */

export const dynamic = "force-dynamic";

export default async function FaqsPage() {
  let faqs: FaqRow[] = [];
  let loadFailed = false;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("faqs")
        .select("id, question, answer, is_published, sort")
        .order("sort", { ascending: true });
      if (error) loadFailed = true;
      else faqs = (data ?? []) as FaqRow[];
    } catch {
      loadFailed = true;
    }
  } else {
    loadFailed = true;
  }

  return (
    <div>
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Content</p>
        <h1 className="mt-1.5 font-display text-3xl font-bold sm:text-4xl">FAQs</h1>
        <p className="mt-2 text-muted-foreground">
          The questions shown on your homepage. Drag-free reordering with the arrows.
        </p>
      </header>

      {loadFailed ? (
        <p className="rounded-[22px] border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          Couldn&rsquo;t load your FAQs right now. Your data is safe — please refresh in a moment.
        </p>
      ) : (
        <FaqsManager faqs={faqs} />
      )}
    </div>
  );
}
