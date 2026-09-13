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

interface ActionResult {
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

/* ──────────────────────────── Media library ──────────────────────────── */

const ALLOWED_MIME = new Set([
  "image/jpeg", "image/png", "image/webp", "image/avif",
  "image/gif", "image/svg+xml", "application/pdf",
]);
const MAX_BYTES = 10 * 1024 * 1024; // must match the bucket's file_size_limit

/**
 * Upload one file into the media bucket and record it in the media table.
 *
 * Both writes happen in this one request so a Storage object can never end up
 * orphaned with no row pointing at it.
 */
export async function uploadMedia(formData: FormData): Promise<ActionResult & { id?: string }> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not signed in as an administrator." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file to upload." };
  }

  // Validate before touching storage (spec §21).
  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, error: `${file.type || "That file type"} isn't allowed. Use JPG, PNG, WebP, AVIF, GIF, SVG or PDF.` };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: `That file is ${(file.size / 1048576).toFixed(1)} MB. The limit is 10 MB — please resize it first.` };
  }

  // Keep the original name readable but make the stored path unique and safe.
  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);
  const storagePath = `${Date.now()}-${safeName}`;

  try {
    const supabase = createClient();

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      return { ok: false, error: `Unable to upload image. ${uploadError.message}` };
    }

    const { data, error } = await supabase
      .from("media")
      .insert({
        storage_path: storagePath,
        filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        created_by: admin.id,
      })
      .select("id")
      .maybeSingle();

    if (error) {
      // Roll the object back so we don't leave a file with no record.
      await supabase.storage.from("media").remove([storagePath]);
      return { ok: false, error: `Unable to save that file. ${error.message}` };
    }

    revalidatePath("/admin/media");
    return { ok: true, id: data?.id as string | undefined };
  } catch {
    return { ok: false, error: "Unable to upload image. Please try again." };
  }
}

/**
 * Media list for the image picker in the page editor.
 *
 * Returns ready-to-use public URLs so the client never has to know the
 * bucket name or how a storage path maps to a URL.
 */
export async function listMedia(): Promise<
  ActionResult & { items?: { id: string; filename: string; url: string }[] }
> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not signed in as an administrator." };

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("media")
      .select("id, filename, storage_path, mime_type")
      .like("mime_type", "image/%")
      .order("created_at", { ascending: false });

    if (error) return { ok: false, error: `Could not load your media. ${error.message}` };

    const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const items = (data ?? []).map((row) => ({
      id: row.id as string,
      filename: row.filename as string,
      url: `${base}/storage/v1/object/public/media/${row.storage_path}`,
    }));

    return { ok: true, items };
  } catch {
    return { ok: false, error: "Could not load your media. Please try again." };
  }
}

/** Update a media file's alt text (translatable) or description. */
export async function updateMediaMeta(
  id: string,
  altText: Record<string, string>,
  description: string
): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not signed in as an administrator." };

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("media")
      .update({ alt_text: cleanI18n(altText), description: description.trim() || null })
      .eq("id", id);

    if (error) return { ok: false, error: `Your changes could not be saved. ${error.message}` };
    revalidatePath("/admin/media");
    return { ok: true };
  } catch {
    return { ok: false, error: "Your changes could not be saved. Please try again." };
  }
}

/**
 * Delete a media file — but refuse if a page still uses it (spec §23).
 * The caller sees exactly where it's used rather than a generic failure.
 */
export async function deleteMedia(id: string): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not signed in as an administrator." };

  try {
    const supabase = createClient();

    const { data: row } = await supabase
      .from("media")
      .select("storage_path")
      .eq("id", id)
      .maybeSingle();

    if (!row) return { ok: false, error: "That file no longer exists." };

    const { data: usage } = await supabase.rpc("media_usage", { p_path: row.storage_path });

    if (Array.isArray(usage) && usage.length > 0) {
      const where = usage
        .map((u: { page_slug: string; section_label: string }) => `${u.page_slug} → ${u.section_label}`)
        .join(", ");
      return {
        ok: false,
        error: `This image is still used on: ${where}. Replace it there before deleting.`,
      };
    }

    const { error: storageError } = await supabase.storage
      .from("media")
      .remove([row.storage_path as string]);
    if (storageError) return { ok: false, error: `Could not delete the file. ${storageError.message}` };

    const { error } = await supabase.from("media").delete().eq("id", id);
    if (error) return { ok: false, error: `Could not delete the record. ${error.message}` };

    revalidatePath("/admin/media");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete that file. Please try again." };
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
