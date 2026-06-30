"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Globe, ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

const T: Record<string, Record<string, string>> = {
  en: { about: "About", contact: "Contact", book: "Book a Class", label: "EN" },
  pt: { about: "Sobre", contact: "Contacto", book: "Marcar Aula", label: "PT" },
  fr: { about: "À propos", contact: "Contact", book: "Réserver", label: "FR" },
  es: { about: "Nosotros", contact: "Contacto", book: "Reservar", label: "ES" },
  kr: { about: "Sobri", contact: "Kontaktu", book: "Marka Aula", label: "KR" },
};
const LANG_NAMES: Record<string, string> = { en: "🇬🇧 English", pt: "🇵🇹 Português", fr: "🇫🇷 Français", es: "🇪🇸 Español", kr: "🇨🇻 Kriolu" };

export function SiteNav({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("icl-lang");
      if (saved && T[saved]) setLang(saved);
    } catch {}
  }, []);

  const t = (k: string) => T[lang]?.[k] ?? T.en[k];
  const pickLang = (l: string) => { setLang(l); setLangOpen(false); try { localStorage.setItem("icl-lang", l); } catch {} };

  /* Nav is over the hero (dark background) when at top, light when scrolled */
  const onHero = !scrolled && pathname === "/";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex h-20 items-center transition-all duration-300",
        scrolled
          ? "border-b border-black/5 bg-background/90 backdrop-blur-md"
          : onHero
          ? "bg-transparent"
          : "bg-transparent"
      )}
    >
      <div className="container flex items-center justify-between gap-5">
        <Link href="/" className="flex items-center" aria-label="IClangues home">
          <Image
            src={onHero ? "/images/logo-dark.jpg" : "/images/logo.png"}
            alt="IClangues"
            width={140}
            height={40}
            className={cn("h-10 w-auto transition-all duration-300", onHero && "mix-blend-screen")}
            priority
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative text-sm font-medium transition",
                "after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-0 after:rounded after:bg-primary after:transition-all hover:after:w-full",
                onHero
                  ? "text-white/80 hover:text-white"
                  : "text-muted-foreground hover:text-foreground",
                pathname === item.href && (onHero ? "text-white after:w-full" : "text-foreground after:w-full")
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition",
                onHero
                  ? "border-white/25 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                  : "border-border bg-card text-foreground hover:border-primary"
              )}
              aria-haspopup="true"
              aria-expanded={langOpen}
            >
              <Globe className="h-4 w-4 text-primary" />
              {T[lang].label}
              <ChevronDown className={cn("h-3.5 w-3.5 transition", langOpen && "rotate-180")} />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] min-w-[178px] rounded-2xl border border-border bg-card p-1.5 shadow-xl">
                {Object.keys(LANG_NAMES).map((l) => (
                  <button
                    key={l}
                    onClick={() => pickLang(l)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted",
                      l === lang && "font-semibold text-primary"
                    )}
                  >
                    {LANG_NAMES[l]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button asChild variant={onHero ? "white" : "default"} size="sm">
            <Link href="/contact">{t("book")}</Link>
          </Button>
        </div>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className={cn(
            "grid h-11 w-11 place-items-center rounded-xl border md:hidden transition",
            onHero ? "border-white/25 bg-white/10 text-white" : "border-border bg-card"
          )}
          aria-label="Menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-x-0 top-20 bottom-0 z-40 flex flex-col gap-1 bg-background p-8 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="border-b border-black/5 py-3 font-display text-2xl text-foreground"
            >
              {t(item.key)}
            </Link>
          ))}
          <div className="mt-5 flex flex-col gap-3">
            <Button asChild variant="default">
              <Link href="/contact" onClick={() => setMenuOpen(false)}>{t("book")}</Link>
            </Button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {Object.keys(LANG_NAMES).map((l) => (
              <button key={l} onClick={() => pickLang(l)} className={cn("rounded-full border px-3 py-1 text-sm transition", l === lang ? "border-primary text-primary" : "border-border")}>
                {T[l].label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
