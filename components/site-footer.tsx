"use client";

import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { SiteSettings } from "@/lib/cms";

/** Fallbacks are the values that were hard-coded here before the CMS existed,
 *  so a missing settings row renders exactly today's footer. */
const FALLBACK_EMAIL = "iclangues@outlook.com";
const FALLBACK_PHONE = "+238 952 1329";

export function SiteFooter({ settings }: { settings?: SiteSettings | null }) {
  const { t, lang } = useI18n();

  const email = settings?.contact_email?.trim() || FALLBACK_EMAIL;
  const phone = settings?.contact_phone?.trim() || FALLBACK_PHONE;
  const location = settings?.address?.[lang]?.trim() || settings?.address?.en?.trim() || t("foot.location");

  const socials = [
    { Icon: Instagram, href: settings?.social_instagram?.trim() },
    { Icon: Facebook, href: settings?.social_facebook?.trim() },
    { Icon: Youtube, href: settings?.social_youtube?.trim() },
  ];

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
              {/* Only render a social icon once a real URL is set, rather than
                  linking to "#" and looking broken. */}
              {socials.filter((s) => s.href).map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
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
              <li className="flex items-start gap-2.5"><Mail className="mt-0.5 h-4 w-4 flex-none text-primary" /><a href={`mailto:${email}`} className="text-white/60 hover:text-white">{email}</a></li>
              <li className="flex items-start gap-2.5"><Phone className="mt-0.5 h-4 w-4 flex-none text-primary" /><a href={`tel:${phone.replace(/\s/g, "")}`} className="text-white/60 hover:text-white">{phone}</a></li>
              <li className="flex items-start gap-2.5"><MapPin className="mt-0.5 h-4 w-4 flex-none text-primary" /><span className="text-white/60">{location}</span></li>
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
