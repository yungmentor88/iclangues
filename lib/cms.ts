/**
 * CMS read layer (server-only).
 *
 * Reads published content from Supabase when the CMS tables exist, and
 * falls back to the hard-coded content in lib/i18n.tsx / lib/content.ts
 * when they don't. That fallback is what makes applying the migrations a
 * non-event: the site renders identically before and after.
 *
 * IMPORTANT: every function here returns `null`/seed on failure rather than
 * throwing. A CMS outage must never take the marketing site down.
 *
 * Do NOT import this from a client component — it uses next/headers via
 * lib/supabase/server. Client components keep using useI18n().
 */

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Lang } from "@/lib/i18n";

/** A translated value: { en: "...", pt: "...", ... }. English is required. */
export type I18nValue = Partial<Record<Lang, string>> & { en: string };

export interface SiteSettings {
  school_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  whatsapp_number: string | null;
  address: I18nValue | null;
  social_instagram: string | null;
  social_facebook: string | null;
  social_youtube: string | null;
}

export interface NavItem {
  label: I18nValue;
  href: string;
  is_external: boolean;
  open_new_tab: boolean;
}

export interface FaqItem {
  question: I18nValue;
  answer: I18nValue;
}

/** Resolve a translated value for a language, falling back to English. */
export function pick(value: I18nValue | null | undefined, lang: Lang): string {
  if (!value) return "";
  return value[lang] ?? value.en ?? "";
}

/**
 * Whether the CMS tables have been migrated yet.
 *
 * Cached per request via a module-level promise reset on each server tick;
 * a missing table returns PostgREST error 42P01 which we treat as "not
 * migrated" rather than an outage.
 */
export async function isCmsReady(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = createClient();
    const { error } = await supabase.from("ui_strings").select("key").limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Published UI strings as the same shape lib/i18n.tsx uses:
 *   { "hero.title1": { en: "...", pt: "..." }, ... }
 *
 * Returns null when the CMS isn't ready, so callers keep their static
 * dictionary.
 */
export async function getUiStrings(): Promise<Record<string, I18nValue> | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ui_strings")
      .select("key, published_value")
      .not("published_value", "is", null);

    if (error || !data || data.length === 0) return null;

    const out: Record<string, I18nValue> = {};
    for (const row of data as { key: string; published_value: I18nValue }[]) {
      out[row.key] = row.published_value;
    }
    return out;
  } catch {
    return null;
  }
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select(
        "school_name, contact_email, contact_phone, whatsapp_number, address, social_instagram, social_facebook, social_youtube"
      )
      .eq("id", true)
      .maybeSingle();

    if (error || !data) return null;
    return data as SiteSettings;
  } catch {
    return null;
  }
}

export async function getNavItems(menu: "header" | "footer"): Promise<NavItem[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("nav_items")
      .select("label, href, is_external, open_new_tab")
      .eq("menu", menu)
      .eq("is_visible", true)
      .order("sort", { ascending: true });

    if (error || !data || data.length === 0) return null;
    return data as NavItem[];
  } catch {
    return null;
  }
}

export async function getFaqs(): Promise<FaqItem[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("faqs")
      .select("question, answer")
      .eq("is_published", true)
      .order("sort", { ascending: true });

    if (error || !data || data.length === 0) return null;
    return data as FaqItem[];
  } catch {
    return null;
  }
}

/**
 * Published content for one page section, e.g. getSection("home", "hero").
 * The shape of `content` depends on section_type — callers narrow it.
 */
export async function getSection<T = Record<string, unknown>>(
  pageSlug: string,
  sectionKey: string
): Promise<T | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("page_sections")
      .select("published_content, pages!inner(slug)")
      .eq("pages.slug", pageSlug)
      .eq("section_key", sectionKey)
      .eq("is_visible", true)
      .maybeSingle();

    if (error || !data?.published_content) return null;
    return data.published_content as T;
  } catch {
    return null;
  }
}
