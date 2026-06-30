"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Globe, ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n, LANG_NAMES, LANG_LABEL, LANGS, type Lang } from "@/lib/i18n";

const NAV = [
  { href: "/about", key: "nav.about" },
  { href: "/contact", key: "nav.contact" },
] as const;

export function SiteNav({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();
  const { lang, setLang, t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close lang dropdown when clicking outside */
  useEffect(() => {
    if (!langOpen) return;
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === "Escape") setLangOpen(false); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [langOpen]);

  const pickLang = (l: Lang) => {
    setLang(l);
    setLangOpen(false);
  };

  const onHero = !scrolled && pathname === "/";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex h-20 items-center transition-all duration-300",
        scrolled ? "border-b border-black/5 bg-background/90 backdrop-blur-md shadow-sm" : "bg-transparent"
      )}
    >
      <div className="container flex items-center justify-between gap-5">

        {/* Logo */}
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

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative text-sm font-medium transition",
                "after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-0 after:rounded after:bg-primary after:transition-all hover:after:w-full",
                onHero ? "text-white/85 hover:text-white" : "text-muted-foreground hover:text-foreground",
                pathname === item.href && (onHero ? "text-white after:w-full" : "text-foreground after:w-full")
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
        {/* nav keys resolve via i18n: nav.about / nav.contact */}

        {/* Desktop right */}
        <div className="hidden items-center gap-3 md:flex">

          {/* Language switcher */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition",
                onHero
                  ? "border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                  : "border-border bg-card text-foreground hover:border-primary"
              )}
              aria-haspopup="listbox"
              aria-expanded={langOpen}
              aria-label="Choose language"
            >
              <Globe className="h-4 w-4 text-primary" />
              <span>{LANG_LABEL[lang]}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", langOpen && "rotate-180")} />
            </button>

            {/* Dropdown — always light background so it's legible over any hero */}
            {langOpen && (
              <div
                role="listbox"
                aria-label="Language options"
                className="absolute right-0 top-[calc(100%+10px)] z-[60] min-w-[188px] rounded-2xl border border-border bg-white p-1.5 shadow-2xl"
              >
                {LANGS.map((code) => (
                  <button
                    key={code}
                    role="option"
                    aria-selected={code === lang}
                    onClick={() => pickLang(code)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-muted",
                      code === lang && "font-semibold text-primary bg-primary/5"
                    )}
                  >
                    {LANG_NAMES[code]}
                    {code === lang && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button asChild variant={onHero ? "white" : "default"} size="sm">
            <Link href="/contact">{t("nav.book")}</Link>
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className={cn(
            "grid h-11 w-11 place-items-center rounded-xl border md:hidden transition",
            onHero ? "border-white/25 bg-white/10 text-white" : "border-border bg-card"
          )}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-x-0 top-20 bottom-0 z-40 flex flex-col gap-1 overflow-y-auto bg-background p-8 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="border-b border-border py-4 font-display text-2xl text-foreground transition hover:text-primary"
            >
              {t(item.key)}
            </Link>
          ))}
          <div className="mt-6">
            <Button asChild variant="default" className="w-full">
              <Link href="/contact" onClick={() => setMenuOpen(false)}>{t("nav.book")}</Link>
            </Button>
          </div>
          {/* Language pills in mobile */}
          <div className="mt-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("nav.language")}</p>
            <div className="flex flex-wrap gap-2">
              {LANGS.map((code) => (
                <button
                  key={code}
                  onClick={() => pickLang(code)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition",
                    code === lang
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                  )}
                >
                  {LANG_NAMES[code]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
