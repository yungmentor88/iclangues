"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, GraduationCap, HelpCircle, Users2,
  Image as ImageIcon, Navigation, Search, Settings, LogOut,
  Menu, X, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

/**
 * Admin chrome: sidebar + top bar.
 *
 * Deliberately NOT using the public site's SiteNav/SiteFooter — the admin
 * area is a tool, not a page of the marketing site. It borrows the same
 * design tokens (warm cream, brand green, Fraunces headings) so it still
 * feels like IClangues.
 *
 * Responsive per spec §20: the sidebar collapses to a slide-over on mobile
 * so the owner can make quick edits from a phone.
 */

const NAV: { heading: string; items: { href: string; label: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    heading: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    heading: "Website",
    items: [
      { href: "/admin/pages", label: "Pages", icon: FileText },
      { href: "/admin/navigation", label: "Navigation", icon: Navigation },
      { href: "/admin/seo", label: "SEO", icon: Search },
    ],
  },
  {
    heading: "Content",
    items: [
      { href: "/admin/courses", label: "Courses", icon: GraduationCap },
      { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
      { href: "/admin/teachers", label: "Teachers", icon: Users2 },
    ],
  },
  {
    heading: "Library",
    items: [{ href: "/admin/media", label: "Media", icon: ImageIcon }],
  },
  {
    heading: "Configuration",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

export function AdminShell({
  email,
  name,
  children,
}: {
  email: string;
  name: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  async function signOut() {
    try {
      await createClient().auth.signOut();
    } finally {
      // Full reload so the server layout re-evaluates the session.
      window.location.href = "/";
    }
  }

  const sidebar = (
    <nav className="flex h-full flex-col gap-7 overflow-y-auto p-5">
      <Link href="/admin" className="flex items-center gap-2.5" onClick={() => setMenuOpen(false)}>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-display text-sm font-bold text-primary-foreground">
          IC
        </span>
        <span>
          <span className="block font-display text-base font-bold leading-tight">IClangues</span>
          <span className="block text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Admin
          </span>
        </span>
      </Link>

      <div className="flex-1 space-y-6">
        {NAV.map((group) => (
          <div key={group.heading}>
            <p className="mb-1.5 px-3 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {group.heading}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition",
                        active
                          ? "bg-primary/12 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-[1.05rem] w-[1.05rem] flex-none" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="h-[1.05rem] w-[1.05rem]" />
          View website
        </a>
        <div className="rounded-xl bg-muted/60 px-3 py-2.5">
          <p className="truncate text-sm font-semibold">{name || email.split("@")[0]}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-[1.05rem] w-[1.05rem]" />
          Log out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-border bg-card lg:block">
        {sidebar}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary font-display text-xs font-bold text-primary-foreground">
            IC
          </span>
          <span className="font-display text-sm font-bold">Admin</span>
        </Link>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-border"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile slide-over */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[272px] border-r border-border bg-card lg:hidden">
            {sidebar}
          </aside>
        </>
      )}

      <main className="lg:pl-[248px]">
        <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">{children}</div>
      </main>
    </div>
  );
}
