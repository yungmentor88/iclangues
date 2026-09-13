-- =====================================================================
-- 0007 — Media storage bucket
--
-- The media table exists (0002) but there was no bucket to upload into.
-- Creates a `media` bucket: public READ (these are marketing photos shown
-- to every visitor, and Next's image optimizer fetches them directly),
-- admin-only WRITE via the same is_admin() helper every other table uses.
--
-- Limits are enforced at the bucket level so a bad upload is rejected by
-- storage itself, not just by the UI:
--   * 10 MB per file
--   * images only (plus PDF for future downloadable resources)
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  10485760,  -- 10 MB
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/avif',
    'image/gif', 'image/svg+xml', 'application/pdf'
  ]
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------- Policies ----------
-- storage.objects already has RLS enabled by Supabase; add our own rules.

drop policy if exists "Media public read" on storage.objects;
create policy "Media public read"
  on storage.objects for select
  using (bucket_id = 'media');

drop policy if exists "Media admin insert" on storage.objects;
create policy "Media admin insert"
  on storage.objects for insert
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "Media admin update" on storage.objects;
create policy "Media admin update"
  on storage.objects for update
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "Media admin delete" on storage.objects;
create policy "Media admin delete"
  on storage.objects for delete
  using (bucket_id = 'media' and public.is_admin());

-- ---------- Protect images that are in use (spec §23) ----------
-- Deleting a media row that a section or setting still references must be
-- blocked. site_settings already uses ON DELETE RESTRICT for its logos;
-- page_sections stores image paths inside JSON, so a foreign key cannot
-- cover it. This function lets the app ask "is this file used anywhere?"
-- before offering to delete it.
create or replace function public.media_usage(p_path text)
returns table (page_slug text, section_label text)
language sql
stable
security definer
set search_path = public
as $$
  select p.slug, s.label
  from public.page_sections s
  join public.pages p on p.id = s.page_id
  where s.draft_content::text like '%' || p_path || '%'
     or coalesce(s.published_content::text, '') like '%' || p_path || '%';
$$;

revoke all on function public.media_usage(text) from public;
grant execute on function public.media_usage(text) to authenticated;

comment on function public.media_usage(text) is
  'Returns the pages/sections referencing an image path, so the UI can warn '
  'before deleting a file that is still in use.';
