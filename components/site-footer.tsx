"use client";

import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="bg-brand-ink text-white/70">
      <div className="container py-16">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1.3fr]">
          <div>
            <div className="mb-4 inline-flex rounded-xl bg-white px-3 py-2">
              <Image src="/images/logo.png" alt="IClangues" width={120} height={34} className="h-8 w-auto" />
            </div>
            <p className="max-w-sm text-sm text-white/60">{t("foot.tagline")}</p>
            <div className="mt-5 flex gap-3">
              {[Instagram, Facebook, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 text-white/60 transition hover:-translate-y-0.5 hover:border-primary hover:text-primary"
                  aria-label="Social link"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-primary">{t("foot.explore")}</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about" className="text-white/60 transition hover:text-white">{t("nav.about")}</Link></li>
              <li><Link href="/contact" className="text-white/60 transition hover:text-white">{t("nav.contact")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-primary">{t("foot.touch")}</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5"><Mail className="mt-0.5 h-4 w-4 flex-none text-primary" /><a href="mailto:iclangues@outlook.com" className="text-white/60 hover:text-white">iclangues@outlook.com</a></li>
              <li className="flex items-start gap-2.5"><Phone className="mt-0.5 h-4 w-4 flex-none text-primary" /><a href="tel:+2389521329" className="text-white/60 hover:text-white">+238 952 1329</a></li>
              <li className="flex items-start gap-2.5"><MapPin className="mt-0.5 h-4 w-4 flex-none text-primary" /><span className="text-white/60">{t("foot.location")}</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-7 text-sm text-white/50 sm:flex-row">
          <span>© {new Date().getFullYear()} IClangues. {t("foot.made")}</span>
          <span>
            {t("foot.design")}{" "}
            <a
              href="https://tedcanlabs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              9ja Lda
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
