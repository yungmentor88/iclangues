"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

const SLIDES = [
  { src: "/images/hero.jpg",   alt: "Learn languages with native speakers in Cabo Verde" },
  { src: "/images/beach.jpg",  alt: "Joy, community and the spirit of the islands" },
  { src: "/images/market.jpg", alt: "The vibrant culture of Cabo Verde" },
];

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.75, delay: 0.1 + i * 0.13, ease: [0.22, 1, 0.36, 1] as const },
});

export function Hero() {
  const { t } = useI18n();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative h-screen min-h-[640px] overflow-hidden">

      {/* ── Rotating Ken-Burns backgrounds ── */}
      {SLIDES.map((slide, i) => (
        <motion.div
          key={slide.src}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: i === current ? 1 : 0 }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1 }}
            animate={{ scale: i === current ? 1.09 : 1.0 }}
            transition={{ duration: 14, ease: "linear" }}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={i === 0}
              className="object-cover"
              sizes="100vw"
            />
          </motion.div>
        </motion.div>
      ))}

      {/* ── Layered overlays ── */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/80" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/50 via-black/10 to-transparent" />

      {/* ── Hero content ── */}
      <div className="relative z-10 flex h-full flex-col justify-center">
        <div className="container max-w-5xl">

          {/* Badge */}
          <motion.span {...stagger(0)} className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-md">
            <span className="flex">
              {["#12C58E", "#EE4B3C", "#2D6BE0"].map((c, i) => (
                <i key={i} className={`${i > 0 ? "-ml-1.5" : ""} h-4 w-4 rounded-full border-2 border-white/30`} style={{ background: c }} />
              ))}
            </span>
            {t("hero.badge")}
          </motion.span>

          {/* Headline */}
          <motion.h1 {...stagger(1)} className="mt-6 font-display text-5xl font-bold leading-[1.03] tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-[5.25rem]">
            {t("hero.title1")}<br />
            {t("hero.title2")} <span className="text-primary">{t("hero.title3")}</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p {...stagger(2)} className="mt-5 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">
            {t("hero.sub")}
          </motion.p>

          {/* CTAs */}
          <motion.div {...stagger(3)} className="mt-8 flex flex-wrap gap-3">
            <motion.div whileHover={{ scale: 1.03, boxShadow: "0 0 28px rgba(18,197,142,0.45)" }} whileTap={{ scale: 0.97 }} className="rounded-full">
              <Button asChild variant="green" size="lg" className="rounded-full shadow-xl shadow-primary/30">
                <Link href="/contact">{t("hero.cta1")} <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="rounded-full">
              <Button asChild size="lg" className="rounded-full border-white/25 bg-white/10 text-white backdrop-blur-md hover:bg-white/20">
                <Link href="/courses">{t("hero.cta2")}</Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Social proof */}
          <motion.div {...stagger(4)} className="mt-10 flex items-center gap-4">
            <div className="flex">
              {["#12C58E", "#EE4B3C", "#2D6BE0", "#7C3AED"].map((c, i) => (
                <span key={i} className={`${i > 0 ? "-ml-2.5" : ""} grid h-10 w-10 place-items-center rounded-full border-2 border-white/30 text-xs font-bold text-white`} style={{ background: c }}>
                  {["A", "M", "J", "S"][i]}
                </span>
              ))}
            </div>
            <div className="text-sm">
              <div className="flex gap-0.5 text-yellow-400">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
              </div>
              <span className="text-white/70">{t("hero.proof")}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Slide indicators ── */}
      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-500 ${i === current ? "w-8 bg-primary" : "w-2 bg-white/40 hover:bg-white/60"}`}
          />
        ))}
      </div>
    </section>
  );
}
