import Link from "next/link";
import {
  FileText, GraduationCap, HelpCircle, Users2, Image as ImageIcon,
  Settings, CircleCheck, CircleAlert, ArrowRight, Clock,
} from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Admin dashboard (spec §26): website status, pending changes, quick actions.
 * Kept deliberately simple — it should orient the owner, not overwhelm them.
 */

interface Counts {
  courses: number;
  faqs: number;
  teachers: number;
  media: number;
  pending: number;
}

async function loadCounts(): Promise<Counts | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const tables = ["courses", "faqs", "teachers", "media", "pending_changes"] as const;

    const results = await Promise.all(
      tables.map((t) =>
        supabase.from(t).select("*", { count: "exact", head: true })
      )
    );

    return {
      courses: results[0].count ?? 0,
      faqs: results[1].count ?? 0,
      teachers: results[2].count ?? 0,
      media: results[3].count ?? 0,
      pending: results[4].count ?? 0,
    };
  } catch {
    return null;
  }
}

const QUICK_ACTIONS = [
  { href: "/admin/pages", label: "Edit pages", icon: FileText, tone: "bg-primary/15 text-primary" },
  { href: "/admin/courses", label: "Manage courses", icon: GraduationCap, tone: "bg-blue-50 text-brand-ocean" },
  { href: "/admin/media", label: "Upload media", icon: ImageIcon, tone: "bg-amber-50 text-amber-600" },
  { href: "/admin/settings", label: "Contact details", icon: Settings, tone: "bg-red-50 text-brand-red" },
];

export default async function AdminDashboard() {
  const counts = await loadCounts();
  const pending = counts?.pending ?? 0;

  return (
    <div>
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Dashboard</p>
        <h1 className="mt-1.5 font-display text-3xl font-bold sm:text-4xl">Your website</h1>
        <p className="mt-2 text-muted-foreground">
          Edit content, manage courses and publish changes — no code required.
        </p>
      </header>

      {/* Status */}
      <section
        className={`mb-6 flex flex-wrap items-center gap-4 rounded-[22px] border p-6 ${
          pending > 0 ? "border-amber-300 bg-amber-50/60" : "border-border bg-card"
        }`}
      >
        <span
          className={`grid h-12 w-12 flex-none place-items-center rounded-2xl ${
            pending > 0 ? "bg-amber-100 text-amber-700" : "bg-primary/15 text-primary"
          }`}
        >
          {pending > 0 ? <CircleAlert className="h-6 w-6" /> : <CircleCheck className="h-6 w-6" />}
        </span>
        <div className="min-w-[12rem] flex-1">
          <p className="font-display text-lg font-bold">
            {pending > 0 ? "You have unpublished changes" : "Website is up to date"}
          </p>
          <p className="text-sm text-muted-foreground">
            {pending > 0
              ? `${pending} change${pending === 1 ? "" : "s"} saved as draft — not visible to visitors yet.`
              : "Everything you've saved is live on iclangues.com."}
          </p>
        </div>
        {pending > 0 && (
          <Link
            href="/admin/publish"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-105"
          >
            Review &amp; publish <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </section>

      {/* Counts */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Courses", value: counts?.courses, icon: GraduationCap, href: "/admin/courses" },
          { label: "FAQs", value: counts?.faqs, icon: HelpCircle, href: "/admin/faqs" },
          { label: "Teachers", value: counts?.teachers, icon: Users2, href: "/admin/teachers" },
          { label: "Media files", value: counts?.media, icon: ImageIcon, href: "/admin/media" },
        ].map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-[22px] border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground">
              <c.icon className="h-[1.15rem] w-[1.15rem]" />
            </span>
            <p className="mt-3.5 font-display text-3xl font-bold">{c.value ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{c.label}</p>
          </Link>
        ))}
      </section>

      {/* Quick actions */}
      <section className="mb-8">
        <h2 className="mb-3.5 font-display text-xl font-bold">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group flex items-center gap-3.5 rounded-[22px] border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className={`grid h-11 w-11 flex-none place-items-center rounded-xl ${a.tone}`}>
                <a.icon className="h-5 w-5" />
              </span>
              <span className="flex-1 font-semibold">{a.label}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
            </Link>
          ))}
        </div>
      </section>

      {counts === null && (
        <p className="flex items-center gap-2 rounded-[22px] border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          <Clock className="h-4 w-4 flex-none" />
          Couldn&rsquo;t load your content right now. Your data is safe — please refresh in a moment.
        </p>
      )}
    </div>
  );
}
