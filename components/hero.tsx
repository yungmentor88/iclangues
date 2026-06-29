"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PixelTrail } from "@/components/ui/pixel-trail";
import { useScreenSize } from "@/components/hooks/use-screen-size";

export function Hero() {
  const screen = useScreenSize();
  const fade = (d: number) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: d, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section className="relative overflow-hidden pb-16 pt-28 sm:pt-32">
      {/* pixel-trail background (interactive on hover) */}
      <div className="pointer-events-none absolute inset-0 -z-0 opacity-70">
        <PixelTrail
          pixelSize={screen.lessThan("md") ? 36 : 56}
          fadeDuration={650}
          pixelClassName="rounded-full bg-primary/25"
        />
      </div>
      <div className="pointer-events-none absolute right-[-120px] top-[-80px] -z-10 h-[460px] w-[460px] rounded-full bg-primary/20 blur-[80px]" />
      <div className="pointer-events-none absolute bottom-[-120px] left-[-100px] -z-10 h-[360px] w-[360px] rounded-full bg-brand-sun/20 blur-[80px]" />

      <div className="container grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative z-10 pointer-events-none">
          <motion.span {...fade(0)} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold shadow-sm">
            <span className="flex">
              <i className="ml-0 h-4 w-4 rounded-full border-2 border-card" style={{ background: "#12C58E" }} />
              <i className="-ml-1.5 h-4 w-4 rounded-full border-2 border-card" style={{ background: "#EE4B3C" }} />
              <i className="-ml-1.5 h-4 w-4 rounded-full border-2 border-card" style={{ background: "#2D6BE0" }} />
            </span>
            Born in Cabo Verde · taught worldwide
          </motion.span>

          <motion.h1 {...fade(0.08)} className="mt-5 font-display text-5xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Learn languages with{" "}
            <span className="relative whitespace-nowrap text-primary">
              native
              <svg className="absolute -bottom-1 left-0 w-full" height="10" viewBox="0 0 200 10" fill="none" preserveAspectRatio="none">
                <path d="M2 7c40-5 120-6 196 0" stroke="#12C58E" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>{" "}
            speakers.
          </motion.h1>

          <motion.p {...fade(0.16)} className="mt-5 max-w-xl text-lg text-muted-foreground">
            Real conversation, real culture — not grammar drills. Master Kriolu, English, French, Spanish or
            Portuguese with teachers who live the language, online or in person.
          </motion.p>

          <motion.div {...fade(0.24)} className="pointer-events-auto mt-8 flex flex-wrap gap-3">
            <Button asChild variant="green" size="lg"><Link href="/contact">Book a Class <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild variant="outline" size="lg"><Link href="/courses">Explore Courses</Link></Button>
          </motion.div>

          <motion.div {...fade(0.32)} className="mt-8 flex items-center gap-3">
            <div className="flex">
              {["#12C58E", "#EE4B3C", "#2D6BE0", "#7C3AED"].map((c, i) => (
                <span key={i} className="-ml-2.5 grid h-9 w-9 place-items-center rounded-full border-2 border-background text-xs font-bold text-white" style={{ background: c }}>
                  {["A", "M", "J", "S"][i]}
                </span>
              ))}
            </div>
            <div className="text-sm">
              <div className="flex gap-0.5 text-brand-sun">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}</div>
              <span className="text-muted-foreground">Loved by <b className="text-foreground">1,200+ learners</b> worldwide</span>
            </div>
          </motion.div>
        </div>

        <motion.div {...fade(0.2)} className="relative z-10 mx-auto w-full max-w-[520px]">
          <div className="relative aspect-[5/5.2] overflow-hidden rounded-[32px] shadow-2xl">
            <Image src="/images/hero.jpg" alt="An IClangues learner and teacher in conversation" fill priority className="object-cover" sizes="(max-width:1024px) 90vw, 520px" />
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
            className="absolute -left-2 top-6 flex items-center gap-2.5 rounded-2xl bg-card p-3 shadow-xl"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary"><UserIcon /></span>
            <span><b className="block font-display text-lg leading-none">25+</b><small className="text-xs text-muted-foreground">Native teachers</small></span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.65 }}
            className="absolute -right-3 bottom-6 max-w-[220px] rounded-2xl bg-card p-3.5 shadow-xl"
          >
            <div className="mb-1 flex gap-0.5 text-brand-sun">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}</div>
            <p className="text-sm font-medium leading-tight text-foreground">&ldquo;My teacher made Kriolu feel like home.&rdquo;</p>
            <small className="text-xs text-muted-foreground">— Sofia, Lisbon</small>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
      <circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}
