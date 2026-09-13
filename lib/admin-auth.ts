import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured, getUser } from "@/lib/supabase/server";

/**
 * Server-side admin gate.
 *
 * Defence in depth — this is the SECOND line, not the only one. The database
 * enforces admin-only writes via RLS (`public.is_admin()`), so a user who
 * somehow reached an admin screen still could not change anything. This guard
 * exists so they never see the screen in the first place.
 *
 * Always call this at the top of an admin server component / layout. Never
 * rely on a client-side check for authorisation.
 */

export interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
}

/** Resolve the signed-in admin, or null if not signed in / not an admin. */
export async function getAdminUser(): Promise<AdminUser | null> {
  if (!isSupabaseConfigured()) return null;

  const user = await getUser();
  if (!user) return null;

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data?.is_admin) return null;

    return {
      id: user.id,
      email: user.email ?? "",
      fullName: (data.full_name as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Require an admin, or redirect away.
 *
 * Non-admins are sent to /login rather than shown a "forbidden" page — that
 * way the existence of the admin area isn't advertised to signed-out visitors.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) redirect("/login?next=/admin");
  return admin;
}
