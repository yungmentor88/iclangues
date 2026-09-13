"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin-auth";

/**
 * Server actions for the repeatable collections: courses, FAQs, teachers
 * (spec §10-§12).
 *
 * As with the page editor, every action re-checks admin status server-side.
 * RLS already enforces it at the database; these checks exist so the owner
 * sees a clean message rather than a raw rejection. Errors are returned, not
 * thrown, so a failure never discards what was typed (§25).
 */

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const LANGS = ["en", "pt", "fr", "es", "kr"] as const;

function cleanI18n(value: Record<string, string>): Record<string, string> | null {
  const out: Record<string, string> = {};
  for (const l of LANGS) {
    const v = (value[l] ?? "").trim();
    if (v) out[l] = v;
  }
  return out.en ? out : null;
}

function refresh() {
  revalidatePath("/admin/courses");
  revalidatePath("/admin/faqs");
  revalidatePath("/admin/teachers");
  revalidatePath("/admin");
}

/* ─────────────────────────────── Courses ─────────────────────────────── */

export interface CourseInput {
  lang: string;
  level: string;
  title: Record<string, string>;
  description: Record<string, string>;
  duration: string;
  format: string;
  price: string;
  is_published: boolean;
  sort: number;
}

const VALID_LANG = new Set(["kr", "en", "fr", "es", "pt"]);
const VALID_LEVEL = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);

function validateCourse(input: CourseInput): string | null {
  if (!VALID_LANG.has(input.lang)) return "Choose a language for this course.";
  if (!VALID_LEVEL.has(input.level)) return "Choose a level from A1 to C2.";
  if (!cleanI18n(input.title)) return "An English title is required.";
  if (!cleanI18n(input.description)) return "An English description is required.";
  return null;
}

/**
 * Courses carry BOTH the legacy plain-text title/description (which the live
 * site still reads through getCourses()) and the new *_i18n jsonb columns.
 * Writing only the jsonb would mean edits that silently never appear on the
 * site, so we keep the English value mirrored into the legacy column until
 * the frontend is switched over.
 */
function courseRow(input: CourseInput) {
  const title = cleanI18n(input.title)!;
  const description = cleanI18n(input.description)!;
  return {
    lang: input.lang,
    level: input.level,
    title: title.en,
    description: description.en,
    title_i18n: title,
    description_i18n: description,
    duration: input.duration.trim() || "8 weeks",
    format: input.format.trim() || "Group",
    price: input.price.trim() || "—",
    is_published: input.is_published,
    sort: input.sort,
  };
}

export async function createCourse(input: CourseInput): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not signed in as an administrator." };

  const invalid = validateCourse(input);
  if (invalid) return { ok: false, error: invalid };

  try {
    const supabase = createClient();
    const { error } = await supabase.from("courses").insert(courseRow(input));
    if (error) return { ok: false, error: `Could not add the course. ${error.message}` };
    refresh();
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not add the course. Please try again." };
  }
}

export async function updateCourse(id: string, input: CourseInput): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not signed in as an administrator." };

  const invalid = validateCourse(input);
  if (invalid) return { ok: false, error: invalid };

  try {
    const supabase = createClient();
    const { error } = await supabase.from("courses").update(courseRow(input)).eq("id", id);
    if (error) return { ok: false, error: `Your changes could not be saved. ${error.message}` };
    refresh();
    return { ok: true };
  } catch {
    return { ok: false, error: "Your changes could not be saved. Please try again." };
  }
}

export async function deleteCourse(id: string): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not signed in as an administrator." };

  try {
    const supabase = createClient();
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) return { ok: false, error: `Could not delete the course. ${error.message}` };
    refresh();
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete the course. Please try again." };
  }
}

/* ───────────────────────────────── FAQs ──────────────────────────────── */

export interface FaqInput {
  question: Record<string, string>;
  answer: Record<string, string>;
  is_published: boolean;
  sort: number;
}

export async function saveFaq(id: string | null, input: FaqInput): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not signed in as an administrator." };

  const question = cleanI18n(input.question);
  const answer = cleanI18n(input.answer);
  if (!question) return { ok: false, error: "An English question is required." };
  if (!answer) return { ok: false, error: "An English answer is required." };

  const row = { question, answer, is_published: input.is_published, sort: input.sort };

  try {
    const supabase = createClient();
    const { error } = id
      ? await supabase.from("faqs").update(row).eq("id", id)
      : await supabase.from("faqs").insert(row);

    if (error) return { ok: false, error: `Your changes could not be saved. ${error.message}` };
    refresh();
    return { ok: true };
  } catch {
    return { ok: false, error: "Your changes could not be saved. Please try again." };
  }
}

export async function deleteFaq(id: string): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not signed in as an administrator." };

  try {
    const supabase = createClient();
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) return { ok: false, error: `Could not delete the FAQ. ${error.message}` };
    refresh();
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete the FAQ. Please try again." };
  }
}

/* ─────────────────────────────── Teachers ────────────────────────────── */

export interface TeacherInput {
  name: string;
  role: Record<string, string>;
  bio: Record<string, string>;
  languages: string[];
  photo_id: string | null;
  is_published: boolean;
  sort: number;
}

export async function saveTeacher(id: string | null, input: TeacherInput): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not signed in as an administrator." };

  if (!input.name.trim()) return { ok: false, error: "A name is required." };

  const row = {
    name: input.name.trim(),
    role: cleanI18n(input.role),
    bio: cleanI18n(input.bio),
    languages: input.languages.filter((l) => VALID_LANG.has(l)),
    photo_id: input.photo_id,
    is_published: input.is_published,
    sort: input.sort,
  };

  try {
    const supabase = createClient();
    const { error } = id
      ? await supabase.from("teachers").update(row).eq("id", id)
      : await supabase.from("teachers").insert(row);

    if (error) return { ok: false, error: `Your changes could not be saved. ${error.message}` };
    refresh();
    return { ok: true };
  } catch {
    return { ok: false, error: "Your changes could not be saved. Please try again." };
  }
}

export async function deleteTeacher(id: string): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not signed in as an administrator." };

  try {
    const supabase = createClient();
    const { error } = await supabase.from("teachers").delete().eq("id", id);
    if (error) return { ok: false, error: `Could not delete. ${error.message}` };
    refresh();
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete. Please try again." };
  }
}

/* ────────────────────────────── Site settings ────────────────────────── */

export interface SiteSettingsInput {
  school_name: string;
  contact_email: string;
  contact_phone: string;
  whatsapp_number: string;
  address: Record<string, string>;
  social_instagram: string;
  social_facebook: string;
  social_youtube: string;
}

/** Blank, or a full https:// address. A bare "instagram.com/x" would render
 *  as a relative link and 404 on our own domain, so reject it explicitly. */
function normaliseUrl(value: string, label: string): { value: string | null } | { error: string } {
  const v = value.trim();
  if (!v) return { value: null };
  if (!/^https?:\/\/\S+$/i.test(v)) {
    return { error: `${label} must be a full web address starting with https://` };
  }
  return { value: v };
}

export async function saveSiteSettings(input: SiteSettingsInput): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not signed in as an administrator." };

  if (!input.school_name.trim()) return { ok: false, error: "A school name is required." };

  const email = input.contact_email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "That email address doesn't look right." };
  }

  const socials: Record<string, string | null> = {};
  for (const [key, label] of [
    ["social_instagram", "Instagram"],
    ["social_facebook", "Facebook"],
    ["social_youtube", "YouTube"],
  ] as const) {
    const result = normaliseUrl(input[key], label);
    if ("error" in result) return { ok: false, error: result.error };
    socials[key] = result.value;
  }

  // The footer builds a wa.me/ link from this, so a stray "+" or space would
  // silently produce a broken link. Store digits only.
  const whatsapp = input.whatsapp_number.replace(/\D/g, "");

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("site_settings")
      .update({
        school_name: input.school_name.trim(),
        contact_email: email || null,
        contact_phone: input.contact_phone.trim() || null,
        whatsapp_number: whatsapp || null,
        address: cleanI18n(input.address),
        ...socials,
        updated_by: admin.id,
      })
      .eq("id", true);

    if (error) return { ok: false, error: `Your changes could not be saved. ${error.message}` };

    revalidatePath("/admin/settings");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Your changes could not be saved. Please try again." };
  }
}

/* ────────────────────────────── Navigation ───────────────────────────── */

export interface NavInput {
  menu: "header" | "footer";
  label: Record<string, string>;
  href: string;
  is_external: boolean;
  open_new_tab: boolean;
  is_visible: boolean;
  sort: number;
}

export async function saveNavItem(id: string | null, input: NavInput): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not signed in as an administrator." };

  const label = cleanI18n(input.label);
  if (!label) return { ok: false, error: "An English menu label is required." };

  const href = input.href.trim();
  // Matches the nav_items_href_shape constraint in 0002. Checking here too
  // means the owner gets a readable message instead of a database error.
  if (input.is_external && !/^https?:\/\//i.test(href)) {
    return { ok: false, error: "An external link must start with https://" };
  }
  if (!input.is_external && !href.startsWith("/")) {
    return { ok: false, error: "A link on this site must start with / — for example /about" };
  }

  const row = {
    menu: input.menu,
    label,
    href,
    is_external: input.is_external,
    open_new_tab: input.open_new_tab,
    is_visible: input.is_visible,
    sort: input.sort,
  };

  try {
    const supabase = createClient();
    const { error } = id
      ? await supabase.from("nav_items").update(row).eq("id", id)
      : await supabase.from("nav_items").insert(row);

    if (error) return { ok: false, error: `Your changes could not be saved. ${error.message}` };

    revalidatePath("/admin/navigation");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Your changes could not be saved. Please try again." };
  }
}

export async function deleteNavItem(id: string): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not signed in as an administrator." };

  try {
    const supabase = createClient();
    const { error } = await supabase.from("nav_items").delete().eq("id", id);
    if (error) return { ok: false, error: `Could not delete the link. ${error.message}` };

    revalidatePath("/admin/navigation");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete the link. Please try again." };
  }
}

/** Move a nav link up or down within its own menu. */
export async function reorderNavItem(
  id: string,
  direction: "up" | "down"
): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not signed in as an administrator." };

  try {
    const supabase = createClient();
    const { data: row } = await supabase
      .from("nav_items")
      .select("id, menu, sort")
      .eq("id", id)
      .maybeSingle();

    if (!row) return { ok: false, error: "That link no longer exists." };

    // Reorder within the same menu only — header and footer are separate lists.
    const { data: siblings } = await supabase
      .from("nav_items")
      .select("id, sort")
      .eq("menu", row.menu)
      .order("sort", { ascending: true });

    if (!siblings) return { ok: false, error: "Could not reorder right now." };

    const index = siblings.findIndex((s) => s.id === id);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= siblings.length) return { ok: true };

    await supabase.from("nav_items").update({ sort: swapWith }).eq("id", siblings[index].id);
    await supabase.from("nav_items").update({ sort: index }).eq("id", siblings[swapWith].id);

    revalidatePath("/admin/navigation");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reorder right now. Please try again." };
  }
}

/* ─────────────────────────────── Reorder ─────────────────────────────── */

/** Move an item up or down within its collection (spec §11 "Reorder"). */
export async function reorderItem(
  table: "courses" | "faqs" | "teachers",
  id: string,
  direction: "up" | "down"
): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not signed in as an administrator." };

  try {
    const supabase = createClient();
    const { data: rows, error } = await supabase
      .from(table)
      .select("id, sort")
      .order("sort", { ascending: true });

    if (error || !rows) return { ok: false, error: "Could not reorder right now." };

    const index = rows.findIndex((r) => r.id === id);
    if (index === -1) return { ok: false, error: "That item no longer exists." };

    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= rows.length) return { ok: true }; // already at the end

    // Swap the two sort values. Normalised positions avoid ties if the seeded
    // sort numbers were ever duplicated.
    await supabase.from(table).update({ sort: swapWith }).eq("id", rows[index].id);
    await supabase.from(table).update({ sort: index }).eq("id", rows[swapWith].id);

    refresh();
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reorder right now. Please try again." };
  }
}
