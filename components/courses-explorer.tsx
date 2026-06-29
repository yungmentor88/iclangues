"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, ArrowRight } from "lucide-react";
import { LANGUAGES, type Course, type LangCode } from "@/lib/content";
import { cn } from "@/lib/utils";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const LEVEL_TONE: Record<string, string> = {
  A1: "bg-emerald-50 text-emerald-700", A2: "bg-blue-50 text-blue-700", B1: "bg-amber-50 text-amber-700",
  B2: "bg-red-50 text-red-600", C1: "bg-violet-50 text-violet-700", C2: "bg-blue-50 text-blue-700",
};

export function CoursesExplorer({ courses }: { courses: Course[] }) {
  const [lang, setLang] = useState<LangCode | "all">("all");
  const [level, setLevel] = useState<string>("all");

  const filtered = useMemo(
    () => courses.filter((c) => (lang === "all" || c.lang === lang) && (level === "all" || c.level === level)),
    [courses, lang, level]
  );

  return (
    <div>
      <div className="mb-9 space-y-4">
        <FilterRow label="Language">
          <Chip active={lang === "all"} onClick={() => setLang("all")}>All</Chip>
          {(Object.keys(LANGUAGES) as LangCode[]).map((l) => (
            <Chip key={l} active={lang === l} onClick={() => setLang(l)}>{LANGUAGES[l].name}</Chip>
          ))}
        </FilterRow>
        <FilterRow label="Level">
          <Chip active={level === "all"} onClick={() => setLevel("all")}>All</Chip>
          {LEVELS.map((l) => <Chip key={l} active={level === l} onClick={() => setLevel(l)}>{l}</Chip>)}
        </FilterRow>
      </div>

      <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((c, i) => {
            const meta = LANGUAGES[c.lang];
            return (
              <motion.article
                key={c.title}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.2) }}
                className="flex flex-col rounded-[22px] border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-3.5 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <span className="grid h-[21px] w-[30px] place-items-center rounded text-[0.6rem] text-white" style={{ background: meta.color }}>{meta.badge}</span>
                    {meta.name}
                  </span>
                  <span className={cn("rounded-full px-2.5 py-1 text-[0.7rem] font-extrabold", LEVEL_TONE[c.level])}>{c.level}</span>
                </div>
                <h3 className="mb-2 font-display text-xl font-bold">{c.title}</h3>
                <p className="mb-4 flex-1 text-sm text-muted-foreground">{c.description}</p>
                <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{c.duration}</span>
                  <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{c.format}</span>
                </div>
                <div className="flex items-center justify-end border-t border-black/5 pt-4">
                  <Link href="/contact" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">Enrol now <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">No courses match that combination yet — try another level.</p>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-[76px] flex-none text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition",
        active ? "border-brand-ink bg-brand-ink text-white" : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
      )}
    >
      {children}
    </button>
  );
}
