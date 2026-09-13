/**
 * Generates supabase/migrations/0004_seed_current_content.sql from the
 * existing hard-coded frontend content.
 *
 * Spec §27: the first CMS seed must reproduce the current website exactly.
 * Transcribing 110 keys x 5 languages by hand would introduce typos into
 * content we've promised not to change, so we derive it mechanically from
 * lib/i18n.tsx and lib/content.ts instead.
 *
 * Run:  node scripts/generate-seed.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "supabase", "migrations", "0004_seed_current_content.sql");

/* ---------- helpers ---------- */

const q = (s) => (s === null || s === undefined ? "null" : `'${String(s).replace(/'/g, "''")}'`);
const jsonb = (o) => (o === null || o === undefined ? "null" : `'${JSON.stringify(o).replace(/'/g, "''")}'::jsonb`);

/**
 * Extract the `const S: Record<string, Record<Lang, string>> = { ... }`
 * dictionary from lib/i18n.tsx by evaluating just that object literal.
 * It is plain data (no imports, no expressions), so this is safe and gives
 * us exact strings including accents and escapes.
 */
function readI18n() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "i18n.tsx"), "utf8");
  const start = src.indexOf("const S:");
  if (start === -1) throw new Error("could not locate the i18n dictionary");
  const brace = src.indexOf("{", start);
  const end = src.indexOf("\n};", brace);
  if (end === -1) throw new Error("could not locate the end of the i18n dictionary");
  const literal = src.slice(brace, end + 2);
  // eslint-disable-next-line no-new-func
  return new Function(`return (${literal});`)();
}

/** Same trick for the SEED_COURSES / FAQ arrays in lib/content.ts. */
function readContentArray(name) {
  const src = fs.readFileSync(path.join(ROOT, "lib", "content.ts"), "utf8");
  const decl = src.indexOf(`export const ${name}`);
  if (decl === -1) throw new Error(`could not locate ${name}`);
  const start = src.indexOf("[", decl);
  const end = src.indexOf("\n];", start);
  const literal = src.slice(start, end + 2);
  // eslint-disable-next-line no-new-func
  return new Function(`return (${literal});`)();
}

/* ---------- load ---------- */

const S = readI18n();
const COURSES = readContentArray("SEED_COURSES");
const FAQ = readContentArray("FAQ");

const keys = Object.keys(S);

/* Human-readable section names for the admin sidebar. */
const SECTION_LABEL = {
  nav: "Navigation",
  hero: "Homepage — Hero",
  man: "Homepage — Manifesto",
  how: "Homepage — How it works",
  langs: "Homepage — Languages",
  feat: "Homepage — Features",
  live: "Homepage — Learn live",
  any: "Homepage — Anytime anywhere",
  faq: "Homepage — FAQ",
  cta: "Homepage — Call to action",
  foot: "Footer",
  about: "About page",
  contact: "Contact page",
  cform: "Contact form",
};

/* ---------- build SQL ---------- */

const L = [];

L.push(`-- =====================================================================
-- 0004 — Seed: reproduce the CURRENT website exactly
--
-- GENERATED FILE — do not edit by hand.
-- Regenerate with:  node scripts/generate-seed.js
--
-- Source of truth: lib/i18n.tsx (${keys.length} keys x 5 languages)
--                  lib/content.ts (${COURSES.length} courses, ${FAQ.length} FAQs)
--
-- Every row is inserted with draft == published so the site renders
-- byte-identically to today the moment the frontend switches over (§27).
-- Re-runnable: every statement is idempotent.
-- =====================================================================
`);

/* --- site settings (currently duplicated across 3 files) --- */
L.push(`-- ---------- Site settings ----------
insert into public.site_settings (id, school_name, contact_email, contact_phone, whatsapp_number, address)
values (
  true,
  'IClangues',
  'iclangues@outlook.com',
  '+238 952 1329',
  '2389521329',
  ${jsonb(S["foot.location"])}
)
on conflict (id) do nothing;
`);

/* --- UI strings --- */
L.push(`-- ---------- UI strings (${keys.length}) ----------`);
keys.forEach((key, i) => {
  const section = key.split(".")[0];
  L.push(
    `insert into public.ui_strings (key, section, description, draft_value, published_value, sort) values (` +
      `${q(key)}, ${q(SECTION_LABEL[section] || section)}, ${q(null)}, ${jsonb(S[key])}, ${jsonb(S[key])}, ${i}) ` +
      `on conflict (key) do nothing;`
  );
});
L.push("");

/* --- pages + sections --- */
const PAGES = [
  { slug: "home", title: { en: "Homepage", pt: "Página inicial", fr: "Accueil", es: "Inicio", kr: "Pájina inisial" }, sort: 0 },
  { slug: "about", title: { en: "About", pt: "Sobre", fr: "À propos", es: "Nosotros", kr: "Sobri" }, sort: 1 },
  { slug: "courses", title: { en: "Courses", pt: "Cursos", fr: "Cours", es: "Cursos", kr: "Kursu" }, sort: 2 },
  { slug: "contact", title: { en: "Contact", pt: "Contacto", fr: "Contact", es: "Contacto", kr: "Kontaktu" }, sort: 3 },
];

L.push(`-- ---------- Pages ----------`);
PAGES.forEach((p) => {
  L.push(
    `insert into public.pages (slug, title, is_system, sort) values (${q(p.slug)}, ${jsonb(p.title)}, true, ${p.sort}) on conflict (slug) do nothing;`
  );
});
L.push("");

/*
 * Page sections mirror the real component structure so the visual editor
 * lists exactly what is on the page. Image references use the current
 * public/images paths; 0005 (media import) will swap these for media ids.
 */
const SECTIONS = [
  ["home", "hero", "hero", "Hero", {
    slides: [
      { src: "/images/header.jpg", position: "50% 22%", altKey: "hero.slide1.alt" },
      { src: "/images/beach.jpg", position: "50% 25%", altKey: "hero.slide2.alt" },
      { src: "/images/market.jpg", position: "50% 50%", altKey: "hero.slide3.alt" },
    ],
    badgeKey: "hero.badge",
    titleKeys: ["hero.title1", "hero.title2", "hero.title3"],
    subKey: "hero.sub",
    primaryCta: { labelKey: "hero.cta1", href: "/contact" },
    secondaryCta: { labelKey: "hero.cta2", href: "/courses" },
    proofKey: "hero.proof",
  }],
  ["home", "manifesto", "text", "Manifesto", {
    lineKeys: ["man.l1", "man.l2", "man.l3", "man.l3a"],
    tagKey: "man.tag",
  }],
  ["home", "marquee", "marquee", "Language marquee", {
    items: ["Kriolu", "English", "Français", "Español", "Português", "Morabeza"],
  }],
  ["home", "how", "card-grid", "How it works", {
    eyebrowKey: "how.eyebrow",
    headingKey: "how.heading",
    cards: ["c1", "c2", "c3", "c4"].map((c) => ({
      icon: { c1: "Users", c2: "MessagesSquare", c3: "GraduationCap", c4: "Globe2" }[c],
      tagKey: `how.${c}.tag`, titleKey: `how.${c}.title`, textKey: `how.${c}.text`,
    })),
  }],
  ["home", "languages", "language-grid", "Languages", {
    eyebrowKey: "langs.eyebrow", headingKey: "langs.heading", subKey: "langs.sub", exploreKey: "langs.explore",
  }],
  ["home", "feature", "text-image", "Feature highlight", {
    image: "/images/market.jpg",
    titleKeys: ["feat.title1", "feat.titleA"],
    featureKeys: ["feat.f1", "feat.f2", "feat.f3", "feat.f4"],
    ctaKey: "feat.btn", ctaHref: "/courses",
  }],
  ["home", "live", "dark-card", "Learn live", {
    eyebrowKey: "live.eyebrow", headingKey: "live.heading", subKey: "live.sub",
    listKeys: ["live.l1", "live.l2", "live.l3", "live.l4"],
    ctaKey: "live.btn", ctaHref: "/contact",
    images: ["/images/card1.jpg", "/images/beach.jpg"],
  }],
  ["home", "anytime", "green-card", "Anytime, anywhere", {
    headingKey: "any.heading", subKey: "any.sub",
    itemKeys: ["any.a1", "any.a2", "any.a3", "any.a4"],
    stats: [{ icon: "GraduationCap", label: "A1–C2" }, { icon: "MessagesSquare", label: "Live" }, { icon: "Globe2", label: "5 langs" }],
  }],
  ["home", "faq", "faq", "FAQ", { headingKey: "faq.heading", linkPreKey: "faq.linkpre", linkCtaKey: "faq.linkcta", linkHref: "/contact" }],
  ["home", "cta", "cta", "Final call to action", {
    headingKey: "cta.heading", subKey: "cta.sub",
    primaryCta: { labelKey: "cta.btn1", href: "/register" },
    secondaryCta: { labelKey: "cta.btn2", href: "/contact" },
  }],

  ["about", "intro", "page-header", "Intro", {
    eyebrowKey: "about.eyebrow",
    titleKeys: ["about.title1", "about.titleIsland", "about.title2", "about.titleWorld"],
    introKey: "about.intro",
  }],
  ["about", "story", "text-image", "Story", { headingKey: "about.h2", bodyKey: "about.body", image: "/images/about.jpg" }],
  ["about", "values", "card-grid", "Values", {
    eyebrowKey: "about.val.eyebrow", headingKey: "about.val.heading",
    cards: ["v1", "v2", "v3", "v4"].map((v) => ({
      icon: { v1: "Heart", v2: "Users", v3: "Globe2", v4: "MessagesSquare" }[v],
      titleKey: `about.${v}.title`, textKey: `about.${v}.text`,
    })),
  }],
  ["about", "people", "cta", "People", {
    headingKey: "about.people.heading", textKey: "about.people.text",
    primaryCta: { labelKey: "about.cta1", href: "/contact" },
    secondaryCta: { labelKey: "about.cta2", href: "/courses" },
  }],

  ["contact", "intro", "page-header", "Intro", {
    eyebrowKey: "contact.eyebrow",
    heading: { en: "Olá. Bonjour. Hello. Oi.", pt: "Olá. Bonjour. Hello. Oi.", fr: "Olá. Bonjour. Hello. Oi.", es: "Olá. Bonjour. Hello. Oi.", kr: "Olá. Bonjour. Hello. Oi." },
    subKey: "contact.sub",
  }],
  ["contact", "details", "contact-cards", "Contact details", {
    emailKey: "contact.email", phoneKey: "contact.phone",
    whatsappMsgKey: "contact.whatsappMsg", whereKey: "contact.where",
  }],

  ["courses", "explorer", "course-grid", "Course explorer", {
    filterLanguageLabel: { en: "Language", pt: "Idioma", fr: "Langue", es: "Idioma", kr: "Língua" },
    filterLevelLabel: { en: "Level", pt: "Nível", fr: "Niveau", es: "Nivel", kr: "Nível" },
    filterAllLabel: { en: "All", pt: "Todos", fr: "Tous", es: "Todos", kr: "Tudu" },
    enrolLabel: { en: "Enrol now", pt: "Inscreve-te", fr: "S'inscrire", es: "Inscríbete", kr: "Inskreve gósi" },
    emptyLabel: { en: "No courses match that combination yet — try another level.", pt: "Nenhum curso corresponde a essa combinação — experimenta outro nível.", fr: "Aucun cours ne correspond — essaie un autre niveau.", es: "Ningún curso coincide — prueba otro nivel.", kr: "Ningun kursu ka ta korresponde — tenta otu nível." },
  }],
];

L.push(`-- ---------- Page sections ----------`);
SECTIONS.forEach(([slug, key, type, label, content], i) => {
  L.push(
    `insert into public.page_sections (page_id, section_key, section_type, label, draft_content, published_content, sort)\n` +
      `select id, ${q(key)}, ${q(type)}, ${q(label)}, ${jsonb(content)}, ${jsonb(content)}, ${i}\n` +
      `  from public.pages where slug = ${q(slug)}\n` +
      `on conflict (page_id, section_key) do nothing;`
  );
});
L.push("");

/* --- navigation (currently the NAV const in site-nav.tsx) --- */
L.push(`-- ---------- Navigation ----------`);
[
  { menu: "header", key: "nav.about", href: "/about", sort: 0 },
  { menu: "header", key: "nav.contact", href: "/contact", sort: 1 },
  { menu: "footer", key: "nav.about", href: "/about", sort: 0 },
  { menu: "footer", key: "nav.contact", href: "/contact", sort: 1 },
].forEach((n) => {
  L.push(
    `insert into public.nav_items (menu, label, href, sort) ` +
      `select ${q(n.menu)}, ${jsonb(S[n.key])}, ${q(n.href)}, ${n.sort} ` +
      `where not exists (select 1 from public.nav_items where menu = ${q(n.menu)} and href = ${q(n.href)});`
  );
});
L.push("");

/* --- FAQs --- */
L.push(`-- ---------- FAQs (${FAQ.length}) ----------`);
FAQ.forEach((f, i) => {
  // The frontend FAQ is English-only today; seed EN and leave the other
  // languages for the owner to fill in from the admin panel.
  L.push(
    `insert into public.faqs (question, answer, sort) ` +
      `select ${jsonb({ en: f.q })}, ${jsonb({ en: f.a })}, ${i} ` +
      `where not exists (select 1 from public.faqs where question->>'en' = ${q(f.q)});`
  );
});
L.push("");

/* --- courses: backfill the translatable columns from existing rows --- */
L.push(`-- ---------- Courses: backfill i18n columns from the live rows ----------
-- The 13 courses already exist with English title/description. Copy them
-- into the new jsonb columns so nothing is lost and the site keeps
-- rendering; the owner can add the other languages from the admin panel.
update public.courses
   set title_i18n = jsonb_build_object('en', title)
 where title_i18n is null;

update public.courses
   set description_i18n = jsonb_build_object('en', description)
 where description_i18n is null;

update public.courses set is_published = true where is_published is null;
`);

fs.writeFileSync(OUT, L.join("\n") + "\n", "utf8");

console.log(`wrote ${path.relative(ROOT, OUT)}`);
console.log(`  ui_strings   : ${keys.length}`);
console.log(`  page_sections: ${SECTIONS.length}`);
console.log(`  faqs         : ${FAQ.length}`);
console.log(`  courses      : ${COURSES.length} (backfilled in place)`);
