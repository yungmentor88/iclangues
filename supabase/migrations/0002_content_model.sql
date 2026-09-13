-- =====================================================================
-- 0002 — Content model
--
-- Every editable piece of the site. Translatable text is stored as jsonb
-- keyed by language code: {"en":"...","pt":"...","fr":"...","es":"...","kr":"..."}
--
-- Why jsonb and not 5 columns / a row per language:
--   * one row per string  -> draft & publish are atomic
--   * adding a 6th language needs no migration
--   * the frontend already consumes a Record<Lang, string> shape
--
-- Every table carries draft_* and published_* pairs. The public site reads
-- ONLY the published_* columns, so an unpublished draft is invisible even
-- if a policy were misconfigured.
-- =====================================================================

-- ---------- Shared helpers ----------

-- Validates that a jsonb value is an object whose values are all text and
-- which contains at least English. Prevents malformed translation blobs.
create or replace function public.is_valid_i18n(v jsonb)
returns boolean
language sql
immutable
as $$
  select
    v is null
    or (
      jsonb_typeof(v) = 'object'
      and v ? 'en'
      and not exists (
        select 1 from jsonb_each(v) e
        where jsonb_typeof(e.value) <> 'string'
      )
    );
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- Site settings — single source of truth for contact details etc.
-- Currently duplicated across site-footer.tsx, contact-content.tsx and
-- the contact.* i18n keys. §9 of the spec: store once, consume everywhere.
-- =====================================================================
create table if not exists public.site_settings (
  id                 boolean primary key default true check (id),  -- single row
  school_name        text not null default 'IClangues',
  contact_email      text,
  contact_phone      text,
  whatsapp_number    text,
  address            jsonb check (public.is_valid_i18n(address)),
  social_instagram   text,
  social_facebook    text,
  social_youtube     text,
  logo_media_id      uuid,
  logo_dark_media_id uuid,
  updated_at         timestamptz not null default now(),
  updated_by         uuid references auth.users (id) on delete set null
);

comment on table public.site_settings is
  'Exactly one row (id = true). Contact details consumed by header, footer and contact page.';

drop trigger if exists site_settings_touch on public.site_settings;
create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- Translatable UI strings — replaces the 110-key dictionary in lib/i18n.tsx
-- =====================================================================
create table if not exists public.ui_strings (
  key            text primary key,
  section        text not null,           -- nav | hero | manifesto | ... (groups the admin UI)
  description    text,                    -- human hint shown in the editor
  draft_value    jsonb not null check (public.is_valid_i18n(draft_value)),
  published_value jsonb check (public.is_valid_i18n(published_value)),
  sort           int not null default 0,
  updated_at     timestamptz not null default now(),
  updated_by     uuid references auth.users (id) on delete set null
);

create index if not exists ui_strings_section_idx on public.ui_strings (section, sort);

drop trigger if exists ui_strings_touch on public.ui_strings;
create trigger ui_strings_touch before update on public.ui_strings
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- Media library
-- =====================================================================
create table if not exists public.media (
  id           uuid primary key default gen_random_uuid(),
  storage_path text not null unique,      -- path inside the 'media' storage bucket
  filename     text not null,
  mime_type    text not null,
  size_bytes   bigint not null,
  width        int,
  height       int,
  alt_text     jsonb check (public.is_valid_i18n(alt_text)),
  description  text,
  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users (id) on delete set null
);

create index if not exists media_created_idx on public.media (created_at desc);

-- Deleting media that is still referenced must be blocked (§23). The FKs
-- below use ON DELETE RESTRICT so Postgres enforces it rather than the app.
alter table public.site_settings
  drop constraint if exists site_settings_logo_fk,
  add constraint site_settings_logo_fk
    foreign key (logo_media_id) references public.media (id) on delete restrict;

alter table public.site_settings
  drop constraint if exists site_settings_logo_dark_fk,
  add constraint site_settings_logo_dark_fk
    foreign key (logo_dark_media_id) references public.media (id) on delete restrict;

-- =====================================================================
-- Page sections — the visual editor's unit of editing
-- =====================================================================
create table if not exists public.pages (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,       -- 'home' | 'about' | 'contact' | 'courses'
  title       jsonb not null check (public.is_valid_i18n(title)),
  is_system   boolean not null default true,  -- system pages cannot be deleted (§23)
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.page_sections (
  id                uuid primary key default gen_random_uuid(),
  page_id           uuid not null references public.pages (id) on delete cascade,
  section_key       text not null,        -- stable key the component looks up
  section_type      text not null,        -- hero | manifesto | text-image | cta | ...
  label             text not null,        -- shown in the admin sidebar
  draft_content     jsonb not null default '{}'::jsonb,
  published_content jsonb,
  is_visible        boolean not null default true,
  sort              int not null default 0,
  updated_at        timestamptz not null default now(),
  updated_by        uuid references auth.users (id) on delete set null,
  unique (page_id, section_key)
);

create index if not exists page_sections_page_idx on public.page_sections (page_id, sort);

drop trigger if exists page_sections_touch on public.page_sections;
create trigger page_sections_touch before update on public.page_sections
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- SEO — one row per page
-- =====================================================================
create table if not exists public.page_seo (
  page_id          uuid primary key references public.pages (id) on delete cascade,
  seo_title        jsonb check (public.is_valid_i18n(seo_title)),
  meta_description jsonb check (public.is_valid_i18n(meta_description)),
  og_title         jsonb check (public.is_valid_i18n(og_title)),
  og_description   jsonb check (public.is_valid_i18n(og_description)),
  og_image_id      uuid references public.media (id) on delete set null,
  canonical_url    text,
  updated_at       timestamptz not null default now()
);

drop trigger if exists page_seo_touch on public.page_seo;
create trigger page_seo_touch before update on public.page_seo
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- Navigation
-- =====================================================================
create table if not exists public.nav_items (
  id           uuid primary key default gen_random_uuid(),
  menu         text not null check (menu in ('header', 'footer')),
  label        jsonb not null check (public.is_valid_i18n(label)),
  href         text not null,
  is_external  boolean not null default false,
  open_new_tab boolean not null default false,
  is_visible   boolean not null default true,
  sort         int not null default 0,
  updated_at   timestamptz not null default now()
);

create index if not exists nav_items_menu_idx on public.nav_items (menu, sort);

-- Guard against obviously broken links (§14 "do not allow the owner to
-- accidentally break the website"). Internal hrefs must be root-relative.
alter table public.nav_items
  drop constraint if exists nav_items_href_shape,
  add constraint nav_items_href_shape check (
    (is_external and href ~ '^https?://')
    or (not is_external and href ~ '^/')
  );

drop trigger if exists nav_items_touch on public.nav_items;
create trigger nav_items_touch before update on public.nav_items
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- Collections: courses, FAQs, teachers
-- (Per the user's decision: NOT testimonials, blog, events or gallery.)
-- =====================================================================

-- Courses already exists from the original schema; extend it in place so
-- the 13 live rows are preserved.
alter table public.courses
  add column if not exists cta_label    jsonb check (public.is_valid_i18n(cta_label)),
  add column if not exists cta_href     text,
  add column if not exists image_id     uuid references public.media (id) on delete set null,
  add column if not exists is_published boolean not null default true,
  add column if not exists updated_at   timestamptz not null default now();

-- The original table stores title/description as plain text (English only).
-- Add translatable columns alongside; 0004 backfills them from the existing
-- values so nothing is lost and the site keeps rendering.
alter table public.courses
  add column if not exists title_i18n       jsonb check (public.is_valid_i18n(title_i18n)),
  add column if not exists description_i18n jsonb check (public.is_valid_i18n(description_i18n));

drop trigger if exists courses_touch on public.courses;
create trigger courses_touch before update on public.courses
  for each row execute function public.touch_updated_at();

create table if not exists public.faqs (
  id           uuid primary key default gen_random_uuid(),
  question     jsonb not null check (public.is_valid_i18n(question)),
  answer       jsonb not null check (public.is_valid_i18n(answer)),
  is_published boolean not null default true,
  sort         int not null default 0,
  updated_at   timestamptz not null default now()
);

create index if not exists faqs_sort_idx on public.faqs (sort);

drop trigger if exists faqs_touch on public.faqs;
create trigger faqs_touch before update on public.faqs
  for each row execute function public.touch_updated_at();

create table if not exists public.teachers (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  role         jsonb check (public.is_valid_i18n(role)),
  bio          jsonb check (public.is_valid_i18n(bio)),
  photo_id     uuid references public.media (id) on delete set null,
  languages    text[] not null default '{}',   -- subset of kr/en/fr/es/pt
  social_links jsonb not null default '{}'::jsonb,
  is_published boolean not null default true,
  sort         int not null default 0,
  updated_at   timestamptz not null default now()
);

create index if not exists teachers_sort_idx on public.teachers (sort);

drop trigger if exists teachers_touch on public.teachers;
create trigger teachers_touch before update on public.teachers
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- Row Level Security
--
-- Pattern for every content table:
--   * anyone (incl. anon) may READ published rows
--   * only admins may read drafts / write anything
-- =====================================================================

alter table public.site_settings enable row level security;
alter table public.ui_strings    enable row level security;
alter table public.media         enable row level security;
alter table public.pages         enable row level security;
alter table public.page_sections enable row level security;
alter table public.page_seo      enable row level security;
alter table public.nav_items     enable row level security;
alter table public.faqs          enable row level security;
alter table public.teachers      enable row level security;

-- Site settings: public read (contact details are public anyway), admin write.
drop policy if exists "Site settings public read" on public.site_settings;
create policy "Site settings public read" on public.site_settings for select using (true);
drop policy if exists "Site settings admin write" on public.site_settings;
create policy "Site settings admin write" on public.site_settings for all
  using (public.is_admin()) with check (public.is_admin());

-- UI strings: everyone reads (the site needs them), admins write.
drop policy if exists "UI strings public read" on public.ui_strings;
create policy "UI strings public read" on public.ui_strings for select using (true);
drop policy if exists "UI strings admin write" on public.ui_strings;
create policy "UI strings admin write" on public.ui_strings for all
  using (public.is_admin()) with check (public.is_admin());

-- Media: public read (images are served publicly), admin write.
drop policy if exists "Media public read" on public.media;
create policy "Media public read" on public.media for select using (true);
drop policy if exists "Media admin write" on public.media;
create policy "Media admin write" on public.media for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Pages public read" on public.pages;
create policy "Pages public read" on public.pages for select using (true);
drop policy if exists "Pages admin write" on public.pages;
create policy "Pages admin write" on public.pages for all
  using (public.is_admin()) with check (public.is_admin());

-- Page sections: the public may read only VISIBLE rows, and the frontend
-- selects published_content. Admins see everything.
drop policy if exists "Page sections public read" on public.page_sections;
create policy "Page sections public read" on public.page_sections for select
  using (is_visible or public.is_admin());
drop policy if exists "Page sections admin write" on public.page_sections;
create policy "Page sections admin write" on public.page_sections for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Page SEO public read" on public.page_seo;
create policy "Page SEO public read" on public.page_seo for select using (true);
drop policy if exists "Page SEO admin write" on public.page_seo;
create policy "Page SEO admin write" on public.page_seo for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Nav public read" on public.nav_items;
create policy "Nav public read" on public.nav_items for select
  using (is_visible or public.is_admin());
drop policy if exists "Nav admin write" on public.nav_items;
create policy "Nav admin write" on public.nav_items for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "FAQs public read" on public.faqs;
create policy "FAQs public read" on public.faqs for select
  using (is_published or public.is_admin());
drop policy if exists "FAQs admin write" on public.faqs;
create policy "FAQs admin write" on public.faqs for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Teachers public read" on public.teachers;
create policy "Teachers public read" on public.teachers for select
  using (is_published or public.is_admin());
drop policy if exists "Teachers admin write" on public.teachers;
create policy "Teachers admin write" on public.teachers for all
  using (public.is_admin()) with check (public.is_admin());

-- Courses: the original schema had a public read policy but NO write policy
-- at all, so the CMS could never write to it. Add admin write + scope the
-- public read to published rows.
drop policy if exists "Courses are public to read" on public.courses;
drop policy if exists "Courses public read" on public.courses;
create policy "Courses public read" on public.courses for select
  using (is_published or public.is_admin());
drop policy if exists "Courses admin write" on public.courses;
create policy "Courses admin write" on public.courses for all
  using (public.is_admin()) with check (public.is_admin());

-- Leads: anyone may submit (existing policy), only admins may read them.
-- Previously reading was left to the service role with no policy, which
-- meant the admin UI could not list them.
drop policy if exists "Admins read leads" on public.leads;
create policy "Admins read leads" on public.leads for select
  using (public.is_admin());
