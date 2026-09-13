"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Check, CircleAlert, Loader2, Eye, EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createCourse, updateCourse, deleteCourse, reorderItem } from "@/app/admin/collections";

export interface CourseRow {
  id: string;
  lang: string;
  level: string;
  title_i18n: Record<string, string> | null;
  description_i18n: Record<string, string> | null;
  duration: string;
  format: string;
  price: string;
  is_published: boolean;
  sort: number;
}

const LANGS = ["en", "pt", "fr", "es", "kr"] as const;
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const COURSE_LANGS: { code: string; name: string }[] = [
  { code: "kr", name: "Kriolu" },
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "es", name: "Español" },
  { code: "pt", name: "Português" },
];

type Notice = { kind: "ok" | "error"; message: string } | null;

const blank = (): CourseRow => ({
  id: "",
  lang: "en",
  level: "A1",
  title_i18n: { en: "" },
  description_i18n: { en: "" },
  duration: "8 weeks",
  format: "Group",
  price: "€99",
  is_published: true,
  sort: 999,
});

export function CoursesManager({ courses }: { courses: CourseRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<CourseRow | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  function move(id: string, direction: "up" | "down") {
    startTransition(async () => {
      const r = await reorderItem("courses", id, direction);
      if (!r.ok) setNotice({ kind: "error", message: r.error ?? "Could not reorder." });
      else router.refresh();
    });
  }

  function remove(id: string) {
    setConfirmId(null);
    startTransition(async () => {
      const r = await deleteCourse(id);
      if (r.ok) {
        setNotice({ kind: "ok", message: "Course deleted." });
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
          {courses.length} course{courses.length === 1 ? "" : "s"}
        </p>
        <button
          onClick={() => setEditing(blank())}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-105"
        >
          <Plus className="h-4 w-4" /> Add course
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

      {courses.length === 0 ? (
        <p className="rounded-[22px] border border-border bg-card p-10 text-center text-muted-foreground">
          No courses yet. Add your first course above.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {courses.map((c, i) => (
            <li
              key={c.id}
              className="flex items-start gap-3 rounded-[22px] border border-border bg-card p-4"
            >
              <span className="flex flex-none flex-col gap-0.5">
                <button
                  onClick={() => move(c.id, "up")}
                  disabled={i === 0 || busy}
                  className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition hover:bg-muted disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => move(c.id, "down")}
                  disabled={i === courses.length - 1 || busy}
                  className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition hover:bg-muted disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </span>

              <button onClick={() => setEditing(c)} className="min-w-0 flex-1 text-left">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold">
                    {c.title_i18n?.en || "(untitled)"}
                  </span>
                  <span className="flex-none rounded-full bg-muted px-2 py-0.5 text-[0.68rem] font-bold uppercase text-muted-foreground">
                    {COURSE_LANGS.find((l) => l.code === c.lang)?.name ?? c.lang} · {c.level}
                  </span>
                  {!c.is_published && (
                    <span className="flex-none rounded-full bg-muted px-2 py-0.5 text-[0.68rem] font-bold uppercase text-muted-foreground">
                      Hidden
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                  {c.description_i18n?.en}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {c.duration} · {c.format} · {c.price} ·{" "}
                  {LANGS.filter((l) => c.title_i18n?.[l]?.trim()).length}/5 languages
                </span>
              </button>

              {confirmId === c.id ? (
                <span className="flex flex-none items-center gap-1.5">
                  <button
                    onClick={() => remove(c.id)}
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
                  onClick={() => setConfirmId(c.id)}
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
        <CourseModal
          course={editing}
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

function CourseModal({
  course,
  onClose,
  onSaved,
  onError,
}: {
  course: CourseRow;
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [title, setTitle] = useState<Record<string, string>>({ ...(course.title_i18n ?? { en: "" }) });
  const [description, setDescription] = useState<Record<string, string>>({
    ...(course.description_i18n ?? { en: "" }),
  });
  const [lang, setLang] = useState<string>("en");
  const [courseLang, setCourseLang] = useState(course.lang);
  const [level, setLevel] = useState(course.level);
  const [duration, setDuration] = useState(course.duration);
  const [format, setFormat] = useState(course.format);
  const [price, setPrice] = useState(course.price);
  const [published, setPublished] = useState(course.is_published);
  const [busy, startTransition] = useTransition();

  function save() {
    const input = {
      lang: courseLang,
      level,
      title,
      description,
      duration,
      format,
      price,
      is_published: published,
      sort: course.sort,
    };
    startTransition(async () => {
      const r = course.id ? await updateCourse(course.id, input) : await createCourse(input);
      if (r.ok) onSaved(course.id ? "Course updated." : "Course added.");
      else onError(r.error ?? "Could not save.");
    });
  }

  const field =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[22px] border border-border bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 font-display text-xl font-bold">
          {course.id ? "Edit course" : "New course"}
        </h2>

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Language taught</label>
            <select value={courseLang} onChange={(e) => setCourseLang(e.target.value)} className={field}>
              {COURSE_LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Level</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className={field}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-3 flex gap-1">
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-bold uppercase transition",
                lang === l
                  ? "bg-primary text-primary-foreground"
                  : title[l]?.trim()
                    ? "bg-muted text-muted-foreground"
                    : "bg-muted/50 text-muted-foreground/50"
              )}
            >
              {l}
            </button>
          ))}
        </div>

        <label className="mb-1.5 block text-sm font-semibold">Course title</label>
        <input
          value={title[lang] ?? ""}
          onChange={(e) => setTitle({ ...title, [lang]: e.target.value })}
          className={cn(field, "mb-4")}
        />

        <label className="mb-1.5 block text-sm font-semibold">Description</label>
        <textarea
          value={description[lang] ?? ""}
          onChange={(e) => setDescription({ ...description, [lang]: e.target.value })}
          rows={3}
          className={cn(field, "mb-4")}
        />

        {lang !== "en" && (
          <p className="mb-4 text-xs text-muted-foreground">
            Leave blank to show the English text to visitors in this language.
          </p>
        )}

        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Duration</label>
            <input value={duration} onChange={(e) => setDuration(e.target.value)} className={field} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Format</label>
            <input value={format} onChange={(e) => setFormat(e.target.value)} className={field} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Price</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)} className={field} />
          </div>
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
          {published ? "Visible on the website" : "Hidden from visitors"}
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
