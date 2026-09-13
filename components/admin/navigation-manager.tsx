"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Check, CircleAlert, Loader2,
  Eye, EyeOff, ExternalLink, Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { saveNavItem, deleteNavItem, reorderNavItem } from "@/app/admin/collections";

export interface NavRow {
  id: string;
  menu: "header" | "footer";
  label: Record<string, string>;
  href: string;
  is_external: boolean;
  open_new_tab: boolean;
  is_visible: boolean;
  sort: number;
}

const LANGS = ["en", "pt", "fr", "es", "kr"] as const;
const MENUS: { key: "header" | "footer"; title: string; hint: string }[] = [
  { key: "header", title: "Header menu", hint: "Shown in the top navigation bar" },
  { key: "footer", title: "Footer menu", hint: "Shown under “Explore” in the footer" },
];

type Notice = { kind: "ok" | "error"; message: string } | null;

const blank = (menu: "header" | "footer"): NavRow => ({
  id: "",
  menu,
  label: { en: "" },
  href: "/",
  is_external: false,
  open_new_tab: false,
  is_visible: true,
  sort: 999,
});

export function NavigationManager({ items }: { items: NavRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<NavRow | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  function move(id: string, direction: "up" | "down") {
    startTransition(async () => {
      const r = await reorderNavItem(id, direction);
      if (!r.ok) setNotice({ kind: "error", message: r.error ?? "Could not reorder." });
      else router.refresh();
    });
  }

  function remove(id: string) {
    setConfirmId(null);
    startTransition(async () => {
      const r = await deleteNavItem(id);
      if (r.ok) {
        setNotice({ kind: "ok", message: "Link removed." });
        router.refresh();
      } else {
        setNotice({ kind: "error", message: r.error ?? "Could not delete." });
      }
    });
  }

  return (
    <div>
      {notice && (
        <p
          className={cn(
            "mb-4 flex items-start gap-2 rounded-[22px] border p-4 text-sm",
            notice.kind === "ok"
              ? "border-primary/30 bg-primary/5 text-primary"
              : "border-destructive/30 bg-destructive/5 text-destructive"
          )}
        >
          {notice.kind === "ok" ? (
            <Check className="mt-0.5 h-4 w-4 flex-none" />
          ) : (
            <CircleAlert className="mt-0.5 h-4 w-4 flex-none" />
          )}
          {notice.message}
        </p>
      )}

      <div className="space-y-6">
        {MENUS.map((menu) => {
          const menuItems = items.filter((i) => i.menu === menu.key);
          return (
            <section key={menu.key}>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold">{menu.title}</h2>
                  <p className="text-sm text-muted-foreground">{menu.hint}</p>
                </div>
                <button
                  onClick={() => setEditing(blank(menu.key))}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary"
                >
                  <Plus className="h-4 w-4" /> Add link
                </button>
              </div>

              {menuItems.length === 0 ? (
                <p className="rounded-[22px] border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                  No links in this menu yet.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {menuItems.map((item, i) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 rounded-[22px] border border-border bg-card p-4"
                    >
                      <span className="flex flex-none flex-col gap-0.5">
                        <button
                          onClick={() => move(item.id, "up")}
                          disabled={i === 0 || busy}
                          className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition hover:bg-muted disabled:opacity-30"
                          aria-label="Move up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => move(item.id, "down")}
                          disabled={i === menuItems.length - 1 || busy}
                          className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition hover:bg-muted disabled:opacity-30"
                          aria-label="Move down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </span>

                      <button
                        onClick={() => setEditing(item)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-semibold">
                            {item.label.en || "(no label)"}
                          </span>
                          {item.is_external && (
                            <ExternalLink className="h-3.5 w-3.5 flex-none text-muted-foreground" />
                          )}
                          {!item.is_visible && (
                            <span className="flex-none rounded-full bg-muted px-2 py-0.5 text-[0.68rem] font-bold uppercase text-muted-foreground">
                              Hidden
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Link2 className="h-3.5 w-3.5 flex-none" />
                          <span className="truncate">{item.href}</span>
                        </span>
                      </button>

                      {confirmId === item.id ? (
                        <span className="flex flex-none items-center gap-1.5">
                          <button
                            onClick={() => remove(item.id)}
                            disabled={busy}
                            className="rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground"
                          >
                            Remove
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmId(item.id)}
                          disabled={busy}
                          className="grid h-8 w-8 flex-none place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Remove link"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {editing && (
        <NavModal
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setNotice({ kind: "ok", message });
            router.refresh();
          }}
          onError={(message) => setNotice({ kind: "error", message })}
        />
      )}
    </div>
  );
}

function NavModal({
  item,
  onClose,
  onSaved,
  onError,
}: {
  item: NavRow;
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [label, setLabel] = useState<Record<string, string>>({ ...item.label });
  const [lang, setLang] = useState<string>("en");
  const [href, setHref] = useState(item.href);
  const [isExternal, setIsExternal] = useState(item.is_external);
  const [newTab, setNewTab] = useState(item.open_new_tab);
  const [visible, setVisible] = useState(item.is_visible);
  const [busy, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const r = await saveNavItem(item.id || null, {
        menu: item.menu,
        label,
        href,
        is_external: isExternal,
        open_new_tab: newTab,
        is_visible: visible,
        sort: item.sort,
      });
      if (r.ok) onSaved(item.id ? "Link updated." : "Link added.");
      else onError(r.error ?? "Could not save.");
    });
  }

  const field =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[22px] border border-border bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 font-display text-xl font-bold">
          {item.id ? "Edit link" : "New link"}
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {item.menu === "header" ? "Header menu" : "Footer menu"}
        </p>

        <div className="mb-3 flex gap-1">
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-bold uppercase transition",
                lang === l
                  ? "bg-primary text-primary-foreground"
                  : label[l]?.trim()
                    ? "bg-muted text-muted-foreground"
                    : "bg-muted/50 text-muted-foreground/50"
              )}
            >
              {l}
            </button>
          ))}
        </div>

        <label className="mb-1.5 block text-sm font-semibold">Menu label</label>
        <input
          value={label[lang] ?? ""}
          onChange={(e) => setLabel({ ...label, [lang]: e.target.value })}
          className={cn(field, "mb-4")}
        />

        <label className="mb-1.5 block text-sm font-semibold">
          Link
          <span className="ml-2 font-normal text-muted-foreground">
            {isExternal ? "Full address, e.g. https://example.com" : "A page on this site, e.g. /about"}
          </span>
        </label>
        <input
          value={href}
          onChange={(e) => setHref(e.target.value)}
          className={cn(field, "mb-4")}
        />

        <div className="mb-5 space-y-2.5">
          <button
            onClick={() => setIsExternal((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium"
          >
            <ExternalLink
              className={cn("h-4 w-4", isExternal ? "text-primary" : "text-muted-foreground")}
            />
            {isExternal ? "Links to another website" : "Links to a page on this site"}
          </button>

          <button
            onClick={() => setNewTab((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium"
          >
            <Link2 className={cn("h-4 w-4", newTab ? "text-primary" : "text-muted-foreground")} />
            {newTab ? "Opens in a new tab" : "Opens in the same tab"}
          </button>

          <button
            onClick={() => setVisible((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium"
          >
            {visible ? (
              <Eye className="h-4 w-4 text-primary" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
            {visible ? "Visible in the menu" : "Hidden from visitors"}
          </button>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-105 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save
          </button>
          <button
            onClick={onClose}
            className="rounded-full border border-border px-4 py-2.5 text-sm font-medium transition hover:border-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
