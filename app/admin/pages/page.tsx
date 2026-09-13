import Link from "next/link";
import { FileText, ArrowRight, Layers } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/** Pages listing — the entry point to the visual editor (spec §5). */

interface PageRow {
  id: string;
  slug: string;
  title: Record<string, string>;
  sort: number;
  page_sections: { id: string }[];
}

async function loadPages(): Promise<PageRow[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("pages")
      .select("id, slug, title, sort, page_sections(id)")
      .order("sort", { ascending: true });
    if (error || !data) return null;
    return data as PageRow[];
  } catch {
    return null;
  }
}

const PUBLIC_PATH: Record<string, string> = {
  home: "/",
  about: "/about",
  courses: "/courses",
  contact: "/contact",
};

export default async function AdminPagesIndex() {
  const pages = await loadPages();

  return (
    <div>
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Website</p>
        <h1 className="mt-1.5 font-display text-3xl font-bold sm:text-4xl">Pages</h1>
        <p className="mt-2 text-muted-foreground">
          Choose a page to edit its text and images. Changes save as drafts until you publish.
        </p>
      </header>

      {pages === null && (
        <p className="rounded-[22px] border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          Couldn&rsquo;t load your pages right now. Your content is safe — please refresh in a moment.
        </p>
      )}

      {pages && pages.length === 0 && (
        <p className="rounded-[22px] border border-border bg-card p-8 text-center text-muted-foreground">
          No pages yet.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {(pages ?? []).map((p) => (
          <Link
            key={p.id}
            href={`/admin/pages/${p.slug}`}
            className="group flex items-start gap-4 rounded-[22px] border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-primary/15 text-primary">
              <FileText className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg font-bold">{p.title?.en ?? p.slug}</span>
              <span className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Layers className="h-3.5 w-3.5" />
                {p.page_sections?.length ?? 0} section
                {(p.page_sections?.length ?? 0) === 1 ? "" : "s"}
                <span className="text-border">·</span>
                <span className="truncate">{PUBLIC_PATH[p.slug] ?? `/${p.slug}`}</span>
              </span>
            </span>
            <ArrowRight className="mt-3 h-4 w-4 flex-none text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
