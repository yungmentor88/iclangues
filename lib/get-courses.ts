import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { SEED_COURSES, type Course } from "@/lib/content";

/** Read courses from Supabase (your CMS) when configured, else the seed data. */
export async function getCourses(): Promise<Course[]> {
  if (!isSupabaseConfigured()) return SEED_COURSES;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("courses")
      .select("id, lang, level, title, description, duration, format, price")
      .order("sort", { ascending: true });
    if (error || !data || data.length === 0) return SEED_COURSES;
    return data as Course[];
  } catch {
    return SEED_COURSES;
  }
}
