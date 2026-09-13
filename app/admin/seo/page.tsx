import Link from "next/link";
import { Search, FileText, Info } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * SEO (spec §15).
 *
 * The page_seo table exists but nothing writes to it yet, and the frontend
 * still takes its metadata from the static export in app/layout.tsx. Rather
 * than ship a form whose values would silently never reach a search engine,
 * this screen states plainly what is live today and what is coming.
 */

export const dynamic = "force-dynamic";

export default async function SeoPage() {
  let pageCount = 0;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { count } = await supabase.from("pages").select("id", { count: "exact", head: true });
      pageCount = count ?? 0;
    } catch {
      /* count is cosmetic here — fall through with 0 */
    }
  }

  return (
    <div>
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Website</p>
        <h1 className="mt-1.5 font-display text-3xl font-bold sm:text-4xl">SEO</h1>
        <p className="mt-2 text-muted-foreground">
          How your pages appear in Google and when shared on social media.
        </p>
      </header>

      <section className="mb-4 rounded-[22px] border border-amber-300 bg-amber-50/60 p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Info className="h-[1.15rem] w-[1.15rem]" /> Editing is still being built
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Per-page titles and descriptions need to be connected to the live pages before this
          screen can do anything useful. Showing you a form that quietly saved nowhere would be
          worse than showing you this.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Your site <strong>is</strong> already indexable — the settings below are live right now,
          set in the site&rsquo;s code.
        </p>
      </section>

      <section className="rounded-[22px] border border-border bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
          <Search className="h-[1.15rem] w-[1.15rem] text-primary" /> Currently live
        </h2>

        <dl className="space-y-4 text-sm">
          <div>
            <dt className="font-semibold">Search result title</dt>
            <dd className="mt-0.5 text-muted-foreground">
              IClangues — Learn Languages with Native Speakers | Cabo Verde
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Description</dt>
            <dd className="mt-0.5 text-muted-foreground">
              IClangues is a Cabo Verde language school teaching Kriolu, English, French, Spanish
              and Portuguese with native speakers — online and in person, A1–C2.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Admin pages</dt>
            <dd className="mt-0.5 text-muted-foreground">
              Hidden from search engines, as they should be.
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-4 rounded-[22px] border border-border bg-card p-5">
        <h2 className="mb-1.5 flex items-center gap-2 font-display text-lg font-bold">
          <FileText className="h-[1.15rem] w-[1.15rem] text-primary" /> Coming here
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          A title, description and social sharing image for each of your {pageCount || 4} pages,
          with a preview of how the result will look in Google.
        </p>
        <Link
          href="/admin/pages"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary"
        >
          Edit page content instead
        </Link>
      </section>
    </div>
  );
}
