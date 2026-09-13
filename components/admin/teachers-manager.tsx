"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Check, CircleAlert, Loader2, Eye, EyeOff, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { saveTeacher, deleteTeacher, reorderItem } from "@/app/admin/collections";

export interface TeacherRow {
  id: string;
  name: string;
  role: Record<string, string> | null;
  bio: Record<string, string> | null;
  languages: string[];
  photo_id: string | null;
  is_published: boolean;
  sort: number;
}

const LANGS = ["en", "pt", "fr", "es", "kr"] as const;

/** The languages a teacher can teach — same set the courses use. */
const TEACHABLE: { code: string; name: string }[] = [
  { code: "kr", name: "Kriolu" },
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "es", name: "Español" },
  { code: "pt", name: "Português" },
];

type Notice = { kind: "ok" | "error"; message: string } | null;

const blank = (): TeacherRow => ({
  id: "",
  name: "",
  role: { en: "" },
  bio: { en: "" },
  languages: [],
  photo_id: null,
  is_published: true,
  sort: 999,
});

export function TeachersManager({ teachers }: { teachers: TeacherRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<TeacherRow | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  function move(id: string, direction: "up" | "down") {
    startTransition(async () => {
      const r = await reorderItem("teachers", id, direction);
      if (!r.ok) setNotice({ kind: "error", message: r.error ?? "Could not reorder." });
      else router.refresh();
    });
  }

  function remove(id: string) {
    setConfirmId(null);
    startTransition(async () => {
      const r = await deleteTeacher(id);
      if (r.ok) {
        setNotice({ kind: "ok", message: "Teacher removed." });
        router.refresh();
      } else {
        setNotice({ kind: "error", message: r.error ?? "Could not delete." });
      }
    });
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {teachers.length} teacher{teachers.length === 1 ? "" : "s"}
        </p>
        <button
          onClick={() => setEditing(blank())}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-105"
        >
          <Plus className="h-4 w-4" /> Add teacher
        </button>
      </div>

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

      {teachers.length === 0 ? (
        <p className="rounded-[22px] border border-border bg-card p-10 text-center text-muted-foreground">
          No teachers yet. Add your first one above.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {teachers.map((teacher, i) => (
            <li
              key={teacher.id}
              className="flex items-center gap-3 rounded-[22px] border border-border bg-card p-4"
            >
              <span className="flex flex-none flex-col gap-0.5">
                <button
                  onClick={() => move(teacher.id, "up")}
                  disabled={i === 0 || busy}
                  className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition hover:bg-muted disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => move(teacher.id, "down")}
                  disabled={i === teachers.length - 1 || busy}
                  className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition hover:bg-muted disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </span>

              <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-muted text-muted-foreground">
                <User className="h-5 w-5" />
              </span>

              <button onClick={() => setEditing(teacher)} className="min-w-0 flex-1 text-left">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold">{teacher.name || "(no name)"}</span>
                  {!teacher.is_published && (
                    <span className="flex-none rounded-full bg-muted px-2 py-0.5 text-[0.68rem] font-bold uppercase text-muted-foreground">
                      Hidden
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                  {teacher.role?.en || "—"}
                </span>
                {teacher.languages.length > 0 && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Teaches{" "}
                    {teacher.languages
                      .map((c) => TEACHABLE.find((t) => t.code === c)?.name ?? c)
                      .join(", ")}
                  </span>
                )}
              </button>

              {confirmId === teacher.id ? (
                <span className="flex flex-none items-center gap-1.5">
                  <button
                    onClick={() => remove(teacher.id)}
                    disabled={busy}
                    className="rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground"
                  >
                    Delete
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
                  onClick={() => setConfirmId(teacher.id)}
                  disabled={busy}
                  className="grid h-8 w-8 flex-none place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <TeacherModal
          teacher={editing}
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

function TeacherModal({
  teacher,
  onClose,
  onSaved,
  onError,
}: {
  teacher: TeacherRow;
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState(teacher.name);
  const [role, setRole] = useState<Record<string, string>>({ ...(teacher.role ?? { en: "" }) });
  const [bio, setBio] = useState<Record<string, string>>({ ...(teacher.bio ?? { en: "" }) });
  const [languages, setLanguages] = useState<string[]>([...teacher.languages]);
  const [published, setPublished] = useState(teacher.is_published);
  const [lang, setLang] = useState<string>("en");
  const [busy, startTransition] = useTransition();

  function toggleLanguage(code: string) {
    setLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  function save() {
    startTransition(async () => {
      const r = await saveTeacher(teacher.id || null, {
        name,
        role,
        bio,
        languages,
        photo_id: teacher.photo_id,
        is_published: published,
        sort: teacher.sort,
      });
      if (r.ok) onSaved(teacher.id ? "Teacher updated." : "Teacher added.");
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
        <h2 className="mb-4 font-display text-xl font-bold">
          {teacher.id ? "Edit teacher" : "New teacher"}
        </h2>

        <label className="mb-1.5 block text-sm font-semibold">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={cn(field, "mb-4")}
        />

        <div className="mb-3 flex gap-1">
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-bold uppercase transition",
                lang === l
                  ? "bg-primary text-primary-foreground"
                  : role[l]?.trim()
                    ? "bg-muted text-muted-foreground"
                    : "bg-muted/50 text-muted-foreground/50"
              )}
            >
              {l}
            </button>
          ))}
        </div>

        <label className="mb-1.5 block text-sm font-semibold">
          Role
          <span className="ml-2 font-normal text-muted-foreground">e.g. Kriolu teacher</span>
        </label>
        <input
          value={role[lang] ?? ""}
          onChange={(e) => setRole({ ...role, [lang]: e.target.value })}
          className={cn(field, "mb-4")}
        />

        <label className="mb-1.5 block text-sm font-semibold">Biography</label>
        <textarea
          value={bio[lang] ?? ""}
          onChange={(e) => setBio({ ...bio, [lang]: e.target.value })}
          rows={4}
          className={cn(field, "mb-4")}
        />

        {lang !== "en" && (
          <p className="mb-4 text-xs text-muted-foreground">
            Leave blank to show the English text in this language.
          </p>
        )}

        <label className="mb-1.5 block text-sm font-semibold">Teaches</label>
        <div className="mb-5 flex flex-wrap gap-2">
          {TEACHABLE.map((t) => (
            <button
              key={t.code}
              onClick={() => toggleLanguage(t.code)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                languages.includes(t.code)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              )}
            >
              {t.name}
            </button>
          ))}
        </div>

        <button
          onClick={() => setPublished((v) => !v)}
          className="mb-5 flex items-center gap-2 text-sm font-medium"
        >
          {published ? (
            <Eye className="h-4 w-4 text-primary" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
          {published ? "Visible once the section is added" : "Hidden"}
        </button>

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
