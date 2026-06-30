"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Users, Globe2, MessagesSquare, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

const VALUES = [
  { icon: Heart, key: "v1" },
  { icon: Users, key: "v2" },
  { icon: Globe2, key: "v3" },
  { icon: MessagesSquare, key: "v4" },
] as const;

export function AboutContent() {
  const { t } = useI18n();

  return (
    <main className="pb-24">
      <section className="bg-gradient-to-b from-primary/10 to-background pb-12 pt-32">
        <div className="container max-w-3xl">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" /> {t("about.eyebrow")}
          </span>
          <h1 className="mt-3 font-display text-5xl font-bold tracking-tight sm:text-6xl">
            {t("about.title1")} <span className="text-primary">{t("about.titleIsland")}</span>{t("about.title2")} <span className="text-brand-red">{t("about.titleWorld")}</span>.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">{t("about.intro")}</p>
        </div>
      </section>

      {/* Main banner image */}
      <section className="container">
        <Reveal>
          <div className="relative aspect-[16/8] overflow-hidden rounded-[32px] shadow-2xl">
            <Image src="/images/card3.jpg" alt="The IClangues community in Cabo Verde" fill className="object-cover object-center" sizes="100vw" priority />
          </div>
        </Reveal>
      </section>

      <section className="container grid items-center gap-12 py-20 lg:grid-cols-2">
        <Reveal>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">{t("about.h2")}</h2>
          <p className="mt-5 text-lg text-muted-foreground">{t("about.body")}</p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] shadow-xl">
            <Image src="/images/about.jpg" alt="IClangues — language learning in Cabo Verde" fill className="object-cover" sizes="(max-width:1024px) 90vw, 560px" />
          </div>
        </Reveal>
      </section>

      <section className="bg-card py-20">
        <div className="container">
          <Reveal className="mb-12 max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-red">
              <span className="h-2 w-2 rounded-full bg-brand-red" /> {t("about.val.eyebrow")}
            </span>
            <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{t("about.val.heading")}</h2>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {VALUES.map((v, i) => (
              <Reveal key={v.key} delay={i * 0.08}>
                <div className="h-full rounded-[22px] border border-border bg-background p-7 transition hover:-translate-y-1 hover:shadow-xl">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-sun text-brand-ink"><v.icon className="h-6 w-6" /></span>
                  <h3 className="mt-4 font-display text-xl font-bold">{t(`about.${v.key}.title`)}</h3>
                  <p className="mt-2 text-muted-foreground">{t(`about.${v.key}.text`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">{t("about.people.heading")}</h2>
          <p className="mt-4 text-muted-foreground">{t("about.people.text")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="green"><Link href="/contact">{t("about.cta1")} <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild variant="outline"><Link href="/courses">{t("about.cta2")}</Link></Button>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
