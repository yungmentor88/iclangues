-- =====================================================================
-- 0003 — Draft / publish workflow and version history
--
-- Publishing = copy draft_* into published_* and snapshot the result.
-- Reverting  = copy a snapshot back into draft_*, then publish again.
--
-- Snapshots are append-only and capped per entity (see prune trigger) so
-- history cannot grow without bound on the free tier.
-- =====================================================================

create table if not exists public.content_versions (
  id          bigserial primary key,
  entity      text not null,          -- 'page_section' | 'ui_string' | 'course' | 'faq' | 'teacher' | 'site_settings'
  entity_id   text not null,          -- text so it covers uuid and text primary keys
  version     int  not null,
  snapshot    jsonb not null,         -- the full published payload at this point
  note        text,                   -- optional "what changed" label
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null,
  unique (entity, entity_id, version)
);

create index if not exists content_versions_entity_idx
  on public.content_versions (entity, entity_id, version desc);

alter table public.content_versions enable row level security;

drop policy if exists "Admins read versions" on public.content_versions;
create policy "Admins read versions" on public.content_versions for select
  using (public.is_admin());

drop policy if exists "Admins write versions" on public.content_versions;
create policy "Admins write versions" on public.content_versions for insert
  with check (public.is_admin());

-- ---------- Next version number for an entity ----------
create or replace function public.next_version(p_entity text, p_entity_id text)
returns int
language sql
stable
as $$
  select coalesce(max(version), 0) + 1
  from public.content_versions
  where entity = p_entity and entity_id = p_entity_id;
$$;

-- ---------- Keep at most N versions per entity ----------
-- Free-tier storage is finite and the owner will never need 500 revisions
-- of one heading. 20 is generous while staying bounded.
create or replace function public.prune_content_versions()
returns trigger
language plpgsql
as $$
begin
  delete from public.content_versions
  where entity = new.entity
    and entity_id = new.entity_id
    and version <= new.version - 20;
  return null;
end;
$$;

drop trigger if exists content_versions_prune on public.content_versions;
create trigger content_versions_prune
  after insert on public.content_versions
  for each row execute function public.prune_content_versions();

-- =====================================================================
-- Publish helpers
--
-- SECURITY DEFINER + an explicit is_admin() check: the function runs with
-- elevated rights but refuses to do anything for a non-admin caller.
-- =====================================================================

create or replace function public.publish_page_section(p_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_content jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorised';
  end if;

  update public.page_sections
     set published_content = draft_content
   where id = p_id
  returning published_content into v_content;

  if not found then
    raise exception 'page section % not found', p_id;
  end if;

  insert into public.content_versions (entity, entity_id, version, snapshot, note, created_by)
  values ('page_section', p_id::text,
          public.next_version('page_section', p_id::text),
          v_content, p_note, auth.uid());
end;
$$;

create or replace function public.publish_ui_string(p_key text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_value jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorised';
  end if;

  update public.ui_strings
     set published_value = draft_value
   where key = p_key
  returning published_value into v_value;

  if not found then
    raise exception 'ui string % not found', p_key;
  end if;

  insert into public.content_versions (entity, entity_id, version, snapshot, note, created_by)
  values ('ui_string', p_key,
          public.next_version('ui_string', p_key),
          v_value, p_note, auth.uid());
end;
$$;

-- Publish every pending draft in one transaction (the dashboard's
-- "Publish all changes" button). All-or-nothing.
create or replace function public.publish_all(p_note text default null)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := 0;
  r record;
begin
  if not public.is_admin() then
    raise exception 'not authorised';
  end if;

  for r in
    select key from public.ui_strings
    where published_value is distinct from draft_value
  loop
    perform public.publish_ui_string(r.key, p_note);
    v_count := v_count + 1;
  end loop;

  for r in
    select id from public.page_sections
    where published_content is distinct from draft_content
  loop
    perform public.publish_page_section(r.id, p_note);
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- ---------- Restore a previous version into the draft ----------
create or replace function public.restore_version(p_version_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v record;
begin
  if not public.is_admin() then
    raise exception 'not authorised';
  end if;

  select * into v from public.content_versions where id = p_version_id;
  if not found then
    raise exception 'version % not found', p_version_id;
  end if;

  -- Restores into the DRAFT, never straight to published. The owner then
  -- previews and publishes deliberately (§22).
  if v.entity = 'page_section' then
    update public.page_sections set draft_content = v.snapshot where id = v.entity_id::uuid;
  elsif v.entity = 'ui_string' then
    update public.ui_strings set draft_value = v.snapshot where key = v.entity_id;
  else
    raise exception 'restore not supported for entity %', v.entity;
  end if;
end;
$$;

revoke all on function public.publish_page_section(uuid, text) from public;
revoke all on function public.publish_ui_string(text, text)    from public;
revoke all on function public.publish_all(text)                from public;
revoke all on function public.restore_version(bigint)          from public;

grant execute on function public.publish_page_section(uuid, text) to authenticated;
grant execute on function public.publish_ui_string(text, text)    to authenticated;
grant execute on function public.publish_all(text)                to authenticated;
grant execute on function public.restore_version(bigint)          to authenticated;

-- ---------- Pending-changes view for the dashboard ----------
create or replace view public.pending_changes as
  select 'ui_string' as entity, key as entity_id, section as label, updated_at
    from public.ui_strings
   where published_value is distinct from draft_value
  union all
  select 'page_section', id::text, label, updated_at
    from public.page_sections
   where published_content is distinct from draft_content;

-- Views run with the invoker's rights in PG15+, so RLS on the underlying
-- tables still applies. Explicit for clarity:
alter view public.pending_changes set (security_invoker = true);
