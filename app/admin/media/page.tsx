import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MediaLibrary, type MediaItem } from "@/components/admin/media-library";

/** Media library (spec §8): upload, browse, edit alt text, delete unused files. */

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  let items: MediaItem[] = [];
  let loadFailed = false;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("media")
        .select("id, storage_path, filename, mime_type, size_bytes, alt_text, description, created_at")
        .order("created_at", { ascending: false });
      if (error) loadFailed = true;
      else items = (data ?? []) as MediaItem[];
    } catch {
      loadFailed = true;
    }
  } else {
    loadFailed = true;
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  return (
    <div>
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Library</p>
        <h1 className="mt-1.5 font-display text-3xl font-bold sm:text-4xl">Media</h1>
        <p className="mt-2 text-muted-foreground">
          Upload and manage the images used across your website.
        </p>
      </header>

      {loadFailed ? (
        <p className="rounded-[22px] border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          Couldn&rsquo;t load your media right now. Your files are safe — please refresh in a moment.
        </p>
      ) : (
        <MediaLibrary items={items} publicBase={`${base}/storage/v1/object/public/media/`} />
      )}
    </div>
  );
}
