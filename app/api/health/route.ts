import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Health endpoint — reports the REAL state of the backend.
 *
 * Why this exists: getCourses() and the whole lib/cms.ts layer fall back to
 * seed data on any error, so the marketing site looks perfectly healthy with
 * a paused or broken database. That resilience is deliberate, but it means a
 * database outage is invisible. This route is the opposite: it reports what
 * is actually true, so an uptime monitor can alert on it.
 *
 * Point UptimeRobot (or similar) at /api/health rather than / — hitting this
 * route also issues a real query, which keeps a free-tier Supabase project
 * from pausing after 7 days of inactivity.
 *
 * 200 = healthy, 503 = degraded. Never cached.
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Check = { ok: boolean; detail?: string };

export async function GET() {
  const started = Date.now();
  const checks: Record<string, Check> = {};

  checks.supabase_configured = { ok: isSupabaseConfigured() };

  if (checks.supabase_configured.ok) {
    // Does the database answer at all?
    try {
      const supabase = createClient();
      const { error } = await supabase.from("courses").select("id").limit(1);
      checks.database = error
        ? { ok: false, detail: error.message }
        : { ok: true };
    } catch (e) {
      checks.database = { ok: false, detail: e instanceof Error ? e.message : "unknown error" };
    }

    // Have the CMS migrations been applied? Informational only — the site
    // works without them, so this does not fail the health check.
    try {
      const supabase = createClient();
      const { error } = await supabase.from("ui_strings").select("key").limit(1);
      checks.cms_migrated = error
        ? { ok: false, detail: "CMS tables not migrated yet" }
        : { ok: true };
    } catch {
      checks.cms_migrated = { ok: false, detail: "CMS tables not migrated yet" };
    }
  } else {
    checks.database = { ok: false, detail: "Supabase env vars not set" };
  }

  // Only the essentials decide the status code. A missing CMS is expected
  // until the migrations run and must not page anyone at 3am.
  const healthy = checks.supabase_configured.ok && checks.database.ok;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks,
      duration_ms: Date.now() - started,
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
