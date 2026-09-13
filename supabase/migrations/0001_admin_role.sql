-- =====================================================================
-- 0001 — Admin role on existing Supabase Auth
--
-- Adds an `is_admin` flag to profiles and the helper functions every
-- later policy depends on. Run this FIRST.
--
-- Design note: policies on `profiles` must NOT query `profiles` directly
-- or Postgres recurses (policy -> select -> policy -> ...). The helper is
-- SECURITY DEFINER so it bypasses RLS and breaks that cycle.
-- =====================================================================

-- ---------- Role flag ----------
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

comment on column public.profiles.is_admin is
  'Grants access to the /admin CMS. Set manually — never self-service.';

-- ---------- Helper: is the current request an admin? ----------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

comment on function public.is_admin() is
  'True when the signed-in user has the admin flag. SECURITY DEFINER to avoid RLS recursion.';

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------- Profiles policies ----------
-- Existing policies only covered "own row". Admins need to see all users
-- (Users screen) but must not be able to escalate anyone via the API.
drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles"
  on public.profiles for select
  using (public.is_admin());

-- Deliberately NO admin update policy on profiles: granting or revoking
-- is_admin happens in the Supabase dashboard, not through the app. This
-- removes a whole class of privilege-escalation bugs.

-- ---------- Guard: is_admin can never be changed via the API ----------
-- Users can update their own profile (existing policy). Without this
-- trigger, that policy would let any user set their own is_admin = true.
create or replace function public.prevent_admin_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin then
    raise exception 'is_admin cannot be modified through the API';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_no_admin_escalation on public.profiles;
create trigger profiles_no_admin_escalation
  before update on public.profiles
  for each row execute function public.prevent_admin_escalation();

-- ---------- Audit log ----------
create table if not exists public.audit_log (
  id          bigserial primary key,
  actor_id    uuid references auth.users (id) on delete set null,
  action      text not null,
  entity      text not null,
  entity_id   text,
  detail      jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists audit_log_created_idx on public.audit_log (created_at desc);

alter table public.audit_log enable row level security;

drop policy if exists "Admins read audit log" on public.audit_log;
create policy "Admins read audit log"
  on public.audit_log for select
  using (public.is_admin());

-- Writes go through the service role only (server-side), never the client.
