import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { collectStringKeys } from "@/lib/section-fields";
import { SectionEditor } from "@/components/admin/section-editor";

/** The visual page editor (spec §5): a page broken into editable sections. */

export const dynamic = "force-dynamic";

const PUBLIC_PATH: Record<string, string> = {
  home: "/",
  about: "/about",
  courses: "/courses",
  contact: "/contact",
};

interface SectionRow {
  id: string;
  section_key: string;
  section_type: string;
  label: string;
  draft_content: Record<string, unknown>;
  published_content: Record<string, unknown> | null;
  sort: number;
}

export default async function EditPage({ params }: { params: { slug: string } }) {
  if (!isSupabaseConfigured()) notFound();

  const supabase = createClient();

  const { data: page } = await supabase
    .from("pages")
    .select("id, slug, title")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!page) notFound();

  const { data: sectionData } = await supabase
    .from("page_sections")
    .select("id, section_key, section_type, label, draft_content, published_content, sort")
    .eq("page_id", page.id)
    .order("sort", { ascending: true });

  const sections = (sectionData ?? []) as SectionRow[];

  // Every translatable string these sections reference, fetched in one query
  // rather than per-field.
  const keys = Array.from(
    new Set(sections.flatMap((s) => collectStringKeys(s.draft_content ?? {})))
  );

  const stringsById: Record<string, Record<string, string>> = {};
  if (keys.length) {
    const { data: strings } = await supabase
      .from("ui_strings")
      .select("key, draft_value")
      .in("key", keys);

    for (const row of (strings ?? []) as { key: string; draft_value: Record<string, string> }[]) {
      stringsById[row.key] = row.draft_value;
    }
  }

  const title = (page.title as Record<string, string>)?.en ?? page.slug;
  const publicPath = PUBLIC_PATH[page.slug] ?? `/${page.slug}`;

  return (
    <div>
      <Link
        href="/admin/pages"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All pages
      </Link>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Editing page</p>
          <h1 className="mt-1.5 font-display text-3xl font-bold sm:text-4xl">{title}</h1>
          <p className="mt-2 text-muted-foreground">
            {sections.length} section{sections.length === 1 ? "" : "s"} · changes save as drafts until you publish
          </p>
        </div>
        <a
          href={publicPath}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition hover:border-primary"
        >
          <ExternalLink className="h-4 w-4" /> View live
        </a>
      </header>

      {sections.length === 0 && (
        <p className="rounded-[22px] border border-border bg-card p-8 text-center text-muted-foreground">
          This page has no editable sections yet.
        </p>
      )}

      <div className="space-y-3">
        {sections.map((s) => (
          <SectionEditor
            key={s.id}
            sectionId={s.id}
            label={s.label}
            sectionType={s.section_type}
            content={s.draft_content ?? {}}
            strings={stringsById}
            hasUnpublished={
              JSON.stringify(s.draft_content) !== JSON.stringify(s.published_content)
            }
          />
        ))}
      </div>
    </div>
  );
}
