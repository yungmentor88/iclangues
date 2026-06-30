"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, GraduationCap, MessagesSquare, Globe2, Sparkles, Star, Users } from "lucide-react";
import { Hero } from "@/components/hero";
import { Reveal } from "@/components/reveal";
import { Faq } from "@/components/faq";
import { FeatureHighlight } from "@/components/ui/feature-highlight";
import { Button } from "@/components/ui/button";
import { LANGUAGES, FAQ, type LangCode } from "@/lib/content";
import { useI18n } from "@/lib/i18n";

const MARQUEE = ["Kriolu", "English", "Français", "Español", "Português", "Morabeza"];

const SMART = [
  { icon: Users,          tone: "bg-primary/15 text-primary",  key: "c1" },
  { icon: MessagesSquare, tone: "bg-red-50 text-brand-red",    key: "c2" },
  { icon: GraduationCap,  tone: "bg-amber-50 text-amber-600",  key: "c3" },
  { icon: Globe2,         tone: "bg-blue-50 text-brand-ocean", key: "c4" },
] as const;

export default function HomePage() {
  const { t } = useI18n();

  return (
    <main>
      {/* ── 1. Hero ── */}
      <Hero />

      {/* ── 2. Manifesto ── */}
      <section className="container py-24 sm:py-32">
        <Reveal className="mx-auto max-w-4xl text-center">
          <p className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-[3.75rem]">
            &ldquo;{t("man.l1")}
            <br />{t("man.l2")}
            <br />{t("man.l3")}{" "}
            <em className="not-italic text-primary">{t("man.l3a")}</em>&rdquo;
          </p>
          <div className="mx-auto mt-8 h-px w-12 bg-border" />
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("man.tag")}</p>
        </Reveal>
      </section>

      {/* ── 3. Marquee ── */}
      <div className="relative overflow-hidden border-y border-border bg-brand-ink py-4">
        <div className="flex w-max animate-marquee">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="flex items-center gap-6 px-6 font-display text-xl font-semibold text-white">
              {m} <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            </span>
          ))}
        </div>
      </div>

      {/* ── 4. How it works ── */}
      <section className="container py-20 sm:py-28">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" /> {t("how.eyebrow")}
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{t("how.heading")}</h2>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SMART.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.key} delay={i * 0.08}>
                <article className="group h-full rounded-[22px] border border-border bg-card p-7 transition hover:-translate-y-1.5 hover:shadow-xl">
                  <span className={`mb-5 grid h-12 w-12 place-items-center rounded-2xl ${s.tone}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t(`how.${s.key}.tag`)}</span>
                  <h3 className="mt-1 font-display text-lg font-semibold">{t(`how.${s.key}.title`)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t(`how.${s.key}.text`)}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── 5. Languages ── */}
      <section id="languages" className="bg-card py-20 sm:py-28">
        <div className="container">
          <Reveal className="mb-12 max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" /> {t("langs.eyebrow")}
            </span>
            <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{t("langs.heading")}</h2>
            <p className="mt-4 text-lg text-muted-foreground">{t("langs.sub")}</p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {(Object.keys(LANGUAGES) as LangCode[]).map((code, i) => {
              const l = LANGUAGES[code];
              return (
                <Reveal key={code} delay={i * 0.06}>
                  <article className="group relative h-full overflow-hidden rounded-[22px] border border-border bg-background p-6 transition hover:-translate-y-1.5 hover:shadow-xl">
                    <span className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" style={{ background: l.color }} />
                    <span className="mb-4 grid h-7 w-10 place-items-center rounded-md text-xs font-extrabold text-white" style={{ background: l.color }}>{l.badge}</span>
                    <h3 className="font-display text-xl font-bold">{l.name}</h3>
                    <p className="mb-2.5 font-display italic" style={{ color: l.color }}>{l.native}</p>
                    <p className="mb-4 text-sm text-muted-foreground">{l.tagline}</p>
                    <Link href="/courses" className="inline-flex items-center gap-1 text-sm font-semibold">{t("langs.explore")} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></Link>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6. Feature highlight ── */}
      <section className="container grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-2">
        <Reveal className="order-2 lg:order-1">
          <div className="relative aspect-[4/3.4] overflow-hidden rounded-[28px] shadow-2xl">
            <Image src="/images/market.jpg" alt="The vibrant streets and culture of Cabo Verde" fill className="object-cover object-center" sizes="(max-width:1024px) 90vw, 560px" />
          </div>
        </Reveal>
        <FeatureHighlight
          className="order-1 max-w-none lg:order-2"
          icon={<span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary"><Sparkles className="h-6 w-6" /></span>}
          title={<>{t("feat.title1")} <span className="text-primary">{t("feat.titleA")}</span></>}
          features={[
            <span key="1" className="flex items-center gap-2"><Check className="h-5 w-5 text-primary" /> {t("feat.f1")}</span>,
            <span key="2" className="flex items-center gap-2"><Check className="h-5 w-5 text-primary" /> {t("feat.f2")}</span>,
            <span key="3" className="flex items-center gap-2"><Check className="h-5 w-5 text-primary" /> {t("feat.f3")}</span>,
            <span key="4" className="flex items-center gap-2"><Check className="h-5 w-5 text-primary" /> {t("feat.f4")}</span>,
          ]}
          footer={
            <Button asChild variant="green" className="mt-2"><Link href="/courses">{t("feat.btn")} <ArrowRight className="h-4 w-4" /></Link></Button>
          }
        />
      </section>

      {/* ── 7. Learn live — dark card ── */}
      <section className="container py-6 sm:py-10">
        <Reveal>
          <div className="grid items-center gap-8 overflow-hidden rounded-[32px] bg-brand-ink p-8 text-white sm:p-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" /> {t("live.eyebrow")}
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">{t("live.heading")}</h2>
              <p className="mt-4 max-w-md text-white/70">{t("live.sub")}</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {["live.l1", "live.l2", "live.l3", "live.l4"].map((k) => (
                  <li key={k} className="flex items-center gap-2.5 text-sm text-white/85">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/20"><Check className="h-3 w-3 text-primary" /></span>{t(k)}
                  </li>
                ))}
              </ul>
              <Button asChild variant="green" className="mt-7"><Link href="/contact">{t("live.btn")} <ArrowRight className="h-4 w-4" /></Link></Button>
            </div>
            <div className="grid grid-rows-[auto_1fr] gap-3">
              <div className="relative aspect-[16/7] overflow-hidden rounded-2xl">
                <Image src="/images/card1.jpg" alt="IClangues students in conversation" fill className="object-cover" sizes="(max-width:1024px) 90vw, 520px" />
              </div>
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
                <Image src="/images/beach.jpg" alt="Joy and community in Cabo Verde" fill className="object-cover object-top" sizes="(max-width:1024px) 90vw, 520px" />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── 8. Anytime anywhere — green card ── */}
      <section className="container py-12 sm:py-16">
        <Reveal>
          <div className="grid items-center gap-8 overflow-hidden rounded-[32px] bg-primary p-8 text-primary-foreground sm:p-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">{t("any.heading")}</h2>
              <p className="mt-3 max-w-md text-primary-foreground/80">{t("any.sub")}</p>
              <div className="mt-6 grid max-w-md gap-3 sm:grid-cols-2">
                {["any.a1", "any.a2", "any.a3", "any.a4"].map((k) => (
                  <span key={k} className="flex items-center gap-2 text-sm font-medium">
                    <Check className="h-4 w-4" /> {t(k)}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { Icon: GraduationCap, label: "A1–C2" },
                { Icon: MessagesSquare, label: "Live" },
                { Icon: Globe2, label: "5 langs" },
              ].map(({ Icon, label }, i) => (
                <div key={i} className="rounded-2xl bg-white/15 p-5">
                  <Icon className="mx-auto h-7 w-7" />
                  <div className="mt-2 font-display text-sm font-bold">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── 9. FAQ ── */}
      <section className="container grid gap-10 py-20 sm:py-28 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" /> FAQ
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{t("faq.heading")}</h2>
          <p className="mt-4 text-muted-foreground">{t("faq.linkpre")} <Link href="/contact" className="font-semibold text-primary">{t("faq.linkcta")}</Link></p>
        </Reveal>
        <Reveal delay={0.1}><Faq items={FAQ} /></Reveal>
      </section>

      {/* ── 10. CTA ── */}
      <section className="container pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-brand-ink p-10 text-center text-white sm:p-16">
            <div className="pointer-events-none absolute -right-16 -top-32 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
            <div className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-brand-ocean/20 blur-3xl" />
            <h2 className="relative font-display text-4xl font-bold text-white sm:text-5xl">{t("cta.heading")}</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-white/80">{t("cta.sub")}</p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild variant="green" size="lg"><Link href="/register">{t("cta.btn1")} <ArrowRight className="h-4 w-4" /></Link></Button>
              <Button asChild variant="white" size="lg"><Link href="/contact">{t("cta.btn2")}</Link></Button>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
