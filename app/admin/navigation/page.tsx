import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { NavigationManager, type NavRow } from "@/components/admin/navigation-manager";

/** Header and footer menus (spec §14). */

export const dynamic = "force-dynamic";

export default async function NavigationPage() {
  let items: NavRow[] = [];
  let loadFailed = false;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("nav_items")
        .select("id, menu, label, href, is_external, open_new_tab, is_visible, sort")
        .order("menu", { ascending: true })
        .order("sort", { ascending: true });
      if (error) loadFailed = true;
      else items = (data ?? []) as NavRow[];
    } catch {
      loadFailed = true;
    }
  } else {
    loadFailed = true;
  }

  return (
    <div>
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Website</p>
        <h1 className="mt-1.5 font-display text-3xl font-bold sm:text-4xl">Navigation</h1>
        <p className="mt-2 text-muted-foreground">
          The menu links in your header and footer. Changes appear immediately.
        </p>
      </header>

      {loadFailed ? (
        <p className="rounded-[22px] border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          Couldn&rsquo;t load your menus right now. Your data is safe — please refresh in a moment.
        </p>
      ) : (
        <NavigationManager items={items} />
      )}
    </div>
  );
}
