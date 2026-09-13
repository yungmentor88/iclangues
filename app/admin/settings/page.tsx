import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { SettingsForm, type SiteSettingsRow } from "@/components/admin/settings-form";

/**
 * Site settings (spec §4 "Settings", §9 "Reusable content").
 *
 * Contact details currently live hard-coded in site-footer.tsx,
 * contact-content.tsx AND the contact.* i18n keys. This screen is the single
 * source of truth they will all read from once the frontend is switched over.
 */

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let settings: SiteSettingsRow | null = null;
  let loadFailed = false;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("site_settings")
        .select(
          "school_name, contact_email, contact_phone, whatsapp_number, address, social_instagram, social_facebook, social_youtube"
        )
        .eq("id", true)
        .maybeSingle();
      if (error) loadFailed = true;
      else settings = (data ?? null) as SiteSettingsRow | null;
    } catch {
      loadFailed = true;
    }
  } else {
    loadFailed = true;
  }

  return (
    <div>
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Configuration</p>
        <h1 className="mt-1.5 font-display text-3xl font-bold sm:text-4xl">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Your school&rsquo;s contact details. Change them once here and they update everywhere on
          the website.
        </p>
      </header>

      {loadFailed || !settings ? (
        <p className="rounded-[22px] border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          Couldn&rsquo;t load your settings right now. Your data is safe — please refresh in a
          moment.
        </p>
      ) : (
        <SettingsForm settings={settings} />
      )}
    </div>
  );
}
