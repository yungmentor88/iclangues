"use client";

import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { ContactForm } from "@/components/contact-form";
import { useI18n } from "@/lib/i18n";

export function ContactContent() {
  const { t } = useI18n();

  return (
    <main className="pb-24">
      <section className="bg-gradient-to-b from-primary/10 to-background pb-12 pt-32">
        <div className="container max-w-3xl">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-red">
            <span className="h-2 w-2 rounded-full bg-brand-red" /> {t("contact.eyebrow")}
          </span>
          <h1 className="mt-3 font-display text-5xl font-bold tracking-tight sm:text-6xl">
            Olá. Bonjour. Hello. <span className="text-brand-red italic">Oi.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">{t("contact.sub")}</p>
        </div>
      </section>

      <section className="container grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal className="space-y-3.5">
          <ContactCard icon={<Mail className="h-5 w-5" />} tone="bg-primary/10 text-primary" label={t("contact.email")} value={<a href="mailto:iclangues@outlook.com">iclangues@outlook.com</a>} />
          <ContactCard icon={<Phone className="h-5 w-5" />} tone="bg-red-50 text-brand-red" label={t("contact.phone")} value={<a href="tel:+2389521329">+238 952 1329</a>} />
          <a href="https://wa.me/2389521329" target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 rounded-2xl bg-brand-ink p-5 text-white transition hover:-translate-y-0.5">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-primary text-brand-ink"><MessageCircle className="h-5 w-5" /></span>
            <span><span className="block text-xs font-bold uppercase tracking-wide text-primary">WhatsApp</span><span className="text-lg">{t("contact.whatsappMsg")}</span></span>
          </a>
          <ContactCard icon={<MapPin className="h-5 w-5" />} tone="bg-blue-50 text-brand-ocean" label={t("contact.where")} value={t("foot.location")} />
        </Reveal>

        <Reveal delay={0.1}>
          <ContactForm />
        </Reveal>
      </section>
    </main>
  );
}

function ContactCard({ icon, tone, label, value }: { icon: React.ReactNode; tone: string; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
      <span className={`grid h-11 w-11 flex-none place-items-center rounded-xl ${tone}`}>{icon}</span>
      <span>
        <span className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="text-lg font-medium text-foreground">{value}</span>
      </span>
    </div>
  );
}
