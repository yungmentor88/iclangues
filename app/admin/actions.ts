"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin-auth";

/**
 * Server actions for the admin CMS.
 *
 * Every action re-checks admin status server-side. That is deliberate
 * belt-and-braces: RLS already rejects non-admin writes at the database, so
 * even a forged request cannot change data. These checks exist so the user
 * gets a clean error instead of a confusing database rejection.
 *
 * Errors are RETURNED, never thrown — the UI shows a message and keeps the
 * user's typing (spec §25: never lose the administrator's work).
 */

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const LANGS = ["en", "pt", "fr", "es", "kr"] as const;
type Lang = (typeof LANGS)[number];

/** Strip empty translations and guarantee English is present. */
function cleanI18n(value: Record<string, string>): Record<string, string> | null {
  const out: Record<string, string> = {};
  for (const l of LANGS) {
    const v = (value[l] ?? "").trim();
    if (v) out[l] = v;
  }
  return out.en ? out : null;
}

/** Save one translatable UI string as a DRAFT (not live until published). */
export async function saveUiString(
  key: string,
  value: Record<string, string>
): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not signed in as an administrator." };

  const cleaned = cleanI18n(value);
  if (!cleaned) return { ok: false, error: "English text is required — it is used as the fallback." };

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("ui_strings")
      .update({ draft_value: cleaned, updated_by: admin.id })
      .eq("key", key);

    if (error) return { ok: false, error: `Your changes could not be saved. ${error.message}` };

    revalidatePath("/admin/pages");
    return { ok: true };
  } catch {
    return { ok: false, error: "Your changes could not be saved. Please try again." };
  }
}

/** Save several strings at once (one section's worth). Stops at the first failure. */
export async function saveUiStrings(
  entries: { key: string; value: Record<string, string> }[]
): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not signed in as an administrator." };

  for (const entry of entries) {
    const result = await saveUiString(entry.key, entry.value);
    if (!result.ok) return result;
  }
  return { ok: true };
}

/** Replace an image reference inside a page section's draft content. */
export async function saveSectionImage(
  sectionId: string,
  path: string[],
  src: string
): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not signed in as an administrator." };

  try {
    const supabase = createClient();
    const { data, error: readError } = await supabase
      .from("page_sections")
      .select("draft_content")
      .eq("id", sectionId)
      .maybeSingle();

    if (readError || !data) return { ok: false, error: "Could not load that section." };

    // Walk the JSON path and set the value, e.g. ["slides","0","src"].
    const content = structuredClone(data.draft_content ?? {}) as Record<string, unknown>;
    let node: any = content;
    for (let i = 0; i < path.length - 1; i++) {
      if (node[path[i]] === undefined) return { ok: false, error: "That field no longer exists." };
      node = node[path[i]];
    }
    node[path[path.length - 1]] = src;

    const { error } = await supabase
      .from("page_sections")
      .update({ draft_content: content, updated_by: admin.id })
      .eq("id", sectionId);

    if (error) return { ok: false, error: `Your changes could not be saved. ${error.message}` };

    revalidatePath("/admin/pages");
    return { ok: true };
  } catch {
    return { ok: false, error: "Your changes could not be saved. Please try again." };
  }
}

/**
 * Save a value at a JSON path inside a section's draft content.
 *
 * Handles both a translated object ({en, pt, ...}) and a plain scalar such as
 * a button link. Used for anything stored on the section itself rather than
 * in ui_strings.
 */
export async function saveSectionValue(
  sectionId: string,
  path: string[],
  value: Record<string, string> | string
): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not signed in as an administrator." };
  if (path.length === 0) return { ok: false, error: "Nothing to save." };

  let toWrite: unknown;
  if (typeof value === "string") {
    const trimmed = value.trim();
    // Guard against links that would break navigation (spec §14).
    const looksLikeLink = path[path.length - 1] === "href";
    if (looksLikeLink && trimmed && !/^(\/|https?:\/\/|mailto:|tel:)/.test(trimmed)) {
      return {
        ok: false,
        error: "Links must start with / for this site, or https:// for an external site.",
      };
    }
    toWrite = trimmed;
  } else {
    const cleaned = cleanI18n(value);
    if (!cleaned) return { ok: false, error: "English text is required — it is used as the fallback." };
    toWrite = cleaned;
  }

  try {
    const supabase = createClient();
    const { data, error: readError } = await supabase
      .from("page_sections")
      .select("draft_content")
      .eq("id", sectionId)
      .maybeSingle();

    if (readError || !data) return { ok: false, error: "Could not load that section." };

    const content = structuredClone(data.draft_content ?? {}) as Record<string, unknown>;
    let node: any = content;
    for (let i = 0; i < path.length - 1; i++) {
      if (node[path[i]] === undefined) return { ok: false, error: "That field no longer exists." };
      node = node[path[i]];
    }
    node[path[path.length - 1]] = toWrite;

    const { error } = await supabase
      .from("page_sections")
      .update({ draft_content: content, updated_by: admin.id })
      .eq("id", sectionId);

    if (error) return { ok: false, error: `Your changes could not be saved. ${error.message}` };

    revalidatePath("/admin/pages");
    return { ok: true };
  } catch {
    return { ok: false, error: "Your changes could not be saved. Please try again." };
  }
}

/** Publish everything currently in draft. Returns how many items went live. */
export async function publishAll(note?: string): Promise<ActionResult & { count?: number }> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not signed in as an administrator." };

  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("publish_all", { p_note: note ?? null });

    if (error) {
      return { ok: false, error: `Publishing failed. Your draft has been preserved. ${error.message}` };
    }

    // Published content changes the public site — refresh every cached route.
    revalidatePath("/", "layout");
    return { ok: true, count: typeof data === "number" ? data : undefined };
  } catch {
    return { ok: false, error: "Publishing failed. Your draft has been preserved." };
  }
}

/** Discard drafts by resetting them back to what is currently published. */
export async function discardDrafts(): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not signed in as an administrator." };

  try {
    const supabase = createClient();

    const { data: strings } = await supabase
      .from("ui_strings")
      .select("key, published_value")
      .not("published_value", "is", null);

    for (const row of (strings ?? []) as { key: string; published_value: unknown }[]) {
      await supabase
        .from("ui_strings")
        .update({ draft_value: row.published_value })
        .eq("key", row.key);
    }

    const { data: sections } = await supabase
      .from("page_sections")
      .select("id, published_content")
      .not("published_content", "is", null);

    for (const row of (sections ?? []) as { id: string; published_content: unknown }[]) {
      await supabase
        .from("page_sections")
        .update({ draft_content: row.published_content })
        .eq("id", row.id);
    }

    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not discard drafts. Please try again." };
  }
}
