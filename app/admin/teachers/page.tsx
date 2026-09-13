import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { TeachersManager, type TeacherRow } from "@/components/admin/teachers-manager";

/**
 * Teachers / staff (spec §11).
 *
 * Note: this collection has no frontend section yet — the approved design
 * doesn't include a teachers block, and adding one is a visual change the
 * owner should approve first. Managing them here is safe in the meantime;
 * nothing appears on the public site until that section is built.
 */

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  let teachers: TeacherRow[] = [];
  let loadFailed = false;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("teachers")
        .select("id, name, role, bio, languages, photo_id, is_published, sort")
        .order("sort", { ascending: true });
      if (error) loadFailed = true;
      else teachers = (data ?? []) as TeacherRow[];
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
        <h1 className="mt-1.5 font-display text-3xl font-bold sm:text-4xl">Teachers</h1>
        <p className="mt-2 text-muted-foreground">
          Your teaching team. Add them here now — they&rsquo;ll appear on the website once the
          teachers section is added to the design.
        </p>
      </header>

      {loadFailed ? (
        <p className="rounded-[22px] border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          Couldn&rsquo;t load your teachers right now. Your data is safe — please refresh in a
          moment.
        </p>
      ) : (
        <TeachersManager teachers={teachers} />
      )}
    </div>
  );
}
